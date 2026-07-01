import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

/**
 * NOTE: Google does not publish a public API/RSS feed for Skills Arcade
 * announcements, so true "auto-fetch" isn't reliably scriptable without
 * fragile scraping of a page that can change at any time. Instead, this
 * route reads curated rows from the `announcements` table — add new ones
 * via POST (service role) or directly in the Supabase table editor — and
 * falls back to a small static seed list so the UI isn't empty on a fresh
 * install.
 */
const SEED_ANNOUNCEMENTS = [
  {
    id: "seed-1",
    title: "Google Skills Arcade 2026 season overview",
    summary: "Arcade points, prize tiers, and milestone structure for the current season.",
    official_link: "https://www.skills.google/",
    published_at: "2026-01-01T00:00:00Z",
    source: "manual",
  },
];

export async function GET() {
  try {
    const db = getServiceClient();
    const { data, error } = await db
      .from("announcements")
      .select("*")
      .order("published_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      announcements: data && data.length > 0 ? data : SEED_ANNOUNCEMENTS,
    });
  } catch {
    // Supabase not configured yet, or table missing — still show the seed list.
    return NextResponse.json({ announcements: SEED_ANNOUNCEMENTS });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, summary, officialLink, imageUrl, publishedAt } = body;
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
        source: "manual",
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
