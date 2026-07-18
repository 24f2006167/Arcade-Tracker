"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Crown, Medal, ExternalLink, Search } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";

interface Row {
  profileId: string;
  publicId: string;
  name: string;
  points: number;
  badges: number;
  games: number;
  skills: number;
  league: string;
  lastUpdated: string | null;
}

const RANK_STYLE = [
  { text: "text-amber", icon: Crown },
  { text: "text-mist", icon: Medal },
  { text: "text-pink", icon: Medal },
];

/** Returns the set of profile IDs this browser has saved in localStorage. */
function getOwnedProfileIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const stored = localStorage.getItem("arcade_profiles");
    if (!stored) return new Set();
    const list: { id: string }[] = JSON.parse(stored);
    return new Set(list.map((p) => p.id));
  } catch {
    return new Set();
  }
}

export default function LeaderboardPage() {
  const { theme, hackerMode } = useTheme();
  const isLight = theme === "light";
  const [rows, setRows] = useState<Row[] | null>(null);
  const [ownedIds, setOwnedIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    setOwnedIds(getOwnedProfileIds());
    fetch("/api/leaderboard")
      .then((r) => r.json())
      .then((d) => setRows(d.leaderboard ?? []));
  }, []);

  const filteredRows = rows
    ? rows.filter((row) =>
        row.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : null;

  return (
    <div className="space-y-10 py-12">
      {hackerMode ? (
        <div className="glass-strong rounded-3xl p-5 md:p-6 border border-line flex flex-row items-center gap-6 rise-in">
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl overflow-hidden border border-line shrink-0 relative select-none pointer-events-none">
            <img 
              src="/hacker-visor.png" 
              alt="Hacker Visor Logo" 
              className={`w-full h-full object-cover ${isLight ? "opacity-95 brightness-95" : "opacity-85"}`}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-red-950/20 to-transparent" />
          </div>
          <div className="space-y-1 flex-1">
            <span className="inline-flex items-center gap-1.5 text-[10px] text-pink bg-pink/10 border border-pink/20 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-pink animate-pulse" />
              High scores
            </span>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-mist">Leaderboard</h1>
            <p className="text-mist-muted text-xs">
              Live ranking across every profile indexed by the STS database.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-2 rise-in">
          <span className="inline-flex items-center gap-1.5 text-xs text-mist-muted">
            <span className="w-1.5 h-1.5 rounded-full bg-pink pulse-glow" />
            High scores
          </span>
          <h1 className="font-display text-3xl font-semibold text-mist">Leaderboard</h1>
          <p className="text-mist-muted text-sm">
            Ranked across every profile this tracker has indexed.
          </p>
        </div>
      )}

      {!rows && <span className="text-mist-muted text-sm animate-pulse">Loading...</span>}

      {rows && rows.length === 0 && (
        <div className="glass rounded-2xl p-10 text-center text-mist-muted text-sm">
          No profiles tracked yet.{" "}
          <Link href="/" className="text-cyan hover:underline">
            Add the first one
          </Link>
          .
        </div>
      )}

      {rows && rows.length > 0 && (
        <div className="space-y-6">
          {/* Search Bar */}
          <div className="relative max-w-sm rise-in">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-mist-muted" />
            <input
              type="text"
              placeholder="Search player name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 border border-white/10 focus:border-cyan/50 focus:ring-1 focus:ring-cyan/50 rounded-2xl pl-11 pr-4 py-3 text-xs text-mist placeholder:text-mist-muted outline-none transition-all"
            />
          </div>

          {filteredRows && filteredRows.length === 0 ? (
            <div className="glass rounded-2xl p-10 text-center text-mist-muted text-sm">
              No matching profiles found.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredRows?.map((row, i) => {
                const rank = RANK_STYLE[i];
                const RankIcon = rank?.icon;
                const isOwn = ownedIds.has(row.profileId);

                return (
                  <div
                    key={row.profileId}
                    className={`gradient-ring glass rounded-2xl flex items-center gap-4 px-5 py-4 rise-in ${
                      isOwn ? "border border-cyan/30" : ""
                    }`}
                    style={{ animationDelay: `${i * 0.05}s` }}
                  >
                    <span className="font-score text-[10px] w-10 flex items-center gap-1.5 text-mist-muted shrink-0">
                      {String(i + 1).padStart(2, "00")}
                      {RankIcon && <RankIcon className={`w-3.5 h-3.5 ${rank.text}`} />}
                    </span>

                    <span className="flex-1 text-sm text-mist truncate">
                      {row.name}
                      {isOwn && (
                        <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full bg-cyan/15 text-cyan font-medium align-middle">
                          you
                        </span>
                      )}
                    </span>

                    <span className="hidden sm:inline-block text-[11px] px-2.5 py-1 rounded-full bg-amber/15 text-amber w-24 text-center shrink-0">
                      {row.league}
                    </span>
                    <span className="hidden md:inline text-xs text-mist-muted w-20 text-right shrink-0">
                      {row.games}G / {row.skills}S
                    </span>
                    <span className="text-xs text-cyan w-20 text-right shrink-0">{row.badges} badges</span>
                    <span className="font-score text-sm text-amber w-16 text-right shrink-0">
                      {row.points}
                    </span>

                    {isOwn ? (
                      <Link
                        href={`/dashboard/${row.profileId}`}
                        className="shrink-0 inline-flex items-center gap-1 text-[10px] text-cyan border border-cyan/30 rounded-lg px-2.5 py-1.5 hover:bg-cyan/10 transition-all"
                        title="View your dashboard"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span className="hidden sm:inline">Dashboard</span>
                      </Link>
                    ) : (
                      <span className="shrink-0 w-[68px] sm:w-[84px]" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
