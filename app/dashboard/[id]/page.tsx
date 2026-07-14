"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { RotateCw, Gamepad2, AlertTriangle, Calendar, Lock, ArrowLeft, ShieldX, Check, Wifi, WifiOff, Star } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { ScoreboardStrip } from "@/components/ScoreboardStrip";
import { PointsDistributionTable } from "@/components/PointsDistributionTable";
import { BadgeGrid } from "@/components/BadgeGrid";
import { IncompleteBadges } from "@/components/IncompleteBadges";
import { HistoryChart } from "@/components/HistoryChart";
import { MilestoneProgressStepper } from "@/components/MilestoneProgressStepper";
import { SeasonCountdown } from "@/components/SeasonCountdown";
import { calculateArcadeResult } from "@/lib/arcadeCalculator";
import { SEASON } from "@/lib/arcade";
import type { ArcadeResult } from "@/lib/arcadeCalculator";
import type { Badge, BonusMilestoneInfo } from "@/lib/scraper";

import HackerVaultTransition from "@/components/hero/HackerVaultTransition";

// Facilitator program date boundaries (IST = UTC+5:30)
// July 13, 2026 17:00 IST = July 13, 2026 11:30 UTC
const FACILITATOR_START = new Date("2026-07-13T11:30:00Z");
// September 14, 2026 23:59 IST = September 14, 2026 18:29 UTC
const FACILITATOR_END = new Date("2026-09-14T18:29:00Z");

/**
 * Parse a badge's earnedDate string into a Date.
 * Formats seen: "Jun 13, 2026", "Jun  8, 2026" (double-space for single digit days)
 */
function parseEarnedDate(dateStr?: string): Date | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}

function facilitatorBadges(badges: Badge[]): Badge[] {
  return badges.filter((b) => {
    if (!b.earnedDate) return false;
    const localDate = new Date(b.earnedDate);
    if (isNaN(localDate.getTime())) return false;
    const d = new Date(Date.UTC(localDate.getFullYear(), localDate.getMonth(), localDate.getDate()));
    const start = new Date("2026-07-13T00:00:00Z");
    const end = new Date("2026-09-14T23:59:59Z");
    return d >= start && d <= end;
  });
}

interface Snapshot {
  total_points: number;
  total_badges: number;
  badges: Badge[];
  fetched_at: string;
}

interface ProfileResponse {
  profile: { id: string; public_id: string; display_name: string };
  snapshots: Snapshot[];
  arcadeResult: ArcadeResult;
  bonusMilestone?: BonusMilestoneInfo;
}

/** Returns true if this profileId is saved in the user's own localStorage. */
function isOwnedProfile(id: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const stored = localStorage.getItem("arcade_profiles");
    if (!stored) return false;
    const list: { id: string }[] = JSON.parse(stored);
    return list.some((p) => p.id === id);
  } catch {
    return false;
  }
}

// ── Toast notification type ─────────────────────────────────────────────────
interface BadgeToast {
  id: string;
  badgeName: string;
  pointsDelta: number;
  newBadgeCount: number;
}

export default function DashboardPage() {
  const { theme, hackerMode, isTransitioning, isTurningOff, completeTransition } = useTheme();
  const isLight = theme === "light";
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<ProfileResponse | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accessGranted, setAccessGranted] = useState<boolean | null>(null);
  // SSE live connection state
  const [liveStatus, setLiveStatus] = useState<"connecting" | "live" | "reconnecting" | "error">("connecting");
  const [lastCheckedAt, setLastCheckedAt] = useState<string | null>(null);
  const [toasts, setToasts] = useState<BadgeToast[]>([]);
  const [liveSpots, setLiveSpots] = useState<Record<string, { left: number; total: number }>>(
    {
      "Arcade Trooper": { total: 6000, left: 4837 },
      "Arcade Ranger": { total: 4000, left: 3899 },
      "Arcade Champion": { total: 3000, left: 2979 },
      "Arcade Legend": { total: 2500, left: 2500 },
    });
  const [lastRefreshedText, setLastRefreshedText] = useState<string>("June 29, 2026 at 8:08 AM UTC");

  // ── Helper: dismiss a toast by id ───────────────────────────────────────
  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // ── Persist profile to localStorage whenever data changes ───────────────
  useEffect(() => {
    if (data && params.id) {
      const stored = localStorage.getItem("arcade_profiles");
      let list: { id: string; name: string; points: number }[] = [];
      try { list = stored ? JSON.parse(stored) : []; } catch (_) { }
      const finalPoints = data.arcadeResult.totalArcadePoints;
      list = list.filter((p) => p.id !== data.profile.id);
      list.push({ id: data.profile.id, name: data.profile.display_name, points: finalPoints });
      localStorage.setItem("arcade_profiles", JSON.stringify(list));
      localStorage.setItem("last_profile_id", data.profile.id);
    }
  }, [data, params.id]);

  useEffect(() => {
    async function fetchLiveTiers() {
      try {
        const res = await fetch("/api/arcade-games");
        if (res.ok) {
          const json = await res.json();
          if (Array.isArray(json.prizeTiers) && json.prizeTiers.length > 0) {
            const mapped: Record<string, { left: number; total: number }> = {};
            json.prizeTiers.forEach((tier: { name: string; left: number; total: number }) => {
              mapped[tier.name] = { left: tier.left, total: tier.total };
            });
            setLiveSpots(mapped);
          }
          if (json.lastRefreshedText) setLastRefreshedText(json.lastRefreshedText);
        }
      } catch (err) {
        console.error("Failed to fetch live prize tiers", err);
      }
    }
    fetchLiveTiers();
  }, []);

  // ── Initial HTTP fetch (fast fallback so data shows immediately) ────────
  useEffect(() => {
    const owned = isOwnedProfile(params.id);
    setAccessGranted(owned);
    if (!owned) return;

    // Load data via regular HTTP immediately so we don't wait for SSE snapshot
    fetch(`/api/profile?id=${params.id}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.profile) {
          setData(json);
        }
      })
      .catch(() => { /* SSE snapshot will cover this */ });
  }, [params.id]);

  // ── SSE stream subscription ──────────────────────────────────────────────
  useEffect(() => {
    if (!isOwnedProfile(params.id)) return;

    let es: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let mounted = true;

    function connect() {
      if (!mounted) return;
      setLiveStatus("connecting");
      es = new EventSource(`/api/profile/stream?id=${params.id}`);

      // Initial snapshot from DB — overrides the HTTP fetch with full live data
      es.addEventListener("snapshot", (e) => {
        try {
          const payload = JSON.parse(e.data);
          setData(payload);
          setLiveStatus("live");
          setLastCheckedAt(new Date().toISOString());
        } catch { /* ignore parse errors */ }
      });

      // Live update — badge count changed!
      es.addEventListener("update", (e) => {
        try {
          const payload = JSON.parse(e.data);
          setData({
            profile: payload.profile,
            snapshots: payload.snapshots,
            arcadeResult: payload.arcadeResult,
            bonusMilestone: payload.bonusMilestone,
          });
          setLiveStatus("live");
          setLastCheckedAt(new Date().toISOString());

          // Show toast for each new badge
          const newBadges: { title: string }[] = payload.newBadges ?? [];
          const pointsDelta: number = payload.pointsDelta ?? 0;
          newBadges.forEach((badge, idx) => {
            const toastId = `${Date.now()}-${idx}`;
            setToasts((prev) => [
              ...prev,
              {
                id: toastId,
                badgeName: badge.title,
                pointsDelta,
                newBadgeCount: payload.newBadgeCount,
              },
            ]);
            // Auto-dismiss after 5 seconds
            setTimeout(() => dismissToast(toastId), 5000);
          });
        } catch { /* ignore parse errors */ }
      });

      // Heartbeat — no change, still watching
      es.addEventListener("heartbeat", (e) => {
        try {
          const payload = JSON.parse(e.data);
          setLastCheckedAt(payload.checkedAt);
          setLiveStatus("live");
        } catch { /* ignore */ }
      });

      // SSE-level error → reconnect after 3s
      es.onerror = () => {
        if (!mounted) return;
        setLiveStatus("reconnecting");
        es?.close();
        reconnectTimer = setTimeout(connect, 3000);
      };
    }

    connect();

    return () => {
      mounted = false;
      es?.close();
      if (reconnectTimer) clearTimeout(reconnectTimer);
    };
  }, [params.id, dismissToast]);

  // ── Manual refresh (force-scrapes skills.google immediately) ────────────
  const load = useCallback(async () => {
    const res = await fetch(`/api/profile?id=${params.id}`);
    const json = await res.json();
    if (!res.ok) { setError(json.error || "Failed to load profile"); return; }
    setData(json);
  }, [params.id]);

  async function handleRefresh() {
    setRefreshing(true);
    setError(null);
    try {
      const res = await fetch("/api/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId: params.id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Refresh failed");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Refresh failed");
    } finally {
      setRefreshing(false);
    }
  }

  if (error) {
    return <p className="text-pink text-sm text-center py-20">{error}</p>;
  }

  // Show a lock screen if the profile doesn't belong to this user
  if (accessGranted === false) {
    return (
      <div className="flex flex-col items-center justify-center gap-8 py-28 text-center">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-pink/20 blur-2xl scale-150" />
          <div className="relative w-20 h-20 rounded-2xl glass-strong border border-pink/30 flex items-center justify-center">
            <ShieldX className="w-10 h-10 text-pink" />
          </div>
        </div>
        <div className="space-y-3 max-w-sm">
          <h1 className="font-display text-2xl font-semibold text-mist">Access Denied</h1>
          <p className="text-mist-muted text-sm leading-relaxed">
            This dashboard belongs to another player. You can only view your{" "}
            <span className="text-mist font-medium">own dashboard</span> after
            tracking your profile.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan via-violet to-pink text-void text-sm font-semibold transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            Track your own profile
          </Link>
          <Link
            href="/leaderboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl glass border border-line/40 text-mist text-sm hover:bg-white/10 transition-colors"
          >
            Back to Leaderboard
          </Link>
        </div>
      </div>
    );
  }

  if (accessGranted === null || !data) {
    return (
      <div className="flex flex-col items-center gap-3 py-24">
        <span className="text-mist-muted text-sm animate-pulse">Loading profile...</span>
      </div>
    );
  }

  const latest = data.snapshots[data.snapshots.length - 1];
  const arcade = data.arcadeResult;
  const badges = latest?.badges ?? [];

  // Total arcade points (includes milestone bonuses and bonus milestone if eligible/completed)
  const points = arcade.totalArcadePoints;

  const tiersConfig = [
    { name: "Arcade Trooper", points: 50 },
    { name: "Arcade Ranger", points: 75 },
    { name: "Arcade Champion", points: 95 },
    { name: "Arcade Legend", points: 120 },
  ];

  let currentTier: { name: string; points: number } | null = null;
  let nextTier: { name: string; points: number } | null = null;
  for (const tier of tiersConfig) {
    if (points >= tier.points) currentTier = tier;
    else if (!nextTier) nextTier = tier;
  }
  const pointsNeeded = nextTier ? Math.max(nextTier.points - points, 0) : 0;

  const updatedTiers = tiersConfig.map(tier => {
    const achieved = points >= tier.points;
    const current = (currentTier === null && tier.name === "Arcade Trooper") || (currentTier?.name === tier.name);
    const pct = Math.min(100, Math.round((points / tier.points) * 100));
    return {
      ...tier,
      achieved,
      current,
      pointsToGo: Math.max(tier.points - points, 0),
      pct
    };
  });

  // ── History chart: annotate each snapshot with its computed Arcade Points ──
  const chartData = data.snapshots.map((snap) => ({
    ...snap,
    arcadePoints: calculateArcadeResult(snap.badges ?? []).totalArcadePoints,
  }));

  // ── Facilitator milestones: only count badges earned during the program ────
  const now = new Date();
  const facilitatorStarted = now >= FACILITATOR_START;
  const facilitatorEnded = now > FACILITATOR_END;
  const facBadges = facilitatorBadges(badges);
  const facArcade = calculateArcadeResult(facBadges);

  return (
    <div className="space-y-8 py-12">
      {/* Hacker Vault Decryption lock overlay transition */}
      {isTransitioning && (
        <HackerVaultTransition 
          isTurningOff={isTurningOff}
          onComplete={completeTransition} 
        />
      )}
      {/* ── Toast notifications (top-right) ── */}
      <div style={{
        position: "fixed",
        top: "20px",
        right: "20px",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        pointerEvents: "none",
      }}>
        {toasts.map((toast) => (
          <div
            key={toast.id}
            style={{
              pointerEvents: "all",
              background: "linear-gradient(135deg, rgba(16,185,129,0.95) 0%, rgba(5,150,105,0.95) 100%)",
              border: "1px solid rgba(52,211,153,0.5)",
              borderRadius: "14px",
              padding: "14px 18px",
              minWidth: "280px",
              maxWidth: "360px",
              boxShadow: "0 8px 32px rgba(16,185,129,0.3), 0 2px 8px rgba(0,0,0,0.4)",
              animation: "slideInRight 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards",
              display: "flex",
              flexDirection: "column",
              gap: "6px",
              cursor: "pointer",
            }}
            onClick={() => dismissToast(toast.id)}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Star style={{ width: "16px", height: "16px", color: "#fbbf24", fill: "#fbbf24", flexShrink: 0 }} />
              <span style={{ fontSize: "13px", fontWeight: 700, color: "#ffffff" }}>
                🎉 New Badge Earned!
              </span>
              {toast.pointsDelta > 0 && (
                <span style={{
                  marginLeft: "auto",
                  background: "rgba(255,255,255,0.2)",
                  borderRadius: "20px",
                  padding: "2px 8px",
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "#fff",
                  whiteSpace: "nowrap",
                }}>
                  +{toast.pointsDelta} pts
                </span>
              )}
            </div>
            <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.85)", margin: 0, lineHeight: 1.4 }}>
              {toast.badgeName}
            </p>
            <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.6)", margin: 0 }}>
              Total badges: {toast.newBadgeCount} · Click to dismiss
            </p>
          </div>
        ))}
      </div>

      {/* Top Navigation Back Redirection */}
      <div className="flex items-center justify-between rise-in">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl glass hover:bg-white/10 text-xs text-mist-muted hover:text-mist transition-all duration-200 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Home
        </Link>

        {/* Live connection indicator */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          padding: "5px 11px",
          borderRadius: "20px",
          fontSize: "11px",
          fontWeight: 600,
          background: liveStatus === "live"
            ? "rgba(34,197,94,0.12)"
            : liveStatus === "connecting"
              ? "rgba(251,191,36,0.12)"
              : "rgba(239,68,68,0.12)",
          border: liveStatus === "live"
            ? "1px solid rgba(34,197,94,0.35)"
            : liveStatus === "connecting"
              ? "1px solid rgba(251,191,36,0.35)"
              : "1px solid rgba(239,68,68,0.35)",
          color: liveStatus === "live" ? "#4ade80" : liveStatus === "connecting" ? "#fbbf24" : "#f87171",
        }}>
          {liveStatus === "live" ? (
            <>
              <Wifi style={{ width: "12px", height: "12px" }} />
              <span style={{
                display: "inline-block",
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: "#4ade80",
                animation: "livePulse 2s infinite",
              }} />
              Live · checking every 5s
            </>
          ) : liveStatus === "connecting" ? (
            <><RotateCw style={{ width: "11px", height: "11px", animation: "spin 1s linear infinite" }} /> Connecting...</>
          ) : (
            <><WifiOff style={{ width: "12px", height: "12px" }} /> Reconnecting...</>
          )}
          {lastCheckedAt && liveStatus === "live" && (
            <span style={{ opacity: 0.6, fontWeight: 400, fontSize: "10px" }}>
              · checked {Math.round((Date.now() - new Date(lastCheckedAt).getTime()) / 1000)}s ago
            </span>
          )}
        </div>
      </div>

      <SeasonCountdown />

      {/* Hero */}
      <div className="gradient-ring glass-strong rounded-2xl relative overflow-hidden px-7 py-8 rise-in border border-line">
        {hackerMode ? (
          <div className="absolute inset-0 z-0 pointer-events-none select-none">
            <img 
              src="/hacker-desk.png" 
              alt="Cyber Cover" 
              className={`w-full h-full object-cover object-center ${isLight ? "opacity-15 mix-blend-multiply" : "opacity-25 mix-blend-lighten"}`}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-void via-void/90 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-void to-transparent opacity-65" />
          </div>
        ) : (
          <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-gradient-to-br from-cyan/20 via-violet/20 to-pink/20 blur-3xl" />
        )}
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 text-xs text-mist-muted">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan pulse-glow" />
              Hello, {data.profile.display_name} 👋
            </span>
            <h1 className="font-display text-3xl font-semibold text-mist">
              {points} Arcade Points
            </h1>
            <p className="text-mist-muted text-xs">
              ID &middot; {data.profile.public_id}
              {" "}&middot;{" "}
              {arcade.basePoints} base + {arcade.bonusPoints} bonus
            </p>
            <div className="flex flex-wrap gap-3 pt-1 text-xs">
              <span className="px-3 py-1 rounded-full bg-amber/15 text-amber font-medium">
                {currentTier ? currentTier.name : "Unranked"}
              </span>
              {nextTier && (
                <span className="px-3 py-1 rounded-full bg-cyan/10 text-cyan">
                  Need {pointsNeeded} more for {nextTier.name}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="rounded-xl flex items-center gap-2 bg-gradient-to-r from-cyan via-violet to-pink text-void font-medium px-5 py-2.5 text-sm transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 self-start"
          >
            <RotateCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Refreshing..." : "Refresh profile"}
          </button>
        </div>
      </div>


      {arcade.breakdown.needsReview.length > 0 && (
        <div className="glass rounded-2xl px-5 py-4 flex items-start gap-3 border border-amber/30 rise-in">
          <AlertTriangle className="w-4 h-4 text-amber shrink-0 mt-0.5" />
          <p className="text-xs text-mist-muted">
            <span className="text-amber font-medium">
              {arcade.breakdown.needsReview.length} badge
              {arcade.breakdown.needsReview.length > 1 ? "s" : ""} need review
            </span>{" "}
            — classified via a generic keyword fallback:{" "}
            {arcade.breakdown.needsReview.map((b) => b.title).join(", ")}.
          </p>
        </div>
      )}

      <ScoreboardStrip
        items={[
          { label: "Arcade Points", value: points, accent: "amber", icon: "trophy" },
          { label: "Total Badges", value: latest?.total_badges ?? 0, accent: "cyan", icon: "award" },
          { label: "Snapshots Logged", value: data.snapshots.length, accent: "pink", icon: "history" },
        ]}
      />

      {/* ── Points Distribution Table ─────────────────────────────────── */}
      <PointsDistributionTable
        arcadeResult={arcade}
        totalBadges={latest?.total_badges ?? 0}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left col: Tier roadmap + Points System */}
        <div className="flex flex-col gap-6">
          <div className="glass-strong rounded-2xl px-6 py-6 space-y-5 rise-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <h2 className="font-display text-sm font-semibold text-mist">Swags Tier Progress</h2>
              {lastRefreshedText && (
                <span className="text-[10px] text-mist-muted sm:text-right">
                  Refreshed: {lastRefreshedText}
                </span>
              )}
            </div>
            <div className="space-y-4">
              {updatedTiers.map((tier) => {
                const spots = liveSpots[tier.name];
                const baseLimits: Record<string, number> = {
                  "Arcade Trooper": 5000,
                  "Arcade Ranger": 3000,
                  "Arcade Champion": 2000,
                  "Arcade Legend": 2000,
                };
                const base = baseLimits[tier.name] || 0;
                const increase = spots ? spots.total - base : 0;
                const filledCount = spots ? spots.total - spots.left : 0;
                const filledPct = spots ? Math.round((filledCount / spots.total) * 100) : 0;

                return (
                  <div key={tier.name} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span
                        className={`font-medium ${tier.achieved ? "text-amber" : tier.current ? "text-cyan" : "text-mist-muted"
                          }`}
                      >
                        {tier.name}
                        {tier.achieved && " ✓"}
                      </span>
                      <span className="text-mist-muted">
                        {Math.min(points, tier.points)} / {tier.points} pts
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${tier.achieved
                            ? "bg-gradient-to-r from-amber to-pink"
                            : "bg-gradient-to-r from-cyan to-violet"
                          }`}
                        style={{ width: `${tier.pct}%` }}
                      />
                    </div>
                    {spots && (
                      <div className="space-y-1 pt-1 border-t border-white/5 mt-1.5">
                        <div className="flex items-center justify-between text-[10px] text-mist-muted">
                          <span>Prize spots remaining:</span>
                          <span className="font-semibold text-mist">
                            {spots.left.toLocaleString()} / {spots.total.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-mist-muted">
                          <span>Spots filled:</span>
                          <span className="font-semibold text-mist text-[10px]">
                            {filledCount.toLocaleString()} ({filledPct}% filled)
                          </span>
                        </div>
                        <div className="h-1 bg-white/5 rounded-full overflow-hidden mt-0.5">
                          <div
                            className="h-full bg-gradient-to-r from-pink/50 to-violet/50 rounded-full transition-all duration-500"
                            style={{ width: `${filledPct}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Points System Quick Reference — fills empty space below tier table */}
          <div className="glass-strong rounded-2xl px-6 py-5 space-y-4 rise-in">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-sm font-semibold text-mist">Points System</h2>
              <a
                href="https://rsvp.withgoogle.com/events/arcade-facilitator/points-system"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-cyan hover:underline flex items-center gap-1"
              >
                Official Page →
              </a>
            </div>
            <div className="space-y-2">
              {[
                { label: "Arcade Adventure", desc: "x1 game badge", pts: "= 1 point", color: "text-pink" },
                { label: "Arcade Voyage", desc: "x1 game badge", pts: "= 1 point", color: "text-pink" },
                { label: "Arcade Trail", desc: "x1 game badge", pts: "= 1 point", color: "text-pink" },
                { label: "Skill Badge", desc: "x2 badges", pts: "= 1 point", color: "text-amber" },
                { label: "Milestone", desc: "x1 completed", pts: "= X bonus", color: "text-violet" },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between text-xs py-1 border-b border-white/5 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full bg-current ${row.color}`} />
                    <span className="text-mist">{row.label}</span>
                    <span className="text-mist-muted text-[10px]">{row.desc}</span>
                  </div>
                  <span className="text-amber font-semibold text-[10px]">{row.pts}</span>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-mist-muted leading-relaxed">
              Note: You only receive points for the milestone that you earn and not for the ones before it.
            </p>
          </div>
        </div>

        {/* Current progress & Swags Eligibility */}
        <div className="flex flex-col gap-6">
          <div className="glass-strong rounded-2xl px-6 py-6 space-y-5 rise-in">
            <h2 className="font-display text-sm font-semibold text-mist">Current progress</h2>
            {[
              { label: "Arcade Games", value: arcade.breakdown.arcadeGames, color: "from-pink to-amber" },
              { label: "Skill Badges", value: arcade.breakdown.skillBadges, color: "from-cyan to-violet" },
              { label: "Trivia Games", value: arcade.breakdown.triviaGames, color: "from-amber to-cyan" },
              { label: "Special Games", value: arcade.breakdown.specialGames, color: "from-violet to-pink" },
              { label: "Level Badges", value: arcade.breakdown.levelBadges, color: "from-cyan to-amber" },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between text-xs">
                <span className="text-mist-muted flex items-center gap-1.5">
                  <Gamepad2 className="w-3.5 h-3.5" /> {row.label}
                </span>
                <span className="text-mist font-medium">{row.value}</span>
              </div>
            ))}
          </div>

          <div className="glass-strong rounded-2xl px-6 py-5 space-y-4 rise-in">
            <h2 className="font-display text-sm font-semibold text-mist">Swags Eligibility</h2>
            {points < 50 ? (
              <div className="flex flex-col items-center justify-center py-2 text-center space-y-3">
                <div className="relative w-12 h-12 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 shadow-lg">
                  <Gamepad2 className="w-6 h-6 text-mist-muted" />
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-pink/20 border border-pink/50 text-pink flex items-center justify-center font-bold text-[10px]">
                    ✕
                  </span>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-pink">Not Eligible Yet</p>
                  <p className="text-[10px] text-mist-muted max-w-xs leading-normal">
                    You need at least 50 points (Arcade Trooper) to qualify for swags. Keep completing challenges!
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-2 text-center space-y-3">
                <div className="relative w-12 h-12 flex items-center justify-center rounded-xl bg-gradient-to-br from-amber/20 to-pink/20 border border-amber/30 shadow-lg">
                  <Gamepad2 className="w-6 h-6 text-amber animate-bounce" />
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber/20 border border-amber/50 text-amber flex items-center justify-center font-bold text-[10px]">
                    ✓
                  </span>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-amber">Eligible for Swags!</p>
                  <p className="text-[10px] text-mist-muted max-w-xs leading-normal">
                    Awesome! You unlocked the <span className="text-amber font-medium">{currentTier?.name}</span> prize tier.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Facilitator Bonus Milestone */}
          <div className="glass-strong rounded-2xl px-6 py-5 space-y-4 rise-in">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-sm font-semibold text-mist">Bonus Milestone 🏆</h2>
              {data?.bonusMilestone?.completed ? (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  +10 pts · Completed
                </span>
              ) : (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-violet/20 text-violet border border-violet/30">
                  +10 pts · Active
                </span>
              )}
            </div>

            <div className={`flex items-start gap-3.5 bg-white/5 rounded-xl p-3 border ${data?.bonusMilestone?.completed ? "border-emerald-500/20" : "border-violet/20"}`}>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${data?.bonusMilestone?.completed ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" : "bg-violet/10 border border-violet/20 text-violet"}`}>
                {data?.bonusMilestone?.completed ? <Check className="w-5 h-5" /> : <Gamepad2 className="w-5 h-5" />}
              </div>
              <div className="space-y-1">
                <p className="text-[11px] font-semibold text-mist">
                  {data?.bonusMilestone?.completed ? "GEAR / AI Agent Challenge Completed!" : "Build an AI Agent & Complete GEAR Badges"}
                </p>
                {data?.bonusMilestone?.completed ? (
                  <p className="text-[10px] text-mist-muted leading-relaxed">
                    Congratulations! You successfully completed the Bonus Milestone and unlocked <span className="text-emerald-400 font-semibold">10 extra bonus points</span>.
                    Verified by badge: <span className="text-emerald-400 font-medium">{data.bonusMilestone.completedBadgeTitle}</span>.
                  </p>
                ) : (
                  <p className="text-[10px] text-mist-muted leading-relaxed whitespace-pre-line">
                    Build your first Vertex AI agent, set up GC Free Trial Billing, complete any of the 4 GEAR Skill Badges, and submit your project details to earn an extra <span className="text-amber font-semibold">10 Bonus Points</span>!
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <a
                href="https://rsvp.withgoogle.com/events/arcade-facilitator/bonus-milestone"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan hover:underline text-[10px] flex items-center gap-1 font-medium cursor-pointer"
              >
                View Official Details →
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Work Meets Play */}
      <div className="glass rounded-2xl px-6 py-5 space-y-3 rise-in">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-sm font-semibold text-mist">{arcade.workMeetsPlay.label}</h2>
          <span className="text-xs text-mist-muted">
            {arcade.workMeetsPlay.badgesEarned} / {arcade.workMeetsPlay.requiredCount}
          </span>
        </div>
        <div className="h-2 rounded-full bg-white/5 overflow-hidden">
          <div
            className={`h-full rounded-full ${arcade.workMeetsPlay.achieved ? "bg-amber" : "bg-gradient-to-r from-violet to-pink"
              }`}
            style={{ width: `${arcade.workMeetsPlay.pct}%` }}
          />
        </div>
        <p className="text-[11px] text-mist-muted">
          {arcade.workMeetsPlay.achieved
            ? `Unlocked — +${arcade.workMeetsPlay.bonusPoints} bonus points added to your tally.`
            : "Complete every badge in this series to unlock a one-time bonus."}
        </p>
      </div>

      {/* ── Facilitator Program Milestones (visual stepper) ─────────────── */}
      <MilestoneProgressStepper
        milestones={facArcade.milestones}
        facilitatorStarted={facilitatorStarted}
        facilitatorEnded={facilitatorEnded}
      />

      <section className="space-y-4">
        <h2 className="font-display text-sm font-semibold text-mist">Arcade Points history</h2>
        <HistoryChart data={chartData} />
      </section>

      <IncompleteBadges completedBadges={badges} />

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-sm font-semibold text-mist">Earned Badges</h2>
          <Link
            href={`/dashboard/${params.id}/badges`}
            className="text-xs text-cyan hover:underline"
          >
            View all {badges.length} &rarr;
          </Link>
        </div>
        <BadgeGrid badges={badges.slice(0, 12)} />
      </section>

      {/* Keyframe animations */}
      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(60px) scale(0.9); }
          to   { opacity: 1; transform: translateX(0)   scale(1);   }
        }
        @keyframes livePulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.4; transform: scale(0.8); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
