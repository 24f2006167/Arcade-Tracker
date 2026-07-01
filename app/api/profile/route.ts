import { NextRequest, NextResponse } from "next/server";
import { fetchPublicProfile, extractPublicIdFromUrl, fetchBonusMilestoneInfo } from "@/lib/scraper";
import { getServiceClient } from "@/lib/supabase";
import { calculateArcadeResult } from "@/lib/arcadeCalculator";

export async function POST(req: NextRequest) {
  try {
    const { input } = await req.json();
    if (!input) {
      return NextResponse.json({ error: "Provide a profile URL or ID" }, { status: 400 });
    }

    const publicId = extractPublicIdFromUrl(input);
    const data = await fetchPublicProfile(publicId);

    const db = getServiceClient();

    const { data: existing } = await db
      .from("profiles")
      .select("id")
      .eq("public_id", publicId)
      .maybeSingle();

    let profileId = existing?.id as string | undefined;

    if (!profileId) {
      const { data: inserted, error } = await db
        .from("profiles")
        .insert({ public_id: publicId, display_name: data.name })
        .select("id")
        .single();
      if (error) throw error;
      profileId = inserted.id;
    } else {
      await db.from("profiles").update({ display_name: data.name }).eq("id", profileId);
    }

    // NOTE: total_points stored here is the scraped Google Profile "Skills
    // Points" total — kept only for reference/debugging. It is NEVER used
    // as Arcade Points. Arcade Points are always recomputed from `badges`
    // via calculateArcadeResult() at read time (see GET below), so config
    // changes apply retroactively without re-scraping.
    const { error: snapErr } = await db.from("snapshots").insert({
      profile_id: profileId,
      total_points: data.totalPoints,
      total_badges: data.totalBadges,
      badges: data.badges,
    });
    if (snapErr) throw snapErr;

    const arcadeResult = calculateArcadeResult(data.badges);
    const bonusMilestone = await fetchBonusMilestoneInfo(data.badges);

    return NextResponse.json({ profileId, ...data, arcadeResult, bonusMilestone });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const db = getServiceClient();

  const { data: profile, error: profileErr } = await db
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();
  if (profileErr || !profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const { data: snapshots, error: snapErr } = await db
    .from("snapshots")
    .select("*")
    .eq("profile_id", id)
    .order("fetched_at", { ascending: true });
  if (snapErr) {
    return NextResponse.json({ error: snapErr.message }, { status: 500 });
  }

  const latest = snapshots?.[snapshots.length - 1];
  const arcadeResult = calculateArcadeResult(latest?.badges ?? []);
  const bonusMilestone = await fetchBonusMilestoneInfo(latest?.badges ?? []);

  return NextResponse.json({ profile, snapshots, arcadeResult, bonusMilestone });
}
