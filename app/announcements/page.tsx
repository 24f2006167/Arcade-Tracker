"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Megaphone,
  ArrowUpRight,
  RefreshCw,
  BadgeCheck,
  Trophy,
  ExternalLink,
  Info,
  ChevronDown,
  ChevronUp,
  Clock,
  Users,
  Flame,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

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
  facilitatorProgram?: {
    startDate: string;
    endDate: string;
    officialLink: string;
  };
  waterfallSystem?: {
    description: string;
    note: string;
  };
  lastFetched?: string;
}

// ── Official Program Links ────────────────────────────────────────────────────
const OFFICIAL_LINKS = [
  {
    label: "Home",
    url: "https://rsvp.withgoogle.com/events/arcade-facilitator/home",
    icon: "🏠",
  },
  {
    label: "Enrol",
    url: "https://rsvp.withgoogle.com/events/arcade-facilitator/enrol",
    icon: "✍️",
  },
  {
    label: "Points System",
    url: "https://rsvp.withgoogle.com/events/arcade-facilitator/points-system",
    icon: "⭐",
  },
  {
    label: "Bonus Milestone",
    url: "https://rsvp.withgoogle.com/events/arcade-facilitator/bonus-milestone",
    icon: "🏆",
  },
  {
    label: "Syllabus",
    url: "https://rsvp.withgoogle.com/events/arcade-facilitator/syllabus",
    icon: "📋",
  },
  {
    label: "Arcade Games",
    url: "https://go.cloudskillsboost.google/arcade",
    icon: "🎮",
  },
  {
    label: "Official Forum",
    url: "https://discuss.google.dev/t/google-skills-arcade-2026-tiers/371066",
    icon: "💬",
  },
];

// ── Tier color maps ──────────────────────────────────────────────────────────
function tierGradient(color: string) {
  const map: Record<string, string> = {
    "#22e5e5": "from-cyan/20 to-cyan/5 border-cyan/20",
    "#a78bfa": "from-violet/20 to-violet/5 border-violet/20",
    "#f97316": "from-orange-400/20 to-orange-400/5 border-orange-400/20",
    "#fbbf24": "from-amber/20 to-amber/5 border-amber/20",
  };
  return map[color] ?? "from-white/10 to-white/5 border-white/10";
}

function tierText(color: string) {
  const map: Record<string, string> = {
    "#22e5e5": "text-cyan",
    "#a78bfa": "text-violet",
    "#f97316": "text-orange-400",
    "#fbbf24": "text-amber",
  };
  return map[color] ?? "text-mist";
}

// ── Tier Spots Widget ─────────────────────────────────────────────────────────
function TierSpotsWidget({
  tiers,
  waterfallSystem,
}: {
  tiers: TierInfo[];
  waterfallSystem?: { description: string; note: string };
}) {
  const [expanded, setExpanded] = useState(false);
  const reversedTiers = [...tiers].reverse(); // Legend first

  return (
    <div className="glass rounded-2xl border border-amber/20 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 bg-amber/5">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber" />
          <span className="text-sm font-semibold text-mist">2026 Prize Tier Spots</span>
          <span className="text-[10px] bg-amber/15 text-amber px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider">
            Official
          </span>
        </div>
        <button
          onClick={() => setExpanded((v) => !v)}
          className="text-mist-muted hover:text-mist transition-colors"
          aria-label="Toggle waterfall explanation"
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Tiers grid */}
      <div className="p-4 space-y-2">
        {reversedTiers.map((tier) => (
          <div
            key={tier.name}
            className={`flex items-center justify-between rounded-xl px-4 py-3 bg-gradient-to-r border ${tierGradient(tier.color)}`}
          >
            <div>
              <p className={`text-sm font-bold ${tierText(tier.color)}`}>{tier.name}</p>
              <p className="text-[11px] text-mist-muted">
                {tier.pointsMin}
                {tier.pointsMax ? `–${tier.pointsMax}` : "+"} pts
              </p>
            </div>
            <div className="text-right">
              <p className={`text-lg font-bold font-score ${tierText(tier.color)}`}>
                {tier.spotsAvailable.toLocaleString()}
              </p>
              <p className="text-[10px] text-mist-muted">spots</p>
            </div>
          </div>
        ))}
      </div>

      {/* Waterfall explanation */}
      {expanded && waterfallSystem && (
        <div className="px-4 pb-4 space-y-2">
          <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-3">
            <p className="text-[11px] text-mist-muted leading-relaxed">
              <span className="text-amber font-semibold">Waterfall System: </span>
              {waterfallSystem.description}
            </p>
            <p className="text-[11px] text-cyan/80 mt-1.5">{waterfallSystem.note}</p>
          </div>
          <a
            href="https://discuss.google.dev/t/google-skills-arcade-2026-tiers/371066"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-[11px] text-violet hover:text-violet/80 transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            Read full announcement by Yugali (Google)
          </a>
        </div>
      )}

      {/* Source note */}
      <div className="px-5 py-2.5 bg-black/20 border-t border-white/5 flex items-center gap-1.5">
        <BadgeCheck className="w-3.5 h-3.5 text-cyan shrink-0" />
        <span className="text-[10px] text-mist-muted">
          Official data · Yugali (Google PM) · Jun 10, 2026 · discuss.google.dev
        </span>
      </div>
    </div>
  );
}

// ── Announcement Card ─────────────────────────────────────────────────────────
function AnnouncementCard({
  announcement,
  index,
}: {
  announcement: Announcement;
  index: number;
}) {
  const isOfficial =
    announcement.is_google_official ||
    announcement.source === "yugali-official" ||
    announcement.source === "google-official";

  return (
    <a
      href={announcement.official_link || "#"}
      target={announcement.official_link ? "_blank" : undefined}
      rel="noreferrer"
      className="gradient-ring glass rounded-2xl flex items-start gap-4 px-5 py-5 transition-all hover:-translate-y-0.5 rise-in group"
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      {/* Icon / avatar */}
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isOfficial ? "bg-blue-500/20 ring-1 ring-blue-400/30" : "bg-violet/15"}`}>
        {isOfficial ? (
          <BadgeCheck className="w-5 h-5 text-blue-400" />
        ) : (
          <Megaphone className="w-4 h-4 text-violet" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 space-y-1.5 min-w-0">
        {/* Badges row */}
        <div className="flex items-center gap-2 flex-wrap">
          {isOfficial ? (
            <span className="inline-flex items-center gap-1 text-[10px] bg-blue-500/15 text-blue-300 border border-blue-400/20 px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider">
              <BadgeCheck className="w-2.5 h-2.5" />
              Google Official
            </span>
          ) : (
            <span className="text-[10px] uppercase tracking-widest text-violet">Official</span>
          )}
          {announcement.author && (
            <span className="text-[10px] text-mist-muted">
              by{" "}
              {announcement.author_url ? (
                <span className={isOfficial ? "text-blue-300" : "text-mist-muted"}>
                  {announcement.author}
                </span>
              ) : (
                announcement.author
              )}
            </span>
          )}
          {announcement.published_at && (
            <span className="text-[11px] text-mist-muted flex items-center gap-1">
              <Clock className="w-2.5 h-2.5" />
              {new Date(announcement.published_at).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          )}
        </div>

        {/* Title */}
        <p className="text-mist text-sm font-semibold leading-snug group-hover:text-white transition-colors">
          {announcement.title}
        </p>

        {/* Summary */}
        {announcement.summary && (
          <p className="text-mist-muted text-xs line-clamp-3 leading-relaxed">
            {announcement.summary}
          </p>
        )}

        {/* Preview image */}
        {announcement.image_url && (
          <img
            src={announcement.image_url}
            alt="Announcement preview"
            className="mt-2 rounded-lg w-full max-h-32 object-cover object-top border border-white/10"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        )}
      </div>

      {/* Arrow */}
      {announcement.official_link && (
        <ArrowUpRight className="w-4 h-4 text-mist-muted shrink-0 mt-1 group-hover:text-mist transition-colors" />
      )}
    </a>
  );
}

// ── Official Links Quick Access ───────────────────────────────────────────────
function OfficialLinksBar() {
  return (
    <div className="glass rounded-2xl p-4 border border-white/5">
      <div className="flex items-center gap-2 mb-3">
        <ExternalLink className="w-4 h-4 text-cyan" />
        <span className="text-xs font-semibold text-mist">Official Program Pages</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {OFFICIAL_LINKS.map((link) => (
          <a
            key={link.url}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-[11px] font-medium px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 text-mist-muted hover:text-mist transition-all"
          >
            <span>{link.icon}</span>
            {link.label}
          </a>
        ))}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AnnouncementsPage() {
  const [items, setItems] = useState<Announcement[] | null>(null);
  const [officialData, setOfficialData] = useState<OfficialData | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const [announcementsRes, officialRes] = await Promise.allSettled([
        fetch("/api/announcements").then((r) => r.json()),
        fetch("/api/official-data").then((r) => r.json()),
      ]);

      if (announcementsRes.status === "fulfilled") {
        setItems(announcementsRes.value.announcements ?? []);
      }
      if (officialRes.status === "fulfilled") {
        setOfficialData(officialRes.value);
      }
      setLastRefreshed(new Date().toLocaleTimeString());
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const officialCount = (items ?? []).filter(
    (a) => a.is_google_official || a.source === "yugali-official"
  ).length;

  return (
    <div className="space-y-8 py-12">
      {/* ── Header ── */}
      <div className="space-y-3 rise-in">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 text-xs text-mist-muted">
            <span className="w-1.5 h-1.5 rounded-full bg-violet pulse-glow" />
            Official updates · auto-synced from Google
          </span>
          <button
            onClick={loadData}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 text-[11px] font-medium text-mist-muted hover:text-mist px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/8 border border-white/5 hover:border-white/15 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${isRefreshing ? "animate-spin" : ""}`} />
            {isRefreshing ? "Syncing…" : "Refresh"}
          </button>
        </div>

        <h1 className="font-display text-3xl font-semibold text-mist">
          Google Announcements
        </h1>
        <p className="text-mist-muted text-sm max-w-2xl">
          Live announcements from Yugali (Google PM) via{" "}
          <a
            href="https://discuss.google.dev/t/google-skills-arcade-2026-tiers/371066"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-300 hover:underline"
          >
            discuss.google.dev
          </a>
          {" "}and official rsvp.withgoogle.com program pages.
          {officialCount > 0 && (
            <span className="ml-2 inline-flex items-center gap-1 text-[10px] bg-blue-500/15 text-blue-300 border border-blue-400/20 px-2 py-0.5 rounded-full font-medium">
              <BadgeCheck className="w-2.5 h-2.5" />
              {officialCount} verified
            </span>
          )}
        </p>
        {lastRefreshed && (
          <p className="text-[11px] text-mist-muted/60 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Last synced: {lastRefreshed}
          </p>
        )}
      </div>

      {/* ── Quick links to all official program pages ── */}
      <OfficialLinksBar />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Announcements feed (left 2 columns) ── */}
        <div className="lg:col-span-2 space-y-3">
          {!items && (
            <div className="flex items-center gap-2 text-mist-muted text-sm animate-pulse glass rounded-2xl px-5 py-8 justify-center">
              <RefreshCw className="w-4 h-4 animate-spin" />
              Fetching from discuss.google.dev…
            </div>
          )}

          {items && items.length === 0 && (
            <div className="glass rounded-2xl p-10 text-center text-mist-muted text-sm">
              No announcements yet.
            </div>
          )}

          {items &&
            items.length > 0 &&
            items.map((a, i) => (
              <AnnouncementCard key={a.id} announcement={a} index={i} />
            ))}
        </div>

        {/* ── Right sidebar: Tier spots + info ── */}
        <div className="space-y-4">
          {/* Tier spots widget */}
          {officialData?.tiers && (
            <TierSpotsWidget
              tiers={officialData.tiers}
              waterfallSystem={officialData.waterfallSystem}
            />
          )}

          {/* Points system quick reference */}
          <div className="glass rounded-2xl border border-white/5 overflow-hidden">
            <div className="px-5 py-4 bg-violet/5 border-b border-white/5 flex items-center gap-2">
              <Info className="w-4 h-4 text-violet" />
              <span className="text-sm font-semibold text-mist">Points System</span>
            </div>
            <div className="px-4 py-3 space-y-2.5">
              {[
                { label: "Arcade Game badge", pts: "1 pt", icon: "🎮" },
                { label: "Every 2 Skill Badges", pts: "1 pt", icon: "🎓" },
                { label: "Trivia Game badge", pts: "1 pt", icon: "🧠" },
                { label: "Milestone 1", pts: "+5 bonus", icon: "⭐" },
                { label: "Milestone 2", pts: "+15 bonus", icon: "⭐⭐" },
                { label: "Milestone 3", pts: "+25 bonus", icon: "⭐⭐⭐" },
                { label: "Ultimate Milestone", pts: "+35 bonus", icon: "🏆" },
                { label: "Bonus Milestone", pts: "+10 pts", icon: "✨" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between text-[11px]">
                  <span className="text-mist-muted flex items-center gap-1.5">
                    <span>{item.icon}</span>
                    {item.label}
                  </span>
                  <span className="text-cyan font-semibold font-mono">{item.pts}</span>
                </div>
              ))}
              <div className="pt-1 border-t border-white/5">
                <a
                  href="https://rsvp.withgoogle.com/events/arcade-facilitator/points-system"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[11px] text-violet hover:text-violet/80 transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  Official points system page
                </a>
              </div>
            </div>
          </div>

          {/* Milestone requirements quick reference */}
          <div className="glass rounded-2xl border border-white/5 overflow-hidden">
            <div className="px-5 py-4 bg-pink/5 border-b border-white/5 flex items-center gap-2">
              <Flame className="w-4 h-4 text-pink" />
              <span className="text-sm font-semibold text-mist">Milestone Requirements</span>
              <span className="text-[9px] text-mist-muted">(Facilitator window only)</span>
            </div>
            <div className="px-4 py-3 space-y-2.5">
              {[
                { label: "Milestone 1", games: 6, skills: 18, bonus: "+5 pts" },
                { label: "Milestone 2", games: 8, skills: 34, bonus: "+15 pts" },
                { label: "Milestone 3", games: 10, skills: 50, bonus: "+25 pts" },
                { label: "Ultimate", games: 12, skills: 66, bonus: "+35 pts" },
              ].map((m) => (
                <div key={m.label} className="rounded-lg bg-white/3 border border-white/5 px-3 py-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-semibold text-mist">{m.label}</span>
                    <span className="text-[10px] font-bold text-amber">{m.bonus}</span>
                  </div>
                  <div className="flex gap-3 text-[10px] text-mist-muted">
                    <span>🎮 {m.games} games</span>
                    <span>🎓 {m.skills} skill badges</span>
                  </div>
                </div>
              ))}
              <div className="pt-1 border-t border-white/5">
                <a
                  href="https://rsvp.withgoogle.com/events/arcade-facilitator/bonus-milestone"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[11px] text-violet hover:text-violet/80 transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  Official bonus milestone page
                </a>
              </div>
            </div>
          </div>

          {/* Facilitator program dates */}
          {officialData?.facilitatorProgram && (
            <div className="glass rounded-2xl border border-cyan/10 overflow-hidden">
              <div className="px-5 py-4 bg-cyan/5 border-b border-white/5 flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan" />
                <span className="text-sm font-semibold text-mist">Facilitator Program</span>
              </div>
              <div className="px-4 py-3 space-y-2">
                <div className="flex justify-between text-[11px]">
                  <span className="text-mist-muted">Starts</span>
                  <span className="text-cyan font-medium">
                    {new Date(officialData.facilitatorProgram.startDate).toLocaleDateString(
                      undefined,
                      { month: "short", day: "numeric", year: "numeric" }
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-mist-muted">Ends</span>
                  <span className="text-cyan font-medium">
                    {new Date(officialData.facilitatorProgram.endDate).toLocaleDateString(
                      undefined,
                      { month: "short", day: "numeric", year: "numeric" }
                    )}
                  </span>
                </div>
                <a
                  href={officialData.facilitatorProgram.officialLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[11px] text-violet hover:text-violet/80 transition-colors mt-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  Official Facilitator Program
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
