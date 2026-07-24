"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  ArrowRight, Gamepad2, Trophy, Zap, Star, CheckCircle2,
  Clock, Users, Target, ChevronRight, Sparkles, Shield,
  TrendingUp, Medal, Flame, BadgeCheck, ExternalLink,
} from "lucide-react";

import { motion, useReducedMotion, useInView } from "framer-motion";
import { ARCADE_GAMES } from "@/lib/catalog";
import type { CatalogBadge } from "@/lib/catalog";
import AdBanner from "@/components/AdBanner";

const EASE = [0.16, 1, 0.3, 1] as const;

// ─── Pre-compute the static active fallback (runs at module load time, before any hook) ──
const NOW_ISO = new Date().toISOString();
const STATIC_ACTIVE = ARCADE_GAMES
  .filter((g) => !g.endDate || g.endDate > NOW_ISO)
  // Deduplicate by title — keep last occurrence (latest month wins)
  .reduce<CatalogBadge[]>((acc, g) => {
    const idx = acc.findIndex((x) => x.title === g.title);
    if (idx >= 0) acc[idx] = g; else acc.push(g);
    return acc;
  }, []);

// ─── Live arcade games hook ────────────────────────────────────────────────────
function useActiveGames() {
  // Start with static data immediately — no flicker, no empty state
  const [games, setGames] = useState<CatalogBadge[]>(STATIC_ACTIVE);

  useEffect(() => {
    // Try to upgrade to live data from the API
    fetch("/api/arcade-games")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.games) && d.games.length > 0) {
          // Deduplicate by title before setting
          const deduped: CatalogBadge[] = [];
          (d.games as CatalogBadge[]).forEach((g) => {
            const idx = deduped.findIndex((x) => x.title === g.title);
            if (idx >= 0) deduped[idx] = g; else deduped.push(g);
          });
          setGames(deduped);
        }
        // If API returns empty or fails, keep the good static fallback
      })
      .catch(() => { /* keep static fallback */ });
  }, []);

  return games;
}

// ─── Latest official announcement hook ────────────────────────────────────────
interface LatestAnnouncement {
  id: string;
  title: string;
  summary?: string;
  officialLink?: string;
  publishedAt?: string;
  author?: string;
  imageUrl?: string;
}

function useLatestAnnouncement() {
  const [item, setItem] = useState<LatestAnnouncement | null>(null);
  useEffect(() => {
    fetch("/api/official-data")
      .then((r) => r.json())
      .then((d) => {
        const ann = d?.announcements?.[0];
        if (ann) {
          setItem({
            id: ann.id,
            title: ann.title,
            summary: ann.summary,
            officialLink: ann.officialLink || ann.official_link,
            publishedAt: ann.publishedAt || ann.published_at,
            author: ann.author,
            imageUrl: ann.imageUrl || ann.image_url,
          });
        }
      })
      .catch(() => {});
  }, []);
  return item;
}



// ─── Animated counter ─────────────────────────────────────────────────────────
function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = to / 40;
    const t = setInterval(() => {
      start += step;
      if (start >= to) { setVal(to); clearInterval(t); }
      else setVal(Math.floor(start));
    }, 30);
    return () => clearInterval(t);
  }, [inView, to]);

  return <span ref={ref}>{val}{suffix}</span>;
}

// ─── Cursor spotlight ─────────────────────────────────────────────────────────
function CursorSpotlight() {
  const divRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const posRef = useRef({ x: -1000, y: -1000 });
  const paint = useCallback(() => {
    const el = divRef.current;
    if (!el) return;
    const { x, y } = posRef.current;
    el.style.background = `radial-gradient(700px circle at ${x}px ${y}px, rgba(34,229,229,0.04) 0%, rgba(179,137,255,0.03) 40%, transparent 70%)`;
  }, []);
  useEffect(() => {
    if (typeof window === "undefined" || window.matchMedia("(hover: none)").matches) return;
    const onMove = (e: MouseEvent) => {
      posRef.current = { x: e.clientX, y: e.clientY };
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(paint);
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => { window.removeEventListener("mousemove", onMove); cancelAnimationFrame(rafRef.current); };
  }, [paint]);
  return <div ref={divRef} aria-hidden className="cursor-spotlight" />;
}

// ─── Game card ────────────────────────────────────────────────────────────────
function GameCard({ game, index }: { game: CatalogBadge; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });

  // Days remaining
  const daysLeft = game.endDate
    ? Math.max(0, Math.ceil((new Date(game.endDate).getTime() - Date.now()) / 86400000))
    : null;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, ease: EASE, delay: index * 0.08 }}
      className="relative group"
    >
      <div className="glass rounded-2xl overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-pink/10 border border-white/5 hover:border-pink/20">
        {/* Badge image */}
        <div className="relative h-36 bg-gradient-to-br from-void via-slate-900/60 to-void flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/50" />
          <img
            src={game.imageUrl}
            alt={game.title}
            className="w-28 h-28 object-contain drop-shadow-2xl transition-transform duration-500 group-hover:scale-110"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
          <div className="absolute top-2.5 right-2.5 bg-amber/90 text-void text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
            <Zap className="w-2.5 h-2.5" /> 1 PT
          </div>
          {daysLeft !== null && (
            <div className={`absolute bottom-2 left-2 flex items-center gap-1 text-[9px] font-medium px-2 py-0.5 rounded-full border ${daysLeft <= 5 ? "bg-red-500/20 border-red-400/30 text-red-300" : "bg-white/10 border-white/15 text-mist-muted"}`}>
              <Clock className="w-2.5 h-2.5" /> {daysLeft}d left
            </div>
          )}
        </div>
        {/* Info */}
        <div className="p-4 flex flex-col gap-3 flex-1">
          <div>
            <span className="text-[9px] uppercase tracking-widest text-pink font-bold">Arcade Game · July 2026</span>
            <h3 className="text-mist text-sm font-semibold mt-1 leading-snug">{game.title}</h3>
          </div>
          {game.accessCode && (
            <div className="flex items-center gap-2 bg-black/30 rounded-xl px-3 py-2 border border-white/5">
              <span className="text-[9px] text-mist-muted uppercase tracking-wider">Code</span>
              <code className="text-cyan font-mono text-[10px] flex-1 truncate">{game.accessCode}</code>
            </div>
          )}
          <a
            href={game.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-auto rounded-xl flex items-center justify-center gap-1.5 bg-pink/10 border border-pink/20 hover:bg-pink/20 hover:border-pink/40 text-pink font-semibold py-2.5 text-xs transition-all cursor-pointer group/btn"
          >
            Start Game <ChevronRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
          </a>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Stat pill ─────────────────────────────────────────────────────────────────
function StatPill({ icon: Icon, label, value, color }: { icon: React.ComponentType<{ className?: string }>; label: string; value: number; color: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  return (
    <div ref={ref} className="glass rounded-2xl p-5 flex flex-col gap-2 border border-white/5">
      <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${color} mb-1`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-2xl font-bold font-score text-mist">
        {inView ? <Counter to={value} /> : "0"}
      </p>
      <p className="text-xs text-mist-muted leading-tight">{label}</p>
    </div>
  );
}

// ─── Feature row ──────────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: Target,
    title: "Track Every Badge",
    desc: "See exactly which games and skill badges you've completed and how many points you've earned.",
    color: "text-cyan",
    bg: "bg-cyan/10",
  },
  {
    icon: TrendingUp,
    title: "Progress Over Time",
    desc: "Snapshot history charts show your points trajectory so you never lose momentum.",
    color: "text-violet",
    bg: "bg-violet/10",
  },
  {
    icon: Users,
    title: "Community Leaderboard",
    desc: "See how you rank against every tracked player in the STS community in real time.",
    color: "text-pink",
    bg: "bg-pink/10",
  },
  {
    icon: Shield,
    title: "Milestone Simulator",
    desc: "Simulate how many more badges you need to hit the next prize tier before the deadline.",
    color: "text-amber",
    bg: "bg-amber/10",
  },
];

// ─── Latest from Google card ──────────────────────────────────────────────────
function LatestFromGoogle({ item }: { item: LatestAnnouncement }) {
  return (
    <a
      href={item.officialLink ?? "https://discuss.google.dev/t/google-skills-arcade-2026-tiers/371066"}
      target="_blank"
      rel="noopener noreferrer"
      className="block group"
    >
      <div className="glass rounded-2xl border border-blue-400/20 hover:border-blue-400/40 px-5 py-4 flex items-start gap-4 transition-all hover:-translate-y-0.5">
        {/* Google badge avatar */}
        <div className="w-9 h-9 rounded-xl bg-blue-500/20 ring-1 ring-blue-400/30 flex items-center justify-center shrink-0">
          <BadgeCheck className="w-5 h-5 text-blue-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="inline-flex items-center gap-1 text-[10px] bg-blue-500/15 text-blue-300 border border-blue-400/20 px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider">
              <BadgeCheck className="w-2.5 h-2.5" />
              Google Official
            </span>
            {item.author && (
              <span className="text-[10px] text-mist-muted">by {item.author}</span>
            )}
            {item.publishedAt && (
              <span className="text-[10px] text-mist-muted">
                {new Date(item.publishedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
              </span>
            )}
          </div>
          <p className="text-mist text-sm font-semibold leading-snug group-hover:text-white transition-colors">
            {item.title}
          </p>
          {item.summary && (
            <p className="text-mist-muted text-xs mt-1 line-clamp-2 leading-relaxed">
              {item.summary}
            </p>
          )}
        </div>
        <ExternalLink className="w-4 h-4 text-mist-muted shrink-0 mt-0.5 group-hover:text-mist transition-colors" />
      </div>
    </a>
  );
}

export default function Home() {
  const reduced = useReducedMotion() ?? false;
  const activeGames = useActiveGames();
  const latestAnnouncement = useLatestAnnouncement();
  const heroRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <CursorSpotlight />

      {/* ══ HERO ═══════════════════════════════════════════════════════════════ */}
      <section ref={heroRef} className="relative w-full overflow-hidden">
        {/* Layered background glows */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan/10 rounded-full blur-[120px] opacity-60" />
          <div className="absolute top-20 right-1/4 w-80 h-80 bg-violet/12 rounded-full blur-[100px] opacity-50" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[700px] h-48 bg-pink/8 rounded-full blur-[80px]" />
        </div>

        <div className="relative max-w-6xl mx-auto px-6 md:px-12 pt-20 pb-12 flex flex-col items-center text-center gap-8">

          {/* Eyebrow badge */}
          <motion.div
            initial={reduced ? false : { opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
          >
            <span className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 text-xs font-medium text-mist-muted border border-white/8">
              <Flame className="w-3.5 h-3.5 text-amber" />
              Google Skills Arcade · July 2026 is LIVE
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            </span>
          </motion.div>

          {/* Headline */}
          <motion.div
            initial={reduced ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: EASE, delay: 0.1 }}
            className="space-y-4 max-w-4xl"
          >
            <h1 className="font-display text-5xl sm:text-6xl md:text-7xl font-bold leading-[1.04] tracking-tight text-mist">
              Complete your{" "}
              <span className="gradient-text">Arcade run.</span>
              <br />
              <span className="text-mist/80">Track every badge.</span>
            </h1>
            <p className="text-mist-muted text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
              Your personal dashboard for Google Skills Arcade — see active games, copy access codes, track completion milestones, and climb the leaderboard.
            </p>
          </motion.div>

          {/* CTA buttons */}
          <motion.div
            initial={reduced ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: EASE, delay: 0.22 }}
            className="flex flex-col sm:flex-row gap-3 items-center"
          >
            <Link href="/add-profile">
              <motion.button
                id="landing-cta-btn"
                whileHover={reduced ? {} : { scale: 1.03 }}
                whileTap={reduced ? {} : { scale: 0.97 }}
                className="cta-btn flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan via-violet to-pink text-void font-bold px-8 py-4 text-sm cursor-pointer"
              >
                <Gamepad2 className="w-4 h-4" />
                Track My Progress
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </Link>
            <Link href="/leaderboard">
              <button className="flex items-center gap-2 rounded-2xl glass border border-white/10 hover:border-cyan/30 text-mist hover:text-cyan font-semibold px-6 py-4 text-sm transition-all cursor-pointer">
                <Trophy className="w-4 h-4" />
                View Leaderboard
              </button>
            </Link>
          </motion.div>

          {/* Stats strip */}
          <motion.div
            initial={reduced ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE, delay: 0.35 }}
            className="flex flex-wrap items-center justify-center gap-4 text-xs text-mist-muted mt-2"
          >
            {[
              { icon: Gamepad2, label: "Active games", val: `${activeGames.length}` },
              { icon: CheckCircle2, label: "Arcade points each", val: "1 PT" },
              { icon: Medal, label: "Facilitator starts", val: "Jul 13" },
              { icon: Star, label: "Free to track", val: "100%" },
            ].map(({ icon: Icon, label, val }) => (
              <div key={label} className="flex items-center gap-1.5">
                <Icon className="w-3.5 h-3.5 text-cyan" />
                <span className="font-medium text-mist">{val}</span>
                <span>{label}</span>
              </div>
            ))}
          </motion.div>

          {/* Latest from Google — live feed */}
          {latestAnnouncement && (
            <motion.div
              initial={reduced ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: EASE, delay: 0.45 }}
              className="w-full max-w-2xl"
            >
              <p className="text-[10px] uppercase tracking-widest text-mist-muted mb-2 text-center">Latest from Google</p>
              <LatestFromGoogle item={latestAnnouncement} />
            </motion.div>
          )}
        </div>
      </section>


      {/* ══ ACTIVE GAMES ═══════════════════════════════════════════════════════ */}
      <section className="max-w-6xl mx-auto px-6 md:px-12 py-12">
        <div className="flex items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[10px] uppercase tracking-widest text-green-400 font-bold">Live This Month</span>
            </div>
            <h2 className="font-display text-2xl md:text-3xl font-bold text-mist">
              July 2026 Arcade Games
            </h2>
            <p className="text-sm text-mist-muted mt-1">
              Complete all games to maximise your Arcade Points before July 31st.
            </p>
          </div>
          <a
            href="https://go.cloudskillsboost.google/arcade"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 text-xs text-cyan hover:underline shrink-0"
          >
            Official Arcade page <ChevronRight className="w-3.5 h-3.5" />
          </a>
        </div>

        {activeGames.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeGames.map((game, i) => (
              <GameCard key={game.accessCode || game.title} game={game} index={i} />
            ))}
          </div>
        ) : (
          <div className="glass rounded-2xl p-10 text-center">
            <p className="text-2xl mb-2">🎮</p>
            <p className="text-mist-muted text-sm">Loading this month's games…</p>
          </div>
        )}
      </section>

      {/* ══ SPONSORED ADVERTISEMENT ═══════════════════════════════════════════ */}
      <section className="max-w-6xl mx-auto px-6 md:px-12 py-2">
        <AdBanner slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_HOME || "1234567890"} />
      </section>

      {/* ══ COMPLETION PROGRESS BAR CONCEPT ════════════════════════════════════ */}
      <section className="max-w-6xl mx-auto px-6 md:px-12 py-6">
        <div className="glass rounded-2xl p-6 md:p-8 border border-white/5 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan/5 via-violet/5 to-pink/5 pointer-events-none" />
          <div className="relative flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Trophy className="w-4 h-4 text-amber" />
                <span className="text-xs text-amber font-bold uppercase tracking-widest">July Completion Target</span>
              </div>
              <h3 className="font-display text-xl font-bold text-mist mb-2">
                6 Games · 6 Arcade Points Available
              </h3>
              <div className="space-y-2">
                {/* Fake progress to show the concept */}
                <div className="flex justify-between text-xs text-mist-muted">
                  <span>Complete all {activeGames.length} games for full points</span>
                  <span className="text-cyan font-semibold">Up to {activeGames.length} pts</span>
                </div>
                <div className="h-2.5 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-cyan via-violet to-pink rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 1.6, ease: EASE, delay: 0.6 }}
                  />
                </div>
                <div className="flex gap-2 flex-wrap">
                  {activeGames.slice(0, 6).map((g, i) => (
                    <div key={i} className="flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-mist-muted">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan/60" />
                      {g.title.replace("Arcade ", "").replace(": Data Mesh Architect", "")}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="shrink-0">
              <Link href="/add-profile">
                <button className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan via-violet to-pink text-void font-bold px-6 py-3 text-sm cursor-pointer hover:opacity-90 transition-opacity">
                  <Sparkles className="w-4 h-4" />
                  Check My Completion
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ══ STATS ══════════════════════════════════════════════════════════════ */}
      <section className="max-w-6xl mx-auto px-6 md:px-12 py-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatPill icon={Gamepad2} label="Active games this month" value={activeGames.length || 6} color="bg-pink/15 text-pink" />
          <StatPill icon={Zap} label="Arcade Points available" value={activeGames.length || 6} color="bg-amber/15 text-amber" />
          <StatPill icon={CheckCircle2} label="Skill badge categories" value={87} color="bg-cyan/15 text-cyan" />
          <StatPill icon={Clock} label="Days until season ends" value={Math.max(0, Math.ceil((new Date("2026-07-31T23:59:59Z").getTime() - Date.now()) / 86400000))} color="bg-violet/15 text-violet" />
        </div>
      </section>

      {/* ══ FEATURES ════════════════════════════════════════════════════════════ */}
      <section className="max-w-6xl mx-auto px-6 md:px-12 py-10 pb-20">
        <div className="text-center mb-10">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-mist">
            Everything you need to <span className="gradient-text">finish strong</span>
          </h2>
          <p className="text-mist-muted text-sm mt-2 max-w-lg mx-auto">
            Built specifically for STS community members tracking their Arcade progress.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map(({ icon: Icon, title, desc, color, bg }, i) => (
            <motion.div
              key={title}
              initial={reduced ? false : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, ease: EASE, delay: i * 0.08 }}
              className="feat-card px-5 py-6 flex flex-col gap-3"
            >
              <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${bg} ${color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-mist">{title}</p>
                <p className="text-xs text-mist-muted mt-1 leading-relaxed">{desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: EASE }}
          className="mt-12 text-center"
        >
          <Link href="/add-profile">
            <motion.button
              whileHover={reduced ? {} : { scale: 1.03 }}
              whileTap={reduced ? {} : { scale: 0.97 }}
              className="cta-btn inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan via-violet to-pink text-void font-bold px-10 py-4 text-sm cursor-pointer"
            >
              <Gamepad2 className="w-4 h-4" />
              Add Your Profile — It&apos;s Free
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </Link>
          <p className="text-xs text-mist-muted mt-3">
            Only your public Google Skills Boost profile URL needed · No login required
          </p>
        </motion.div>
      </section>
    </>
  );
}
