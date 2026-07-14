"use client";

import { useEffect, useState, useCallback } from "react";
import { RefreshCw, CheckCircle2, AlertCircle, Clock, Zap, Eye, Activity, ExternalLink, Play } from "lucide-react";

interface ProfileStatus {
  profileId: string;
  publicId: string;
  name: string;
  profileUrl: string;
  totalBadges: number;
  arcadePoints: number;
  basePoints: number;
  bonusPoints: number;
  breakdown: {
    gameBadges: number;
    skillBadges: number;
    triviaBadges: number;
    levelBadges: number;
    specialGames: number;
  };
  currentTier: string;
  nextTier: string | null;
  pointsToNextTier: number;
  lastSnapshotAt: string | null;
  facilitatorGames: number;
  facilitatorSkillBadges: number;
}

interface WatchData {
  fetchedAt: string;
  totalProfiles: number;
  profiles: ProfileStatus[];
  meta: {
    description: string;
    updateFrequency: string;
    arcadePointRules: Record<string, string>;
  };
}

interface CronResult {
  runAt: string;
  profilesChecked: number;
  profilesUpdated: number;
  results: {
    publicId: string;
    name: string;
    status: "updated" | "no-change" | "error";
    previousBadgeCount?: number;
    newBadgeCount?: number;
    arcadePoints?: number;
    newBadgesSince?: string[];
    error?: string;
  }[];
}

function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return `${Math.round(diff)}s ago`;
  if (diff < 3600) return `${Math.round(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.round(diff / 3600)}h ago`;
  return `${Math.round(diff / 86400)}d ago`;
}

export default function AutoFetchPage() {
  const [watch, setWatch] = useState<WatchData | null>(null);
  const [cronResult, setCronResult] = useState<CronResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [lastPollAt, setLastPollAt] = useState<string | null>(null);
  const [pollCount, setPollCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/watch");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: WatchData = await res.json();
      setWatch(data);
      setLastPollAt(new Date().toISOString());
      setPollCount((c) => c + 1);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch status");
    } finally {
      setLoading(false);
    }
  }, []);

  const triggerCron = useCallback(async () => {
    setRunning(true);
    try {
      const res = await fetch("/api/cron");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: CronResult = await res.json();
      setCronResult(data);
      // Refresh the watch data after cron finishes
      await fetchStatus();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Cron failed");
    } finally {
      setRunning(false);
    }
  }, [fetchStatus]);

  // Poll /api/watch every 30 seconds automatically
  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30_000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const tierColor = (tier: string) => {
    if (tier === "Arcade Legend") return "#fbbf24";
    if (tier === "Arcade Champion") return "#a78bfa";
    if (tier === "Arcade Ranger") return "#34d399";
    if (tier === "Arcade Trooper") return "#60a5fa";
    return "#64748b";
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)",
      fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
      color: "#e2e8f0",
      padding: "0",
    }}>

      {/* ── Header ── */}
      <div style={{
        background: "rgba(255,255,255,0.03)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        padding: "24px 32px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "16px",
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
            <div style={{
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              borderRadius: "8px",
              padding: "6px 8px",
              display: "flex",
              alignItems: "center",
            }}>
              <Activity size={18} color="white" />
            </div>
            <h1 style={{ fontSize: "20px", fontWeight: 700, margin: 0 }}>
              Auto-Fetch Monitor
            </h1>
            <span style={{
              background: "rgba(34,197,94,0.15)",
              border: "1px solid rgba(34,197,94,0.4)",
              color: "#4ade80",
              borderRadius: "20px",
              padding: "2px 10px",
              fontSize: "11px",
              fontWeight: 600,
              animation: "pulse 2s infinite",
            }}>● LIVE</span>
          </div>
          <p style={{ margin: 0, fontSize: "13px", color: "#94a3b8" }}>
            Auto-polls skills.google every 15 min · Public endpoint · Anyone can view
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <a
            href="/api/watch"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "rgba(99,102,241,0.15)",
              border: "1px solid rgba(99,102,241,0.4)",
              color: "#a5b4fc",
              borderRadius: "8px",
              padding: "8px 14px",
              fontSize: "13px",
              textDecoration: "none",
              fontWeight: 500,
              transition: "all 0.2s",
            }}
          >
            <Eye size={14} /> View JSON API
            <ExternalLink size={12} />
          </a>

          <button
            onClick={triggerCron}
            disabled={running}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: running ? "rgba(99,102,241,0.1)" : "linear-gradient(135deg, #6366f1, #8b5cf6)",
              border: "none",
              color: running ? "#6366f1" : "white",
              borderRadius: "8px",
              padding: "8px 16px",
              fontSize: "13px",
              fontWeight: 600,
              cursor: running ? "not-allowed" : "pointer",
              transition: "all 0.2s",
            }}
          >
            {running ? (
              <><RefreshCw size={14} style={{ animation: "spin 1s linear infinite" }} /> Fetching...</>
            ) : (
              <><Play size={14} /> Run Fetch Now</>
            )}
          </button>
        </div>
      </div>

      <div style={{ padding: "24px 32px", maxWidth: "1200px", margin: "0 auto" }}>

        {/* ── Status Bar ── */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: "12px",
          marginBottom: "24px",
        }}>
          {[
            {
              label: "Tracked Profiles",
              value: watch?.totalProfiles ?? "—",
              icon: <Eye size={16} />,
              color: "#60a5fa",
            },
            {
              label: "Auto-Refresh Interval",
              value: "15 min",
              icon: <Clock size={16} />,
              color: "#34d399",
            },
            {
              label: "UI Poll Interval",
              value: "30 sec",
              icon: <Activity size={16} />,
              color: "#a78bfa",
            },
            {
              label: "Page Refreshes",
              value: pollCount,
              icon: <Zap size={16} />,
              color: "#fbbf24",
            },
          ].map((stat) => (
            <div key={stat.label} style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "12px",
              padding: "16px",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: stat.color, marginBottom: "8px" }}>
                {stat.icon}
                <span style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {stat.label}
                </span>
              </div>
              <div style={{ fontSize: "24px", fontWeight: 700, color: "#f1f5f9" }}>
                {stat.value}
              </div>
              {lastPollAt && stat.label === "Page Refreshes" && (
                <div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>
                  Last: {timeAgo(lastPollAt)}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* ── How it works ── */}
        <div style={{
          background: "rgba(99,102,241,0.06)",
          border: "1px solid rgba(99,102,241,0.2)",
          borderRadius: "12px",
          padding: "16px 20px",
          marginBottom: "24px",
          display: "flex",
          gap: "16px",
          flexWrap: "wrap",
          alignItems: "flex-start",
        }}>
          <div>
            <p style={{ margin: "0 0 8px 0", fontWeight: 600, color: "#a5b4fc", fontSize: "13px" }}>
              🤖 How Auto-Fetch Works
            </p>
            <div style={{ fontSize: "12px", color: "#94a3b8", lineHeight: "1.8" }}>
              <strong style={{ color: "#c7d2fe" }}>Every 15 minutes</strong> → Vercel Cron hits <code style={{ background: "rgba(255,255,255,0.08)", padding: "1px 5px", borderRadius: "4px" }}>/api/cron</code> →
              Scrapes <code style={{ background: "rgba(255,255,255,0.08)", padding: "1px 5px", borderRadius: "4px" }}>skills.google/public_profiles/&lt;id&gt;</code> for every tracked user →
              <strong style={{ color: "#c7d2fe" }}>Change detected?</strong> → Writes new snapshot to Supabase →
              <strong style={{ color: "#c7d2fe" }}>Realtime pushes</strong> the update to all open dashboards instantly.
            </div>
          </div>
          <div style={{ marginLeft: "auto", textAlign: "right", fontSize: "11px", color: "#475569", minWidth: "120px" }}>
            <div>Cron endpoint:</div>
            <code style={{ color: "#6366f1" }}>/api/cron</code>
            <div style={{ marginTop: "4px" }}>Public status:</div>
            <code style={{ color: "#6366f1" }}>/api/watch</code>
          </div>
        </div>

        {/* ── Error Banner ── */}
        {error && (
          <div style={{
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.3)",
            borderRadius: "10px",
            padding: "12px 16px",
            marginBottom: "20px",
            display: "flex",
            gap: "10px",
            alignItems: "center",
            color: "#fca5a5",
            fontSize: "13px",
          }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {/* ── Last Cron Run Result ── */}
        {cronResult && (
          <div style={{
            background: "rgba(34,197,94,0.06)",
            border: "1px solid rgba(34,197,94,0.2)",
            borderRadius: "12px",
            padding: "16px 20px",
            marginBottom: "24px",
          }}>
            <p style={{ margin: "0 0 12px 0", fontWeight: 600, color: "#4ade80", fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}>
              <CheckCircle2 size={15} /> Last Cron Run — {timeAgo(cronResult.runAt)}
            </p>
            <div style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "10px" }}>
              Checked {cronResult.profilesChecked} profile(s) · Updated {cronResult.profilesUpdated}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {cronResult.results.map((r) => (
                <div key={r.publicId} style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "8px 12px",
                  background: "rgba(255,255,255,0.03)",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}>
                  <span style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: r.status === "updated" ? "#4ade80" : r.status === "error" ? "#ef4444" : "#475569",
                    flexShrink: 0,
                  }} />
                  <span style={{ color: "#e2e8f0", fontWeight: 500 }}>{r.name}</span>
                  <span style={{ color: "#64748b" }}>·</span>
                  <span style={{ color: r.status === "updated" ? "#4ade80" : r.status === "error" ? "#ef4444" : "#475569" }}>
                    {r.status === "updated"
                      ? `↑ ${r.previousBadgeCount} → ${r.newBadgeCount} badges`
                      : r.status === "no-change"
                      ? `No change (${r.newBadgeCount} badges)`
                      : `Error: ${r.error}`}
                  </span>
                  {r.newBadgesSince && r.newBadgesSince.length > 0 && (
                    <span style={{ color: "#a78bfa", fontSize: "11px" }}>
                      New: {r.newBadgesSince.join(", ")}
                    </span>
                  )}
                  {r.arcadePoints !== undefined && (
                    <span style={{ marginLeft: "auto", color: "#fbbf24", fontWeight: 600 }}>
                      {r.arcadePoints} pts
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Profile Cards ── */}
        <div style={{ marginBottom: "12px", fontSize: "13px", color: "#64748b", display: "flex", alignItems: "center", gap: "6px" }}>
          <Activity size={13} /> Live data from Supabase · Auto-updates every 30 seconds
          {lastPollAt && <span>· Last refreshed {timeAgo(lastPollAt)}</span>}
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "60px", color: "#475569" }}>
            <RefreshCw size={32} style={{ animation: "spin 1s linear infinite", marginBottom: "12px" }} />
            <p>Loading live profile data...</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {watch?.profiles.map((profile) => (
              <div key={profile.profileId} style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "16px",
                padding: "20px 24px",
                transition: "border-color 0.2s",
              }}>
                {/* Profile header */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                      <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "#f1f5f9" }}>
                        {profile.name}
                      </h2>
                      <span style={{
                        background: `${tierColor(profile.currentTier)}22`,
                        border: `1px solid ${tierColor(profile.currentTier)}66`,
                        color: tierColor(profile.currentTier),
                        borderRadius: "20px",
                        padding: "2px 10px",
                        fontSize: "11px",
                        fontWeight: 600,
                      }}>
                        {profile.currentTier}
                      </span>
                    </div>
                    <a
                      href={profile.profileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: "#6366f1",
                        fontSize: "12px",
                        textDecoration: "none",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      {profile.profileUrl.replace("https://", "")}
                      <ExternalLink size={10} />
                    </a>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "32px", fontWeight: 800, color: "#a5b4fc", lineHeight: 1 }}>
                      {profile.arcadePoints}
                    </div>
                    <div style={{ fontSize: "11px", color: "#64748b" }}>Arcade Points</div>
                    {profile.basePoints !== profile.arcadePoints && (
                      <div style={{ fontSize: "11px", color: "#475569" }}>
                        {profile.basePoints} base + {profile.bonusPoints} bonus
                      </div>
                    )}
                  </div>
                </div>

                {/* Badge breakdown */}
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))",
                  gap: "8px",
                  marginBottom: "16px",
                }}>
                  {[
                    { label: "🎮 Games", value: profile.breakdown.gameBadges, pts: `${profile.breakdown.gameBadges + profile.breakdown.specialGames * 2 - profile.breakdown.specialGames} pt`, color: "#60a5fa" },
                    { label: "⚡ Special", value: profile.breakdown.specialGames, pts: `${profile.breakdown.specialGames * 2} pt`, color: "#f97316" },
                    { label: "🛡️ Skills", value: profile.breakdown.skillBadges, pts: `${(profile.breakdown.skillBadges * 0.5).toFixed(1)} pt`, color: "#34d399" },
                    { label: "🎯 Trivia", value: profile.breakdown.triviaBadges, pts: `${profile.breakdown.triviaBadges} pt`, color: "#a78bfa" },
                    { label: "📊 Sprints", value: profile.breakdown.levelBadges, pts: `${profile.breakdown.levelBadges} pt`, color: "#22d3ee" },
                    { label: "🏅 Total", value: profile.totalBadges, pts: "", color: "#fbbf24" },
                  ].map((item) => (
                    <div key={item.label} style={{
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      borderRadius: "8px",
                      padding: "10px 12px",
                    }}>
                      <div style={{ fontSize: "11px", color: "#64748b", marginBottom: "4px" }}>{item.label}</div>
                      <div style={{ fontSize: "20px", fontWeight: 700, color: item.color }}>{item.value}</div>
                      {item.pts && <div style={{ fontSize: "10px", color: "#475569" }}>{item.pts}</div>}
                    </div>
                  ))}
                </div>

                {/* Facilitator window progress */}
                <div style={{
                  background: "rgba(99,102,241,0.06)",
                  borderRadius: "8px",
                  padding: "10px 14px",
                  display: "flex",
                  gap: "24px",
                  flexWrap: "wrap",
                  marginBottom: "12px",
                }}>
                  <div style={{ fontSize: "11px", color: "#6366f1", fontWeight: 600, marginBottom: "2px", width: "100%" }}>
                    Facilitator Window (Jul 13 – Sep 14, 2026)
                  </div>
                  <div>
                    <span style={{ fontSize: "20px", fontWeight: 700, color: "#60a5fa" }}>{profile.facilitatorGames}</span>
                    <span style={{ fontSize: "11px", color: "#64748b" }}> / 12 Games</span>
                  </div>
                  <div>
                    <span style={{ fontSize: "20px", fontWeight: 700, color: "#34d399" }}>{profile.facilitatorSkillBadges}</span>
                    <span style={{ fontSize: "11px", color: "#64748b" }}> / 66 Skill Badges</span>
                  </div>
                  {profile.nextTier && (
                    <div style={{ marginLeft: "auto" }}>
                      <span style={{ fontSize: "11px", color: "#64748b" }}>Next tier: </span>
                      <span style={{ fontSize: "13px", fontWeight: 600, color: tierColor(profile.nextTier) }}>
                        {profile.nextTier}
                      </span>
                      <span style={{ fontSize: "11px", color: "#64748b" }}> ({profile.pointsToNextTier} pts away)</span>
                    </div>
                  )}
                </div>

                {/* Last updated */}
                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "#475569" }}>
                  <Clock size={11} />
                  Last snapshot: {profile.lastSnapshotAt ? timeAgo(profile.lastSnapshotAt) : "Never"}
                  <span style={{ marginLeft: "auto" }}>
                    <a
                      href={`/dashboard/${profile.profileId}`}
                      style={{ color: "#6366f1", textDecoration: "none", fontSize: "11px" }}
                    >
                      View full dashboard →
                    </a>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Point Rules ── */}
        {watch?.meta && (
          <div style={{
            marginTop: "24px",
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: "12px",
            padding: "16px 20px",
          }}>
            <p style={{ margin: "0 0 10px 0", fontSize: "12px", fontWeight: 600, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Arcade Point Rules
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {Object.entries(watch.meta.arcadePointRules).map(([key, val]) => (
                <span key={key} style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "6px",
                  padding: "4px 10px",
                  fontSize: "11px",
                  color: "#94a3b8",
                }}>
                  <strong style={{ color: "#cbd5e1" }}>{key}</strong>: {val}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── API Docs ── */}
        <div style={{
          marginTop: "16px",
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: "12px",
          padding: "16px 20px",
          fontSize: "12px",
          color: "#64748b",
        }}>
          <p style={{ margin: "0 0 8px 0", fontWeight: 600, color: "#475569" }}>Public API Endpoints</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <div><code style={{ color: "#6366f1" }}>GET /api/watch</code> — Current Arcade Points for all tracked profiles (JSON, no auth)</div>
            <div><code style={{ color: "#6366f1" }}>GET /api/cron</code> — Trigger a manual fetch + change detection run (no auth in dev)</div>
            <div><code style={{ color: "#6366f1" }}>GET /api/profile?id=&lt;id&gt;</code> — Full profile data + snapshot history</div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>
    </div>
  );
}
