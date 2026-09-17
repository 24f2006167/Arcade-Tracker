"use client";

import { useState } from "react";
import { ExternalLink } from "lucide-react";

/* ─── Tier definitions ───────────────────────────────────────────────────── */
const TIERS = [
  {
    id: "trooper",
    name: "Arcade Trooper",
    label: "Trooper",
    pts: 50,
    emoji: "🛡️",
    color: "#22e5e5",
    glow: "rgba(34,229,229,0.18)",
    border: "rgba(34,229,229,0.25)",
    stripeBg: "rgba(34,229,229,0.06)",
    badge: "rgba(34,229,229,0.15)",
    spots: 6000,
  },
  {
    id: "ranger",
    name: "Arcade Ranger",
    label: "Ranger",
    pts: 75,
    emoji: "🏹",
    color: "#b389ff",
    glow: "rgba(179,137,255,0.18)",
    border: "rgba(179,137,255,0.25)",
    stripeBg: "rgba(179,137,255,0.06)",
    badge: "rgba(179,137,255,0.15)",
    spots: 4000,
  },
  {
    id: "champion",
    name: "Arcade Champion",
    label: "Champion",
    pts: 95,
    emoji: "🏆",
    color: "#ffc24b",
    glow: "rgba(255,194,75,0.18)",
    border: "rgba(255,194,75,0.25)",
    stripeBg: "rgba(255,194,75,0.06)",
    badge: "rgba(255,194,75,0.15)",
    spots: 3000,
  },
  {
    id: "legend",
    name: "Arcade Legend",
    label: "Legend",
    pts: 120,
    emoji: "👑",
    color: "#ff6fb3",
    glow: "rgba(255,111,179,0.18)",
    border: "rgba(255,111,179,0.25)",
    stripeBg: "rgba(255,111,179,0.06)",
    badge: "rgba(255,111,179,0.15)",
    spots: 2500,
  },
];

/* ─── Swag catalog ───────────────────────────────────────────────────────── */
const SWAG_CATALOG = [
  {
    id: "jacket",
    name: "Arcade Weather-Shield Jacket",
    image: "/arcade-jacket-swag-2026.jpg",
    revealedOn: "15 September 2026",
    tiers: ["champion", "legend"],
    drop: "Drop #1",
    link: "https://discuss.google.dev/t/swag-drop-the-arcade-weather-shield-jacket/397353",
    isNew: true,
    desc: "Storm-ready tech jacket with Google Cloud branding. Built for Champions and Legends.",
  },
  {
    id: "trooper-pack",
    name: "Arcade Trooper Pack",
    image: null,
    revealedOn: "TBA",
    tiers: ["trooper"],
    drop: "Core Pack",
    link: null,
    isNew: false,
    desc: "Essential Google Skills Arcade gear for reaching the Trooper milestone.",
  },
  {
    id: "ranger-pack",
    name: "Arcade Ranger Pack",
    image: null,
    revealedOn: "TBA",
    tiers: ["ranger"],
    drop: "Bonus Pack",
    link: null,
    isNew: false,
    desc: "Trooper Pack rewards + exclusive Ranger bonus reward on top.",
  },
  {
    id: "legend-exclusive",
    name: "Legend Exclusive Reward",
    image: null,
    revealedOn: "TBA",
    tiers: ["legend"],
    drop: "Legend Only",
    link: null,
    isNew: false,
    desc: "Reserved exclusively for users who reach the very top of the leaderboard.",
  },
];

interface Props {
  currentTierName?: string | null;
  userPoints?: number;
}

export function SwagDropBanner({ currentTierName, userPoints = 0 }: Props) {
  const [activeFilter, setActiveFilter] = useState<string>("all");

  const tierById = (id: string) => TIERS.find((t) => t.id === id)!;

  const filteredSwags =
    activeFilter === "all"
      ? SWAG_CATALOG
      : SWAG_CATALOG.filter((s) => s.tiers.includes(activeFilter));

  const userTierId = (() => {
    if (currentTierName === "Arcade Legend") return "legend";
    if (currentTierName === "Arcade Champion") return "champion";
    if (currentTierName === "Arcade Ranger") return "ranger";
    if (currentTierName === "Arcade Trooper") return "trooper";
    return null;
  })();

  return (
    <div className="space-y-5">

      {/* ══════════════════════════════════════════════════════════════
          SECTION HEADER
      ══════════════════════════════════════════════════════════════ */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-base"
            style={{ background: "linear-gradient(135deg,rgba(255,194,75,0.2) 0%,rgba(255,111,179,0.2) 100%)", border: "1px solid rgba(255,194,75,0.3)" }}
          >
            🎁
          </div>
          <div>
            <h2 className="font-display text-sm font-bold text-mist uppercase tracking-widest">
              Season Prizes &amp; Swags
            </h2>
            <p className="text-[10px] text-mist-muted mt-0.5">2026 · First-come, first-served waterfall system</p>
          </div>
        </div>
        <span
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase"
          style={{
            background: "linear-gradient(135deg,rgba(255,194,75,0.15),rgba(255,111,179,0.15))",
            border: "1px solid rgba(255,194,75,0.4)",
            color: "#ffc24b",
          }}
        >
          ✦ Drop #1 Live
        </span>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          TIER CARDS ROW
      ══════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {TIERS.map((tier) => {
          const unlocked = userPoints >= tier.pts;
          const isCurrent = userTierId === tier.id;

          return (
            <div
              key={tier.id}
              className="relative rounded-2xl overflow-hidden transition-all duration-200 hover:-translate-y-0.5"
              style={{
                border: `1px solid ${isCurrent ? tier.color : tier.border}`,
                boxShadow: isCurrent ? `0 0 20px ${tier.glow}` : "none",
                background: "rgba(255,255,255,0.03)",
              }}
            >
              {/* Diagonal stripe background */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundImage: `repeating-linear-gradient(
                    -45deg,
                    ${tier.stripeBg} 0px,
                    ${tier.stripeBg} 4px,
                    transparent 4px,
                    transparent 14px
                  )`,
                }}
              />

              {/* Unlocked glow top bar */}
              {unlocked && (
                <div
                  className="absolute top-0 left-0 right-0 h-0.5"
                  style={{ background: `linear-gradient(90deg, transparent, ${tier.color}, transparent)` }}
                />
              )}

              <div className="relative flex items-center gap-3 px-4 py-4">
                {/* Emoji icon in white card */}
                <div
                  className="shrink-0 w-14 h-14 rounded-xl flex items-center justify-center text-2xl"
                  style={{
                    background: "rgba(255,255,255,0.08)",
                    border: `1px solid ${tier.border}`,
                    boxShadow: `0 2px 12px ${tier.glow}`,
                  }}
                >
                  {tier.emoji}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-bold" style={{ color: tier.color }}>
                    {tier.name}
                  </p>

                  {/* PTS badge */}
                  <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                    <span
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider"
                      style={{
                        background: tier.badge,
                        border: `1px solid ${tier.border}`,
                        color: tier.color,
                      }}
                    >
                      {tier.pts} pts required
                    </span>
                    {unlocked && (
                      <span className="text-[9px] font-semibold" style={{ color: "#4ade80" }}>
                        ✓ Unlocked
                      </span>
                    )}
                  </div>

                  <p className="text-[9px] text-mist-muted mt-1">
                    {tier.spots.toLocaleString()} spots
                  </p>
                </div>

                {/* Crown for current tier */}
                {isCurrent && (
                  <div
                    className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center text-[10px]"
                    style={{ background: tier.badge, border: `1px solid ${tier.border}` }}
                  >
                    ★
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ══════════════════════════════════════════════════════════════
          FILTER TABS
      ══════════════════════════════════════════════════════════════ */}
      <div className="flex items-center gap-2 flex-wrap">
        {[{ id: "all", label: "All Tiers" }, ...TIERS.map((t) => ({ id: t.id, label: t.label }))].map((tab) => {
          const tier = TIERS.find((t) => t.id === tab.id);
          const isActive = activeFilter === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className="px-3.5 py-1.5 rounded-full text-[11px] font-semibold transition-all duration-200"
              style={{
                background: isActive
                  ? tab.id === "all"
                    ? "linear-gradient(135deg,#ffc24b,#ff6fb3)"
                    : tier?.color
                  : "rgba(255,255,255,0.06)",
                color: isActive ? (tab.id === "all" ? "#05060f" : "#05060f") : "rgba(255,255,255,0.55)",
                border: isActive
                  ? "1px solid transparent"
                  : "1px solid rgba(255,255,255,0.1)",
                boxShadow: isActive && tier ? `0 2px 10px ${tier.glow}` : "none",
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ══════════════════════════════════════════════════════════════
          SWAG CARDS GRID
      ══════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredSwags.map((item) => {
          const primaryTier = tierById(item.tiers[0]);

          return (
            <div
              key={item.id}
              className="glass-strong rounded-2xl overflow-hidden flex flex-col transition-all duration-200 hover:-translate-y-1"
              style={{
                border: `1px solid rgba(255,255,255,0.07)`,
                boxShadow: item.isNew ? `0 0 24px rgba(255,194,75,0.12)` : "none",
              }}
            >
              {/* Image area */}
              <div
                className="relative overflow-hidden"
                style={{
                  height: "160px",
                  background: "linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)",
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover object-center transition-transform duration-500 hover:scale-105"
                  />
                ) : (
                  /* Placeholder for unrevealed swags */
                  <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl"
                      style={{
                        background: primaryTier.badge,
                        border: `1px solid ${primaryTier.border}`,
                      }}
                    >
                      {primaryTier.emoji}
                    </div>
                    <span className="text-[10px] text-mist-muted font-medium">Coming soon</span>
                  </div>
                )}

                {/* New badge */}
                {item.isNew && (
                  <div
                    className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest"
                    style={{
                      background: "linear-gradient(135deg,#ffc24b,#ff6fb3)",
                      color: "#05060f",
                    }}
                  >
                    ✦ New
                  </div>
                )}

                {/* Drop label top right */}
                <div
                  className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full text-[9px] font-semibold"
                  style={{
                    background: "rgba(0,0,0,0.5)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "rgba(255,255,255,0.7)",
                    backdropFilter: "blur(6px)",
                  }}
                >
                  {item.drop}
                </div>
              </div>

              {/* Card body */}
              <div className="flex flex-col gap-2.5 p-4 flex-1">
                {/* Reveal date */}
                <p className="text-[9px] text-mist-muted">
                  {item.revealedOn === "TBA" ? "🔒 Not yet revealed" : `Revealed on ${item.revealedOn}`}
                </p>

                {/* Name */}
                <p className="text-[12px] font-bold text-mist leading-snug">{item.name}</p>

                {/* Description */}
                <p className="text-[10px] text-mist-muted leading-relaxed flex-1">
                  {item.desc}
                </p>

                {/* Tier tags */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {item.tiers.map((tid) => {
                    const t = tierById(tid);
                    return (
                      <span
                        key={tid}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold"
                        style={{
                          background: t.badge,
                          border: `1px solid ${t.border}`,
                          color: t.color,
                        }}
                      >
                        {t.emoji} {t.label}
                      </span>
                    );
                  })}
                </div>

                {/* CTA */}
                {item.link ? (
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 w-full flex items-center justify-between px-3 py-2 rounded-xl text-[11px] font-semibold transition-all duration-150 hover:bg-white/10 group"
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "rgba(255,255,255,0.8)",
                    }}
                  >
                    Swag Drop
                    <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </a>
                ) : (
                  <div
                    className="mt-1 w-full flex items-center justify-between px-3 py-2 rounded-xl text-[11px] font-medium"
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      color: "rgba(255,255,255,0.3)",
                    }}
                  >
                    <span>To be revealed</span>
                    <span>🔒</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ══════════════════════════════════════════════════════════════
          SNOWBALL NOTE
      ══════════════════════════════════════════════════════════════ */}
      <div
        className="flex items-start gap-3 px-4 py-3 rounded-xl"
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <span className="text-base shrink-0">❄️</span>
        <p className="text-[10px] text-mist-muted leading-relaxed">
          <span className="text-cyan font-semibold">Snowball System:</span> You never lose rewards
          when you rank up — each tier includes everything from the previous tier plus more. 
          Reaching Legend Tier gives you the complete Champion pack plus exclusive Legend-only rewards.{" "}
          <span className="text-amber font-medium">
            Note: Trooper &amp; Ranger prizes don&apos;t snowball into Champion &amp; Legend tiers.
          </span>
        </p>
      </div>
    </div>
  );
}
