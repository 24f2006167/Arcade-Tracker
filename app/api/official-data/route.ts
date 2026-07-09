import { NextResponse } from "next/server";
import { YUGALI_ANNOUNCEMENTS, OFFICIAL_TIERS, type OfficialAnnouncement } from "@/lib/officialAnnouncements";

// Re-export so consumers can access these directly
export { YUGALI_ANNOUNCEMENTS, OFFICIAL_TIERS };

// ─── In-memory cache (5 min TTL so updates appear quickly) ───────────────────
interface CacheEntry { data: OfficialData; fetchedAt: number; }

interface OfficialData {
  tiers: typeof OFFICIAL_TIERS;
  announcements: OfficialAnnouncement[];
  facilitatorProgram: { startDate: string; endDate: string; officialLink: string };
  waterfallSystem: { description: string; note: string };
  lastFetched: string;
  dataSource: string;
}

let cache: CacheEntry | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes — fast updates

// ─── Discourse topic action type 4 = posts by user ───────────────────────────
interface UserAction {
  title: string;
  created_at: string;
  topic_id: number;
  slug: string;
  excerpt?: string;
}

// ─── Strip HTML and return clean text ─────────────────────────────────────────
function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/p>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&hellip;/g, "…")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// ─── Fetch the full first post body from a topic ─────────────────────────────
async function fetchTopicFirstPost(topicId: number): Promise<{ cooked: string; postId: number } | null> {
  try {
    const res = await fetch(
      `https://discuss.google.dev/t/${topicId}.json`,
      {
        headers: { "User-Agent": "STS-ArcadeTracker/1.0", Accept: "application/json" },
        // No Next.js cache here — we want fresh data
        cache: "no-store",
      }
    );
    if (!res.ok) return null;
    const json = await res.json();
    const posts = json?.post_stream?.posts ?? [];
    const firstYugali = posts.find(
      (p: { username: string }) => p.username?.toLowerCase() === "yugali"
    );
    if (!firstYugali) return null;
    return { cooked: firstYugali.cooked ?? "", postId: firstYugali.id };
  } catch {
    return null;
  }
}

// ─── Categorize post by title keywords ───────────────────────────────────────
function categorizePost(title: string): { tag: string; color: string } {
  const t = title.toLowerCase();
  if (t.includes("infocus") || t.includes("in focus") || t.includes("this week")) return { tag: "Weekly Update", color: "#60a5fa" };
  if (t.includes("tier") || t.includes("prize") || t.includes("swag") || t.includes("spot")) return { tag: "Prize & Tiers", color: "#fbbf24" };
  if (t.includes("facilitator") || t.includes("program")) return { tag: "Facilitator", color: "#34d399" };
  if (t.includes("bonus") || t.includes("milestone")) return { tag: "Milestone", color: "#f97316" };
  if (t.includes("clarification") || t.includes("update")) return { tag: "Important Update", color: "#f87171" };
  if (t.includes("access") || t.includes("enrol") || t.includes("sign")) return { tag: "Getting Started", color: "#a78bfa" };
  if (t.includes("level up") || t.includes("pro-tip") || t.includes("skill")) return { tag: "Tips", color: "#22d3ee" };
  return { tag: "Announcement", color: "#94a3b8" };
}

// ─── Fetch ALL Yugali posts via user_actions API ──────────────────────────────
async function fetchAllYugaliPosts(): Promise<OfficialAnnouncement[]> {
  let userActions: UserAction[] = [];

  try {
    const res = await fetch(
      "https://discuss.google.dev/user_actions.json?username=Yugali&filter=4",
      {
        headers: { "User-Agent": "STS-ArcadeTracker/1.0", Accept: "application/json" },
        cache: "no-store",
      }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    userActions = (json?.user_actions ?? []) as UserAction[];
  } catch {
    return [];
  }

  // Filter for 2026 Arcade-relevant posts only
  const arcadeKeywords = [
    "arcade", "skill", "facilitator", "milestone", "tier", "prize",
    "swag", "badge", "infocus", "in focus", "cloud", "bonus", "access"
  ];
  const relevant = userActions.filter((a) => {
    const t = (a.title ?? "").toLowerCase();
    return arcadeKeywords.some((kw) => t.includes(kw));
  });

  // Fetch full content for the top 8 most recent (to keep it fast)
  const top = relevant.slice(0, 3);
  const announcements: OfficialAnnouncement[] = [];

  await Promise.all(
    top.map(async (action) => {
      const fullPost = await fetchTopicFirstPost(action.topic_id);
      const cat = categorizePost(action.title);

      // Build a rich summary from the full post body
      let summary = "";
      if (fullPost?.cooked) {
        const text = stripHtml(fullPost.cooked);
        summary = text.slice(0, 600) + (text.length > 600 ? "…" : "");
      } else if (action.excerpt) {
        summary = stripHtml(action.excerpt);
      }

      const topicUrl = `https://discuss.google.dev/t/${action.slug ?? action.topic_id}/${action.topic_id}`;
      const postUrl = fullPost ? `${topicUrl}/${fullPost.postId}` : topicUrl;

      announcements.push({
        id: `yugali-live-${action.topic_id}`,
        title: action.title,
        summary,
        officialLink: postUrl,
        publishedAt: action.created_at,
        author: "Yugali",
        authorUrl: "https://discuss.google.dev/u/Yugali",
        isGoogleOfficial: true,
        source: "yugali-official",
        // Store category info in title for front-end display
        tag: cat.tag,
        tagColor: cat.color,
      } as OfficialAnnouncement & { tag: string; tagColor: string });
    })
  );

  // Sort newest first
  announcements.sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  return announcements;
}

// ─── Build full response ──────────────────────────────────────────────────────
async function buildOfficialData(): Promise<OfficialData> {
  let liveAnnouncements: OfficialAnnouncement[] = [];
  try {
    liveAnnouncements = await fetchAllYugaliPosts();
  } catch {
    // Fall through to static seeds
  }

  // Merge live + static seeds, deduplicated by id
  const seen = new Set<string>();
  const all: OfficialAnnouncement[] = [];
  for (const a of [...liveAnnouncements, ...YUGALI_ANNOUNCEMENTS]) {
    if (!seen.has(a.id)) {
      seen.add(a.id);
      all.push(a);
    }
  }

  return {
    tiers: OFFICIAL_TIERS,
    announcements: all,
    facilitatorProgram: {
      startDate: "2026-07-13T11:30:00Z",
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
    dataSource: "discuss.google.dev (Discourse JSON API) · user_actions + topic fetch",
  };
}

// ─── Route handler ────────────────────────────────────────────────────────────
export async function GET() {
  const now = Date.now();

  if (cache && now - cache.fetchedAt < CACHE_TTL_MS) {
    return NextResponse.json(cache.data, {
      headers: {
        "X-Cache": "HIT",
        "X-Cache-Age": String(Math.floor((now - cache.fetchedAt) / 1000)),
        "Cache-Control": "public, max-age=300",
      },
    });
  }

  const data = await buildOfficialData();
  cache = { data, fetchedAt: now };

  return NextResponse.json(data, {
    headers: { "X-Cache": "MISS", "Cache-Control": "public, max-age=300" },
  });
}
