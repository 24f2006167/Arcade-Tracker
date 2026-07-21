"use client";

import { useState } from "react";
import { Info, Shield, Award, Trophy, ChevronDown, Sparkles, ArrowDown, Droplets } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import {
  ARCADE_2026_TIERS,
  getUserWaterfallStatus,
} from "@/lib/arcadeCalculator";
import type { ArcadeWaterfallTier } from "@/lib/arcadeCalculator";

interface WaterfallTiersProps {
  userPoints?: number;
}

export function WaterfallTiers({ userPoints = 0 }: WaterfallTiersProps) {
  const { hackerMode, theme } = useTheme();
  const isLight = theme === "light";
  const [expandedTier, setExpandedTier] = useState<string | null>(null);

  const safePoints = typeof userPoints === "number" && !isNaN(userPoints) ? Math.max(0, userPoints) : 0;
  const status = getUserWaterfallStatus(safePoints);

  // Icon mapping for tiers
  const tierIcons = {
    legend: Trophy,
    champion: Award,
    ranger: Shield,
    trooper: Sparkles,
  };

  // Color theme per tier
  const tierStyles = {
    legend: {
      accent: "#ffc24b", // amber
      bgGradient: "from-amber/20 via-amber/10 to-amber/5",
      borderColor: "border-amber/50",
      glowColor: "rgba(255, 194, 75, 0.35)",
      badgeBg: "bg-amber/20 text-amber border-amber/40",
      streamGrad: ["#ffc24b", "#b389ff"],
    },
    champion: {
      accent: "#b389ff", // violet
      bgGradient: "from-violet/20 via-violet/10 to-violet/5",
      borderColor: "border-violet/50",
      glowColor: "rgba(179, 137, 255, 0.35)",
      badgeBg: "bg-violet/20 text-violet border-violet/40",
      streamGrad: ["#b389ff", "#ff6fb3"],
    },
    ranger: {
      accent: "#ff6fb3", // pink
      bgGradient: "from-pink/20 via-pink/10 to-pink/5",
      borderColor: "border-pink/50",
      glowColor: "rgba(255, 111, 179, 0.35)",
      badgeBg: "bg-pink/20 text-pink border-pink/40",
      streamGrad: ["#ff6fb3", "#22e5e5"],
    },
    trooper: {
      accent: "#22e5e5", // cyan
      bgGradient: "from-cyan/20 via-cyan/10 to-cyan/5",
      borderColor: "border-cyan/50",
      glowColor: "rgba(34, 229, 229, 0.35)",
      badgeBg: "bg-cyan/20 text-cyan border-cyan/40",
      streamGrad: ["#22e5e5", "#ffc24b"],
    },
  };

  const toggleTooltip = (id: string) => {
    setExpandedTier((prev) => (prev === id ? null : id));
  };

  return (
    <section
      aria-label="Google Skills Arcade 2026 Waterfall Tiers Explainer"
      className="glass-strong rounded-2xl p-6 space-y-6 rise-in border border-cyan/30 relative overflow-hidden shadow-2xl"
    >
      {/* Background ambient water glow */}
      <div className="absolute inset-0 pointer-events-none z-0 opacity-40 select-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-gradient-to-b from-cyan/20 via-violet/15 to-transparent blur-3xl" />
      </div>

      {/* Visual Header */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-gradient-to-br from-cyan/20 via-violet/20 to-amber/20 border border-cyan/40 shadow-inner">
              <Droplets className="w-5 h-5 text-cyan animate-bounce" />
            </span>
            <h2 className="font-display text-lg font-bold text-mist tracking-wide">
              Arcade Waterfall System <span className="text-cyan">🌊</span>
            </h2>
            {hackerMode && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan/15 text-cyan border border-cyan/30">
                [LIVE_WATERFALL_FLOW]
              </span>
            )}
          </div>
          <p className="text-xs text-mist-muted">
            Continuous spot rollover: overflow automatically cascades from upper tiers to lower tiers
          </p>
        </div>

        {/* User standing summary badge */}
        <div
          tabIndex={0}
          role="status"
          aria-label={`Current status: ${status.currentTierName}, ${status.userPoints} points`}
          className={`px-3.5 py-2 rounded-xl border flex items-center gap-2.5 self-start sm:self-auto text-xs font-semibold shadow-md ${
            status.currentTierId === "below_trooper"
              ? "bg-white/5 text-mist-muted border-white/15"
              : "bg-gradient-to-r from-amber/25 via-violet/25 to-cyan/25 border-cyan/50 text-mist ring-1 ring-cyan/30"
          }`}
        >
          <span className="w-2.5 h-2.5 rounded-full bg-cyan animate-ping" />
          <span>
            Your Standing:{" "}
            <strong className="text-cyan font-bold text-sm">
              {safePoints} pts
            </strong>{" "}
            ({status.currentTierName})
          </span>
        </div>
      </div>

      {/* Main Waterfall Funnel Diagram */}
      <div className="relative z-10 max-w-2xl mx-auto py-2 space-y-4">
        {ARCADE_2026_TIERS.map((tier, idx) => {
          const isUserCurrentTier = status.currentTierId === tier.id;
          const IconComponent = tierIcons[tier.id];
          const style = tierStyles[tier.id];
          const isExpanded = expandedTier === tier.id;

          // Chamber width tapering effect: Legend 100%, Champion 96%, Ranger 92%, Trooper 88%
          const widths = ["w-full", "w-[96%]", "w-[92%]", "w-[88%]"];
          const widthClass = widths[idx] || "w-full";

          const pointRangeText =
            tier.maxPoints === null
              ? `${tier.minPoints}+ pts`
              : `${tier.minPoints}–${tier.maxPoints} pts`;

          return (
            <div key={tier.id} className="flex flex-col items-center">
              {/* Stacked Chamber Box */}
              <div
                tabIndex={0}
                role="region"
                aria-label={`${tier.name}: ${pointRangeText}, ${tier.capSlots.toLocaleString()} spots`}
                style={{
                  boxShadow: isUserCurrentTier
                    ? `0 0 30px ${style.glowColor}`
                    : undefined,
                }}
                className={`relative ${widthClass} transition-all duration-300 rounded-2xl border p-4 sm:p-5 overflow-hidden ${
                  isUserCurrentTier
                    ? `${style.borderColor} bg-gradient-to-r ${style.bgGradient} ring-2 ring-cyan/60 shadow-xl`
                    : "border-line bg-white/5 hover:border-white/20"
                }`}
              >
                {/* Subtle Fluid Wave Background */}
                <div className="absolute inset-x-0 bottom-0 h-3 opacity-25 overflow-hidden pointer-events-none">
                  <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-[200%] h-full animate-wave-flow">
                    <path
                      d="M0,0 C150,90 350,-40 500,40 C650,120 900,-20 1200,60 L1200,120 L0,120 Z"
                      fill={style.accent}
                    />
                  </svg>
                </div>

                {/* User Droplet/Marker Overlay on User's Chamber */}
                {isUserCurrentTier && (
                  <div className="absolute -top-3 left-6 sm:left-8 z-30 flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-gradient-to-r from-cyan via-violet to-amber text-void text-[11px] font-bold shadow-xl animate-bounce">
                    <span className="w-2.5 h-2.5 rounded-full bg-void animate-ping" />
                    📍 YOU ARE HERE ({safePoints} PTS)
                  </div>
                )}

                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Left: Tier Name & Point Range */}
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border shadow-md ${style.badgeBg}`}
                    >
                      <IconComponent className="w-5 h-5" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-display text-base font-bold text-mist">
                          {tier.name}
                        </h3>
                        <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-md bg-white/10 text-mist font-medium border border-white/10">
                          {pointRangeText}
                        </span>
                      </div>
                      <p className="text-xs text-mist-muted mt-0.5">
                        Slot Cap:{" "}
                        <strong className="text-mist font-semibold">
                          {tier.capSlots.toLocaleString()} spots
                        </strong>
                      </p>
                    </div>
                  </div>

                  {/* Right: Info Toggle & Status */}
                  <div className="flex items-center gap-2 justify-between sm:justify-end">
                    {isUserCurrentTier && (
                      <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-cyan/20 text-cyan border border-cyan/50 shadow-sm">
                        Active Tier
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => toggleTooltip(tier.id)}
                      aria-expanded={isExpanded}
                      aria-label={`Toggle info for ${tier.name}`}
                      className="inline-flex items-center gap-1 text-xs text-mist-muted hover:text-cyan transition-colors px-2.5 py-1 rounded-lg hover:bg-white/10"
                    >
                      <Info className="w-3.5 h-3.5 text-cyan" />
                      <span>Waterfall Rule</span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform duration-200 ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* In-Chamber Progress Bar (if user is in this tier) */}
                {isUserCurrentTier && (
                  <div className="relative z-10 mt-4 pt-3 border-t border-white/10 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-mist-muted">
                        Progress to next tier:
                      </span>
                      <span className="font-semibold text-cyan">
                        {status.pointsToNextTier > 0
                          ? `${status.pointsToNextTier} pts to ${status.nextTierName}`
                          : "Reached Top Tier (Arcade Legend! 🏆)"}
                      </span>
                    </div>

                    <div
                      className="h-3 rounded-full bg-white/10 overflow-hidden relative shadow-inner"
                      role="progressbar"
                      aria-valuenow={status.progressPctInTier}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`Progress to ${status.nextTierName || "Legend"}: ${status.progressPctInTier}%`}
                    >
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-cyan via-violet to-amber transition-all duration-700 relative overflow-hidden"
                        style={{ width: `${status.progressPctInTier}%` }}
                      >
                        <div className="absolute inset-0 bg-white/30 animate-pulse" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Expandable Waterfall Rule Note */}
                {isExpanded && (
                  <div className="relative z-10 mt-3 p-3.5 rounded-xl bg-white/10 border border-cyan/30 text-xs text-mist-muted leading-relaxed rise-in flex items-start gap-2.5 shadow-md">
                    <Info className="w-4 h-4 text-cyan shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-mist block mb-0.5">
                        Waterfall Overflow Mechanic:
                      </strong>
                      If this tier's {tier.capSlots.toLocaleString()} cap fills up,
                      remaining players who reach {pointRangeText} roll down into the
                      next tier below ({idx < ARCADE_2026_TIERS.length - 1 ? ARCADE_2026_TIERS[idx + 1].name : "Trooper"}) — your points still count toward prize qualification, queued at the tier below!
                    </div>
                  </div>
                )}
              </div>

              {/* Connecting Continuous Waterfall Chute */}
              {idx < ARCADE_2026_TIERS.length - 1 && (
                <div className="my-1 flex flex-col items-center justify-center relative group w-full py-1">
                  {/* Real Continuous Waterfall SVG Stream */}
                  <svg
                    width="60"
                    height="44"
                    viewBox="0 0 60 44"
                    fill="none"
                    className="overflow-visible"
                    aria-hidden="true"
                  >
                    <defs>
                      <linearGradient
                        id={`stream-grad-${tier.id}`}
                        x1="0%"
                        y1="0%"
                        x2="0%"
                        y2="100%"
                      >
                        <stop offset="0%" stopColor={style.streamGrad[0]} stopOpacity="0.9" />
                        <stop offset="100%" stopColor={style.streamGrad[1]} stopOpacity="0.9" />
                      </linearGradient>

                      <filter id={`glow-${tier.id}`} x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="2" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                      </filter>
                    </defs>

                    {/* Main Water Pipe / Column Background */}
                    <path
                      d="M30 0 L30 36"
                      stroke="rgba(255, 255, 255, 0.1)"
                      strokeWidth="8"
                      strokeLinecap="round"
                    />

                    {/* Secondary Flow Lines */}
                    <path
                      d="M24 0 L24 34"
                      stroke={`url(#stream-grad-${tier.id})`}
                      strokeWidth="2"
                      strokeDasharray="10 6"
                      strokeLinecap="round"
                      className="animate-waterfall-flow"
                      style={{ animationDuration: "0.7s" }}
                    />
                    <path
                      d="M30 0 L30 36"
                      stroke={`url(#stream-grad-${tier.id})`}
                      strokeWidth="4"
                      strokeDasharray="12 8"
                      strokeLinecap="round"
                      filter={`url(#glow-${tier.id})`}
                      className="animate-waterfall-flow"
                    />
                    <path
                      d="M36 0 L36 34"
                      stroke={`url(#stream-grad-${tier.id})`}
                      strokeWidth="2"
                      strokeDasharray="8 6"
                      strokeLinecap="round"
                      className="animate-waterfall-flow"
                      style={{ animationDuration: "0.85s" }}
                    />

                    {/* Continuous Falling Water Droplets */}
                    <circle cx="30" cy="0" r="2.5" fill="#22e5e5" className="animate-water-drop-1" />
                    <circle cx="25" cy="2" r="2" fill="#ffc24b" className="animate-water-drop-2" />
                    <circle cx="35" cy="4" r="2" fill="#b389ff" className="animate-water-drop-1" style={{ animationDelay: "0.6s" }} />

                    {/* Splash Ripple Ring at Bottom */}
                    <circle cx="30" cy="36" r="6" stroke="#22e5e5" strokeWidth="1.5" fill="none" className="animate-splash" />
                    <circle cx="30" cy="36" r="4" stroke="#ffc24b" strokeWidth="1" fill="none" className="animate-splash" style={{ animationDelay: "0.5s" }} />

                    {/* Funnel Arrow Head */}
                    <polygon
                      points="22,34 38,34 30,42"
                      fill={`url(#stream-grad-${tier.id})`}
                    />
                  </svg>
                  <span className="text-[10px] text-cyan font-mono tracking-widest uppercase opacity-90 -mt-1 font-bold">
                    continuous overflow ↓
                  </span>
                </div>
              )}
            </div>
          );
        })}

        {/* 0–49 Pts Entry Chamber (Below Trooper) */}
        <div className="flex flex-col items-center pt-1">
          {/* Continuous Water Stream to Entry Pool */}
          <div className="my-1 flex flex-col items-center">
            <svg width="40" height="28" viewBox="0 0 40 28" fill="none" aria-hidden="true">
              <path d="M20 0 L20 22" stroke="#ffc24b" strokeWidth="3" strokeDasharray="8 6" strokeLinecap="round" className="animate-waterfall-flow" />
              <polygon points="14,20 26,20 20,26" fill="#ffc24b" />
            </svg>
          </div>

          <div
            tabIndex={0}
            role="region"
            aria-label="Unranked: 0 to 49 points (below Trooper)"
            className={`w-[84%] rounded-2xl border p-4 transition-all duration-300 ${
              status.currentTierId === "below_trooper"
                ? "border-amber/60 bg-gradient-to-r from-amber/20 via-amber/10 to-transparent ring-2 ring-amber/50 shadow-lg"
                : "border-line/60 bg-white/[0.03]"
            }`}
          >
            {status.currentTierId === "below_trooper" && (
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber text-void text-[11px] font-bold shadow-md mb-2">
                📍 YOU ARE HERE ({safePoints} PTS)
              </div>
            )}

            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber/80 animate-pulse" />
                <span className="font-bold text-mist">
                  Aspiring / Below Trooper
                </span>
                <span className="font-mono text-[10px] text-mist-muted px-2 py-0.5 bg-white/10 rounded">
                  0–49 pts
                </span>
              </div>
              <span className="text-amber font-semibold text-[11px]">
                Qualification Pool
              </span>
            </div>

            {status.currentTierId === "below_trooper" && (
              <div className="mt-3 pt-2.5 border-t border-white/10 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-mist-muted">
                    Points to Arcade Trooper (50 pts):
                  </span>
                  <span className="font-bold text-amber">
                    {status.pointsToNextTier} pts needed
                  </span>
                </div>
                <div
                  className="h-2.5 rounded-full bg-white/10 overflow-hidden shadow-inner"
                  role="progressbar"
                  aria-valuenow={status.progressPctInTier}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`Progress to Arcade Trooper: ${status.progressPctInTier}%`}
                >
                  <div
                    className="h-full bg-gradient-to-r from-amber to-cyan rounded-full transition-all duration-700 relative overflow-hidden"
                    style={{ width: `${status.progressPctInTier}%` }}
                  >
                    <div className="absolute inset-0 bg-white/30 animate-pulse" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
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
          className="text-cyan hover:underline shrink-0 font-bold cursor-pointer"
        >
          Google Arcade Page →
        </a>
      </div>
    </section>
  );
}
