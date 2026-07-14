"use client";

import { useEffect, useState, useRef } from "react";
import type { ArcadeResult, ClassifiedBadge } from "@/lib/arcadeCalculator";

// ── Types ────────────────────────────────────────────────────────────────────
interface RowDef {
  key: string;
  label: string;
  icon: string;
  color: string;
  glow: string;
  gradient: string;
  badgeCount: number;
  points: number;
  pointsPerBadge: number | string;
}

interface Props {
  arcadeResult: ArcadeResult;
  totalBadges?: number;
}

// ── Tiny hook: animated counting number ─────────────────────────────────────
function useCountUp(target: number, duration = 700): number {
  const [val, setVal] = useState(0);
  const raf = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);
  const fromRef = useRef(0);

  useEffect(() => {
    const from = fromRef.current;
    const diff = target - from;
    if (diff === 0) return;
    startRef.current = null;

    function tick(ts: number) {
      if (!startRef.current) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out-cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = from + diff * eased;
      setVal(Math.round(current * 10) / 10);
      if (progress < 1) {
        raf.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = target;
      }
    }
    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [target, duration]);

  return val;
}

// ── Radial Donut Chart ───────────────────────────────────────────────────────
function DonutChart({ rows, totalPoints }: { rows: RowDef[]; totalPoints: number }) {
  const size = 200;
  const cx = size / 2;
  const cy = size / 2;
  const R = 76;
  const strokeW = 22;
  const circumference = 2 * Math.PI * R;

  let cumulativeAngle = -90; // start from top
  const segments = rows.filter(r => r.points > 0).map(r => {
    const frac = totalPoints > 0 ? r.points / totalPoints : 0;
    const angle = frac * 360;
    const startAngle = cumulativeAngle;
    cumulativeAngle += angle;
    return { ...r, frac, startAngle, sweepAngle: angle };
  });

  function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
    const rad = (angleDeg * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }

  function describeArc(cx: number, cy: number, r: number, startAngle: number, sweepAngle: number) {
    if (sweepAngle >= 360) sweepAngle = 359.99;
    const start = polarToCartesian(cx, cy, r, startAngle);
    const end = polarToCartesian(cx, cy, r, startAngle + sweepAngle);
    const largeArc = sweepAngle > 180 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
  }

  const animatedTotal = useCountUp(totalPoints, 900);

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ overflow: "visible" }}>
        {/* Track ring */}
        <circle cx={cx} cy={cy} r={R} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={strokeW} />
        {/* Segments */}
        {segments.map((seg) => (
          <path
            key={seg.key}
            d={describeArc(cx, cy, R, seg.startAngle, seg.sweepAngle)}
            fill="none"
            stroke={`url(#grad-${seg.key})`}
            strokeWidth={strokeW}
            strokeLinecap="round"
            style={{
              filter: `drop-shadow(0 0 6px ${seg.glow})`,
              transition: "stroke-dasharray 0.7s cubic-bezier(0.16,1,0.3,1)",
            }}
          />
        ))}
        {/* Gradient defs */}
        <defs>
          {segments.map((seg) => (
            <linearGradient key={seg.key} id={`grad-${seg.key}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={seg.glow} stopOpacity="1" />
              <stop offset="100%" stopColor={seg.color} stopOpacity="1" />
            </linearGradient>
          ))}
        </defs>
        {/* Center text */}
        <text x={cx} y={cy - 8} textAnchor="middle" fill="#f3f1ff" fontSize="24" fontWeight="700" fontFamily="monospace">
          {animatedTotal % 1 === 0 ? animatedTotal : animatedTotal.toFixed(1)}
        </text>
        <text x={cx} y={cy + 14} textAnchor="middle" fill="#8e8aab" fontSize="10" fontFamily="sans-serif">
          TOTAL PTS
        </text>
      </svg>
    </div>
  );
}

// ── Scanline row glow animation ticker ───────────────────────────────────────
function useScanTick(intervalMs = 1000): number {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return tick;
}

// ── Main component ────────────────────────────────────────────────────────────
export function PointsDistributionTable({ arcadeResult, totalBadges }: Props) {
  const { breakdown, classifiedBadges, totalArcadePoints, bonusPoints, basePoints } = arcadeResult;
  const tick = useScanTick(1000);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [scanRow, setScanRow] = useState(0);

  // Advance the scan highlight row every second
  const rowCount = 7;
  useEffect(() => {
    setScanRow(prev => (prev + 1) % rowCount);
  }, [tick]);

  // Build per-category point totals from classified badges
  function sumPoints(cat: ClassifiedBadge["category"]): number {
    return classifiedBadges
      .filter(b => b.category === cat)
      .reduce((s, b) => s + b.points, 0);
  }

  const rows: RowDef[] = [
    {
      key: "arcade_game",
      label: "Arcade Games",
      icon: "🎮",
      color: "#ff6fb3",
      glow: "rgba(255,111,179,0.8)",
      gradient: "from-pink-500 to-rose-500",
      badgeCount: breakdown.arcadeGames,
      points: sumPoints("arcade_game"),
      pointsPerBadge: 1,
    },
    {
      key: "trivia_game",
      label: "Trivia Games",
      icon: "🧩",
      color: "#ffc24b",
      glow: "rgba(255,194,75,0.8)",
      gradient: "from-amber-400 to-orange-500",
      badgeCount: breakdown.triviaGames,
      points: sumPoints("trivia_game"),
      pointsPerBadge: 1,
    },
    {
      key: "special_game",
      label: "Special Games",
      icon: "⭐",
      color: "#b389ff",
      glow: "rgba(179,137,255,0.8)",
      gradient: "from-violet-500 to-purple-600",
      badgeCount: breakdown.specialGames,
      points: sumPoints("special_game"),
      pointsPerBadge: 2,
    },
    {
      key: "skill_badge",
      label: "Skill Badges",
      icon: "🛡️",
      color: "#22e5e5",
      glow: "rgba(34,229,229,0.8)",
      gradient: "from-cyan-400 to-teal-500",
      badgeCount: breakdown.skillBadges,
      points: sumPoints("skill_badge"),
      pointsPerBadge: "0.5",
    },
    {
      key: "level_badge",
      label: "Level Badges",
      icon: "🏅",
      color: "#60a5fa",
      glow: "rgba(96,165,250,0.8)",
      gradient: "from-blue-400 to-indigo-500",
      badgeCount: breakdown.levelBadges,
      points: sumPoints("level_badge"),
      pointsPerBadge: 1,
    },
    {
      key: "certification",
      label: "Certifications",
      icon: "📜",
      color: "#34d399",
      glow: "rgba(52,211,153,0.8)",
      gradient: "from-emerald-400 to-green-500",
      badgeCount: breakdown.certifications,
      points: sumPoints("certification"),
      pointsPerBadge: 1,
    },
    {
      key: "bonus",
      label: "Bonus & Milestones",
      icon: "🏆",
      color: "#fb923c",
      glow: "rgba(251,146,60,0.8)",
      gradient: "from-orange-400 to-amber-500",
      badgeCount: 0,
      points: bonusPoints,
      pointsPerBadge: "—",
    },
  ];

  const animatedBase = useCountUp(basePoints, 900);
  const animatedBonus = useCountUp(bonusPoints, 900);
  const animatedTotal = useCountUp(totalArcadePoints, 900);
  const displayTotal = animatedTotal % 1 === 0 ? animatedTotal : animatedTotal.toFixed(1);

  return (
    <div
      className="glass-strong rounded-2xl overflow-hidden rise-in"
      style={{ position: "relative" }}
    >
      {/* ── Animated header scan line ────────────────────────────────────── */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: "1px",
        background: "linear-gradient(90deg, transparent, #22e5e5, #b389ff, #ff6fb3, transparent)",
        opacity: 0.6,
        animation: "headerGlow 2s ease-in-out infinite alternate",
      }} />

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div style={{
        padding: "20px 24px 16px",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: "16px",
        flexWrap: "wrap",
        borderBottom: "1px solid var(--color-line)",
      }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{
              fontSize: "15px",
              fontWeight: 700,
              color: "var(--color-mist)",
              letterSpacing: "0.04em",
              fontFamily: "var(--font-display, sans-serif)",
            }}>
              Points Distribution
            </span>
            {/* Live badge */}
            <span style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              padding: "2px 8px",
              borderRadius: "20px",
              fontSize: "9px",
              fontWeight: 700,
              background: "rgba(34,229,229,0.12)",
              border: "1px solid rgba(34,229,229,0.3)",
              color: "#22e5e5",
              letterSpacing: "0.06em",
            }}>
              <span style={{
                width: "5px", height: "5px", borderRadius: "50%",
                background: "#22e5e5",
                animation: "livePulse2 1.4s ease-in-out infinite",
                display: "inline-block",
              }} />
              LIVE
            </span>
          </div>
          <p style={{ fontSize: "11px", color: "var(--color-mist-muted)", margin: 0 }}>
            Break down of how you earned each arcade point
          </p>
        </div>

        {/* Donut + total badge count */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {totalBadges !== undefined && (
            <div style={{
              padding: "6px 12px",
              borderRadius: "20px",
              background: "rgba(179,137,255,0.1)",
              border: "1px solid rgba(179,137,255,0.25)",
              fontSize: "10px",
              fontWeight: 600,
              color: "#b389ff",
              whiteSpace: "nowrap",
            }}>
              🎖 {totalBadges} badges total
            </div>
          )}
        </div>
      </div>

      {/* ── Body: donut + table ─────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: 0, alignItems: "stretch" }}>

        {/* Left: Donut chart */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "28px 24px",
          gap: "14px",
          borderRight: "1px solid var(--color-line)",
          minWidth: "230px",
        }}>
          <DonutChart rows={rows} totalPoints={totalArcadePoints} />

          {/* Legend */}
          <div style={{ display: "flex", flexDirection: "column", gap: "5px", width: "100%" }}>
            {rows.filter(r => r.points > 0).map(r => (
              <div key={r.key} style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                <span style={{
                  width: "10px", height: "10px", borderRadius: "3px",
                  background: r.color,
                  boxShadow: `0 0 5px ${r.glow}`,
                  flexShrink: 0,
                }} />
                <span style={{ fontSize: "10px", color: "var(--color-mist-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {r.label}
                </span>
                <span style={{ marginLeft: "auto", fontSize: "10px", fontWeight: 700, color: r.color, flexShrink: 0 }}>
                  {r.points % 1 === 0 ? r.points : r.points.toFixed(1)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Table */}
        <div style={{ flex: 1, overflowX: "auto" }}>
          {/* Table header */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 72px 72px 90px 150px",
            padding: "10px 20px",
            fontSize: "10px",
            fontWeight: 700,
            color: "var(--color-mist-muted)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            borderBottom: "1px solid var(--color-line)",
          }}>
            <span>Category</span>
            <span style={{ textAlign: "center" }}>Badges</span>
            <span style={{ textAlign: "center" }}>Pts/ea</span>
            <span style={{ textAlign: "right" }}>Points</span>
            <span style={{ textAlign: "right", paddingRight: "8px" }}>Share</span>
          </div>

          {/* Rows */}
          {rows.map((row, idx) => {
            const pct = totalArcadePoints > 0
              ? Math.round((row.points / totalArcadePoints) * 100)
              : 0;
            const isScanned = scanRow === idx;
            const isHovered = hoveredRow === row.key;

            return (
              <div
                key={row.key}
                onMouseEnter={() => setHoveredRow(row.key)}
                onMouseLeave={() => setHoveredRow(null)}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 72px 72px 90px 150px",
                  padding: "13px 20px",
                  alignItems: "center",
                  borderBottom: "1px solid var(--color-line)",
                  cursor: "default",
                  position: "relative",
                  transition: "background 0.2s ease",
                  background: isHovered
                    ? `rgba(${hexToRgb(row.color)},0.07)`
                    : isScanned
                      ? `rgba(${hexToRgb(row.color)},0.04)`
                      : "transparent",
                }}
              >
                {/* Scan shimmer */}
                {isScanned && (
                  <div style={{
                    position: "absolute",
                    inset: 0,
                    background: `linear-gradient(90deg, transparent, rgba(${hexToRgb(row.color)}, 0.06), transparent)`,
                    animation: "shimmerScan 0.8s ease-out forwards",
                    pointerEvents: "none",
                  }} />
                )}

                {/* Hover glow left border */}
                {(isHovered || isScanned) && (
                  <div style={{
                    position: "absolute",
                    left: 0,
                    top: "20%",
                    bottom: "20%",
                    width: "2px",
                    borderRadius: "2px",
                    background: row.color,
                    boxShadow: `0 0 8px ${row.glow}`,
                    transition: "opacity 0.2s",
                  }} />
                )}

                {/* Category label */}
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "18px", flexShrink: 0 }}>{row.icon}</span>
                  <div>
                    <p style={{
                      margin: 0,
                      fontSize: "13px",
                      fontWeight: 600,
                      color: isHovered ? row.color : "var(--color-mist)",
                      transition: "color 0.2s",
                    }}>
                      {row.label}
                    </p>
                    {/* Mini neon bar */}
                    <div style={{
                      marginTop: "5px",
                      height: "3px",
                      borderRadius: "3px",
                      width: "100%",
                      maxWidth: "130px",
                      background: "rgba(255,255,255,0.05)",
                      overflow: "hidden",
                    }}>
                      <div style={{
                        height: "100%",
                        width: `${pct}%`,
                        borderRadius: "3px",
                        background: row.color,
                        boxShadow: `0 0 6px ${row.glow}`,
                        transition: "width 0.9s cubic-bezier(0.16,1,0.3,1)",
                      }} />
                    </div>
                  </div>
                </div>

                {/* Badges */}
                <div style={{ textAlign: "center" }}>
                  {row.key === "bonus" ? (
                    <span style={{ fontSize: "13px", color: "var(--color-mist-muted)" }}>—</span>
                  ) : (
                    <span style={{
                      fontSize: "14px",
                      fontWeight: 700,
                      color: row.badgeCount > 0 ? "var(--color-mist)" : "var(--color-mist-muted)",
                      fontFamily: "monospace",
                    }}>
                      {row.badgeCount}
                    </span>
                  )}
                </div>

                {/* Pts/ea */}
                <div style={{ textAlign: "center" }}>
                  <span style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    color: row.color,
                    opacity: 0.85,
                    fontFamily: "monospace",
                  }}>
                    {row.pointsPerBadge}
                  </span>
                </div>

                {/* Points earned */}
                <div style={{ textAlign: "right" }}>
                  <PointCell target={row.points} color={row.color} />
                </div>

                {/* Share bar + percent */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px", paddingRight: "8px" }}>
                  <div style={{
                    flex: 1,
                    height: "8px",
                    borderRadius: "8px",
                    background: "rgba(255,255,255,0.04)",
                    overflow: "hidden",
                    minWidth: "50px",
                  }}>
                    <div style={{
                      height: "100%",
                      width: `${pct}%`,
                      background: `linear-gradient(90deg, ${row.color}cc, ${row.color})`,
                      boxShadow: pct > 0 ? `0 0 8px ${row.glow}` : "none",
                      borderRadius: "8px",
                      transition: "width 0.9s cubic-bezier(0.16,1,0.3,1)",
                    }} />
                  </div>
                  <span style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    color: pct > 0 ? row.color : "var(--color-mist-muted)",
                    minWidth: "34px",
                    textAlign: "right",
                    fontFamily: "monospace",
                  }}>
                    {pct}%
                  </span>
                </div>
              </div>
            );
          })}

          {/* ── Total row ─────────────────────────────────────────────── */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 72px 72px 90px 150px",
            padding: "13px 20px",
            alignItems: "center",
            background: "rgba(255,255,255,0.02)",
            borderTop: "1px solid rgba(255,255,255,0.08)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{
                width: "10px", height: "10px", borderRadius: "50%",
                background: "linear-gradient(135deg, #22e5e5, #b389ff, #ff6fb3)",
                boxShadow: "0 0 8px rgba(34,229,229,0.6)",
                display: "inline-block",
                animation: "livePulse2 1.8s ease-in-out infinite",
              }} />
              <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-mist)" }}>Total</span>
            </div>
            <div style={{ textAlign: "center" }}>
              <span style={{ fontSize: "13px", color: "var(--color-mist-muted)", fontFamily: "monospace" }}>
                {totalBadges ?? classifiedBadges.length}
              </span>
            </div>
            <div />
            <div style={{ textAlign: "right" }}>
              <span style={{
                fontSize: "17px",
                fontWeight: 800,
                fontFamily: "monospace",
                background: "linear-gradient(90deg, #22e5e5, #b389ff, #ff6fb3)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>
                {typeof displayTotal === "number" && displayTotal % 1 === 0 ? displayTotal : displayTotal}
              </span>
            </div>
            <div style={{ textAlign: "right", paddingRight: "8px" }}>
              <span style={{ fontSize: "12px", color: "#22e5e5", fontFamily: "monospace", fontWeight: 700 }}>
                100%
              </span>
            </div>
          </div>

          {/* ── Base / Bonus split ────────────────────────────────────── */}
          <div style={{
            display: "flex",
            gap: "8px",
            padding: "10px 16px 14px",
            flexWrap: "wrap",
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 10px",
              borderRadius: "20px",
              background: "rgba(34,229,229,0.08)",
              border: "1px solid rgba(34,229,229,0.2)",
            }}>
              <span style={{ fontSize: "10px", color: "var(--color-mist-muted)" }}>Base pts</span>
              <span style={{ fontSize: "11px", fontWeight: 700, color: "#22e5e5", fontFamily: "monospace" }}>
                {animatedBase % 1 === 0 ? animatedBase : animatedBase.toFixed(1)}
              </span>
            </div>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 10px",
              borderRadius: "20px",
              background: "rgba(255,194,75,0.08)",
              border: "1px solid rgba(255,194,75,0.2)",
            }}>
              <span style={{ fontSize: "10px", color: "var(--color-mist-muted)" }}>Bonus pts</span>
              <span style={{ fontSize: "11px", fontWeight: 700, color: "#ffc24b", fontFamily: "monospace" }}>
                +{animatedBonus % 1 === 0 ? animatedBonus : animatedBonus.toFixed(1)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Keyframe styles ──────────────────────────────────────────────── */}
      <style>{`
        @keyframes livePulse2 {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.5; transform: scale(0.7); }
        }
        @keyframes headerGlow {
          0%   { opacity: 0.4; }
          100% { opacity: 0.9; }
        }
        @keyframes shimmerScan {
          0%   { transform: translateX(-100%); opacity: 0; }
          30%  { opacity: 1; }
          100% { transform: translateX(100%); opacity: 0; }
        }
        @keyframes countUp {
          from { opacity: 0.2; transform: translateY(4px); }
          to   { opacity: 1;   transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ── Animated point cell ───────────────────────────────────────────────────────
function PointCell({ target, color }: { target: number; color: string }) {
  const val = useCountUp(target, 800);
  const display = val % 1 === 0 ? val : val.toFixed(1);
  return (
    <span style={{
      fontSize: "13px",
      fontWeight: 700,
      color: target > 0 ? color : "#8e8aab",
      fontFamily: "monospace",
      display: "block",
      textShadow: target > 0 ? `0 0 12px ${color}80` : "none",
      transition: "text-shadow 0.3s",
    }}>
      {display}
    </span>
  );
}

// ── Utility ───────────────────────────────────────────────────────────────────
function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}
