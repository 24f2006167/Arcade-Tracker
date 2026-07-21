"use client";

import { useState } from "react";
import { Info, Shield, Award, Trophy, ChevronDown, Sparkles, ArrowDown } from "lucide-react";
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
      bgGradient: "from-amber/15 via-amber/5 to-transparent",
      borderColor: "border-amber/40",
      glowColor: "rgba(255, 194, 75, 0.25)",
      badgeBg: "bg-amber/20 text-amber border-amber/40",
    },
    champion: {
      accent: "#b389ff", // violet
      bgGradient: "from-violet/15 via-violet/5 to-transparent",
      borderColor: "border-violet/40",
      glowColor: "rgba(179, 137, 255, 0.25)",
      badgeBg: "bg-violet/20 text-violet border-violet/40",
    },
    ranger: {
      accent: "#ff6fb3", // pink
      bgGradient: "from-pink/15 via-pink/5 to-transparent",
      borderColor: "border-pink/40",
      glowColor: "rgba(255, 111, 179, 0.25)",
      badgeBg: "bg-pink/20 text-pink border-pink/40",
    },
    trooper: {
      accent: "#22e5e5", // cyan
      bgGradient: "from-cyan/15 via-cyan/5 to-transparent",
      borderColor: "border-cyan/40",
      glowColor: "rgba(34, 229, 229, 0.25)",
      badgeBg: "bg-cyan/20 text-cyan border-cyan/40",
    },
  };

  const toggleTooltip = (id: string) => {
    setExpandedTier((prev) => (prev === id ? null : id));
  };

  return (
    <section
      aria-label="Google Skills Arcade 2026 Waterfall Tiers Explainer"
      className="glass-strong rounded-2xl p-6 space-y-6 rise-in border border-line relative overflow-hidden"
    >
      {/* Visual Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-gradient-to-br from-amber/20 to-cyan/20 border border-amber/30">
              <Trophy className="w-4 h-4 text-amber" />
            </span>
            <h2 className="font-display text-base font-semibold text-mist">
              Arcade Waterfall System 🌊
            </h2>
            {hackerMode && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan/15 text-cyan border border-cyan/30">
                [SYS_WATERFALL_V2026]
              </span>
            )}
          </div>
          <p className="text-xs text-mist-muted">
            How prize spots spill downwards when top tier caps are reached
          </p>
        </div>

        {/* User standing summary badge */}
        <div
          tabIndex={0}
          role="status"
          aria-label={`Current status: ${status.currentTierName}, ${status.userPoints} points`}
          className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 self-start sm:self-auto text-xs font-medium ${
            status.currentTierId === "below_trooper"
              ? "bg-white/5 text-mist-muted border-white/10"
              : "bg-gradient-to-r from-amber/20 via-violet/20 to-cyan/20 border-cyan/40 text-mist"
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-cyan animate-pulse" />
          <span>
            Your Standing:{" "}
            <strong className="text-mist font-semibold">
              {status.userPoints} pts
            </strong>{" "}
            ({status.currentTierName})
          </span>
        </div>
      </div>

      {/* Main Waterfall Funnel Diagram */}
      <div className="relative max-w-2xl mx-auto py-2 space-y-3">
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
                    ? `0 0 24px ${style.glowColor}`
                    : undefined,
                }}
                className={`relative ${widthClass} transition-all duration-300 rounded-2xl border p-4 sm:p-5 ${
                  isUserCurrentTier
                    ? `${style.borderColor} bg-gradient-to-r ${style.bgGradient} ring-2 ring-cyan/50`
                    : "border-line bg-white/5 hover:border-white/20"
                }`}
              >
                {/* User Droplet/Marker Overlay on User's Chamber */}
                {isUserCurrentTier && (
                  <div className="absolute -top-3 left-6 sm:left-8 z-20 flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-gradient-to-r from-cyan to-amber text-void text-[11px] font-bold shadow-lg animate-bounce">
                    <span className="w-2 h-2 rounded-full bg-void animate-ping" />
                    📍 YOU ARE HERE ({safePoints} PTS)
                  </div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Left: Tier Name & Point Range */}
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${style.badgeBg}`}
                    >
                      <IconComponent className="w-5 h-5" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-display text-sm font-semibold text-mist">
                          {tier.name}
                        </h3>
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-white/10 text-mist-muted">
                          {pointRangeText}
                        </span>
                      </div>
                      <p className="text-xs text-mist-muted mt-0.5">
                        Cap:{" "}
                        <strong className="text-mist font-medium">
                          {tier.capSlots.toLocaleString()} spots
                        </strong>
                      </p>
                    </div>
                  </div>

                  {/* Right: Info Toggle & Status */}
                  <div className="flex items-center gap-2 justify-between sm:justify-end">
                    {isUserCurrentTier && (
                      <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-cyan/20 text-cyan border border-cyan/40">
                        Active Tier
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => toggleTooltip(tier.id)}
                      aria-expanded={isExpanded}
                      aria-label={`Toggle info for ${tier.name}`}
                      className="inline-flex items-center gap-1 text-[11px] text-mist-muted hover:text-cyan transition-colors px-2 py-1 rounded-lg hover:bg-white/10"
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
                  <div className="mt-4 pt-3 border-t border-white/10 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-mist-muted">
                        Progress to next tier:
                      </span>
                      <span className="font-medium text-cyan">
                        {status.pointsToNextTier > 0
                          ? `${status.pointsToNextTier} pts to ${status.nextTierName}`
                          : "Reached Top Tier (Arcade Legend! 🏆)"}
                      </span>
                    </div>

                    <div
                      className="h-2.5 rounded-full bg-white/10 overflow-hidden relative"
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
                        <div className="absolute inset-0 bg-white/20 animate-pulse" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Expandable Waterfall Rule Note */}
                {isExpanded && (
                  <div className="mt-3 p-3 rounded-xl bg-white/5 border border-cyan/20 text-xs text-mist-muted leading-relaxed rise-in flex items-start gap-2">
                    <Info className="w-4 h-4 text-cyan shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-mist block mb-0.5">
                        Waterfall Overflow Mechanic:
                      </strong>
                      If this tier's {tier.capSlots.toLocaleString()} cap fills up,
                      remaining players who reach {pointRangeText} roll down into the
                      next tier below ({idx < ARCADE_2026_TIERS.length - 1 ? ARCADE_2026_TIERS[idx + 1].name : "Trooper"}) — your points still count, but you're queued at the tier below.
                    </div>
                  </div>
                )}
              </div>

              {/* Connecting Chute / Overflow Arrow between chambers */}
              {idx < ARCADE_2026_TIERS.length - 1 && (
                <div className="my-1.5 flex flex-col items-center justify-center relative group">
                  {/* SVG Chute Stream with animated dashed line */}
                  <svg
                    width="40"
                    height="32"
                    viewBox="0 0 40 32"
                    fill="none"
                    className="overflow-visible"
                    aria-hidden="true"
                  >
                    <defs>
                      <linearGradient
                        id={`chute-grad-${tier.id}`}
                        x1="0%"
                        y1="0%"
                        x2="0%"
                        y2="100%"
                      >
                        <stop offset="0%" stopColor={style.accent} stopOpacity="0.8" />
                        <stop offset="100%" stopColor="#22e5e5" stopOpacity="0.8" />
                      </linearGradient>
                    </defs>
                    {/* Background chute line */}
                    <path
                      d="M20 0 L20 24"
                      stroke="rgba(255, 255, 255, 0.15)"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                    {/* Animated downward stream */}
                    <path
                      d="M20 0 L20 24"
                      stroke={`url(#chute-grad-${tier.id})`}
                      strokeWidth="3"
                      strokeDasharray="6 4"
                      strokeLinecap="round"
                      className="animate-waterfall-flow"
                    />
                    <polygon
                      points="15,22 25,22 20,28"
                      fill={`url(#chute-grad-${tier.id})`}
                    />
                  </svg>
                  <span className="text-[10px] text-mist-muted opacity-80 font-mono tracking-wider scale-90">
                    overflow ↓
                  </span>
                </div>
              )}
            </div>
          );
        })}

        {/* 0–49 Pts Entry Chamber (Below Trooper) */}
        <div className="flex flex-col items-center pt-1">
          {/* Chute down to Entry Pool */}
          <div className="my-1 flex flex-col items-center">
            <ArrowDown className="w-4 h-4 text-mist-muted/60 animate-bounce" />
          </div>

          <div
            tabIndex={0}
            role="region"
            aria-label="Unranked: 0 to 49 points (below Trooper)"
            className={`w-[84%] rounded-2xl border p-4 transition-all duration-300 ${
              status.currentTierId === "below_trooper"
                ? "border-amber/50 bg-gradient-to-r from-amber/15 via-amber/5 to-transparent ring-2 ring-amber/40"
                : "border-line/60 bg-white/[0.02]"
            }`}
          >
            {status.currentTierId === "below_trooper" && (
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber text-void text-[11px] font-bold shadow-md mb-2">
                📍 YOU ARE HERE ({safePoints} PTS)
              </div>
            )}

            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-mist-muted/50" />
                <span className="font-semibold text-mist-muted">
                  Aspiring / Below Trooper
                </span>
                <span className="font-mono text-[10px] text-mist-muted">
                  0–49 pts
                </span>
              </div>
              <span className="text-mist-muted text-[11px]">
                Qualification Pool
              </span>
            </div>

            {status.currentTierId === "below_trooper" && (
              <div className="mt-3 pt-2 border-t border-white/10 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-mist-muted">
                    Points to Arcade Trooper (50 pts):
                  </span>
                  <span className="font-semibold text-amber">
                    {status.pointsToNextTier} pts needed
                  </span>
                </div>
                <div
                  className="h-2 rounded-full bg-white/10 overflow-hidden"
                  role="progressbar"
                  aria-valuenow={status.progressPctInTier}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`Progress to Arcade Trooper: ${status.progressPctInTier}%`}
                >
                  <div
                    className="h-full bg-gradient-to-r from-amber to-cyan rounded-full transition-all duration-700"
                    style={{ width: `${status.progressPctInTier}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Disclaimer */}
      <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-[11px] text-mist-muted gap-2">
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
          className="text-cyan hover:underline shrink-0 font-medium cursor-pointer"
        >
          Google Arcade Page →
        </a>
      </div>
    </section>
  );
}
