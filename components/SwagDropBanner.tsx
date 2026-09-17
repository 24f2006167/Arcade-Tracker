"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Wind,
  Zap,
  Shield,
  Package,
  Feather,
  Trophy,
  Crown,
  Gift,
  Star,
  Shirt,
  Backpack,
  Coffee,
  Watch,
  BookOpen,
} from "lucide-react";

/* ─── Jacket feature highlights ─────────────────────────────────────────── */
const JACKET_FEATURES = [
  {
    icon: "wind",
    label: "Storm-ready weave",
    desc: "Repels light rain, shuts down gusting winds.",
    color: "text-cyan",
  },
  {
    icon: "zap",
    label: "Official branding",
    desc: "Google Cloud chest logo + super cloud sleeve patch.",
    color: "text-amber",
  },
  {
    icon: "shield",
    label: "Total draft block",
    desc: "Stand-up collar, Velcro cuffs, ribbed elastic hem.",
    color: "text-violet",
  },
  {
    icon: "package",
    label: "Secure cargo pockets",
    desc: "Deep zippered hand-warmer pockets.",
    color: "text-pink",
  },
  {
    icon: "feather",
    label: "Weightless mobility",
    desc: "Technical performance, no heavy winter bulk.",
    color: "text-cyan",
  },
];

/* ─── Champion swag list (95 pts) ───────────────────────────────────────── */
const CHAMPION_SWAGS = [
  {
    icon: "shirt",
    name: "Arcade Weather-Shield Jacket",
    note: "Flagship drop — shared with Legend",
    highlight: true,
  },
  { icon: "backpack", name: "Google Skills Arcade Backpack", note: "Premium carry gear" },
  { icon: "coffee", name: "Arcade Tumbler / Water Bottle", note: "Branded drinkware" },
  { icon: "star", name: "Champion Tier Swag Pack", note: "Full core gear collection" },
];

/* ─── Legend swag list (120 pts) ────────────────────────────────────────── */
const LEGEND_SWAGS = [
  {
    icon: "shirt",
    name: "Arcade Weather-Shield Jacket",
    note: "Flagship drop — shared with Champion",
    highlight: true,
  },
  { icon: "backpack", name: "Google Skills Arcade Backpack", note: "Premium carry gear" },
  { icon: "coffee", name: "Arcade Tumbler / Water Bottle", note: "Branded drinkware" },
  { icon: "star", name: "Champion Tier Swag Pack", note: "Everything from Champion Tier" },
  {
    icon: "crown",
    name: "Exclusive Legend-only Reward",
    note: "Reserved for top finishers only",
    exclusive: true,
  },
  {
    icon: "watch",
    name: "Premium Arcade Collectible",
    note: "Legend badge + special edition item",
    exclusive: true,
  },
];

/* ─── Snowball tier data ─────────────────────────────────────────────────── */
const TIERS = [
  {
    name: "Arcade Trooper",
    pts: 50,
    emoji: "🛡️",
    color: "text-cyan",
    border: "border-cyan/25",
    bg: "bg-cyan/8",
    dot: "bg-cyan",
    desc: "Foundational milestone — core swag pack with essential Arcade gear.",
  },
  {
    name: "Arcade Ranger",
    pts: 75,
    emoji: "🏹",
    color: "text-violet",
    border: "border-violet/25",
    bg: "bg-violet/8",
    dot: "bg-violet",
    desc: "Everything from Trooper Tier plus an additional bonus reward.",
  },
  {
    name: "Arcade Champion",
    pts: 95,
    emoji: "🏆",
    color: "text-amber",
    border: "border-amber/25",
    bg: "bg-amber/8",
    dot: "bg-amber",
    desc: "High-tier premium gear collection + the Weather-Shield Jacket.",
  },
  {
    name: "Arcade Legend",
    pts: 120,
    emoji: "👑",
    color: "text-pink",
    border: "border-pink/25",
    bg: "bg-pink/8",
    dot: "bg-pink",
    desc: "All Champion Tier rewards + exclusive Legend-only items.",
  },
];

/* ─── Icon helper ────────────────────────────────────────────────────────── */
function Icon({ name, className }: { name: string; className?: string }) {
  const cls = `w-4 h-4 ${className ?? ""}`;
  switch (name) {
    case "wind":     return <Wind className={cls} />;
    case "zap":      return <Zap className={cls} />;
    case "shield":   return <Shield className={cls} />;
    case "package":  return <Package className={cls} />;
    case "feather":  return <Feather className={cls} />;
    case "shirt":    return <Shirt className={cls} />;
    case "backpack": return <Backpack className={cls} />;
    case "coffee":   return <Coffee className={cls} />;
    case "star":     return <Star className={cls} />;
    case "crown":    return <Crown className={cls} />;
    case "trophy":   return <Trophy className={cls} />;
    case "watch":    return <Watch className={cls} />;
    case "book":     return <BookOpen className={cls} />;
    default:         return <Gift className={cls} />;
  }
}

interface Props {
  currentTierName?: string | null;
  userPoints?: number;
}

export function SwagDropBanner({ currentTierName, userPoints = 0 }: Props) {
  const [snowballOpen, setSnowballOpen] = useState(false);

  const isChampion = currentTierName === "Arcade Champion";
  const isLegend   = currentTierName === "Arcade Legend";
  const qualifies  = isChampion || isLegend;

  return (
    <div className="space-y-4 rise-in">

      {/* ══════════════════════════════════════════════════════════════
          TOP BANNER — image thumbnail + headline
      ══════════════════════════════════════════════════════════════ */}
      <div
        className="glass-strong rounded-2xl overflow-hidden border border-line relative"
        id="swag-drop-banner"
      >
        {/* Drop pill */}
        <div className="absolute top-3 left-3 z-10">
          <span
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase"
            style={{
              background: "linear-gradient(135deg,#ffc24b 0%,#ff6fb3 100%)",
              color: "#05060f",
              boxShadow: "0 2px 10px rgba(255,194,75,0.45)",
            }}
          >
            ✦ 2026 Swag Drop · Drop #1
          </span>
        </div>

        {qualifies && (
          <div className="absolute top-3 right-3 z-10">
            <span
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold"
              style={{
                background: "rgba(34,229,229,0.15)",
                border: "1px solid rgba(34,229,229,0.4)",
                color: "#22e5e5",
              }}
            >
              ✓ You qualify!
            </span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-0 sm:gap-5 p-5 pt-10 sm:pt-5 sm:items-start">
          {/* ── Thumbnail image ──────────────────────────────────── */}
          <div className="sm:pt-1 shrink-0">
            <div
              className="relative overflow-hidden rounded-xl"
              style={{
                width: "140px",
                minWidth: "140px",
                boxShadow: "0 4px 24px rgba(255,194,75,0.25), 0 1px 6px rgba(0,0,0,0.4)",
                border: "1px solid rgba(255,194,75,0.2)",
              }}
            >
              <img
                src="/arcade-jacket-swag-2026.jpg"
                alt="Arcade Weather-Shield Jacket"
                className="w-full object-cover object-center"
                style={{ display: "block", height: "105px" }}
              />
              {/* Vignette */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    "linear-gradient(135deg,rgba(0,0,0,0.25) 0%,transparent 60%,rgba(0,0,0,0.15) 100%)",
                }}
              />
            </div>
          </div>

          {/* ── Text content ─────────────────────────────────────── */}
          <div className="flex-1 min-w-0 space-y-3">
            <div>
              <h2
                className="font-display text-base font-bold leading-snug"
                style={{
                  background: "linear-gradient(90deg,#ffc24b 0%,#ff6fb3 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Arcade Weather-Shield Jacket
              </h2>
              <p className="text-mist-muted text-[11px] mt-0.5">
                For{" "}
                <span className="text-amber font-semibold">Arcade Champion</span>
                {" "}&amp;{" "}
                <span className="text-pink font-semibold">Arcade Legend</span>
                {" "}tier achievers · 95+ pts
              </p>
            </div>

            <p className="text-[11px] text-mist-muted leading-relaxed">
              You didn&apos;t reach the top by waiting—you built through the storm. Kick off 2026 with
              the ultimate weather barrier. Throw it on for your commute or wear it to work — it&apos;s
              a flex you actually earned.
            </p>

            {/* 5 feature pills */}
            <div className="flex flex-wrap gap-1.5">
              {JACKET_FEATURES.map((f) => (
                <span
                  key={f.label}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold ${f.color}`}
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.09)" }}
                >
                  <Icon name={f.icon} className="w-2.5 h-2.5" />
                  {f.label}
                </span>
              ))}
            </div>

            {/* CTA */}
            <div className="flex items-center gap-3 pt-1">
              <a
                href="https://discuss.google.dev/t/swag-drop-the-arcade-weather-shield-jacket/397353"
                target="_blank"
                rel="noopener noreferrer"
                id="swag-read-drop-link"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-all duration-200 hover:scale-[1.04] active:scale-[0.97]"
                style={{
                  background: "linear-gradient(135deg,#ffc24b 0%,#ff6fb3 100%)",
                  color: "#05060f",
                  boxShadow: "0 2px 10px rgba(255,194,75,0.3)",
                }}
              >
                Official Announcement <ExternalLink className="w-2.5 h-2.5" />
              </a>
              <span className="text-[10px] text-mist-muted">
                🚀 Every badge gets you closer!
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          CHAMPION SWAG CARD
      ══════════════════════════════════════════════════════════════ */}
      <div
        className="glass-strong rounded-2xl border overflow-hidden"
        style={{ borderColor: "rgba(255,194,75,0.25)" }}
        id="swag-champion-card"
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-3"
          style={{
            background: "linear-gradient(90deg,rgba(255,194,75,0.1) 0%,rgba(255,111,179,0.06) 100%)",
            borderBottom: "1px solid rgba(255,194,75,0.15)",
          }}
        >
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🏆</span>
            <div>
              <p className="text-[12px] font-bold text-amber">Arcade Champion</p>
              <p className="text-[10px] text-mist-muted">95 pts · 3,000 spots available</p>
            </div>
          </div>
          <div
            className="flex flex-col items-end gap-0.5"
          >
            <span
              className="text-[9px] px-2 py-0.5 rounded-full font-semibold text-amber"
              style={{ background: "rgba(255,194,75,0.12)", border: "1px solid rgba(255,194,75,0.25)" }}
            >
              {isChampion ? "✓ Your Tier" : isLegend ? "✓ Included" : "95+ pts"}
            </span>
          </div>
        </div>

        {/* Swag list */}
        <div className="px-5 py-4 space-y-2.5">
          <p className="text-[10px] text-mist-muted mb-3">
            Reaching Champion Tier unlocks a high-tier collection of premium Google Skills Arcade gear:
          </p>
          {CHAMPION_SWAGS.map((item) => (
            <div
              key={item.name}
              className="flex items-start gap-3 p-3 rounded-xl"
              style={{
                background: item.highlight
                  ? "linear-gradient(90deg,rgba(255,194,75,0.1) 0%,rgba(255,111,179,0.08) 100%)"
                  : "rgba(255,255,255,0.03)",
                border: item.highlight
                  ? "1px solid rgba(255,194,75,0.25)"
                  : "1px solid rgba(255,255,255,0.06)",
              }}
            >
              {/* Thumbnail for jacket item */}
              {item.highlight ? (
                <div
                  className="relative overflow-hidden rounded-lg shrink-0"
                  style={{
                    width: "48px",
                    height: "36px",
                    border: "1px solid rgba(255,194,75,0.3)",
                  }}
                >
                  <img
                    src="/arcade-jacket-swag-2026.jpg"
                    alt="Jacket"
                    className="w-full h-full object-cover object-center"
                  />
                </div>
              ) : (
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                  style={{
                    background: "rgba(255,194,75,0.1)",
                    border: "1px solid rgba(255,194,75,0.2)",
                  }}
                >
                  <Icon name={item.icon} className="w-4 h-4 text-amber" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className={`text-[11px] font-semibold ${item.highlight ? "text-amber" : "text-mist"}`}>
                  {item.name}
                </p>
                <p className="text-[10px] text-mist-muted mt-0.5">{item.note}</p>
              </div>
              {item.highlight && (
                <span className="shrink-0 text-[9px] text-amber font-bold">⭐ DROP #1</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          LEGEND SWAG CARD
      ══════════════════════════════════════════════════════════════ */}
      <div
        className="glass-strong rounded-2xl border overflow-hidden"
        style={{ borderColor: "rgba(255,111,179,0.25)" }}
        id="swag-legend-card"
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-3"
          style={{
            background: "linear-gradient(90deg,rgba(255,111,179,0.1) 0%,rgba(179,137,255,0.08) 100%)",
            borderBottom: "1px solid rgba(255,111,179,0.15)",
          }}
        >
          <div className="flex items-center gap-2.5">
            <span className="text-xl">👑</span>
            <div>
              <p className="text-[12px] font-bold text-pink">Arcade Legend</p>
              <p className="text-[10px] text-mist-muted">120 pts · 2,500 spots available</p>
            </div>
          </div>
          <div>
            <span
              className="text-[9px] px-2 py-0.5 rounded-full font-semibold text-pink"
              style={{ background: "rgba(255,111,179,0.12)", border: "1px solid rgba(255,111,179,0.25)" }}
            >
              {isLegend ? "✓ Your Tier" : "120+ pts"}
            </span>
          </div>
        </div>

        {/* Snowball note */}
        <div
          className="mx-5 mt-4 px-3 py-2 rounded-lg text-[10px] text-mist-muted leading-relaxed"
          style={{ background: "rgba(255,111,179,0.06)", border: "1px solid rgba(255,111,179,0.12)" }}
        >
          ❄️{" "}
          <span className="text-pink font-semibold">Snowball:</span> Legend includes everything from
          Champion Tier <span className="font-semibold">plus</span> these exclusive Legend-only rewards:
        </div>

        {/* Swag list */}
        <div className="px-5 py-4 space-y-2.5">
          {LEGEND_SWAGS.map((item) => (
            <div
              key={item.name}
              className="flex items-start gap-3 p-3 rounded-xl"
              style={{
                background: item.exclusive
                  ? "linear-gradient(90deg,rgba(255,111,179,0.1) 0%,rgba(179,137,255,0.08) 100%)"
                  : item.highlight
                    ? "linear-gradient(90deg,rgba(255,194,75,0.08) 0%,rgba(255,111,179,0.06) 100%)"
                    : "rgba(255,255,255,0.03)",
                border: item.exclusive
                  ? "1px solid rgba(255,111,179,0.25)"
                  : item.highlight
                    ? "1px solid rgba(255,194,75,0.2)"
                    : "1px solid rgba(255,255,255,0.06)",
              }}
            >
              {/* Thumbnail for jacket */}
              {item.highlight ? (
                <div
                  className="relative overflow-hidden rounded-lg shrink-0"
                  style={{
                    width: "48px",
                    height: "36px",
                    border: "1px solid rgba(255,194,75,0.3)",
                  }}
                >
                  <img
                    src="/arcade-jacket-swag-2026.jpg"
                    alt="Jacket"
                    className="w-full h-full object-cover object-center"
                  />
                </div>
              ) : (
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                  style={{
                    background: item.exclusive
                      ? "rgba(255,111,179,0.12)"
                      : "rgba(255,194,75,0.08)",
                    border: item.exclusive
                      ? "1px solid rgba(255,111,179,0.25)"
                      : "1px solid rgba(255,194,75,0.15)",
                  }}
                >
                  <Icon
                    name={item.icon}
                    className={`w-4 h-4 ${item.exclusive ? "text-pink" : "text-amber"}`}
                  />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p
                  className={`text-[11px] font-semibold ${
                    item.exclusive ? "text-pink" : item.highlight ? "text-amber" : "text-mist"
                  }`}
                >
                  {item.name}
                </p>
                <p className="text-[10px] text-mist-muted mt-0.5">{item.note}</p>
              </div>
              {item.exclusive && (
                <span className="shrink-0 text-[9px] text-pink font-bold">👑 LEGEND</span>
              )}
              {item.highlight && !item.exclusive && (
                <span className="shrink-0 text-[9px] text-amber font-bold">⭐ DROP #1</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          SNOWBALL TIER SYSTEM ACCORDION
      ══════════════════════════════════════════════════════════════ */}
      <div
        className="glass rounded-2xl overflow-hidden"
        style={{ border: "1px solid rgba(255,255,255,0.07)" }}
      >
        <button
          id="swag-snowball-toggle"
          onClick={() => setSnowballOpen((v) => !v)}
          className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-white/5 transition-colors duration-150"
          style={{ background: "rgba(255,255,255,0.03)" }}
        >
          <span className="text-xs font-semibold text-mist flex items-center gap-2">
            <span>❄️</span> Snowball Prize Tier System — how rewards stack up
          </span>
          {snowballOpen ? (
            <ChevronUp className="w-4 h-4 text-mist-muted" />
          ) : (
            <ChevronDown className="w-4 h-4 text-mist-muted" />
          )}
        </button>

        {snowballOpen && (
          <div className="px-5 pb-5 pt-2 space-y-3">
            <p className="text-[10px] text-mist-muted leading-relaxed">
              Think of it like a{" "}
              <span className="text-cyan font-semibold">&ldquo;Snowball&rdquo;</span> — you never
              have to pick and choose. Ranking up rolls your rewards forward and adds more.{" "}
              <span className="text-amber font-medium">
                Note: Trooper &amp; Ranger prizes won&apos;t snowball into Champion &amp; Legend.
              </span>
            </p>
            <div className="space-y-2">
              {TIERS.map((tier, idx) => {
                const unlocked = userPoints >= tier.pts;
                return (
                  <div
                    key={tier.name}
                    className={`flex items-start gap-3 p-3 rounded-xl border transition-opacity ${tier.border} ${unlocked ? "opacity-100" : "opacity-50"}`}
                    style={{ background: `rgba(255,255,255,0.03)` }}
                  >
                    <div className="flex flex-col items-center gap-1 shrink-0 pt-0.5">
                      <span className="text-base leading-none">{tier.emoji}</span>
                      {idx < TIERS.length - 1 && (
                        <div className={`w-0.5 h-4 rounded-full ${tier.dot} opacity-30`} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[11px] font-bold ${tier.color}`}>{tier.name}</span>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded-full ${tier.color}`}
                          style={{ background: "rgba(255,255,255,0.07)" }}
                        >
                          {tier.pts} pts
                        </span>
                        {unlocked && (
                          <span className="text-[9px] font-semibold" style={{ color: "#4ade80" }}>
                            ✓ Unlocked
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-mist-muted leading-relaxed mt-0.5">
                        {tier.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
