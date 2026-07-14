import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { calculateArcadeResult } from "@/lib/arcadeCalculator";
import { fetchBonusMilestoneInfo } from "@/lib/scraper";
import type { Badge } from "@/lib/scraper";

/**
 * GET /api/watch
 *
 * Public status endpoint — no auth required.
 * Shows the current live data for all tracked profiles,
 * calculated directly from the latest snapshot in Supabase.
 *
 * Used by the /auto-fetch status page and anyone who wants
 * to check current badge counts programmatically.
 *
 * Example:
 *   fetch("https://your-app.vercel.app/api/watch")
 */
export async function GET() {
  const db = getServiceClient();

  const { data: profiles, error } = await db
    .from("profiles")
    .select("id, public_id, display_name");

  if (error || !profiles) {
    return NextResponse.json({ error: "Failed to load profiles" }, { status: 500 });
  }

  const statuses = await Promise.all(
    profiles.map(async (profile) => {
      const { data: latest } = await db
        .from("snapshots")
        .select("total_badges, badges, fetched_at, total_points")
        .eq("profile_id", profile.id)
        .order("fetched_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const badges = (latest?.badges as Badge[]) ?? [];
      const bonusMilestone = await fetchBonusMilestoneInfo(badges);
      const isBonusDone =
        !!bonusMilestone?.description &&
        bonusMilestone.description.length > 100 &&
        !bonusMilestone.description.includes("will be posted here soon") &&
        bonusMilestone.completed;
      const arcade = calculateArcadeResult(badges, undefined, isBonusDone);

      // Count by category
      const gameBadges = arcade.classifiedBadges.filter(
        (b) => b.category === "arcade_game" || b.category === "special_game"
      ).length;
      const skillBadges = arcade.breakdown.skillBadges;
      const triviaBadges = arcade.breakdown.triviaGames;
      const levelBadges = arcade.breakdown.levelBadges;

      return {
        profileId: profile.id,
        publicId: profile.public_id,
        name: profile.display_name,
        profileUrl: `https://www.skills.google/public_profiles/${profile.public_id}`,
        totalBadges: latest?.total_badges ?? 0,
        arcadePoints: arcade.totalArcadePoints,
        basePoints: arcade.basePoints,
        bonusPoints: arcade.bonusPoints,
        breakdown: {
          gameBadges,
          skillBadges,
          triviaBadges,
          levelBadges,
          specialGames: arcade.breakdown.specialGames,
        },
        currentTier: arcade.swag.currentTier?.name ?? "Unranked",
        nextTier: arcade.swag.nextTier?.name ?? null,
        pointsToNextTier: arcade.swag.pointsNeeded,
        lastSnapshotAt: latest?.fetched_at ?? null,
        // Milestone window badges only (July 13 – Sept 14)
        facilitatorGames: arcade.classifiedBadges.filter((b) => {
          if (!b.earnedDate) return false;
          const d = new Date(b.earnedDate);
          return (
            d >= new Date("2026-07-13T00:00:00Z") &&
            d <= new Date("2026-09-14T23:59:59Z") &&
            (b.category === "arcade_game" || b.category === "special_game")
          );
        }).length,
        facilitatorSkillBadges: arcade.classifiedBadges.filter((b) => {
          if (!b.earnedDate) return false;
          const d = new Date(b.earnedDate);
          return (
            d >= new Date("2026-07-13T00:00:00Z") &&
            d <= new Date("2026-09-14T23:59:59Z") &&
            b.category === "skill_badge"
          );
        }).length,
      };
    })
  );

  return NextResponse.json(
    {
      fetchedAt: new Date().toISOString(),
      totalProfiles: profiles.length,
      profiles: statuses,
      meta: {
        description:
          "Live Arcade Points status for all tracked profiles. Scraped from skills.google public profiles.",
        dataSource: "skills.google/public_profiles",
        updateFrequency: "Every 15 minutes via Vercel Cron",
        arcadePointRules: {
          arcadeGame: "1 pt per badge",
          specialGame: "2 pts per badge",
          skillBadge: "0.5 pts per badge (1 pt per 2 badges)",
          trivia: "1 pt per badge",
          levelSprint: "1 pt per badge",
        },
      },
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        "Access-Control-Allow-Origin": "*",
      },
    }
  );
}
