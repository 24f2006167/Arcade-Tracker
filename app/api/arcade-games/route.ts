import { NextResponse } from "next/server";
import type { CatalogBadge } from "@/lib/catalog";
import { ARCADE_GAMES } from "@/lib/catalog";

/**
 * GET /api/arcade-games
 *
 * Scrapes go.cloudskillsboost.google/arcade for live game data.
 * The page embeds HTML-entity-encoded markup, so we decode then regex-extract.
 *
 * Cache: revalidate every 30 minutes via Next.js fetch cache.
 */

const ARCADE_URL = "https://go.cloudskillsboost.google/arcade";

const FETCH_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
};

// ─── UTM campaign prefix → canonical game title ───────────────────────────────
const CAMPAIGN_TITLE: Record<string, string> = {
  "voyage":   "Arcade Voyage",
  "adv":      "Arcade Adventure",
  "trail":    "Arcade Trail",
  "basecamp": "Arcade Base Camp",
  "specgame": "Arcade Simulator: Data Mesh Architect",
  "wmpgame":  "Safe Spaces",
  "wmp":      "Safe Spaces",
  "special":  "Arcade Simulator: Data Mesh Architect",
};

// ─── Image filename fragment → canonical game title ───────────────────────────
const IMG_TITLE: Record<string, string> = {
  "voyuge-july":    "Arcade Voyage",
  "voyage-july":    "Arcade Voyage",
  "adv-july":       "Arcade Adventure",
  "trail-july":     "Arcade Trail",
  "basecamp-july":  "Arcade Base Camp",
  "special-july":   "Arcade Simulator: Data Mesh Architect",
  "new-special":    "Safe Spaces",
  "safe":           "Safe Spaces",
};

// Known bad titles to skip (section headings, prize tier labels, etc.)
const SKIP_TITLES = new Set([
  "arcade prize tiers",
  "complete your skill badge journey",
  "arcade simulator",  // too short - only keep full title
  "faqs",
  "google skills arcade",
]);

function resolveTitle(rawTitle: string, imgSrc: string, campaignUrl: string): string {
  // 1. Try image filename map
  for (const [fragment, title] of Object.entries(IMG_TITLE)) {
    if (imgSrc.includes(fragment)) return title;
  }
  // 2. Try utm_campaign map
  const campaignMatch = campaignUrl.match(/utm_campaign=([^&"]+)/);
  if (campaignMatch) {
    const campaign = campaignMatch[1];
    for (const [prefix, title] of Object.entries(CAMPAIGN_TITLE)) {
      if (campaign.startsWith(prefix)) return title;
    }
  }
  // 3. Use raw title if not in skip list
  const normalised = rawTitle.toLowerCase().trim();
  if (rawTitle && rawTitle.length >= 3 && rawTitle.length <= 100 && !SKIP_TITLES.has(normalised)) {
    return rawTitle;
  }
  return "";
}

function decodeEntities(html: string): string {
  return html
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

interface ScrapedPrizeTier {
  name: string;
  left: number;
  total: number;
}

interface ScrapedArcadeData {
  games: CatalogBadge[];
  prizeTiers: ScrapedPrizeTier[];
  lastRefreshedText?: string;
}

function parseArcadePage(rawHtml: string): ScrapedArcadeData {
  // First pass: find and decode all embedded HTML entity blocks
  const decoded = decodeEntities(rawHtml);

  // Parse spot limits
  const spotRegex = /<div class="tier-points">(\d+)\s*\/\s*(\d+)\s*spots left<\/div>/gi;
  const spotMatches = [...decoded.matchAll(spotRegex)];
  const tierNames = ["Arcade Trooper", "Arcade Ranger", "Arcade Champion", "Arcade Legend"];
  const prizeTiers: ScrapedPrizeTier[] = [];

  spotMatches.forEach((m, i) => {
    if (i < tierNames.length) {
      prizeTiers.push({
        name: tierNames[i],
        left: parseInt(m[1], 10),
        total: parseInt(m[2], 10),
      });
    }
  });

  // Fallback if not parsed
  if (prizeTiers.length === 0) {
    prizeTiers.push(
      { name: "Arcade Trooper", left: 4837, total: 6000 },
      { name: "Arcade Ranger", left: 3899, total: 4000 },
      { name: "Arcade Champion", left: 2979, total: 3000 },
      { name: "Arcade Legend", left: 2500, total: 2500 }
    );
  }

  // Parse last refreshed date
  const refreshRegex = /Last refreshed:\s*([^<]+)/i;
  const refreshMatch = decoded.match(refreshRegex);
  const lastRefreshedText = refreshMatch ? refreshMatch[1].trim() : "June 29, 2026 at 8:08 AM UTC";

  // Find every access code
  const codeRegex = /\b(1q-[a-z0-9-]{4,30})\b/g;
  const codeMatches = [...decoded.matchAll(codeRegex)];

  const games: CatalogBadge[] = [];
  const seenCodes = new Set<string>();

  for (const match of codeMatches) {
    const accessCode = match[1];
    if (seenCodes.has(accessCode)) continue;
    seenCodes.add(accessCode);

    const pos = match.index!;

    // Grab a 2000-char window around the code (1500 before, 500 after)
    const ctx = decoded.slice(Math.max(0, pos - 1500), pos + 500);

    // ── Image URL ─────────────────────────────────────────────────────────────
    const imgMatch = ctx.match(/src="(https:\/\/services\.google\.com\/fh\/files\/misc\/[^"]+)"/);
    const imgSrc = imgMatch ? imgMatch[1] : "";

    // ── Game page URL ─────────────────────────────────────────────────────────
    // Find the URL closest to the access code to avoid matching a preceding game's URL
    const urlRegex = /href="(https:\/\/www\.skills\.google\/games\/\d+)[^"]*"/g;
    let urlMatch;
    let gameUrl = "";
    let minDistance = Infinity;
    while ((urlMatch = urlRegex.exec(ctx)) !== null) {
      const url = urlMatch[1];
      const matchPosInCtx = urlMatch.index;
      const ctxStart = Math.max(0, pos - 1500);
      const matchPosInDecoded = ctxStart + matchPosInCtx;
      const distance = Math.abs(matchPosInDecoded - pos);
      if (distance < minDistance) {
        minDistance = distance;
        gameUrl = url;
      }
    }

    // ── UTM campaign URL (for title resolution) ───────────────────────────────
    const campaignMatch = ctx.match(/href="(https:\/\/[^"]+utm_campaign=[^"]*)"/);
    const campaignUrl = campaignMatch ? campaignMatch[1] : "";

    // ── Points ────────────────────────────────────────────────────────────────
    const ptsMatch = stripTags(ctx).match(/Arcade points?:\s*(\d+)/i);
    const pts = ptsMatch ? parseInt(ptsMatch[1], 10) : 1;

    // ── Title ─────────────────────────────────────────────────────────────────
    let rawTitle = "";

    // Try h2/h3 headings in context
    const headingMatch = ctx.match(/<h[23][^>]*>\s*([^<]{3,80})\s*<\/h[23]>/i);
    if (headingMatch) rawTitle = headingMatch[1].trim();

    // Also try well-known Arcade game name patterns directly in the stripped text
    if (!rawTitle) {
      const textBlock = stripTags(ctx.slice(-1200)); // last portion has the game name
      const knownPattern = textBlock.match(
        /(Arcade (?:Voyage|Adventure|Trail|Base Camp|Simulator[^.]{0,50})|Safe Spaces|Logic Log)/i
      );
      if (knownPattern) rawTitle = knownPattern[1].trim();
    }

    const title = resolveTitle(rawTitle, imgSrc, campaignUrl);
    if (!title) continue;

    const now = new Date();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    games.push({
      title,
      type: "game",
      url: gameUrl || ARCADE_URL,
      imageUrl: imgSrc || undefined,
      accessCode,
      pointValue: pts,
      pointLabel: `${pts} Arcade Point${pts !== 1 ? "s" : ""} per badge`,
      startDate: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
      endDate: endOfMonth.toISOString(),
    });
  }

  return { games, prizeTiers, lastRefreshedText };
}

export async function GET() {
  try {
    const res = await fetch(ARCADE_URL, {
      headers: FETCH_HEADERS,
      next: { revalidate: 1800 }, // 30 minutes
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const rawHtml = await res.text();
    const scraped = parseArcadePage(rawHtml);

    if (scraped.games.length > 0) {
      return NextResponse.json(
        {
          source: "live",
          games: scraped.games,
          count: scraped.games.length,
          scrapedAt: new Date().toISOString(),
          prizeTiers: scraped.prizeTiers,
          lastRefreshedText: scraped.lastRefreshedText,
        },
        {
          headers: {
            "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600",
          },
        }
      );
    }

    throw new Error("No games parsed from page");
  } catch (err) {
    // Active games from the static catalog as reliable fallback
    const now = new Date().toISOString();
    const active = ARCADE_GAMES.filter((g) => !g.endDate || g.endDate > now);

    return NextResponse.json(
      {
        source: "static-fallback",
        games: active,
        count: active.length,
        scrapedAt: new Date().toISOString(),
        prizeTiers: [
          { name: "Arcade Trooper", left: 4837, total: 6000 },
          { name: "Arcade Ranger", left: 3899, total: 4000 },
          { name: "Arcade Champion", left: 2979, total: 3000 },
          { name: "Arcade Legend", left: 2500, total: 2500 }
        ],
        lastRefreshedText: "June 29, 2026 at 8:08 AM UTC",
        error: err instanceof Error ? err.message : String(err),
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      }
    );
  }
}
