import { NextRequest, NextResponse } from "next/server";
import { fetchPublicProfile, fetchBonusMilestoneInfo } from "@/lib/scraper";
import { getServiceClient } from "@/lib/supabase";
import { calculateArcadeResult } from "@/lib/arcadeCalculator";

export async function POST(req: NextRequest) {
  try {
    const { profileId } = await req.json();
    if (!profileId) {
      return NextResponse.json({ error: "Missing profileId" }, { status: 400 });
    }

    const db = getServiceClient();
    const { data: profile, error } = await db
      .from("profiles")
      .select("*")
      .eq("id", profileId)
      .single();
    if (error || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const fresh = await fetchPublicProfile(profile.public_id);

    await db.from("snapshots").insert({
      profile_id: profileId,
      total_points: fresh.totalPoints,
      total_badges: fresh.totalBadges,
      badges: fresh.badges,
    });

    await db.from("profiles").update({ display_name: fresh.name }).eq("id", profileId);

    const bonusMilestone = await fetchBonusMilestoneInfo(fresh.badges);
    const bonusMilestoneAnnounced = !!(bonusMilestone?.description && bonusMilestone.description.length > 100 && !bonusMilestone.description.includes("will be posted here soon"));
    const isBonusMilestoneCompleted = bonusMilestoneAnnounced && bonusMilestone.completed;
    const arcadeResult = calculateArcadeResult(fresh.badges, undefined, isBonusMilestoneCompleted);

    return NextResponse.json({ success: true, ...fresh, arcadeResult, bonusMilestone });
  } catch (err) {
    console.error("Refresh API Error:", err);
    const message = err instanceof Error
      ? err.message
      : (err && typeof err === "object" && "message" in err)
      ? String((err as any).message)
      : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
