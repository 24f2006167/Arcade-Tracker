"use client";

import { useState } from "react";
import { Info, Shield, Award, Trophy, ChevronDown, Sparkles, Droplets, ExternalLink } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import {
  ARCADE_2026_TIERS,
  getUserWaterfallStatus,
} from "@/lib/arcadeCalculator";
import type { ArcadeWaterfallTier } from "@/lib/arcadeCalculator";

interface WaterfallTiersProps {
  userPoints?: number;
  /** Optional custom fill percent per tier (0-100). Default is 100% to represent capped prize tiers. */
  tierFillPercents?: Record<string, number>;
}

export function WaterfallTiers({ userPoints = 0, tierFillPercents }: WaterfallTiersProps) {
  const { hackerMode, theme } = useTheme();
  const isLight = theme === "light";
  const [expandedTier, setExpandedTier] = useState<string | null>(null);

  const safePoints = typeof userPoints === "number" && !isNaN(userPoints) ? Math.max(0, userPoints) : 0;
  const status = getUserWaterfallStatus(safePoints);

  const toggleTooltip = (id: string) => {
    setExpandedTier((prev) => (prev === id ? null : id));
  };

  // Color palettes per tier (surface water, deep water, stream, ledge glow)
  const tierColors = {
    legend: {
      name: "Arcade Legend",
      minPts: "120+ pts",
      cap: "2,500 spots",
      badgeBg: "bg-amber/20 text-amber border-amber/40",
      accent: "#ffc24b",
      waterTop: "#ffe29a",
      waterSurface: "#ffc24b",
      waterDeep: "#7a4e00",
      progressWater: "rgba(255, 226, 154, 0.4)",
      streamGrad: ["#ffc24b", "#b389ff"],
      rockGrad: ["#2d2417", "#17120a"],
    },
    champion: {
      name: "Arcade Champion",
      minPts: "95–119 pts",
      cap: "3,000 spots",
      badgeBg: "bg-violet/20 text-violet border-violet/40",
      accent: "#b389ff",
      waterTop: "#d8c2ff",
      waterSurface: "#b389ff",
      waterDeep: "#482180",
      progressWater: "rgba(216, 194, 255, 0.4)",
      streamGrad: ["#b389ff", "#ff6fb3"],
      rockGrad: ["#251a33", "#120c1a"],
    },
    ranger: {
      name: "Arcade Ranger",
      minPts: "75–94 pts",
      cap: "4,000 spots",
      badgeBg: "bg-pink/20 text-pink border-pink/40",
      accent: "#ff6fb3",
      waterTop: "#ffa4d2",
      waterSurface: "#ff6fb3",
      waterDeep: "#7a1a4c",
      progressWater: "rgba(255, 164, 210, 0.4)",
      streamGrad: ["#ff6fb3", "#22e5e5"],
      rockGrad: ["#331a27", "#1a0c13"],
    },
    trooper: {
      name: "Arcade Trooper",
      minPts: "50–74 pts",
      cap: "6,000 spots",
      badgeBg: "bg-cyan/20 text-cyan border-cyan/40",
      accent: "#22e5e5",
      waterTop: "#88ffff",
      waterSurface: "#22e5e5",
      waterDeep: "#0a5555",
      progressWater: "rgba(136, 255, 255, 0.4)",
      streamGrad: ["#22e5e5", "#ffc24b"],
      rockGrad: ["#142b30", "#0a1618"],
    },
    below_trooper: {
      name: "Qualification Pool",
      minPts: "0–49 pts",
      cap: "Unranked Pool",
      badgeBg: "bg-white/10 text-mist-muted border-white/20",
      accent: "#8e8aab",
      waterTop: "#b0aacd",
      waterSurface: "#5e5882",
      waterDeep: "#1a162b",
      progressWater: "rgba(176, 170, 205, 0.3)",
      streamGrad: ["#5e5882", "#22e5e5"],
      rockGrad: ["#1c1a29", "#0c0a14"],
    },
  };

  // Basins configuration: Top to Bottom (Y offsets, widths, heights, spillover coords)
  const basins = [
    { id: "legend",   y: 40,  x: 200, width: 440, height: 90,  spillX: 620, spillY: 105 },
    { id: "champion", y: 195, x: 170, width: 420, height: 90,  spillX: 190, spillY: 260 },
    { id: "ranger",   y: 350, x: 210, width: 400, height: 90,  spillX: 590, spillY: 415 },
    { id: "trooper",  y: 505, x: 180, width: 380, height: 90,  spillX: 200, spillY: 570 },
    { id: "below_trooper", y: 660, x: 140, width: 460, height: 95, spillX: null, spillY: null },
  ];

  return (
    <section
      aria-label="Google Skills Arcade 2026 Waterfall Tiers Explainer"
      className="glass-strong rounded-3xl p-6 sm:p-8 space-y-6 rise-in border border-cyan/40 relative overflow-hidden shadow-2xl"
    >
      {/* Background ambient lighting */}
      <div className="absolute inset-0 pointer-events-none z-0 opacity-40 select-none" aria-hidden="true">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gradient-to-b from-cyan/25 via-violet/15 to-transparent blur-3xl" />
        <div className="absolute bottom-0 right-10 w-96 h-96 bg-amber/10 rounded-full blur-3xl" />
      </div>

      {/* Visual Header */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 rounded-2xl bg-gradient-to-br from-cyan/20 via-violet/20 to-amber/20 border border-cyan/40 shadow-inner">
              <Droplets className="w-6 h-6 text-cyan animate-bounce" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-xl font-bold text-mist tracking-wide">
                  Arcade Waterfall System
                </h2>
                {hackerMode && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan/15 text-cyan border border-cyan/40">
                    [REAL_CASCADE_FLOW]
                  </span>
                )}
              </div>
              <p className="text-xs text-mist-muted mt-0.5">
                Visualizing how prize spots spill down rock ledges when upper tier caps fill up
              </p>
            </div>
          </div>
        </div>

        {/* User Standing summary chip */}
        <div
          tabIndex={0}
          role="status"
          aria-label={`Current standing: ${status.currentTierName}, ${safePoints} points`}
          className="px-4 py-2.5 rounded-2xl border flex items-center gap-3 self-start sm:self-auto text-xs font-semibold shadow-lg bg-gradient-to-r from-amber/25 via-violet/25 to-cyan/25 border-cyan/50 text-mist ring-1 ring-cyan/40"
        >
          <span className="w-3 h-3 rounded-full bg-cyan animate-ping shrink-0" />
          <span>
            Your Standing:{" "}
            <strong className="text-cyan font-bold text-sm">
              {safePoints} pts
            </strong>{" "}
            ({status.currentTierName})
          </span>
        </div>
      </div>

      {/* Main SVG Waterfall Diagram Container */}
      <div className="relative z-10 w-full overflow-x-auto">
        <div className="min-w-[700px] w-full">
          <svg
            viewBox="0 0 800 850"
            className="w-full h-auto drop-shadow-xl select-none"
            aria-label="Cascading Waterfall Diagram showing Legend, Champion, Ranger, Trooper, and Qualification Pool"
          >
            <defs>
              {/* Gradients for each basin water & ledges */}
              {Object.entries(tierColors).map(([key, col]) => (
                <g key={key}>
                  <linearGradient id={`water-grad-${key}`} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor={col.waterTop} stopOpacity="0.9" />
                    <stop offset="35%" stopColor={col.waterSurface} stopOpacity="0.8" />
                    <stop offset="100%" stopColor={col.waterDeep} stopOpacity="0.95" />
                  </linearGradient>

                  <linearGradient id={`rock-grad-${key}`} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor={col.rockGrad[0]} />
                    <stop offset="100%" stopColor={col.rockGrad[1]} />
                  </linearGradient>

                  <linearGradient id={`stream-grad-${key}`} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor={col.streamGrad[0]} stopOpacity="0.95" />
                    <stop offset="100%" stopColor={col.streamGrad[1]} stopOpacity="0.95" />
                  </linearGradient>
                </g>
              ))}

              {/* Droplet Radial Glow */}
              <radialGradient id="droplet-glow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
                <stop offset="40%" stopColor="#22e5e5" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#ffc24b" stopOpacity="0" />
              </radialGradient>

              {/* Drop Shadow filter */}
              <filter id="ledge-shadow" x="-10%" y="-10%" width="130%" height="130%">
                <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#000000" floodOpacity="0.6" />
              </filter>

              <filter id="glow-effect" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* ── CASCADING WATER STREAMS BETWEEN BASINS ────────────────── */}
            {/* Stream 1: Legend (right spill) -> Champion (left basin top) */}
            <g id="stream-legend-champion">
              <path
                d="M 620 125 C 640 150, 260 160, 260 215"
                fill="none"
                stroke="url(#stream-grad-legend)"
                strokeWidth="14"
                strokeLinecap="round"
                opacity="0.85"
                filter="url(#glow-effect)"
              />
              <path
                d="M 620 125 C 640 150, 260 160, 260 215"
                fill="none"
                stroke="#ffffff"
                strokeWidth="4"
                strokeDasharray="10 8"
                strokeLinecap="round"
                className="animate-waterfall-flow"
              />
              {/* Falling droplets */}
              <circle cx="580" cy="145" r="3" fill="#ffe29a" className="animate-water-drop-1" />
              <circle cx="400" cy="170" r="3.5" fill="#22e5e5" className="animate-water-drop-2" />
              <circle cx="280" cy="195" r="2.5" fill="#ffffff" className="animate-water-drop-1" style={{ animationDelay: "0.5s" }} />
              {/* Splash rings at impact */}
              <circle cx="260" cy="225" fill="none" stroke="#d8c2ff" strokeWidth="1.5" className="animate-splash-ring" />
              <circle cx="260" cy="225" fill="none" stroke="#22e5e5" strokeWidth="1" className="animate-splash-ring" style={{ animationDelay: "0.6s" }} />
            </g>

            {/* Stream 2: Champion (left spill) -> Ranger (right basin top) */}
            <g id="stream-champion-ranger">
              <path
                d="M 190 275 C 170 300, 530 310, 530 370"
                fill="none"
                stroke="url(#stream-grad-champion)"
                strokeWidth="14"
                strokeLinecap="round"
                opacity="0.85"
                filter="url(#glow-effect)"
              />
              <path
                d="M 190 275 C 170 300, 530 310, 530 370"
                fill="none"
                stroke="#ffffff"
                strokeWidth="4"
                strokeDasharray="10 8"
                strokeLinecap="round"
                className="animate-waterfall-flow"
              />
              <circle cx="230" cy="295" r="3" fill="#d8c2ff" className="animate-water-drop-1" />
              <circle cx="380" cy="325" r="3.5" fill="#ff6fb3" className="animate-water-drop-2" />
              <circle cx="500" cy="350" r="2.5" fill="#ffffff" className="animate-water-drop-1" style={{ animationDelay: "0.4s" }} />
              <circle cx="530" cy="380" fill="none" stroke="#ffa4d2" strokeWidth="1.5" className="animate-splash-ring" />
              <circle cx="530" cy="380" fill="none" stroke="#22e5e5" strokeWidth="1" className="animate-splash-ring" style={{ animationDelay: "0.5s" }} />
            </g>

            {/* Stream 3: Ranger (right spill) -> Trooper (left basin top) */}
            <g id="stream-ranger-trooper">
              <path
                d="M 590 430 C 610 455, 270 465, 270 525"
                fill="none"
                stroke="url(#stream-grad-ranger)"
                strokeWidth="14"
                strokeLinecap="round"
                opacity="0.85"
                filter="url(#glow-effect)"
              />
              <path
                d="M 590 430 C 610 455, 270 465, 270 525"
                fill="none"
                stroke="#ffffff"
                strokeWidth="4"
                strokeDasharray="10 8"
                strokeLinecap="round"
                className="animate-waterfall-flow"
              />
              <circle cx="550" cy="450" r="3" fill="#ffa4d2" className="animate-water-drop-1" />
              <circle cx="390" cy="480" r="3.5" fill="#22e5e5" className="animate-water-drop-2" />
              <circle cx="290" cy="505" r="2.5" fill="#ffffff" className="animate-water-drop-1" style={{ animationDelay: "0.3s" }} />
              <circle cx="270" cy="535" fill="none" stroke="#88ffff" strokeWidth="1.5" className="animate-splash-ring" />
              <circle cx="270" cy="535" fill="none" stroke="#ffc24b" strokeWidth="1" className="animate-splash-ring" style={{ animationDelay: "0.6s" }} />
            </g>

            {/* Stream 4: Trooper (left spill) -> Qualification Pool (bottom center) */}
            <g id="stream-trooper-pool">
              <path
                d="M 200 585 C 180 610, 360 620, 360 680"
                fill="none"
                stroke="url(#stream-grad-trooper)"
                strokeWidth="14"
                strokeLinecap="round"
                opacity="0.85"
                filter="url(#glow-effect)"
              />
              <path
                d="M 200 585 C 180 610, 360 620, 360 680"
                fill="none"
                stroke="#ffffff"
                strokeWidth="4"
                strokeDasharray="10 8"
                strokeLinecap="round"
                className="animate-waterfall-flow"
              />
              <circle cx="220" cy="605" r="3" fill="#88ffff" className="animate-water-drop-1" />
              <circle cx="300" cy="635" r="3.5" fill="#ffc24b" className="animate-water-drop-2" />
              <circle cx="350" cy="660" r="2.5" fill="#ffffff" className="animate-water-drop-1" style={{ animationDelay: "0.5s" }} />
              <circle cx="360" cy="690" fill="none" stroke="#b0aacd" strokeWidth="1.5" className="animate-splash-ring" />
            </g>

            {/* ── BASINS AND ROCK LEDGES ────────────────────────────────── */}
            {basins.map((b) => {
              const col = tierColors[b.id as keyof typeof tierColors];
              const isUserTier = status.currentTierId === b.id;
              const fillPct = tierFillPercents?.[b.id] ?? 95; // Default 95% full to indicate prize caps

              return (
                <g key={b.id} id={`basin-group-${b.id}`} filter="url(#ledge-shadow)">
                  {/* Rock Ledge Foundation */}
                  <path
                    d={`M ${b.x - 25} ${b.y + b.height} 
                       L ${b.x + b.width + 25} ${b.y + b.height} 
                       L ${b.x + b.width + 15} ${b.y + b.height + 22} 
                       Q ${b.x + b.width / 2} ${b.y + b.height + 35} ${b.x - 15} ${b.y + b.height + 22} 
                       Z`}
                    fill={`url(#rock-grad-${b.id})`}
                    stroke="rgba(255, 255, 255, 0.15)"
                    strokeWidth="1.5"
                  />

                  {/* Basin Trough Wall Container */}
                  <path
                    d={`M ${b.x} ${b.y + 15} 
                       Q ${b.x} ${b.y + b.height} ${b.x + 30} ${b.y + b.height} 
                       L ${b.x + b.width - 30} ${b.y + b.height} 
                       Q ${b.x + b.width} ${b.y + b.height} ${b.x + b.width} ${b.y + 15} 
                       Z`}
                    fill="rgba(5, 6, 15, 0.85)"
                    stroke={isUserTier ? col.accent : "rgba(255, 255, 255, 0.2)"}
                    strokeWidth={isUserTier ? "3" : "1.5"}
                  />

                  {/* Main Water Layer with Wave Surface */}
                  <path
                    d={`M ${b.x + 4} ${b.y + 25} 
                       Q ${b.x + b.width / 4} ${b.y + 18}, ${b.x + b.width / 2} ${b.y + 24} 
                       T ${b.x + b.width - 4} ${b.y + 22} 
                       L ${b.x + b.width - 6} ${b.y + b.height - 4} 
                       Q ${b.x + b.width - 20} ${b.y + b.height - 2} ${b.x + 20} ${b.y + b.height - 2} 
                       Z`}
                    fill={`url(#water-grad-${b.id})`}
                    className="transition-all duration-500"
                  />

                  {/* Animated Wave Top Surface Edge */}
                  <path
                    d={`M ${b.x + 4} ${b.y + 22} 
                       Q ${b.x + b.width / 4} ${b.y + 16}, ${b.x + b.width / 2} ${b.y + 22} 
                       T ${b.x + b.width - 4} ${b.y + 20}`}
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    opacity="0.75"
                  />

                  {/* User Progress Sub-Level Indicator (Rising inside User Basin) */}
                  {isUserTier && status.progressPctInTier < 100 && (
                    <path
                      d={`M ${b.x + 10} ${b.y + b.height - 8} 
                         L ${b.x + b.width - 10} ${b.y + b.height - 8} 
                         L ${b.x + b.width - 12} ${b.y + b.height - (b.height * (status.progressPctInTier / 100) * 0.75)} 
                         Q ${b.x + b.width / 2} ${b.y + b.height - (b.height * (status.progressPctInTier / 100) * 0.75) - 6} ${b.x + 12} ${b.y + b.height - (b.height * (status.progressPctInTier / 100) * 0.75)} 
                         Z`}
                      fill={col.progressWater}
                      className="transition-all duration-700"
                    />
                  )}

                  {/* Overflow Lip Highlight on Downhill Edge */}
                  <circle cx={b.spillX || b.x + 20} cy={b.spillY ? b.spillY - 10 : b.y + b.height} r="6" fill={col.accent} opacity="0.8" className="animate-pulse" />

                  {/* FLOATING USER DROPLET MARKER (If User is in this Basin) */}
                  {isUserTier && (
                    <g id="user-droplet-marker" transform={`translate(${b.x + b.width / 2}, ${b.y + 16})`}>
                      {/* Floating Teardrop Marker with Bobbing Animation */}
                      <g className="animate-droplet-bob cursor-pointer">
                        {/* Outer Glowing Ripple on Water Surface */}
                        <ellipse cx="0" cy="10" rx="22" ry="6" fill="url(#droplet-glow)" opacity="0.6" className="animate-ping" />
                        <ellipse cx="0" cy="10" rx="16" ry="4" fill="none" stroke="#22e5e5" strokeWidth="1.5" />

                        {/* Teardrop Water Droplet */}
                        <path
                          d="M 0 -22 C -10 -8, -12 4, 0 10 C 12 4, 10 -8, 0 -22 Z"
                          fill="url(#droplet-glow)"
                          stroke="#ffffff"
                          strokeWidth="2"
                          filter="url(#glow-effect)"
                        />
                        <circle cx="-3" cy="-6" r="2.5" fill="#ffffff" opacity="0.9" />

                        {/* Anchored Floating Text Tooltip Badge */}
                        <g transform="translate(0, -32)">
                          <rect
                            x="-75"
                            y="-14"
                            width="150"
                            height="24"
                            rx="12"
                            fill="#05060f"
                            stroke="#22e5e5"
                            strokeWidth="2"
                            className="shadow-xl"
                          />
                          <text
                            x="0"
                            y="2"
                            textAnchor="middle"
                            fill="#ffffff"
                            fontSize="11"
                            fontWeight="bold"
                            fontFamily="sans-serif"
                          >
                            📍 You're here · {safePoints} pts
                          </text>
                        </g>
                      </g>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Basin Info Ledges & Waterfall Rule Cards */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        {ARCADE_2026_TIERS.map((tier) => {
          const isUserCurrentTier = status.currentTierId === tier.id;
          const col = tierColors[tier.id as keyof typeof tierColors];
          const isExpanded = expandedTier === tier.id;

          return (
            <div
              key={tier.id}
              className={`glass rounded-2xl p-4 border transition-all duration-300 ${
                isUserCurrentTier
                  ? "border-cyan/50 bg-gradient-to-r from-cyan/15 via-violet/10 to-transparent shadow-lg ring-1 ring-cyan/40"
                  : "border-white/10 bg-white/5 hover:border-white/20"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span
                    className="w-3 h-3 rounded-full shrink-0 shadow"
                    style={{ backgroundColor: col.accent }}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-display text-sm font-bold text-mist">
                        {tier.name}
                      </h4>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white/10 text-mist-muted">
                        {tier.maxPoints === null ? `${tier.minPoints}+ pts` : `${tier.minPoints}–${tier.maxPoints} pts`}
                      </span>
                    </div>
                    <p className="text-xs text-mist-muted mt-0.5">
                      Prize Cap:{" "}
                      <strong className="text-mist font-semibold">
                        {tier.capSlots.toLocaleString()} spots
                      </strong>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => toggleTooltip(tier.id)}
                  aria-expanded={isExpanded}
                  aria-label={`Toggle waterfall rule for ${tier.name}`}
                  className="inline-flex items-center gap-1 text-[11px] text-mist-muted hover:text-cyan transition-colors px-2 py-1 rounded-lg hover:bg-white/10"
                >
                  <Info className="w-3.5 h-3.5 text-cyan" />
                  <span>Rule</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                  />
                </button>
              </div>

              {/* In-Card Progress Bar if User is in this Tier */}
              {isUserCurrentTier && (
                <div className="mt-3 pt-2.5 border-t border-white/10 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-mist-muted">Basin Fill / Tier Progress:</span>
                    <span className="font-bold text-cyan">
                      {status.pointsToNextTier > 0
                        ? `${status.pointsToNextTier} pts to ${status.nextTierName}`
                        : "Reached Top Tier! 🏆"}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan via-violet to-amber rounded-full transition-all duration-700"
                      style={{ width: `${status.progressPctInTier}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Expandable Waterfall Rule Explanation */}
              {isExpanded && (
                <div className="mt-3 p-3 rounded-xl bg-white/5 border border-cyan/30 text-xs text-mist-muted leading-relaxed rise-in flex items-start gap-2">
                  <Info className="w-4 h-4 text-cyan shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-mist block mb-0.5">
                      Waterfall Overflow Rule:
                    </strong>
                    If this tier's {tier.capSlots.toLocaleString()} spot cap fills up,
                    eligible players roll down to the next tier below — your Arcade Points still count toward prize qualification, queued at the tier below.
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer Disclaimer */}
      <div className="relative z-10 pt-3 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-[11px] text-mist-muted gap-2">
        <p className="flex items-center gap-1.5 text-center sm:text-left">
          <Info className="w-3.5 h-3.5 text-cyan shrink-0" />
          <span>
            Official real-time remaining-slot counts are on Google's Arcade
            page (weekly updated) — this view shows the tier rules and your
            standing, not live global slot counts.
          </span>
        </p>
        <a
          href="https://go.cloudskillsboost.google/arcade"
          target="_blank"
          rel="noopener noreferrer"
          className="text-cyan hover:underline shrink-0 font-bold flex items-center gap-1 cursor-pointer"
        >
          Google Arcade Page <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </section>
  );
}
