"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Megaphone, ArrowUpRight, RefreshCw, BadgeCheck, Trophy,
  ExternalLink, ChevronDown, ChevronUp, Clock, Users, Flame,
  Star, Zap, Target, BookOpen, Gift, Info,
} from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";

// ── Types ──────────────────────────────────────────────────────────────────────
interface Announcement {
  id: string;
  title: string;
  summary?: string;
  official_link?: string;
  published_at?: string;
  source?: string;
  author?: string;
  author_url?: string;
  is_google_official?: boolean;
  image_url?: string;
  tag?: string;
  tagColor?: string;
}

interface TierInfo {
  name: string;
  pointsMin: number;
  pointsMax: number | null;
  spotsAvailable: number;
  color: string;
  description: string;
}

interface OfficialData {
  tiers: TierInfo[];
  announcements: Announcement[];
  facilitatorProgram?: { startDate: string; endDate: string; officialLink: string };
  waterfallSystem?: { description: string; note: string };
  lastFetched?: string;
}

// ── Official Program Links ─────────────────────────────────────────────────────
const OFFICIAL_LINKS = [
  { label: "Home", url: "https://rsvp.withgoogle.com/events/arcade-facilitator/home", icon: "🏠", color: "from-cyan/20 to-cyan/5 border-cyan/20 text-cyan" },
  { label: "Enrol Now", url: "https://rsvp.withgoogle.com/events/arcade-facilitator/enrol", icon: "✍️", color: "from-violet/20 to-violet/5 border-violet/20 text-violet" },
  { label: "Points System", url: "https://rsvp.withgoogle.com/events/arcade-facilitator/points-system", icon: "⭐", color: "from-amber/20 to-amber/5 border-amber/20 text-amber" },
  { label: "Bonus Milestone", url: "https://rsvp.withgoogle.com/events/arcade-facilitator/bonus-milestone", icon: "🏆", color: "from-orange-400/20 to-orange-400/5 border-orange-400/20 text-orange-400" },
  { label: "Syllabus", url: "https://rsvp.withgoogle.com/events/arcade-facilitator/syllabus", icon: "📋", color: "from-pink/20 to-pink/5 border-pink/20 text-pink" },
  { label: "Arcade Games", url: "https://go.cloudskillsboost.google/arcade", icon: "🎮", color: "from-green-400/20 to-green-400/5 border-green-400/20 text-green-400" },
  { label: "Official Forum", url: "https://discuss.google.dev/t/google-skills-arcade-2026-tiers/371066", icon: "💬", color: "from-blue-400/20 to-blue-400/5 border-blue-400/20 text-blue-400" },
];

// ── Points system data ─────────────────────────────────────────────────────────
const POINTS_DATA = [
  { label: "Arcade Game badge", pts: "1 pt", color: "text-cyan", icon: "🎮" },
  { label: "Every 2 Skill Badges", pts: "1 pt", color: "text-violet", icon: "🎓" },
  { label: "Trivia Game badge", pts: "1 pt", color: "text-blue-400", icon: "🧠" },
  { label: "Milestone 1", pts: "+5 bonus", color: "text-amber", icon: "⭐" },
  { label: "Milestone 2", pts: "+15 bonus", color: "text-amber", icon: "⭐⭐" },
  { label: "Milestone 3", pts: "+25 bonus", color: "text-amber", icon: "⭐⭐⭐" },
  { label: "Ultimate Milestone", pts: "+35 bonus", color: "text-pink", icon: "🏆" },
  { label: "Bonus Milestone", pts: "+10 pts", color: "text-orange-400", icon: "✨" },
];

// ── Milestone data ─────────────────────────────────────────────────────────────
const MILESTONES = [
  { label: "Milestone 1", games: 6, skills: 18, bonus: "+5 pts", color: "border-cyan/20 bg-cyan/5" },
  { label: "Milestone 2", games: 8, skills: 34, bonus: "+15 pts", color: "border-violet/20 bg-violet/5" },
  { label: "Milestone 3", games: 10, skills: 50, bonus: "+25 pts", color: "border-pink/20 bg-pink/5" },
  { label: "Ultimate", games: 12, skills: 66, bonus: "+35 pts", color: "border-amber/20 bg-amber/5" },
];

// ── Tier helpers ───────────────────────────────────────────────────────────────
const TIER_STYLES: Record<string, { bg: string; text: string; ring: string; icon: string }> = {
  "#fbbf24": { bg: "from-amber/15 to-amber/5", text: "text-amber", ring: "ring-amber/30", icon: "👑" },
  "#f97316": { bg: "from-orange-400/15 to-orange-400/5", text: "text-orange-400", ring: "ring-orange-400/30", icon: "🏆" },
  "#a78bfa": { bg: "from-violet/15 to-violet/5", text: "text-violet", ring: "ring-violet/30", icon: "⚔️" },
  "#22e5e5": { bg: "from-cyan/15 to-cyan/5", text: "text-cyan", ring: "ring-cyan/30", icon: "🛡️" },
};

// ── Countdown to facilitator start ────────────────────────────────────────────
function useCountdown(targetDate: string) {
  const [diff, setDiff] = useState<{ days: number; hours: number; mins: number; secs: number } | null>(null);
  useEffect(() => {
    const tick = () => {
      const ms = new Date(targetDate).getTime() - Date.now();
      if (ms <= 0) { setDiff({ days: 0, hours: 0, mins: 0, secs: 0 }); return; }
      const secs = Math.floor(ms / 1000);
      setDiff({ days: Math.floor(secs / 86400), hours: Math.floor((secs % 86400) / 3600), mins: Math.floor((secs % 3600) / 60), secs: secs % 60 });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetDate]);
  return diff;
}

// ── Countdown widget ───────────────────────────────────────────────────────────
function CountdownWidget({ startDate, officialLink }: { startDate: string; officialLink: string }) {
  const cd = useCountdown(startDate);
  const started = new Date(startDate).getTime() <= Date.now();

  return (
    <div className="glass rounded-2xl border border-cyan/20 overflow-hidden">
      <div className="px-5 py-4 bg-gradient-to-r from-cyan/10 to-violet/10 border-b border-white/5 flex items-center gap-2">
        <Users className="w-4 h-4 text-cyan" />
        <span className="text-sm font-bold text-mist">Facilitator Program 2026</span>
        <span className="ml-auto text-[10px] bg-cyan/15 text-cyan border border-cyan/20 px-2 py-0.5 rounded-full font-medium">
          {started ? "🟢 LIVE" : "⏳ Starting Soon"}
        </span>
      </div>
      <div className="p-5">
        {!started && cd && (
          <div className="mb-4">
            <p className="text-[10px] uppercase tracking-widest text-mist-muted mb-2">Starts in</p>
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: "Days", val: cd.days },
                { label: "Hours", val: cd.hours },
                { label: "Mins", val: cd.mins },
                { label: "Secs", val: cd.secs },
              ].map(({ label, val }) => (
                <div key={label} className="bg-black/30 rounded-xl border border-white/8 p-2 text-center">
                  <p className="text-xl font-bold font-score text-cyan">{String(val).padStart(2, "0")}</p>
                  <p className="text-[9px] text-mist-muted uppercase tracking-wider">{label}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="space-y-2.5 text-[12px]">
          <div className="flex items-center justify-between rounded-lg bg-white/3 border border-white/5 px-3 py-2">
            <span className="text-mist-muted flex items-center gap-1.5"><Clock className="w-3 h-3" /> Starts</span>
            <span className="text-cyan font-semibold">{new Date(startDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-white/3 border border-white/5 px-3 py-2">
            <span className="text-mist-muted flex items-center gap-1.5"><Clock className="w-3 h-3" /> Ends</span>
            <span className="text-pink font-semibold">Sep 14, 2026</span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-white/3 border border-white/5 px-3 py-2">
            <span className="text-mist-muted flex items-center gap-1.5"><Zap className="w-3 h-3" /> Duration</span>
            <span className="text-amber font-semibold">63 days</span>
          </div>
        </div>
        <a
          href={officialLink}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 w-full flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan/20 to-violet/20 hover:from-cyan/30 hover:to-violet/30 border border-cyan/20 hover:border-cyan/40 text-cyan text-[11px] font-semibold py-2.5 transition-all"
        >
          <ExternalLink className="w-3 h-3" /> View Official Program
        </a>
      </div>
    </div>
  );
}

// ── Tier Spots Grid (horizontal, full width) ────────────────────────────────────
function TierSpotsGrid({ tiers, waterfallSystem }: { tiers: TierInfo[]; waterfallSystem?: { description: string; note: string } }) {
  const { theme, hackerMode } = useTheme();
  const isLight = theme === "light";
  const [showWaterfall, setShowWaterfall] = useState(false);
  const reversed = [...tiers].reverse();

  return (
    <div className="glass rounded-2xl border border-amber/20 overflow-hidden">
      <div className="px-5 py-4 bg-gradient-to-r from-amber/10 to-orange-400/5 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber" />
          <span className="text-sm font-bold text-mist">2026 Official Prize Tier Spots</span>
          <span className="text-[10px] bg-amber/15 text-amber border border-amber/20 px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider">Official</span>
        </div>
        <button onClick={() => setShowWaterfall(v => !v)} className="flex items-center gap-1 text-[11px] text-mist-muted hover:text-mist transition-colors">
          Waterfall {showWaterfall ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {/* 4-column tier grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4">
        {reversed.map((tier) => {
          const s = TIER_STYLES[tier.color] ?? { bg: "from-white/10 to-white/5", text: "text-mist", ring: "ring-white/20", icon: "🏅" };
          return (
            <div key={tier.name} className={`relative rounded-xl bg-gradient-to-br ${s.bg} border ring-1 ${s.ring} p-4 text-center`} style={{ borderColor: tier.color + "33" }}>
              <p className="text-2xl mb-1">{s.icon}</p>
              <p className={`text-xs font-bold ${s.text} mb-0.5`}>{tier.name}</p>
              <p className="text-mist-muted text-[10px] mb-2">
                {tier.pointsMin}{tier.pointsMax ? `–${tier.pointsMax}` : "+"} pts
              </p>
              <p className={`text-2xl font-bold font-score ${s.text}`}>
                {tier.spotsAvailable.toLocaleString()}
              </p>
              <p className="text-[10px] text-mist-muted">prize spots</p>
            </div>
          );
        })}
      </div>

      {/* Waterfall explanation */}
      {showWaterfall && waterfallSystem && (
        <div className="px-4 pb-4 space-y-2">
          {hackerMode ? (
            <div className="rounded-2xl glass-strong border border-red-500/20 p-5 flex flex-col md:flex-row items-center gap-5">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden border border-red-500/30 shrink-0 relative select-none pointer-events-none">
                <img 
                  src="/cyber-warning.png" 
                  alt="Cyber Warning Globe" 
                  className={`w-full h-full object-cover ${isLight ? "opacity-95 brightness-95" : "opacity-85"}`}
                />
                <div className="absolute inset-0 bg-red-500/10" />
              </div>
              <div className="space-y-1.5 flex-1 text-left">
                <span className="inline-flex items-center gap-1.5 text-[10px] text-red-400 bg-red-500/10 border border-red-500/20 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  ⚠️ System Rules Notice
                </span>
                <p className="text-[11px] text-mist-muted leading-relaxed">
                  <span className="text-red-400 font-semibold">Waterfall Priority: </span>
                  {waterfallSystem.description}
                </p>
                <p className="text-[10px] text-cyan/70 font-mono">{waterfallSystem.note}</p>
              </div>
            </div>
          ) : (
            <>
              <div className="rounded-xl bg-amber/5 border border-amber/15 px-4 py-3 text-[11px] text-mist-muted leading-relaxed">
                <span className="text-amber font-semibold">⬇️ Waterfall System: </span>
                {waterfallSystem.description}
              </div>
              <p className="text-[11px] text-cyan/80 px-1">{waterfallSystem.note}</p>
            </>
          )}
        </div>
      )}

      <div className="px-5 py-2.5 bg-black/20 border-t border-white/5 flex items-center gap-1.5">
        <BadgeCheck className="w-3.5 h-3.5 text-blue-400 shrink-0" />
        <span className="text-[10px] text-mist-muted">Source: Yugali (Google PM) · discuss.google.dev · Jun 10, 2026</span>
        <a href="https://discuss.google.dev/t/google-skills-arcade-2026-tiers/371066" target="_blank" rel="noopener noreferrer" className="ml-auto text-[10px] text-blue-400 hover:underline flex items-center gap-0.5">
          Read full post <ExternalLink className="w-2.5 h-2.5" />
        </a>
      </div>
    </div>
  );
}

// ── Featured Announcement card ──────────────────────────────────────────────────
function FeaturedPostCard({ announcement, rank }: { announcement: Announcement; rank: number }) {
  const isOfficial = announcement.is_google_official || announcement.source === "yugali-official";
  const tag = announcement.tag || (isOfficial ? "Official" : "Update");
  const tagColor = announcement.tagColor || "#60a5fa";

  const dateStr = announcement.published_at
    ? new Date(announcement.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "";

  return (
    <div className="group glass rounded-2xl overflow-hidden border border-blue-400/30 hover:border-blue-400/50 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 relative rise-in">
      <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-blue-400 to-violet" />
      <div className="p-6 space-y-4">
        {/* Top row: tags, latest indicator and date */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1 text-[10px] bg-gradient-to-r from-blue-500 to-violet text-white px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider animate-pulse">
            🔥 Latest Announcement
          </span>
          {isOfficial && (
            <span className="inline-flex items-center gap-1 text-[10px] bg-blue-500/15 text-blue-300 border border-blue-400/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
              <BadgeCheck className="w-2.5 h-2.5" /> Google Official
            </span>
          )}
          <span
            className="text-[10px] px-2 py-0.5 rounded-full font-semibold border"
            style={{ color: tagColor, borderColor: tagColor + "40", backgroundColor: tagColor + "15" }}
          >
            {tag}
          </span>
          <span className="ml-auto text-[10px] text-mist-muted flex items-center gap-1">
            <Clock className="w-2.5 h-2.5" /> {dateStr}
          </span>
        </div>

        {/* Title */}
        <h2 className="text-base font-bold text-mist group-hover:text-white transition-colors leading-snug">
          {announcement.title}
        </h2>

        {/* Message visual container */}
        <div className="rounded-xl bg-white/5 border border-white/5 p-4 relative overflow-hidden">
          <div className="absolute right-3 top-3 text-white/5 pointer-events-none select-none text-7xl font-serif">“</div>
          <p className="text-xs text-mist-muted leading-relaxed relative z-10 whitespace-pre-line">
            {announcement.summary}
          </p>
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between pt-2 border-t border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-xs font-bold text-blue-300 border border-blue-400/30">
              YM
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-blue-300">Yugali Mohite</span>
              <span className="text-[8px] text-mist-muted">Google Program Manager</span>
            </div>
          </div>
          {announcement.official_link && (
            <a
              href={announcement.official_link}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border transition-all hover:scale-105"
              style={{ color: tagColor, borderColor: tagColor + "40", backgroundColor: tagColor + "10" }}
            >
              Read full post <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Announcement card ─────────────────────────────────────────────────────────
function AnnouncementCard({ announcement, index, featured = false }: { announcement: Announcement; index: number; featured?: boolean }) {
  const isOfficial = announcement.is_google_official || announcement.source === "yugali-official";
  const tag = announcement.tag || (isOfficial ? "Official" : "Update");
  const tagColor = announcement.tagColor || "#60a5fa";

  // Format date nicely
  const dateStr = announcement.published_at
    ? new Date(announcement.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "";

  return (
    <div
      className={`group glass rounded-2xl overflow-hidden border transition-all hover:-translate-y-0.5 hover:shadow-xl rise-in ${featured
          ? "border-blue-400/25 hover:border-blue-400/40 hover:shadow-blue-400/10"
          : "border-white/8 hover:border-white/20"
        }`}
      style={{ animationDelay: `${index * 0.06}s` }}
    >
      {/* Featured image */}
      {featured && announcement.image_url && (
        <div className="relative h-40 overflow-hidden bg-gradient-to-br from-void to-slate-900">
          <img
            src={announcement.image_url}
            alt="Announcement preview"
            className="w-full h-full object-cover object-top opacity-60 group-hover:opacity-80 group-hover:scale-105 transition-all duration-500"
            onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = "none"; }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
        </div>
      )}

      {/* Card body */}
      <div className="p-4 space-y-3">
        {/* Top row: badges + date */}
        <div className="flex items-center gap-2 flex-wrap">
          {isOfficial && (
            <span className="inline-flex items-center gap-1 text-[10px] bg-blue-500/15 text-blue-300 border border-blue-400/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
              <BadgeCheck className="w-2.5 h-2.5" /> Google Official
            </span>
          )}
          {/* Category tag */}
          <span
            className="text-[10px] px-2 py-0.5 rounded-full font-semibold border"
            style={{ color: tagColor, borderColor: tagColor + "40", backgroundColor: tagColor + "15" }}
          >
            {tag}
          </span>
          <span className="ml-auto text-[10px] text-mist-muted flex items-center gap-1">
            <Clock className="w-2.5 h-2.5" /> {dateStr}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-sm font-bold text-mist group-hover:text-white transition-colors leading-snug">
          {announcement.title}
        </h3>

        {/* Full summary — NOT truncated, shows the actual post content */}
        {announcement.summary && (
          <p className="text-[11px] text-mist-muted leading-relaxed">
            {announcement.summary}
          </p>
        )}

        {/* Author + Read More */}
        <div className="flex items-center justify-between pt-1 border-t border-white/5">
          <span className="text-[10px] text-mist-muted">
            ✍️ <span className={isOfficial ? "text-blue-300" : ""}>Yugali Mohite</span>
            <span className="text-mist/40 ml-1">(Google PM)</span>
          </span>
          {announcement.official_link && (
            <a
              href={announcement.official_link}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-lg border transition-all hover:scale-105"
              style={{ color: tagColor, borderColor: tagColor + "40", backgroundColor: tagColor + "10" }}
            >
              Read full post <ExternalLink className="w-2.5 h-2.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Points System card ────────────────────────────────────────────────────────
function PointsSystemCard() {
  return (
    <div className="glass rounded-2xl border border-violet/15 overflow-hidden">
      <div className="px-5 py-4 bg-gradient-to-r from-violet/10 to-cyan/5 border-b border-white/5 flex items-center gap-2">
        <Star className="w-4 h-4 text-violet" />
        <span className="text-sm font-bold text-mist">Points System</span>
        <a href="https://rsvp.withgoogle.com/events/arcade-facilitator/points-system" target="_blank" rel="noopener noreferrer" className="ml-auto flex items-center gap-1 text-[10px] text-violet hover:text-violet/80 transition-colors">
          Official <ExternalLink className="w-2.5 h-2.5" />
        </a>
      </div>
      <div className="p-4 space-y-1.5">
        {POINTS_DATA.map((item) => (
          <div key={item.label} className="flex items-center justify-between rounded-lg hover:bg-white/3 transition-colors px-2 py-1.5 text-[11px]">
            <span className="text-mist-muted flex items-center gap-2">
              <span className="text-sm">{item.icon}</span>
              {item.label}
            </span>
            <span className={`font-bold font-mono ${item.color}`}>{item.pts}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Milestones card ───────────────────────────────────────────────────────────
function MilestonesCard() {
  return (
    <div className="glass rounded-2xl border border-pink/15 overflow-hidden">
      <div className="px-5 py-4 bg-gradient-to-r from-pink/10 to-amber/5 border-b border-white/5 flex items-center gap-2">
        <Flame className="w-4 h-4 text-pink" />
        <span className="text-sm font-bold text-mist">Milestone Requirements</span>
        <span className="text-[9px] text-mist-muted">(Facilitator window)</span>
        <a href="https://rsvp.withgoogle.com/events/arcade-facilitator/bonus-milestone" target="_blank" rel="noopener noreferrer" className="ml-auto flex items-center gap-1 text-[10px] text-pink hover:text-pink/80 transition-colors">
          Official <ExternalLink className="w-2.5 h-2.5" />
        </a>
      </div>
      <div className="p-4 space-y-2.5">
        {MILESTONES.map((m) => (
          <div key={m.label} className={`rounded-xl border px-4 py-3 flex items-center gap-3 ${m.color}`}>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[12px] font-bold text-mist">{m.label}</span>
                <span className="text-[11px] font-bold text-amber">{m.bonus}</span>
              </div>
              <div className="flex gap-4 text-[10px] text-mist-muted">
                <span className="flex items-center gap-1"><span>🎮</span> {m.games} games</span>
                <span className="flex items-center gap-1"><span>🎓</span> {m.skills} skill badges</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── How to earn card ──────────────────────────────────────────────────────────
function HowToEarnCard() {
  return (
    <div className="glass rounded-2xl border border-green-400/15 overflow-hidden">
      <div className="px-5 py-4 bg-gradient-to-r from-green-400/10 to-cyan/5 border-b border-white/5 flex items-center gap-2">
        <Target className="w-4 h-4 text-green-400" />
        <span className="text-sm font-bold text-mist">How to Earn Arcade Points</span>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { icon: "🎮", label: "Arcade Games", desc: "Complete monthly game badges", pts: "1 pt each", color: "border-cyan/20 bg-cyan/5" },
            { icon: "🎓", label: "Skill Badges", desc: "Complete any Skill Badge lab", pts: "1 pt per 2", color: "border-violet/20 bg-violet/5" },
            { icon: "🧠", label: "Trivia Games", desc: "Complete weekly trivia badges", pts: "1 pt each", color: "border-blue-400/20 bg-blue-400/5" },
          ].map((item) => (
            <div key={item.label} className={`rounded-xl border px-4 py-3 text-center ${item.color}`}>
              <p className="text-2xl mb-1">{item.icon}</p>
              <p className="text-xs font-bold text-mist mb-0.5">{item.label}</p>
              <p className="text-[10px] text-mist-muted mb-2">{item.desc}</p>
              <span className="inline-block text-[10px] font-bold text-amber bg-amber/10 border border-amber/20 rounded-full px-2 py-0.5">{item.pts}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Season progress card ──────────────────────────────────────────────────────
function SeasonProgressCard() {
  const programStart = new Date("2026-07-13T11:30:00Z");
  const programEnd = new Date("2026-09-14T23:59:59Z");
  const now = new Date();
  const total = programEnd.getTime() - programStart.getTime();
  const elapsed = Math.max(0, now.getTime() - programStart.getTime());
  const pct = Math.min(100, Math.round((elapsed / total) * 100));
  const daysLeft = Math.max(0, Math.ceil((programEnd.getTime() - now.getTime()) / 86400000));

  return (
    <div className="glass rounded-2xl border border-white/8 overflow-hidden">
      <div className="px-5 py-4 border-b border-white/5 flex items-center gap-2">
        <BookOpen className="w-4 h-4 text-cyan" />
        <span className="text-sm font-bold text-mist">Facilitator Season Progress</span>
        <span className="ml-auto text-[10px] text-mist-muted">{daysLeft} days remaining</span>
      </div>
      <div className="px-5 py-4 space-y-3">
        <div className="flex justify-between text-xs text-mist-muted">
          <span>Jul 13, 2026</span>
          <span className="text-cyan font-medium">{pct}% elapsed</span>
          <span>Sep 14, 2026</span>
        </div>
        <div className="h-3 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan via-violet to-pink rounded-full transition-all duration-1000"
            style={{ width: `${Math.max(2, pct)}%` }}
          />
        </div>
        <div className="grid grid-cols-3 gap-3 pt-1">
          {[
            { label: "Season", val: "2026", color: "text-mist" },
            { label: "Max points", val: "~150+", color: "text-cyan" },
            { label: "Days left", val: daysLeft.toString(), color: "text-amber" },
          ].map(({ label, val, color }) => (
            <div key={label} className="text-center">
              <p className={`text-lg font-bold font-score ${color}`}>{val}</p>
              <p className="text-[10px] text-mist-muted">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Prize counter card ────────────────────────────────────────────────────────
function PrizeCounterCard() {
  return (
    <div className="glass rounded-2xl border border-amber/15 overflow-hidden h-full">
      <div className="p-4 flex items-start gap-3">
        <Gift className="w-5 h-5 text-amber shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-mist mb-1">Prize Counter</p>
          <p className="text-[11px] text-mist-muted leading-relaxed">
            The Prize Counter opens <span className="text-amber font-medium">after the 2026 season ends</span> (Dec 2026).
            First-come, first-served starting from the Legend Tier.
          </p>
          <a
            href="https://go.cloudskillsboost.google/arcade"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 flex items-center gap-1 text-[11px] text-amber hover:text-amber/80 transition-colors"
          >
            <ExternalLink className="w-3 h-3" /> View Arcade Page
          </a>
        </div>
      </div>
    </div>
  );
}

// ── Bonus Milestone preview ───────────────────────────────────────────────────
function BonusMilestonePreview() {
  return (
    <div className="glass rounded-2xl border border-orange-400/20 overflow-hidden relative group">
      <div className="absolute inset-0 bg-gradient-to-br from-orange-400/5 to-transparent pointer-events-none" />
      <div className="px-5 py-4 border-b border-white/5 flex items-center gap-2">
        <Trophy className="w-4 h-4 text-orange-400" />
        <span className="text-sm font-bold text-mist">Introducing the Bonus Milestone</span>
        <span className="ml-auto text-[10px] bg-orange-400/10 text-orange-400 border border-orange-400/20 px-2 py-0.5 rounded-full uppercase tracking-wider font-bold animate-pulse">Coming Soon</span>
      </div>
      <div className="p-5 text-sm text-mist-muted leading-relaxed space-y-3">
        <p>
          For the first time ever, there is more than one way to earn "Bonus Points" in the Arcade Facilitator program!
          This time, we want to make sure you step away with some <strong className="text-orange-300 font-medium">industry-ready skills</strong>.
        </p>
        <p>
          More details about the new "Bonus Milestone", its eligibility criteria, and how you will be able to earn
          <strong className="text-orange-300 font-medium"> an extra 10 Bonus Points</strong> will be posted here soon.
        </p>
        <p className="text-[11px] text-mist/60 italic">So please stay tuned and keep an eye out here!</p>

        <div className="pt-2">
          <a
            href="https://rsvp.withgoogle.com/events/arcade-facilitator/bonus-milestone"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-orange-400 hover:text-orange-300 hover:bg-orange-400/10 border border-orange-400/20 rounded-lg px-4 py-2 transition-all"
          >
            <ExternalLink className="w-3 h-3" /> Read Official Teaser
          </a>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AnnouncementsPage() {
  const [items, setItems] = useState<Announcement[] | null>(null);
  const [officialData, setOfficialData] = useState<OfficialData | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // Primary: rich official data with all Yugali posts (Jul 3 "InFocus", Jun 10 Tiers, etc.)
      const officialRes = await fetch("/api/official-data").then((r) => r.json());
      if (officialRes?.announcements) {
        setOfficialData(officialRes);
        // Map camelCase API fields to snake_case interface fields
        const mapped: Announcement[] = (officialRes.announcements as Array<{
          id: string; title: string; summary?: string; officialLink?: string;
          publishedAt?: string; source?: string; author?: string;
          authorUrl?: string; isGoogleOfficial?: boolean; imageUrl?: string;
          tag?: string; tagColor?: string;
        }>).map((a) => ({
          id: a.id,
          title: a.title,
          summary: a.summary,
          official_link: a.officialLink,
          published_at: a.publishedAt,
          source: a.source,
          author: a.author,
          author_url: a.authorUrl,
          is_google_official: a.isGoogleOfficial,
          image_url: a.imageUrl,
          tag: a.tag,
          tagColor: a.tagColor,
        }));
        setItems(mapped);
      }
      setLastRefreshed(new Date().toLocaleTimeString());
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const officialCount = (items ?? []).filter(a => a.is_google_official || a.source === "yugali-official").length;
  const featured = items?.[0];
  const rest = items?.slice(1) ?? [];

  return (
    <div className="space-y-6 py-10">

      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 rise-in">
        <div className="space-y-1.5">
          <span className="inline-flex items-center gap-1.5 text-xs text-mist-muted">
            <span className="w-1.5 h-1.5 rounded-full bg-violet pulse-glow" />
            Official updates · auto-synced from Google
          </span>
          <h1 className="font-display text-3xl font-bold text-mist">Google Announcements</h1>
          <p className="text-mist-muted text-sm">
            Live posts from{" "}
            <a href="https://discuss.google.dev/u/Yugali" target="_blank" rel="noopener noreferrer" className="text-blue-300 hover:underline">
              Yugali (Google PM)
            </a>{" "}
            via discuss.google.dev · official program pages
            {officialCount > 0 && (
              <span className="ml-2 inline-flex items-center gap-1 text-[10px] bg-blue-500/15 text-blue-300 border border-blue-400/20 px-2 py-0.5 rounded-full">
                <BadgeCheck className="w-2.5 h-2.5" /> {officialCount} verified
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {lastRefreshed && (
            <span className="text-[10px] text-mist-muted flex items-center gap-1">
              <Clock className="w-3 h-3" /> Synced {lastRefreshed}
            </span>
          )}
          <button
            onClick={loadData}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 text-[11px] font-medium text-mist-muted hover:text-mist px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/8 border border-white/8 hover:border-white/15 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${isRefreshing ? "animate-spin" : ""}`} />
            {isRefreshing ? "Syncing…" : "Refresh"}
          </button>
        </div>
      </div>

      {/* ── Official links strip ────────────────────────────────────────────── */}
      <div className="glass rounded-2xl border border-white/5 p-4 rise-in">
        <div className="flex items-center gap-2 mb-3">
          <ExternalLink className="w-3.5 h-3.5 text-cyan" />
          <span className="text-xs font-semibold text-mist">Official Program Pages · rsvp.withgoogle.com</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {OFFICIAL_LINKS.map((link) => (
            <a
              key={link.url}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex flex-col items-center gap-1 text-center text-[10px] font-medium p-3 rounded-xl bg-gradient-to-b border hover:scale-105 transition-transform ${link.color}`}
            >
              <span className="text-xl">{link.icon}</span>
              {link.label}
            </a>
          ))}
        </div>
      </div>

      {/* ── Tier spots (full width) ─────────────────────────────────────────── */}
      {officialData?.tiers && (
        <TierSpotsGrid tiers={officialData.tiers} waterfallSystem={officialData.waterfallSystem} />
      )}

      {/* ── Main content grid ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* LEFT: Announcements feed (2 columns wide) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-violet" />
            <span className="text-sm font-bold text-mist">Official Announcements</span>
            <span className="text-[10px] text-mist-muted">(auto-fetched from discuss.google.dev)</span>
          </div>

          {/* Top 3 latest posts — visual layout */}
          {items && items.length > 0 && (() => {
            const top3 = items.slice(0, 3);
            const [first, ...others] = top3;
            return (
              <div className="space-y-4">
                {/* #1 — Latest post: full-width featured card */}
                {first && <FeaturedPostCard announcement={first} rank={1} />}
                {/* #2 + #3 — side by side */}
                {others.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {others.map((a, i) => (
                      <AnnouncementCard key={a.id} announcement={a} index={i + 1} />
                    ))}
                  </div>
                )}
              </div>
            );
          })()}

          {!items && (
            <div className="glass rounded-2xl flex items-center justify-center gap-2 py-16 text-mist-muted text-sm animate-pulse">
              <RefreshCw className="w-4 h-4 animate-spin" /> Fetching from discuss.google.dev…
            </div>
          )}
        </div>

        {/* RIGHT: Countdown and Prize counter */}
        <div className="space-y-4">
          {officialData?.facilitatorProgram && (
            <CountdownWidget
              startDate={officialData.facilitatorProgram.startDate}
              officialLink={officialData.facilitatorProgram.officialLink}
            />
          )}
          <PrizeCounterCard />
        </div>
      </div>

      {/* ── Bottom grids (Information) ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-2">
        {/* Left column stacking the progress and points */}
        <div className="space-y-6">
          <SeasonProgressCard />
          <PointsSystemCard />
        </div>

        {/* Right column stacking how to earn and milestones */}
        <div className="space-y-6">
          <HowToEarnCard />
          <MilestonesCard />
        </div>
      </div>

    </div>
  );
}
