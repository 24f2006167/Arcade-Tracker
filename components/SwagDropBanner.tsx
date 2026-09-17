"use client";

import { useState } from "react";
import { ExternalLink, RotateCcw, Search } from "lucide-react";

/* ─── Tier config ────────────────────────────────────────────────────────── */
const TIERS = [
  { id: "trooper",  label: "Trooper",  name: "Arcade Trooper",  pts: 50,  emoji: "🛡️", color: "#22e5e5", glow: "rgba(34,229,229,0.18)",   border: "rgba(34,229,229,0.3)",   bg: "rgba(34,229,229,0.08)",   pill: "rgba(34,229,229,0.15)",  stripe: "rgba(34,229,229,0.055)", spots: 6000 },
  { id: "ranger",   label: "Ranger",   name: "Arcade Ranger",   pts: 75,  emoji: "🏹", color: "#b389ff", glow: "rgba(179,137,255,0.18)",  border: "rgba(179,137,255,0.3)",  bg: "rgba(179,137,255,0.08)",  pill: "rgba(179,137,255,0.15)", stripe: "rgba(179,137,255,0.055)", spots: 4000 },
  { id: "champion", label: "Champion", name: "Arcade Champion", pts: 95,  emoji: "🏆", color: "#ffc24b", glow: "rgba(255,194,75,0.18)",   border: "rgba(255,194,75,0.3)",   bg: "rgba(255,194,75,0.08)",   pill: "rgba(255,194,75,0.15)",  stripe: "rgba(255,194,75,0.055)",  spots: 3000 },
  { id: "legend",   label: "Legend",   name: "Arcade Legend",   pts: 120, emoji: "👑", color: "#ff6fb3", glow: "rgba(255,111,179,0.18)",  border: "rgba(255,111,179,0.3)",  bg: "rgba(255,111,179,0.08)",  pill: "rgba(255,111,179,0.15)", stripe: "rgba(255,111,179,0.055)", spots: 2500 },
];

/* ─── Swag catalog ───────────────────────────────────────────────────────── */
const SWAG_CATALOG = [
  {
    id: "jacket",
    name: "The Arcade Weather-Shield Jacket",
    image: "/arcade-jacket-swag-2026.jpg",
    revealedOn: "September 15, 2026",
    tiers: ["champion", "legend"],
    link: "https://discuss.google.dev/t/swag-drop-the-arcade-weather-shield-jacket/397353",
    isNew: true,
  },
  {
    id: "coming-soon",
    name: "Exciting Prizes Ahead!",
    image: "/more-swags-dropping-soon.jpg",
    revealedOn: null,
    tiers: ["trooper", "ranger", "champion", "legend"],
    link: null,
    isNew: false,
  },
];

/* ─── Tier tag pill ─────────────────────────────────────────────────────── */
function TierTag({ id }: { id: string }) {
  const t = TIERS.find((x) => x.id === id)!;
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold"
      style={{ background: t.pill, border: `1px solid ${t.border}`, color: t.color }}
    >
      {t.label}
    </span>
  );
}

interface Props {
  currentTierName?: string | null;
  userPoints?: number;
}

export function SwagDropBanner({ currentTierName, userPoints = 0 }: Props) {
  const [activeFilter, setActiveFilter] = useState<string>("all");

  const userTierId = (() => {
    if (currentTierName === "Arcade Legend")   return "legend";
    if (currentTierName === "Arcade Champion") return "champion";
    if (currentTierName === "Arcade Ranger")   return "ranger";
    if (currentTierName === "Arcade Trooper")  return "trooper";
    return null;
  })();

  const filteredSwags = activeFilter === "all"
    ? SWAG_CATALOG
    : SWAG_CATALOG.filter((s) => s.tiers.includes(activeFilter));

  /* The "coming soon" card always shows in All Tiers; hide it if a specific tier
     filter is applied and no real swag exists for that tier — it's a wildcard. */
  const visibleSwags = filteredSwags.filter((s) =>
    s.id !== "coming-soon" || activeFilter === "all" || s.tiers.includes(activeFilter)
  );

  const realCount = visibleSwags.filter((s) => s.id !== "coming-soon").length;

  return (
    <div className="space-y-5">

      {/* ══════════════════════════════════════════════════════════════
          SECTION HEADER
      ══════════════════════════════════════════════════════════════ */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0"
            style={{ background: "linear-gradient(135deg,rgba(255,194,75,0.2),rgba(255,111,179,0.2))", border: "1px solid rgba(255,194,75,0.3)" }}
          >
            🎁
          </div>
          <div>
            <h2 className="font-display text-sm font-bold text-mist uppercase tracking-widest">
              Season Prizes &amp; Swags
            </h2>
            <p className="text-[10px] text-mist-muted mt-0.5">2026 · First-come, first-served</p>
          </div>
        </div>
        <span
          className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-bold tracking-widest uppercase"
          style={{ background: "linear-gradient(135deg,rgba(255,194,75,0.15),rgba(255,111,179,0.15))", border: "1px solid rgba(255,194,75,0.4)", color: "#ffc24b" }}
        >
          ✦ Drop #1 Live
        </span>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          TIER CARDS
      ══════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {TIERS.map((tier) => {
          const unlocked = userPoints >= tier.pts;
          const isCurrent = userTierId === tier.id;
          return (
            <div
              key={tier.id}
              className="relative rounded-2xl overflow-hidden transition-all duration-200 hover:-translate-y-0.5"
              style={{
                border: `1px solid ${isCurrent ? tier.color : tier.border}`,
                boxShadow: isCurrent ? `0 0 18px ${tier.glow}` : "none",
                background: "rgba(255,255,255,0.03)",
              }}
            >
              {/* Diagonal stripes */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundImage: `repeating-linear-gradient(-45deg, ${tier.stripe} 0px, ${tier.stripe} 3px, transparent 3px, transparent 13px)`,
                }}
              />
              {/* Top accent line when unlocked */}
              {unlocked && (
                <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: `linear-gradient(90deg,transparent,${tier.color},transparent)` }} />
              )}
              {isCurrent && (
                <div
                  className="absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center text-[10px]"
                  style={{ background: tier.pill, border: `1px solid ${tier.border}`, color: tier.color }}
                >★</div>
              )}
              <div className="relative flex items-center gap-3 px-4 py-4">
                <div
                  className="shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                  style={{ background: "rgba(255,255,255,0.07)", border: `1px solid ${tier.border}` }}
                >
                  {tier.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold leading-tight" style={{ color: tier.color }}>{tier.name}</p>
                  <div className="mt-1.5 flex flex-col gap-1">
                    <span
                      className="inline-flex self-start items-center px-1.5 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider"
                      style={{ background: tier.pill, border: `1px solid ${tier.border}`, color: tier.color }}
                    >
                      {tier.pts} pts required
                    </span>
                    {unlocked
                      ? <span className="text-[9px] font-semibold" style={{ color: "#4ade80" }}>✓ Unlocked</span>
                      : <span className="text-[9px] text-mist-muted">{tier.spots.toLocaleString()} spots</span>
                    }
                  </div>
                </div>
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
              className="px-4 py-2 rounded-full text-[11px] font-semibold transition-all duration-200 hover:scale-[1.03]"
              style={{
                background: isActive
                  ? tab.id === "all" ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : tier?.color
                  : "rgba(255,255,255,0.06)",
                color: isActive ? "#ffffff" : "rgba(255,255,255,0.5)",
                border: isActive ? "1px solid transparent" : "1px solid rgba(255,255,255,0.1)",
                boxShadow: isActive && tier ? `0 2px 12px ${tier.glow}` : isActive ? "0 2px 12px rgba(99,102,241,0.3)" : "none",
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Count line */}
      <p className="text-[11px] text-mist-muted">
        Showing <span className="font-bold text-mist">{realCount}</span> swag item{realCount !== 1 ? "s" : ""}
      </p>

      {/* ══════════════════════════════════════════════════════════════
          SWAG CARDS
      ══════════════════════════════════════════════════════════════ */}
      {visibleSwags.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <Search className="w-7 h-7 text-mist-muted" />
          </div>
          <div className="text-center space-y-1">
            <p className="text-base font-bold text-mist">No Swag Found</p>
            <p className="text-[11px] text-mist-muted max-w-xs leading-relaxed">
              We couldn&apos;t find any swag matching your filters. Try adjusting your filter criteria.
            </p>
          </div>
          <button
            onClick={() => setActiveFilter("all")}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[11px] font-bold transition-all duration-200 hover:scale-[1.03]"
            style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "#ffffff", boxShadow: "0 2px 12px rgba(99,102,241,0.35)" }}
          >
            <RotateCcw className="w-3.5 h-3.5" /> Clear All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {visibleSwags.map((item) => (
            <div
              key={item.id}
              className="glass-strong rounded-2xl overflow-hidden flex flex-col transition-all duration-250 hover:-translate-y-1 hover:shadow-xl"
              style={{
                border: "1px solid rgba(255,255,255,0.08)",
                boxShadow: item.isNew ? "0 0 28px rgba(255,194,75,0.1)" : "none",
              }}
            >
              {/* ── Image ── */}
              <div className="relative overflow-hidden" style={{ height: "200px" }}>
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover object-center transition-transform duration-500 hover:scale-105"
                />
                {item.isNew && (
                  <div
                    className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest"
                    style={{ background: "linear-gradient(135deg,#ffc24b,#ff6fb3)", color: "#05060f" }}
                  >
                    ✦ New
                  </div>
                )}
              </div>

              {/* ── Body ── */}
              <div className="flex flex-col gap-3 p-4 flex-1">
                {/* Date / label */}
                <p className="text-[10px] text-mist-muted">
                  {item.revealedOn ? `Revealed on ${item.revealedOn}` : "Stay tuned!"}
                </p>

                {/* Title */}
                <p className="text-[13px] font-bold text-mist leading-snug">{item.name}</p>

                {/* Tier tags */}
                <div className="flex items-center gap-1.5 flex-wrap flex-1">
                  {item.id === "coming-soon"
                    ? <TierTag id="trooper" />
                    : item.tiers.map((tid) => <TierTag key={tid} id={tid} />)
                  }
                  {item.id === "coming-soon" && (
                    <span
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold text-mist-muted"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                    >
                      All Tiers
                    </span>
                  )}
                </div>

                {/* CTA */}
                {item.link ? (
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[12px] font-bold transition-all duration-200 hover:opacity-90 hover:scale-[1.02]"
                    style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "#ffffff", boxShadow: "0 2px 12px rgba(99,102,241,0.35)" }}
                  >
                    Swag Drop <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                ) : (
                  <div
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[12px] font-semibold"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.35)" }}
                  >
                    ⏳ Dropping Soon
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          SNOWBALL FOOTNOTE
      ══════════════════════════════════════════════════════════════ */}
      <div
        className="flex items-start gap-2.5 px-4 py-3 rounded-xl text-[10px] text-mist-muted leading-relaxed"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
      >
        <span className="shrink-0 text-sm">❄️</span>
        <span>
          <span className="text-cyan font-semibold">Snowball System:</span> Ranking up rolls all your previous tier rewards forward and adds more on top.{" "}
          <span className="text-amber font-medium">Trooper &amp; Ranger prizes don&apos;t snowball into Champion &amp; Legend tiers.</span>
        </span>
      </div>
    </div>
  );
}
