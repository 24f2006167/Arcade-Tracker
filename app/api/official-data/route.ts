import { NextResponse } from "next/server";
import { YUGALI_ANNOUNCEMENTS, OFFICIAL_TIERS, type OfficialAnnouncement } from "@/lib/officialAnnouncements";

/**
 * GET /api/official-data
 * ---------------------------------------------------------------------------
 * Auto-fetches official Google Skills Arcade data from the Discourse-powered
 * Google Developer Forum (discuss.google.dev), which exposes a public JSON API.
 *
 * Primary source: Yugali (Google PM) posts on the official tier announcement
 * thread: https://discuss.google.dev/t/google-skills-arcade-2026-tiers/371066
 *
 * The rsvp.withgoogle.com pages are JavaScript-rendered SPAs — they require
 * a headless browser to parse and cannot be fetched server-side. Instead, we
 * use the Discourse JSON API which is freely accessible.
 *
 * Cached in-memory for 1 hour to avoid hammering the Discourse server.
 */

// Re-export so consumers can access these directly
export { YUGALI_ANNOUNCEMENTS, OFFICIAL_TIERS };


// ─── In-memory cache ─────────────────────────────────────────────────────────
interface CacheEntry {
  data: OfficialData;
  fetchedAt: number;
}

interface OfficialData {
  tiers: typeof OFFICIAL_TIERS;
  announcements: OfficialAnnouncement[];
  facilitatorProgram: {
    startDate: string;
    endDate: string;
    officialLink: string;
  };
  waterfallSystem: {
    description: string;
    note: string;
  };
  lastFetched: string;
  dataSource: string;
}

let cache: CacheEntry | null = null;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

// ─── Internal types ───────────────────────────────────────────────────────────
interface DiscoursePost {
  id: number;
  username: string;
  cooked: string;
  created_at: string;
}


// ─── Fetch latest Yugali posts from Discourse JSON API ────────────────────────
async function fetchLatestYugaliPosts(): Promise<OfficialAnnouncement[]> {
  const TOPIC_IDS = [
    371066, // Google Skills Arcade 2026 Tiers (primary thread)
  ];

  const freshPosts: OfficialAnnouncement[] = [];

  for (const topicId of TOPIC_IDS) {
    try {
      const res = await fetch(
        `https://discuss.google.dev/t/${topicId}.json`,
        {
          headers: {
            "User-Agent": "STS-ArcadeTracker/1.0 (auto-fetch official data)",
            Accept: "application/json",
          },
          next: { revalidate: 3600 }, // Next.js cache hint
        }
      );

      if (!res.ok) continue;

      const json = await res.json();
      const posts: DiscoursePost[] = json?.post_stream?.posts ?? [];
      const topicTitle: string = json?.title ?? "Google Skills Arcade Update";
      const topicUrl = `https://discuss.google.dev/t/${topicId}`;

      // Filter for Yugali's posts only (Google PM / official source)
      const yugaliPosts = posts.filter(
        (p) => p.username?.toLowerCase() === "yugali"
      );

      for (const post of yugaliPosts) {
        // Extract a short text summary by stripping HTML tags
        const textContent = post.cooked
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim();
        const summary = textContent.slice(0, 280) + (textContent.length > 280 ? "…" : "");

        freshPosts.push({
          id: `discourse-${topicId}-${post.id}`,
          title: topicTitle,
          summary,
          officialLink: `${topicUrl}/${post.id}`,
          publishedAt: post.created_at,
          author: "Yugali",
          authorUrl: "https://discuss.google.dev/u/Yugali",
          isGoogleOfficial: true,
          source: "yugali-official",
        });
      }
    } catch {
      // Skip this topic if fetch fails — fall back to static seeds
    }
  }

  return freshPosts;
}

async function buildOfficialData(): Promise<OfficialData> {
  // Try to get fresh Yugali posts from Discourse
  let liveAnnouncements: OfficialAnnouncement[] = [];
  try {
    liveAnnouncements = await fetchLatestYugaliPosts();
  } catch {
    // Fall back to static announcements if fetch fails
  }

  // Merge: live posts first, then static seeds (deduplicated by id)
  const seen = new Set<string>();
  const allAnnouncements: OfficialAnnouncement[] = [];

  for (const a of [...liveAnnouncements, ...YUGALI_ANNOUNCEMENTS]) {
    if (!seen.has(a.id)) {
      seen.add(a.id);
      allAnnouncements.push(a);
    }
  }

  return {
    tiers: OFFICIAL_TIERS,
    announcements: allAnnouncements,
    facilitatorProgram: {
      startDate: "2026-07-13T00:00:00Z",
      endDate: "2026-09-14T23:59:59Z",
      officialLink: "https://rsvp.withgoogle.com/events/arcade-facilitator/home",
    },
    waterfallSystem: {
      description:
        "First-come, first-served starting from the Legend Tier. If a tier's prize pool fills up, your eligibility automatically rolls down to the next tier below.",
      note:
        "The earlier you lock in your points, the higher up the waterfall you stay, securing the best rewards before they run out!",
    },
    lastFetched: new Date().toISOString(),
    dataSource: "discuss.google.dev (Discourse JSON API) + static verified seeds",
  };
}

export async function GET() {
  const now = Date.now();

  // Serve from cache if still fresh
  if (cache && now - cache.fetchedAt < CACHE_TTL_MS) {
    return NextResponse.json(cache.data, {
      headers: { "X-Cache": "HIT", "X-Cache-Age": String(Math.floor((now - cache.fetchedAt) / 1000)) },
    });
  }

  const data = await buildOfficialData();
  cache = { data, fetchedAt: now };

  return NextResponse.json(data, {
    headers: { "X-Cache": "MISS" },
  });
}
