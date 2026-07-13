import { type NextRequest } from "next/server";
import { fetchPublicProfile, fetchBonusMilestoneInfo } from "@/lib/scraper";
import { getServiceClient } from "@/lib/supabase";
import { calculateArcadeResult } from "@/lib/arcadeCalculator";
import type { Badge } from "@/lib/scraper";

/**
 * GET /api/profile/stream?id=<profileId>
 *
 * Server-Sent Events endpoint for real-time badge detection.
 *
 * Behaviour:
 *  1. Immediately sends a `snapshot` event with current DB data.
 *  2. Every POLL_INTERVAL_MS, directly scrapes skills.google for the profile.
 *  3. If badge count changed → inserts new Supabase snapshot → sends `update` event.
 *  4. If no change → sends `heartbeat` event with current count + timestamp.
 *  5. Cleans up on client disconnect.
 *
 * SSE event types:
 *   snapshot  – initial DB data (same shape as /api/profile GET response)
 *   update    – fresh data after a change was detected
 *   heartbeat – no change; contains { badgeCount, checkedAt, arcadePoints }
 *   error     – scrape/DB error; contains { message }
 */

export const runtime = "nodejs";
// Give this SSE connection up to 5 minutes on Vercel Pro; on Hobby the platform
// cuts it at ~60 s but the client's EventSource will auto-reconnect.
export const maxDuration = 300;

const POLL_INTERVAL_MS = 5_000; // 5 seconds
const HEARTBEAT_INTERVAL_MS = 20_000; // keep-alive comment every 20 s

export async function GET(req: NextRequest) {
  const profileId = req.nextUrl.searchParams.get("id");
  if (!profileId) {
    return new Response(JSON.stringify({ error: "Missing id" }), { status: 400 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let closed = false;

      function send(event: string, data: unknown) {
        if (closed) return;
        try {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
          );
        } catch {
          closed = true;
        }
      }

      function sendComment(comment: string) {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`: ${comment}\n\n`));
        } catch {
          closed = true;
        }
      }

      const db = getServiceClient();

      // ── 1. Load profile from DB ─────────────────────────────────────────
      const { data: profile, error: profileErr } = await db
        .from("profiles")
        .select("*")
        .eq("id", profileId)
        .single();

      if (profileErr || !profile) {
        send("error", { message: "Profile not found" });
        try { controller.close(); } catch { /* already closed */ }
        return;
      }

      // ── 2. Send initial snapshot from DB ────────────────────────────────
      const { data: snapshots } = await db
        .from("snapshots")
        .select("*")
        .eq("profile_id", profileId)
        .order("fetched_at", { ascending: true });

      const latest = snapshots?.[snapshots.length - 1];
      const latestBadges = (latest?.badges as Badge[]) ?? [];
      const bonusMilestone = await fetchBonusMilestoneInfo(latestBadges);
      const bonusMilestoneAnnounced =
        !!(bonusMilestone?.description &&
          bonusMilestone.description.length > 100 &&
          !bonusMilestone.description.includes("will be posted here soon"));
      const isBonusMilestoneCompleted = bonusMilestoneAnnounced && bonusMilestone.completed;
      const arcadeResult = calculateArcadeResult(latestBadges, undefined, isBonusMilestoneCompleted);

      send("snapshot", {
        profile,
        snapshots,
        arcadeResult,
        bonusMilestone,
        watchingLive: true,
      });

      // ── 3. Track current badge count for change detection ────────────────
      let lastKnownBadgeCount = latest?.total_badges ?? 0;
      let lastKnownBadgeTitles = new Set<string>(
        latestBadges.map((b) => b.title)
      );

      // ── 4. Poll skills.google every 5 seconds ──────────────────────────
      const pollInterval = setInterval(async () => {
        if (closed) {
          clearInterval(pollInterval);
          clearInterval(heartbeatInterval);
          return;
        }

        try {
          const fresh = await fetchPublicProfile(profile.public_id);

          if (fresh.totalBadges !== lastKnownBadgeCount) {
            // ── Change detected! ─────────────────────────────────────────

            // Find which badges are new
            const newBadges = fresh.badges.filter(
              (b) => !lastKnownBadgeTitles.has(b.title)
            );

            // Write new snapshot to Supabase (triggers Realtime for any other listeners)
            await db.from("snapshots").insert({
              profile_id: profileId,
              total_points: fresh.totalPoints,
              total_badges: fresh.totalBadges,
              badges: fresh.badges,
            });

            if (fresh.name !== profile.display_name) {
              await db
                .from("profiles")
                .update({ display_name: fresh.name })
                .eq("id", profileId);
            }

            // Recompute arcade points with fresh data
            const freshBonus = await fetchBonusMilestoneInfo(fresh.badges);
            const freshBonusAnnounced =
              !!(freshBonus?.description &&
                freshBonus.description.length > 100 &&
                !freshBonus.description.includes("will be posted here soon"));
            const isFreshBonusDone = freshBonusAnnounced && freshBonus.completed;
            const freshArcade = calculateArcadeResult(fresh.badges, undefined, isFreshBonusDone);

            // Reload snapshots from DB to get the full history
            const { data: freshSnapshots } = await db
              .from("snapshots")
              .select("*")
              .eq("profile_id", profileId)
              .order("fetched_at", { ascending: true });

            send("update", {
              profile: { ...profile, display_name: fresh.name },
              snapshots: freshSnapshots,
              arcadeResult: freshArcade,
              bonusMilestone: freshBonus,
              newBadges,
              previousBadgeCount: lastKnownBadgeCount,
              newBadgeCount: fresh.totalBadges,
              pointsDelta:
                freshArcade.totalArcadePoints - arcadeResult.totalArcadePoints,
              watchingLive: true,
            });

            // Update tracking state
            lastKnownBadgeCount = fresh.totalBadges;
            lastKnownBadgeTitles = new Set(fresh.badges.map((b) => b.title));
          } else {
            // No change — send heartbeat with current info
            send("heartbeat", {
              badgeCount: fresh.totalBadges,
              arcadePoints: arcadeResult.totalArcadePoints,
              checkedAt: new Date().toISOString(),
            });
          }
        } catch (err) {
          send("error", {
            message: err instanceof Error ? err.message : "Scrape failed",
            checkedAt: new Date().toISOString(),
          });
        }
      }, POLL_INTERVAL_MS);

      // ── 5. SSE keep-alive comments (prevents proxy timeouts) ──────────
      const heartbeatInterval = setInterval(() => {
        sendComment("heartbeat");
      }, HEARTBEAT_INTERVAL_MS);

      // ── 6. Cleanup on disconnect ─────────────────────────────────────
      req.signal.addEventListener("abort", () => {
        closed = true;
        clearInterval(pollInterval);
        clearInterval(heartbeatInterval);
        try { controller.close(); } catch { /* already closed */ }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
