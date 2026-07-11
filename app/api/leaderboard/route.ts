import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { calculateArcadeResult } from "@/lib/arcadeCalculator";
import { fetchBonusMilestoneInfo } from "@/lib/scraper";
import type { Badge } from "@/lib/scraper";

export async function GET() {
  try {
    const db = getServiceClient();

    const { data: profiles, error } = await db.from("profiles").select("id, public_id, display_name");
    if (error) throw error;
    if (!profiles?.length) return NextResponse.json({ leaderboard: [] });

    const bonusMilestone = await fetchBonusMilestoneInfo([]);
    const bonusMilestoneAnnounced = !!(bonusMilestone?.description && bonusMilestone.description.length > 100 && !bonusMilestone.description.includes("will be posted here soon"));

    const rows = await Promise.all(
      profiles.map(async (p) => {
        const { data: latest } = await db
          .from("snapshots")
          .select("total_badges, badges, fetched_at")
          .eq("profile_id", p.id)
          .order("fetched_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        const badges = (latest?.badges as Badge[]) ?? [];
        const userBonusMilestone = await fetchBonusMilestoneInfo(badges);
        const isBonusMilestoneCompleted = bonusMilestoneAnnounced && userBonusMilestone.completed;
        const arcade = calculateArcadeResult(badges, undefined, isBonusMilestoneCompleted);

        return {
          profileId: p.id,
          publicId: p.public_id,
          name: p.display_name,
          points: arcade.totalArcadePoints,
          badges: latest?.total_badges ?? 0,
          games: arcade.breakdown.arcadeGames + arcade.breakdown.specialGames,
          skills: arcade.breakdown.skillBadges,
          league: arcade.swag.currentTier?.name ?? "Unranked",
          lastUpdated: latest?.fetched_at ?? null,
        };
      })
    );

    rows.sort((a, b) => b.points - a.points);

    return NextResponse.json({ leaderboard: rows });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
