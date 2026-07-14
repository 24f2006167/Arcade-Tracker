import { NextRequest, NextResponse } from "next/server";
import { fetchPublicProfile, fetchBonusMilestoneInfo } from "@/lib/scraper";
import { getServiceClient } from "@/lib/supabase";
import { calculateArcadeResult } from "@/lib/arcadeCalculator";

/**
 * GET /api/cron
 *
 * Called automatically by Vercel Cron every 15 minutes (see vercel.json).
 * Also callable manually from /auto-fetch page or via:
 *   curl https://your-app.vercel.app/api/cron
 *
 * What it does:
 *  1. Fetches every profile from the `profiles` table
 *  2. Scrapes the live public profile page on skills.google
 *  3. Compares badge count with the last snapshot
 *  4. If badges changed → inserts a new snapshot row (triggers Supabase Realtime)
 *  5. Returns a detailed JSON report of what happened
 *
 * Change detection: only writes to DB when badge count changes,
 * preventing unnecessary Supabase writes on every cron tick.
 */

interface ProfileResult {
  publicId: string;
  name: string;
  status: "updated" | "no-change" | "error";
  previousBadgeCount?: number;
  newBadgeCount?: number;
  arcadePoints?: number;
  newBadgesSince?: string[];
  error?: string;
  scrapedAt: string;
}

// In-memory log of last N runs (survives for the lifetime of the serverless instance)
const RUN_LOG: {
  runAt: string;
  profilesChecked: number;
  profilesUpdated: number;
  results: ProfileResult[];
}[] = [];
const MAX_LOG_ENTRIES = 10;

export async function GET(req: NextRequest) {
  // ── Secret guard (optional but recommended) ─────────────────────────────
  // Add CRON_SECRET to your .env.local and Vercel env vars.
  // Vercel Cron automatically passes this; manual callers can skip it in dev.
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers.get("authorization");
    const isVercelCron = req.headers.get("x-vercel-cron") === "1";
    if (!isVercelCron && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: "Unauthorized — pass Authorization: Bearer <CRON_SECRET>" },
        { status: 401 }
      );
    }
  }

  const runAt = new Date().toISOString();
  const db = getServiceClient();

  // ── 1. Load all tracked profiles ────────────────────────────────────────
  const { data: profiles, error: profilesErr } = await db
    .from("profiles")
    .select("id, public_id, display_name");

  if (profilesErr || !profiles) {
    return NextResponse.json(
      { error: "Failed to load profiles", detail: profilesErr?.message },
      { status: 500 }
    );
  }

  const results: ProfileResult[] = [];

  // ── 2. Process each profile ──────────────────────────────────────────────
  for (const profile of profiles) {
    const scrapedAt = new Date().toISOString();

    try {
      // Fetch latest snapshot from DB
      const { data: lastSnap } = await db
        .from("snapshots")
        .select("total_badges, badges, fetched_at")
        .eq("profile_id", profile.id)
        .order("fetched_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      // Scrape live profile from skills.google
      const fresh = await fetchPublicProfile(profile.public_id);

      const prevCount = lastSnap?.total_badges ?? 0;
      const newCount = fresh.totalBadges;

      if (newCount !== prevCount || !lastSnap) {
        // ── Badge change detected → write snapshot ──────────────────────
        await db.from("snapshots").insert({
          profile_id: profile.id,
          total_points: fresh.totalPoints,
          total_badges: fresh.totalBadges,
          badges: fresh.badges,
        });

        // Update display name if changed
        if (fresh.name !== profile.display_name) {
          await db
            .from("profiles")
            .update({ display_name: fresh.name })
            .eq("id", profile.id);
        }

        // Compute arcade points for the report
        const bonusMilestone = await fetchBonusMilestoneInfo(fresh.badges);
        const isBonusDone =
          !!bonusMilestone?.description &&
          bonusMilestone.description.length > 100 &&
          !bonusMilestone.description.includes("will be posted here soon") &&
          bonusMilestone.completed;
        const arcade = calculateArcadeResult(fresh.badges, undefined, isBonusDone);

        // Find which specific badges are new
        const prevTitles = new Set(
          ((lastSnap?.badges as { title: string }[]) ?? []).map((b) => b.title)
        );
        const newBadges = fresh.badges
          .filter((b) => !prevTitles.has(b.title))
          .map((b) => b.title);

        results.push({
          publicId: profile.public_id,
          name: fresh.name,
          status: "updated",
          previousBadgeCount: prevCount,
          newBadgeCount: newCount,
          arcadePoints: arcade.totalArcadePoints,
          newBadgesSince: newBadges,
          scrapedAt,
        });
      } else {
        // No change
        const bonusMilestone = await fetchBonusMilestoneInfo(fresh.badges);
        const isBonusDone =
          !!bonusMilestone?.description &&
          bonusMilestone.description.length > 100 &&
          !bonusMilestone.description.includes("will be posted here soon") &&
          bonusMilestone.completed;
        const arcade = calculateArcadeResult(fresh.badges, undefined, isBonusDone);

        results.push({
          publicId: profile.public_id,
          name: fresh.name,
          status: "no-change",
          previousBadgeCount: prevCount,
          newBadgeCount: newCount,
          arcadePoints: arcade.totalArcadePoints,
          scrapedAt,
        });
      }
    } catch (err) {
      results.push({
        publicId: profile.public_id,
        name: profile.display_name ?? "Unknown",
        status: "error",
        error: err instanceof Error ? err.message : String(err),
        scrapedAt,
      });
    }
  }

  // ── 3. Persist run to in-memory log ─────────────────────────────────────
  const runEntry = {
    runAt,
    profilesChecked: profiles.length,
    profilesUpdated: results.filter((r) => r.status === "updated").length,
    results,
  };
  RUN_LOG.unshift(runEntry);
  if (RUN_LOG.length > MAX_LOG_ENTRIES) RUN_LOG.pop();

  return NextResponse.json({
    success: true,
    runAt,
    profilesChecked: profiles.length,
    profilesUpdated: results.filter((r) => r.status === "updated").length,
    results,
    recentRuns: RUN_LOG.length,
  });
}

/**
 * GET /api/cron/log — returns the in-memory run history
 * Exposed separately so the status page can poll it.
 */
export { RUN_LOG };
