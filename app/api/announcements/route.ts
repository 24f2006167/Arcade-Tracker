import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { YUGALI_ANNOUNCEMENTS } from "@/lib/officialAnnouncements";

/**
 * GET /api/announcements
 * ---------------------------------------------------------------------------
 * Returns official Google Skills Arcade announcements. Priority order:
 * 1. Supabase `announcements` table (if configured and populated)
 * 2. Live-fetched Yugali posts from discuss.google.dev Discourse JSON API
 * 3. Static verified seed announcements from Yugali's official posts
 *
 * Announcements marked `source: "yugali-official"` are shown with a
 * "Google Official" badge in the UI.
 */

export async function GET() {
  // --- 1. Try Supabase first ---
  try {
    const db = getServiceClient();
    const { data, error } = await db
      .from("announcements")
      .select("*")
      .order("published_at", { ascending: false });

    if (!error && data && data.length > 0) {
      return NextResponse.json({ announcements: data });
    }
  } catch {
    // Supabase not configured — fall through
  }

  // --- 2. Try live Discourse API fetch ---
  try {
    const res = await fetch(
      "https://discuss.google.dev/t/371066.json",
      {
        headers: {
          "User-Agent": "STS-ArcadeTracker/1.0 (auto-fetch official data)",
          Accept: "application/json",
        },
        next: { revalidate: 3600 },
      }
    );

    if (res.ok) {
      const json = await res.json();
      const posts: Array<{
        id: number;
        username: string;
        cooked: string;
        created_at: string;
      }> = json?.post_stream?.posts ?? [];

      const yugaliPosts = posts
        .filter((p) => p.username?.toLowerCase() === "yugali")
        .map((p) => {
          const textContent = p.cooked
            .replace(/<[^>]+>/g, " ")
            .replace(/\s+/g, " ")
            .trim();
          return {
            id: `discourse-${p.id}`,
            title: json?.title ?? "Google Skills Arcade 2026 Update",
            summary: textContent.slice(0, 320) + (textContent.length > 320 ? "…" : ""),
            official_link: `https://discuss.google.dev/t/371066/${p.id}`,
            published_at: p.created_at,
            source: "yugali-official",
            author: "Yugali",
            author_url: "https://discuss.google.dev/u/Yugali",
            is_google_official: true,
          };
        });

      if (yugaliPosts.length > 0) {
        // Merge with static seeds (deduplicated)
        const seen = new Set(yugaliPosts.map((p) => p.id));
        const merged = [
          ...yugaliPosts,
          ...YUGALI_ANNOUNCEMENTS
            .filter((a) => !seen.has(a.id))
            .map((a) => ({
              id: a.id,
              title: a.title,
              summary: a.summary,
              official_link: a.officialLink,
              published_at: a.publishedAt,
              source: a.source,
              author: a.author,
              author_url: a.authorUrl,
              is_google_official: a.isGoogleOfficial,
              image_url: a.imageUrl,
            })),
        ];
        return NextResponse.json({ announcements: merged });
      }
    }
  } catch {
    // Discourse fetch failed — fall through to static seeds
  }

  // --- 3. Static verified seeds (always available) ---
  const seeds = YUGALI_ANNOUNCEMENTS.map((a) => ({
    id: a.id,
    title: a.title,
    summary: a.summary,
    official_link: a.officialLink,
    published_at: a.publishedAt,
    source: a.source,
    author: a.author,
    author_url: a.authorUrl,
    is_google_official: a.isGoogleOfficial,
    image_url: a.imageUrl,
  }));

  return NextResponse.json({ announcements: seeds });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, summary, officialLink, imageUrl, publishedAt, isGoogleOfficial } = body;
    if (!title) {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }

    const db = getServiceClient();
    const { data, error } = await db
      .from("announcements")
      .insert({
        title,
        summary,
        official_link: officialLink,
        image_url: imageUrl,
        published_at: publishedAt ?? new Date().toISOString(),
        source: isGoogleOfficial ? "yugali-official" : "manual",
        is_google_official: isGoogleOfficial ?? false,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ announcement: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
