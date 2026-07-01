import * as cheerio from "cheerio";

export interface Badge {
  title: string;
  type: "game" | "trivia" | "skill" | "certification" | "special" | "other";
  earnedDate?: string;
  imageUrl?: string;
  /** Direct link to the badge's page on skills.google — use as href for badge cards. */
  pageUrl?: string;
}

export interface ProfileData {
  name: string;
  publicId: string;
  totalPoints: number;
  totalBadges: number;
  badges: Badge[];
  raw?: unknown;
}

const PROFILE_BASE = "https://www.skills.google/public_profiles/";

const FETCH_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
};

function classifyBadge(title: string): Badge["type"] {
  const t = title.toLowerCase();
  if (t.includes("trivia")) return "trivia";
  if (
    t.includes("arcade") ||
    t.includes("base camp") ||
    t.includes("arcade trail") ||
    t.includes("arcade adventure") ||
    t.includes("arcade voyage") ||
    t.includes("logic log") ||
    t.includes("dialogue design") ||
    t.includes("skill up summer") ||
    t.includes("game") ||
    t.includes("voyage") ||
    t.includes("trail") ||
    t.includes("adventure")
  )
    return "game";
  if (t.includes("certified") || t.includes("certification"))
    return "certification";
  if (
    t.includes("skill badge") ||
    t.includes("get started with") ||
    t.includes("build and") ||
    t.includes("level ")
  )
    return "skill";
  return "other";
}

/**
 * Fetch a single badge detail page and extract the badge title from og:title.
 * Falls back to <title> tag. Returns null if both fail.
 */
async function fetchBadgeTitle(
  badgeUrl: string
): Promise<string | null> {
  try {
    const res = await fetch(badgeUrl, {
      headers: FETCH_HEADERS,
      next: { revalidate: 0 },
    });
    if (!res.ok) return null;
    const html = await res.text();
    const $ = cheerio.load(html);
    const ogTitle = $('meta[property="og:title"]').attr("content");
    if (ogTitle && ogTitle.trim()) return ogTitle.trim();
    const titleTag = $("title").text();
    if (titleTag) return titleTag.replace(/\s*\|.*$/, "").trim();
    return null;
  } catch {
    return null;
  }
}

/**
 * Phase 1: Parse the public profile HTML to extract:
 *   - display name
 *   - total skills points (shown as "N points" in bold)
 *   - list of { badgeUrl, earnedDate, imageUrl } for each badge
 */
function parseProfileHtml(html: string, publicId: string): {
  name: string;
  totalPoints: number;
  badgeEntries: { badgeUrl: string; earnedDate: string; imageUrl: string }[];
} {
  const $ = cheerio.load(html);

  // Name from og:title → "Sujeet C | Google Skills"
  const ogTitle = $('meta[property="og:title"]').attr("content") ?? "";
  const name =
    ogTitle.replace(/\s*\|.*$/, "").trim() ||
    $("title").text().replace(/\s*\|.*$/, "").trim() ||
    "Unknown";

  // Total skills points (NOT arcade points — kept for reference)
  const pointsText = $("strong")
    .filter((_, el) => /\d+\s*points/i.test($(el).text()))
    .first()
    .text();
  const pointsMatch = pointsText.match(/(\d+)/);
  const totalPoints = pointsMatch ? parseInt(pointsMatch[1], 10) : 0;

  // Badge entries — each .profile-badge has:
  //   <a class="badge-image" href="/public_profiles/.../badges/{id}"><img src="..."/></a>
  //   <span class='ql-title-medium l-mts'>Earned Jun 13, 2026 EDT</span>
  const badgeEntries: { badgeUrl: string; earnedDate: string; imageUrl: string }[] = [];

  $(".profile-badge").each((_, el) => {
    const anchor = $(el).find("a.badge-image");
    const href = anchor.attr("href") ?? "";
    const badgeUrl = href.startsWith("http")
      ? href
      : `https://www.skills.google${href}`;
    const imageUrl = anchor.find("img").attr("src") ?? "";
    const earnedText = $(el).find(".ql-title-medium").text().trim();
    // "Earned Jun 13, 2026 EDT" → "Jun 13, 2026"
    const dateMatch = earnedText.match(/Earned\s+([A-Za-z]+\s+\d+,\s+\d{4})/);
    const earnedDate = dateMatch ? dateMatch[1] : "";

    if (badgeUrl && badgeUrl.includes("/badges/")) {
      badgeEntries.push({ badgeUrl, earnedDate, imageUrl });
    }
  });

  return { name, totalPoints, badgeEntries };
}

/**
 * Phase 2: Concurrently fetch every badge's detail page and resolve its title.
 * Batched in groups of 10 to avoid hammering the server.
 */
async function resolveBadgeTitles(
  badgeEntries: { badgeUrl: string; earnedDate: string; imageUrl: string }[]
): Promise<Badge[]> {
  const BATCH_SIZE = 10;
  const badges: Badge[] = [];

  for (let i = 0; i < badgeEntries.length; i += BATCH_SIZE) {
    const batch = badgeEntries.slice(i, i + BATCH_SIZE);
    const titles = await Promise.all(
      batch.map((entry) => fetchBadgeTitle(entry.badgeUrl))
    );
    for (let j = 0; j < batch.length; j++) {
      const entry = batch[j];
      const title = titles[j] ?? `Badge ${entry.badgeUrl.split("/").pop()}`;
      badges.push({
        title,
        type: classifyBadge(title),
        earnedDate: entry.earnedDate || undefined,
        imageUrl: entry.imageUrl || undefined,
        pageUrl: entry.badgeUrl,
      });
    }
  }

  return badges;
}

/**
 * Main entry point.
 *
 * Two-phase scrape:
 *  1. Fetch the public profile page → extract name, points, badge URLs + dates.
 *  2. Concurrently fetch each individual badge page → get the real title from og:title.
 *
 * This reliably captures the exact badge title regardless of how Google
 * names the current season's games — no keyword guessing required here.
 * Classification (arcade vs. skill vs. trivia, etc.) is handled separately
 * by arcadeCalculator.ts using the explicit season registry.
 */
export async function fetchPublicProfile(publicId: string): Promise<ProfileData> {
  const profileUrl = `${PROFILE_BASE}${publicId}`;
  const res = await fetch(profileUrl, {
    headers: FETCH_HEADERS,
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    throw new Error(
      `Failed to fetch profile (HTTP ${res.status}). Check the public ID/URL.`
    );
  }

  const html = await res.text();
  const { name, totalPoints, badgeEntries } = parseProfileHtml(html, publicId);

  if (badgeEntries.length === 0) {
    // Safety fallback — profile was fetched but no badges found (could be private or empty)
    return {
      name,
      publicId,
      totalPoints,
      totalBadges: 0,
      badges: [],
    };
  }

  // Phase 2: resolve titles from individual badge pages in parallel
  const badges = await resolveBadgeTitles(badgeEntries);

  return {
    name,
    publicId,
    totalPoints,
    totalBadges: badges.length,
    badges,
  };
}

export function extractPublicIdFromUrl(input: string): string {
  const trimmed = input.trim();
  const match = trimmed.match(/public_profiles\/([a-zA-Z0-9-]+)/);
  return match ? match[1] : trimmed;
}

export interface BonusMilestoneInfo {
  title: string;
  description: string;
  completed: boolean;
  completedBadgeTitle: string;
  pointsAwarded: number;
}

export async function fetchBonusMilestoneInfo(userBadges: { title: string }[]): Promise<BonusMilestoneInfo> {
  let description = "";
  try {
    const res = await fetch("https://rsvp.withgoogle.com/events/arcade-facilitator/bonus-milestone", {
      headers: FETCH_HEADERS,
      next: { revalidate: 3600 }
    });
    if (!res.ok) throw new Error("Fetch failed");
    const html = await res.text();
    const $ = cheerio.load(html);
    const paragraphs: string[] = [];
    $("p").each((_, el) => {
      const text = $(el).text().trim();
      if (text) paragraphs.push(text);
    });
    description = paragraphs.join("\n\n");
  } catch (err) {
    description = "More details about the new \"Bonus Milestone\", its eligibility criteria and how will you be able to earn an extra 10 Bonus Points will be posted here soon. So please stay tuned and keep an eye out here!";
  }

  if (!description || description.trim().length === 0) {
    description = "For the first time ever, there is more than one way to earn \"Bonus Points\" in the Arcade Facilitator program and this time we want to make sure that you actually step away with some industry-ready skills after completing this.\n\nMore details about the new \"Bonus Milestone\", its eligibility criteria and how will you be able to earn an extra 10 Bonus Points will be posted here soon.\n\nSo please stay tuned and keep an eye out here!";
  }

  // Heuristic matching: search for any of the user's completed badges in the page description
  // OR check if they have completed any "Certification" or "Certified" badge representing industry-ready skills
  let completed = false;
  let completedBadgeTitle = "";
  for (const b of userBadges) {
    if (!b.title) continue;
    const lowerTitle = b.title.toLowerCase();
    if (
      (lowerTitle.includes("certification") || lowerTitle.includes("certified")) ||
      (description.length > 50 && lowerTitle.length > 5 && description.toLowerCase().includes(lowerTitle))
    ) {
      completed = true;
      completedBadgeTitle = b.title;
      break;
    }
  }

  return {
    title: "Bonus Milestone",
    description,
    completed,
    completedBadgeTitle,
    pointsAwarded: completed ? 10 : 0
  };
}
