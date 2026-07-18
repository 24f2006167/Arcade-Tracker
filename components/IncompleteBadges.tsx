"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search, Gamepad2, Wrench, Brain, ExternalLink,
  Copy, CheckCheck, Zap, Clock, XCircle, RefreshCw,
} from "lucide-react";
import { CATALOG_BADGES, ARCADE_GAMES } from "@/lib/catalog";
import type { CatalogBadge } from "@/lib/catalog";
import type { Badge } from "@/lib/scraper";

interface IncompleteBadgesProps {
  completedBadges: Badge[];
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function normalize(t: string) {
  return t.toLowerCase().replace(/[^a-z0-9]/g, "").trim();
}

function isExpired(endDate?: string): boolean {
  if (!endDate) return false;
  return new Date(endDate) < new Date();
}

function getTimeRemaining(endDate?: string): { expired: boolean; label: string; urgent: boolean } {
  if (!endDate) return { expired: false, label: "", urgent: false };
  const now = new Date();
  const end = new Date(endDate);
  const ms = end.getTime() - now.getTime();
  if (ms <= 0) return { expired: true, label: "Expired", urgent: false };
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
  if (days > 0) return { expired: false, label: `${days}d ${hours}h left`, urgent: days <= 3 };
  const mins = Math.floor((ms / (1000 * 60)) % 60);
  return { expired: false, label: `${hours}h ${mins}m left`, urgent: true };
}

// ─── Copy button ─────────────────────────────────────────────────────────────

function CopyCodeButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    try { await navigator.clipboard.writeText(code); }
    catch {
      const el = document.createElement("textarea");
      el.value = code; document.body.appendChild(el); el.select();
      document.execCommand("copy"); document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="flex items-center gap-1.5 mt-1.5">
      <code className="flex-1 text-[9px] bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-cyan font-mono tracking-wide truncate">
        {code}
      </code>
      <button
        onClick={handleCopy}
        className={`shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-medium transition-all duration-200 cursor-pointer border ${
          copied
            ? "bg-amber/20 border-amber/40 text-amber"
            : "bg-white/5 border-white/10 hover:bg-cyan/10 hover:border-cyan/30 text-mist-muted hover:text-cyan"
        }`}
      >
        {copied ? <><CheckCheck className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
      </button>
    </div>
  );
}

// ─── Countdown chip ───────────────────────────────────────────────────────────

function CountdownChip({ endDate }: { endDate?: string }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);
  const { expired, label, urgent } = getTimeRemaining(endDate);
  if (!endDate || expired) return null;
  return (
    <div className={`flex items-center gap-1 text-[9px] font-medium px-2 py-0.5 rounded-full border ${
      urgent
        ? "bg-red-500/15 border-red-500/30 text-red-400"
        : "bg-white/5 border-white/15 text-mist-muted"
    }`}>
      <Clock className="w-2.5 h-2.5" />
      {label}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function IncompleteBadges({ completedBadges }: IncompleteBadgesProps) {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "skill" | "trivia">("all");
  const [showAll, setShowAll] = useState(false);

  // ── Live arcade games — SSE auto-stream ───────────────────────────────────
  const [liveGames, setLiveGames] = useState<CatalogBadge[] | null>(null);
  const [gamesSource, setGamesSource] = useState<"live" | "static-fallback" | "loading">("loading");
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  /** Manual refresh: clears cache and re-fetches immediately */
  const fetchLiveGames = useCallback(async () => {
    setGamesSource("loading");
    try {
      const res = await fetch("/api/arcade-games", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (Array.isArray(data.games) && data.games.length > 0) {
        setLiveGames(data.games);
        setGamesSource(data.source === "live" ? "live" : "static-fallback");
      } else {
        setLiveGames(null);
        setGamesSource("static-fallback");
      }
      setLastFetched(new Date());
    } catch {
      setLiveGames(null);
      setGamesSource("static-fallback");
      setLastFetched(new Date());
    }
  }, []);

  /** SSE subscription — auto-receives pushes every 30 min from the server */
  useEffect(() => {
    // Immediate one-shot fetch first so data appears without waiting for SSE handshake
    fetchLiveGames();

    if (typeof EventSource === "undefined") return; // SSR guard

    const es = new EventSource("/api/arcade-games/stream");

    es.addEventListener("games", (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        if (Array.isArray(data.games) && data.games.length > 0) {
          setLiveGames(data.games);
          setGamesSource(data.source === "live" ? "live" : "static-fallback");
          setLastFetched(new Date());
        }
      } catch { /* ignore parse errors */ }
    });

    es.onerror = () => {
      // SSE disconnected — fall back silently, keep showing last known data
      es.close();
    };

    return () => es.close();
  }, [fetchLiveGames]);

  /**
   * Merge strategy:
   * - Live fetch / SSE data wins.
   * - Otherwise fall back to the static ARCADE_GAMES catalog (filtered to active).
   */
  const now = new Date().toISOString();
  const staticActive = ARCADE_GAMES.filter((g) => !g.endDate || g.endDate > now);
  const effectiveGames: CatalogBadge[] =
    liveGames !== null ? liveGames : staticActive;

  const isSkillOrTriviaCompleted = (cb: CatalogBadge) => {
    const key = normalize(cb.title);
    return completedBadges.some((b) => {
      const ek = normalize(b.title);
      const exactOrPrefixMatches = ek === key || ek.startsWith(key) || key.startsWith(ek);
      if (exactOrPrefixMatches) return true;
      
      // Substring fallback for longer titles to handle prefixes/suffixes (e.g. "[Partner]" or "Challenge Lab")
      if (key.length > 15 && (ek.includes(key) || key.includes(ek))) {
        return true;
      }
      return false;
    });
  };

  /* Smart keyword prefix match with date validation: "Arcade Trail" matches "Arcade Trail: Data Engineering…" only if earned during the game's active month */
  const isGameCompleted = (game: CatalogBadge) => {
    const key = normalize(game.title);
    return completedBadges.some((b) => {
      const ek = normalize(b.title);
      const titleMatches = ek === key || ek.startsWith(key) || key.startsWith(ek);
      if (!titleMatches) return false;

      // If we have date constraints, verify the earned date falls within the game's range
      if (b.earnedDate && game.startDate) {
        const earnedTime = new Date(b.earnedDate).getTime();
        const startTime = new Date(game.startDate).getTime();
        const endTime = game.endDate ? new Date(game.endDate).getTime() : Infinity;
        if (earnedTime < startTime || earnedTime > endTime) {
          return false;
        }
      }
      return true;
    });
  };

  const getMatchedEarnedBadge = (game: CatalogBadge) => {
    const key = normalize(game.title);
    return completedBadges.find((b) => {
      const ek = normalize(b.title);
      const titleMatches = ek === key || ek.startsWith(key) || key.startsWith(ek);
      if (!titleMatches) return false;

      if (b.earnedDate && game.startDate) {
        const earnedTime = new Date(b.earnedDate).getTime();
        const startTime = new Date(game.startDate).getTime();
        const endTime = game.endDate ? new Date(game.endDate).getTime() : Infinity;
        if (earnedTime < startTime || earnedTime > endTime) {
          return false;
        }
      }
      return true;
    });
  };

  /* ── Partition games into 3 buckets ── */
  // All-time list for expired/completed detection (static catalog includes historical data)
  const allGames = ARCADE_GAMES;
  const completedGames  = allGames.filter((g) => isGameCompleted(g));
  const expiredGames    = allGames.filter((g) => !isGameCompleted(g) && isExpired(g.endDate));
  // Active: use live/merged effective list, not expired, not already completed
  const activeGames     = effectiveGames.filter((g) => !isGameCompleted(g) && !isExpired(g.endDate));

  /* ── Skill / trivia incomplete badges (exclude "game" type since games are handled at the top) ── */
  const incompleteSkills = CATALOG_BADGES.filter(
    (cb) => cb.type !== "game" && !isSkillOrTriviaCompleted(cb) && !isExpired(cb.endDate)
  );
  const searched = incompleteSkills.filter((b) =>
    b.title.toLowerCase().includes(search.toLowerCase())
  );
  const filtered = searched.filter((b) => activeTab === "all" || b.type === activeTab);
  const displayed = showAll ? filtered : filtered.slice(0, 6);

  const tabClass = (tab: typeof activeTab) =>
    `px-4 py-2 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
      activeTab === tab
        ? "bg-gradient-to-r from-cyan via-violet to-pink text-void shadow-lg shadow-violet/20"
        : "glass hover:bg-white/10 text-mist-muted"
    }`;

  return (
    <section className="space-y-10 rise-in">

      {/* ══ ARCADE GAMES ═════════════════════════════════════════════════════ */}
      <div className="space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-sm font-semibold text-mist flex items-center gap-2">
              <Gamepad2 className="w-4 h-4 text-pink" />
              Arcade Games
              {/* Live / loading indicator */}
              {gamesSource === "loading" ? (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[9px] text-mist-muted">
                  <RefreshCw className="w-2.5 h-2.5 animate-spin" /> Fetching live…
                </span>
              ) : gamesSource === "live" ? (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/15 border border-green-500/25 text-[9px] text-green-400 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  Live
                </span>
              ) : (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber/10 border border-amber/20 text-[9px] text-amber">
                  Cached
                </span>
              )}
            </h2>
            <p className="text-xs text-mist-muted mt-0.5">
              Each game badge = <span className="text-amber font-medium">1 Arcade Point</span>.
              Use the access code to enroll. Expires games are automatically removed.
              {lastFetched && (
                <span className="ml-2 opacity-50">
                  · Updated {lastFetched.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={fetchLiveGames}
              disabled={gamesSource === "loading"}
              title="Refresh live games"
              className="flex items-center gap-1 text-xs text-mist-muted hover:text-cyan transition-colors disabled:opacity-40 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${gamesSource === "loading" ? "animate-spin" : ""}`} />
            </button>
            <a href="https://go.cloudskillsboost.google/arcade" target="_blank" rel="noopener noreferrer"
              className="text-xs text-cyan hover:underline flex items-center gap-1">
              View all on Arcade <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* ── Active (incomplete) games ── */}
        {activeGames.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeGames.map((game, i) => (
              <div key={game.title}
                className="gradient-ring glass rounded-2xl overflow-hidden flex flex-col transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-pink/10 rise-in"
                style={{ animationDelay: `${i * 0.05}s` }}>
                {/* Image */}
                <div className="relative h-40 bg-gradient-to-br from-black/60 via-slate-900/80 to-black/60 overflow-hidden flex items-center justify-center">
                  <img src={game.imageUrl} alt={game.title}
                    className="w-full h-full object-contain p-4 transition-transform duration-300 hover:scale-105"
                    onError={(e) => {
                      (e.target as HTMLImageElement).parentElement!.innerHTML =
                        `<div class="flex items-center justify-center w-full h-full"><span class="text-4xl">🕹️</span></div>`;
                    }}
                  />
                  <div className="absolute top-2 right-2 bg-amber text-void text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-lg">
                    <Zap className="w-2.5 h-2.5" /> 1 pt / badge
                  </div>
                  {/* Time remaining */}
                  {game.endDate && (
                    <div className="absolute bottom-2 left-2">
                      <CountdownChip endDate={game.endDate} />
                    </div>
                  )}
                </div>
                {/* Info */}
                <div className="p-4 flex flex-col gap-3 flex-1">
                  <div>
                    <span className="text-[9px] uppercase tracking-widest text-pink font-semibold">Arcade Game</span>
                    <h4 className="text-mist text-sm font-semibold mt-0.5 leading-snug">{game.title}</h4>
                    {game.pointLabel && <p className="text-[9px] text-mist-muted mt-0.5">{game.pointLabel}</p>}
                  </div>
                  {game.accessCode && (
                    <div>
                      <p className="text-[9px] text-mist-muted uppercase tracking-wider font-medium">Access Code</p>
                      <CopyCodeButton code={game.accessCode} />
                    </div>
                  )}
                  <a href={game.url} target="_blank" rel="noopener noreferrer"
                    className="mt-auto rounded-xl flex items-center justify-center gap-1.5 bg-pink/10 border border-pink/20 hover:bg-pink/20 hover:border-pink/40 text-pink font-medium py-2 text-xs transition-all w-full cursor-pointer group">
                    <span>Play Game</span>
                    <ExternalLink className="w-3.5 h-3.5 opacity-70 group-hover:opacity-100 transition-opacity" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : gamesSource === "loading" ? (
          /* Loading skeleton */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass rounded-2xl overflow-hidden animate-pulse">
                <div className="h-40 bg-white/5" />
                <div className="p-4 space-y-3">
                  <div className="h-3 bg-white/10 rounded-full w-1/3" />
                  <div className="h-4 bg-white/10 rounded-full w-2/3" />
                  <div className="h-8 bg-white/5 rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass rounded-2xl p-6 text-center">
            <p className="text-2xl mb-2">🎮</p>
            <p className="text-mist text-sm font-medium">No active games right now</p>
            <p className="text-mist-muted text-xs mt-1">New Arcade Games are announced monthly. Check back soon!</p>
            <a href="https://go.cloudskillsboost.google/arcade" target="_blank" rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 text-xs text-cyan hover:underline">
              Check Arcade page <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}

      </div>

      {/* ══ SKILL & TRIVIA BADGES ════════════════════════════════════════════ */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-sm font-semibold text-mist flex items-center gap-2">
              <Wrench className="w-4 h-4 text-amber" />
              Incomplete Skill &amp; Trivia Badges
            </h2>
            <p className="text-xs text-mist-muted mt-0.5">
              Skill Badges: <span className="text-amber font-medium">every 2 = 1 pt</span>.
              Trivia: <span className="text-cyan font-medium">1 pt per badge</span>.
            </p>
          </div>
          <div className="relative max-w-xs w-full md:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-mist-muted" />
            <input type="text" placeholder="Search badges..."
              value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl glass border-0 text-mist text-xs placeholder-mist-muted focus:ring-1 focus:ring-violet/50 outline-none" />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2">
          {(["all", "skill", "trivia"] as const).map((tab) => {
            const count = tab === "all" ? searched.length : searched.filter((b) => b.type === tab).length;
            const Icon = tab === "skill" ? Wrench : tab === "trivia" ? Brain : null;
            return (
              <button key={tab} onClick={() => { setActiveTab(tab); setShowAll(false); }} className={tabClass(tab)}>
                {Icon && <Icon className="w-3.5 h-3.5" />}
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                <span className="opacity-70 font-semibold">{count}</span>
              </button>
            );
          })}
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="glass rounded-2xl p-10 text-center text-mist-muted text-sm">
            No incomplete badges found. You are all caught up! 🚀
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayed.map((badge, i) => {
                const isSkill = badge.type === "skill";
                const color   = isSkill ? "text-amber" : "text-cyan";
                const chip    = isSkill ? "bg-amber/15" : "bg-cyan/15";
                const ring    = isSkill ? "hover:shadow-amber/10" : "hover:shadow-cyan/10";
                const ptLabel = isSkill ? "2 badges = 1 pt" : "1 pt / badge";
                return (
                  <div key={`${badge.title}-${i}`}
                    className={`gradient-ring glass rounded-2xl p-5 flex flex-col justify-between gap-4 transition-all hover:-translate-y-1 hover:shadow-lg ${ring} rise-in`}
                    style={{ animationDelay: `${Math.min(i, 9) * 0.04}s` }}>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-1">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider font-semibold ${chip} ${color}`}>
                          {badge.type}
                        </span>
                        <span className="text-[9px] text-mist-muted flex items-center gap-0.5 shrink-0">
                          <Zap className="w-2.5 h-2.5 text-amber" />{ptLabel}
                        </span>
                      </div>
                      <h4 className="text-mist text-sm font-medium leading-snug line-clamp-2">{badge.title}</h4>
                      {badge.accessCode && <CopyCodeButton code={badge.accessCode} />}
                    </div>
                    <a href={badge.url} target="_blank" rel="noopener noreferrer"
                      className="rounded-xl flex items-center justify-center gap-1.5 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-mist font-medium py-2 text-xs transition-all w-full cursor-pointer group">
                      <span>Start Challenge</span>
                      <ExternalLink className="w-3.5 h-3.5 text-mist-muted group-hover:text-mist transition-colors" />
                    </a>
                  </div>
                );
              })}
            </div>
            {filtered.length > 6 && (
              <div className="flex justify-center pt-4">
                <button onClick={() => setShowAll(!showAll)}
                  className="px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs text-mist font-medium hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer">
                  {showAll ? "Show Less" : `Show All Badges (${filtered.length})`}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
