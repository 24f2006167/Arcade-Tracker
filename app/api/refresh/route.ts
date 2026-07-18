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

    // Cooldown check: max one refresh every 5 minutes to prevent abuse
    const { data: latest } = await db
      .from("snapshots")
      .select("fetched_at")
      .eq("profile_id", profileId)
      .order("fetched_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latest) {
      const lastFetched = new Date(latest.fetched_at).getTime();
      const diffMin = (Date.now() - lastFetched) / (1000 * 60);
      if (diffMin < 5) {
        const remainingSec = Math.ceil((5 - diffMin) * 60);
        return NextResponse.json(
          { error: `Profile was refreshed recently. Please wait ${remainingSec} seconds before refreshing again.` },
          { status: 429 }
        );
      }
    }

    const fresh = await fetchPublicProfile(profile.public_id);

    await db.from("snapshots").insert({
      profile_id: profileId,
      total_points: fresh.totalPoints,
      total_badges: fresh.totalBadges,
      badges: fresh.badges,
    });

    await db.from("profiles").update({ display_name: fresh.name }).eq("id", profileId);

    const arcadeResult = calculateArcadeResult(fresh.badges);
    const bonusMilestone = await fetchBonusMilestoneInfo(fresh.badges);
    const bonusMilestoneAnnounced = !!(bonusMilestone?.description && bonusMilestone.description.length > 100 && !bonusMilestone.description.includes("will be posted here soon"));
    
    if (bonusMilestoneAnnounced) {
      bonusMilestone.completed = arcadeResult.isBonusMilestoneCompleted;
      bonusMilestone.pointsAwarded = arcadeResult.isBonusMilestoneCompleted ? 10 : 0;
    } else {
      bonusMilestone.completed = false;
      bonusMilestone.pointsAwarded = 0;
    }

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
