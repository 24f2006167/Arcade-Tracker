"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Crown, Medal, ExternalLink } from "lucide-react";

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
  const [rows, setRows] = useState<Row[] | null>(null);
  const [ownedIds, setOwnedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setOwnedIds(getOwnedProfileIds());
    fetch("/api/leaderboard")
      .then((r) => r.json())
      .then((d) => setRows(d.leaderboard ?? []));
  }, []);

  return (
    <div className="space-y-10 py-12">
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
        <div className="space-y-3">
          {rows.map((row, i) => {
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

                {/* Only show dashboard link for the user's own profiles */}
                {isOwn ? (
                  <Link
                    href={`/dashboard/${row.profileId}`}
                    className="shrink-0 inline-flex items-center gap-1 text-[10px] text-cyan hover:text-mist border border-cyan/30 rounded-lg px-2 py-1 hover:bg-cyan/10 transition-colors"
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
  );
}
