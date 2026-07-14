"use client";

import { Lock } from "lucide-react";
import type { MilestoneResult } from "@/lib/arcadeCalculator";

interface Props {
  milestones: MilestoneResult[];
  facilitatorStarted: boolean;
  facilitatorEnded: boolean;
}

const STEP_LABELS = ["Start", "Milestone 1", "Milestone 2", "Milestone 3", "Ultimate"];
const STEP_BONUS  = [0, 5, 15, 25, 35];
const STEP_ICONS  = ["⚡", "🎯", "🔓", "🔓", "🏆"];

export function MilestoneProgressStepper({ milestones, facilitatorStarted, facilitatorEnded }: Props) {
  // "Start" is index 0 — always done (you're in the program)
  const steps = [
    { label: "Start", bonus: 0, achieved: true, icon: "⚡", m: null },
    ...milestones.map((m, i) => ({
      label: m.label,
      bonus: m.bonusPoints,
      achieved: m.achieved,
      icon: i === milestones.length - 1 ? "🏆" : "🎯",
      m,
    })),
  ];

  // Current active milestone index (first not achieved)
  const currentIdx = steps.findIndex(s => !s.achieved);
  const currentTarget = currentIdx !== -1 ? steps[currentIdx] : null;

  return (
    <div className="glass-strong rounded-2xl overflow-hidden rise-in">
      {/* ── Header ── */}
      <div className="px-6 pt-5 pb-4 border-b border-white/5 flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display text-sm font-semibold text-mist">Facilitator Program Milestones</h2>
            <a
              href="https://rsvp.withgoogle.com/events/arcade-facilitator/home"
              target="_blank" rel="noopener noreferrer"
              className="text-[10px] text-cyan hover:underline flex items-center gap-0.5"
            >
              Learn more →
            </a>
          </div>
          <p className="text-[10px] text-mist-muted mt-1">
            Earn bonus arcade points by completing game &amp; skill badge requirements
          </p>
        </div>
        <div className="flex items-center gap-2">
          {milestones.filter(m => m.achieved).length > 0 && (
            <span style={{
              padding: "3px 10px",
              borderRadius: 20,
              background: "rgba(245,158,11,0.12)",
              border: "1px solid rgba(245,158,11,0.3)",
              fontSize: 10,
              fontWeight: 700,
              color: "#f59e0b",
            }}>
              +{milestones.filter(m => m.achieved).reduce((s, m) => s + m.bonusPoints, 0)} bonus pts
            </span>
          )}
          <span style={{
            padding: "3px 10px",
            borderRadius: 20,
            background: "rgba(34,229,229,0.08)",
            border: "1px solid rgba(34,229,229,0.2)",
            fontSize: 10,
            fontWeight: 600,
            color: "#8e8aab",
          }}>
            13 Jul – 14 Sep 2026
          </span>
        </div>
      </div>

      {/* ── Not started yet ── */}
      {!facilitatorStarted && (
        <div className="mx-6 mt-4 glass rounded-xl px-4 py-3 flex items-start gap-3 border border-violet/30">
          <Lock className="w-4 h-4 text-violet shrink-0 mt-0.5" />
          <p className="text-xs text-mist-muted">
            <span className="text-violet font-semibold">Program not live yet.</span>{" "}
            Badges earned before 13 July will not count. Progress starts from 0 on launch day.
          </p>
        </div>
      )}

      {/* ── Ended ── */}
      {facilitatorEnded && (
        <div className="px-6 py-6 text-center text-mist-muted text-sm">
          The Facilitator Program ended on 14 September 2026.
        </div>
      )}

      {!facilitatorEnded && (
        <>
          {/* ── Visual Stepper ── */}
          <div className="px-6 pt-6 pb-2">
            <div style={{ display: "flex", alignItems: "flex-start", position: "relative" }}>
              {/* Connecting line background */}
              <div style={{
                position: "absolute",
                top: 20,
                left: 20,
                right: 20,
                height: 3,
                borderRadius: 3,
                background: "rgba(255,255,255,0.05)",
                zIndex: 0,
              }} />
              {/* Progress fill */}
              <div style={{
                position: "absolute",
                top: 20,
                left: 20,
                height: 3,
                borderRadius: 3,
                width: `${
                  steps.length <= 1 ? 0
                  : currentIdx === -1 ? 100
                  : ((currentIdx - 0.5) / (steps.length - 1)) * 100
                }%`,
                background: "linear-gradient(90deg, #22e5e5, #b389ff, #ff6fb3)",
                boxShadow: "0 0 10px rgba(34,229,229,0.4)",
                transition: "width 0.8s cubic-bezier(0.16,1,0.3,1)",
                zIndex: 1,
              }} />

              {steps.map((step, i) => {
                const isActive  = currentIdx === i;
                const isDone    = step.achieved;
                const isLocked  = !isDone && !isActive;

                return (
                  <div key={i} style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 8,
                    position: "relative",
                    zIndex: 2,
                  }}>
                    {/* Node */}
                    <div style={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: isDone ? 16 : 14,
                      background: isDone
                        ? "linear-gradient(135deg, #22e5e5, #b389ff)"
                        : isActive
                        ? "rgba(34,229,229,0.15)"
                        : "rgba(255,255,255,0.04)",
                      border: isDone
                        ? "2px solid transparent"
                        : isActive
                        ? "2px solid #22e5e5"
                        : "2px solid rgba(255,255,255,0.1)",
                      boxShadow: isDone
                        ? "0 0 16px rgba(34,229,229,0.5), 0 0 32px rgba(179,137,255,0.25)"
                        : isActive
                        ? "0 0 12px rgba(34,229,229,0.3)"
                        : "none",
                      transition: "all 0.4s ease",
                      animation: isActive ? "activeNodePulse 2s ease-in-out infinite" : "none",
                      cursor: "default",
                    }}>
                      {isDone ? "✓" : isLocked ? "🔒" : step.icon}
                    </div>

                    {/* Label + bonus */}
                    <div style={{ textAlign: "center", maxWidth: 80 }}>
                      <p style={{
                        fontSize: 10,
                        fontWeight: isActive ? 700 : isDone ? 600 : 400,
                        color: isDone ? "#22e5e5" : isActive ? "#f3f1ff" : "#8e8aab",
                        margin: 0,
                        lineHeight: 1.3,
                      }}>
                        {step.label}
                      </p>
                      {step.bonus > 0 && (
                        <p style={{
                          fontSize: 9,
                          fontWeight: 700,
                          color: isDone ? "#f59e0b" : "#8e8aab",
                          margin: "2px 0 0",
                        }}>
                          +{step.bonus} pts
                        </p>
                      )}
                      {isActive && (
                        <span style={{
                          display: "inline-block",
                          marginTop: 3,
                          fontSize: 8,
                          fontWeight: 700,
                          color: "#22e5e5",
                          padding: "1px 6px",
                          borderRadius: 10,
                          background: "rgba(34,229,229,0.12)",
                          border: "1px solid rgba(34,229,229,0.3)",
                          letterSpacing: "0.04em",
                        }}>
                          CURRENT
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Current Target Requirements ── */}
          {currentTarget && currentTarget.m && (
            <div className="mx-6 my-4">
              <div style={{
                padding: "14px 16px",
                borderRadius: 16,
                background: "rgba(34,229,229,0.06)",
                border: "1px solid rgba(34,229,229,0.2)",
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#f3f1ff" }}>
                      {currentTarget.label} Requirements
                    </span>
                    <span style={{
                      fontSize: 9,
                      fontWeight: 700,
                      color: "#22e5e5",
                      padding: "2px 7px",
                      borderRadius: 10,
                      background: "rgba(34,229,229,0.12)",
                      border: "1px solid rgba(34,229,229,0.25)",
                    }}>
                      Current Target 🎯
                    </span>
                  </div>
                  <span style={{
                    fontSize: 12,
                    fontWeight: 800,
                    color: "#f59e0b",
                    fontFamily: "monospace",
                  }}>
                    +{currentTarget.bonus} pts
                  </span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  {/* Game Badges */}
                  <RequirementBar
                    label="Game Badges"
                    done={currentTarget.m.gamesDone}
                    required={currentTarget.m.gamesRequired}
                    color="#ff6fb3"
                    glow="rgba(255,111,179,0.6)"
                  />
                  {/* Skill Badges */}
                  <RequirementBar
                    label="Skill Badges"
                    done={currentTarget.m.skillBadgesDone}
                    required={currentTarget.m.skillBadgesRequired}
                    color="#22e5e5"
                    glow="rgba(34,229,229,0.6)"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── All milestones list ── */}
          <div className="px-6 pb-6 grid grid-cols-2 gap-3">
            {milestones.map((m) => {
              const gamePct  = m.gamesRequired   > 0 ? Math.min(100, Math.round((m.gamesDone         / m.gamesRequired)         * 100)) : 0;
              const skillPct = m.skillBadgesRequired > 0 ? Math.min(100, Math.round((m.skillBadgesDone / m.skillBadgesRequired) * 100)) : 0;
              const overallPct = Math.round((gamePct + skillPct) / 2);

              return (
                <div key={m.id} style={{
                  padding: "12px 14px",
                  borderRadius: 14,
                  background: m.achieved ? "rgba(245,158,11,0.06)" : "rgba(255,255,255,0.02)",
                  border: m.achieved
                    ? "1px solid rgba(245,158,11,0.25)"
                    : "1px solid rgba(255,255,255,0.06)",
                  position: "relative",
                  overflow: "hidden",
                }}>
                  {/* Glow bg on achieved */}
                  {m.achieved && (
                    <div style={{
                      position: "absolute", inset: 0,
                      background: "radial-gradient(circle at 80% 20%, rgba(245,158,11,0.08), transparent 60%)",
                      pointerEvents: "none",
                    }} />
                  )}

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: m.achieved ? "#f59e0b" : "#f3f1ff", margin: 0 }}>
                      {m.label}
                    </p>
                    <span style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: m.achieved ? "#f59e0b" : "#8e8aab",
                      fontFamily: "monospace",
                    }}>
                      {m.achieved ? `✓ +${m.bonusPoints}pts` : `+${m.bonusPoints}pts`}
                    </span>
                  </div>

                  <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 9, color: "#8e8aab" }}>
                      🎮 {m.gamesDone}/{m.gamesRequired}
                    </span>
                    <span style={{ fontSize: 9, color: "#8e8aab" }}>
                      🛡 {m.skillBadgesDone}/{m.skillBadgesRequired}
                    </span>
                  </div>

                  <div style={{ height: 4, borderRadius: 4, background: "rgba(255,255,255,0.05)", overflow: "hidden" }}>
                    <div style={{
                      height: "100%",
                      width: `${overallPct}%`,
                      borderRadius: 4,
                      background: m.achieved
                        ? "linear-gradient(90deg, #f59e0b, #fbbf24)"
                        : "linear-gradient(90deg, #22e5e5, #b389ff)",
                      boxShadow: m.achieved ? "0 0 8px rgba(245,158,11,0.5)" : "0 0 6px rgba(34,229,229,0.4)",
                      transition: "width 0.8s cubic-bezier(0.16,1,0.3,1)",
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <style>{`
        @keyframes activeNodePulse {
          0%, 100% { box-shadow: 0 0 12px rgba(34,229,229,0.3); }
          50%       { box-shadow: 0 0 20px rgba(34,229,229,0.6), 0 0 40px rgba(34,229,229,0.2); }
        }
      `}</style>
    </div>
  );
}

// ── Requirement progress bar ──────────────────────────────────────────────────
function RequirementBar({
  label, done, required, color, glow,
}: {
  label: string; done: number; required: number; color: string; glow: string;
}) {
  const pct = required > 0 ? Math.min(100, Math.round((done / required) * 100)) : 0;
  const complete = done >= required;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
        <span style={{ fontSize: 10, color: "#8e8aab" }}>{label}</span>
        <span style={{
          fontSize: 10, fontWeight: 700, fontFamily: "monospace",
          color: complete ? color : "#f3f1ff",
        }}>
          {done} / {required}
        </span>
      </div>
      <div style={{ height: 6, borderRadius: 6, background: "rgba(255,255,255,0.05)", overflow: "hidden" }}>
        <div style={{
          height: "100%",
          width: `${pct}%`,
          borderRadius: 6,
          background: color,
          boxShadow: `0 0 8px ${glow}`,
          transition: "width 0.8s cubic-bezier(0.16,1,0.3,1)",
        }} />
      </div>
    </div>
  );
}
