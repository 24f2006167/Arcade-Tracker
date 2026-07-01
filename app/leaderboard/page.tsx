"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Crown, Medal } from "lucide-react";

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

export default function LeaderboardPage() {
  const [rows, setRows] = useState<Row[] | null>(null);

  useEffect(() => {
    fetch("/api/leaderboard")
      .then((r) => r.json())
      .then((d) => setRows(d.leaderboard ?? []));
  }, []);

  return (
    <div className="space-y-10">
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
            return (
              <Link
                key={row.profileId}
                href={`/dashboard/${row.profileId}`}
                className="gradient-ring glass rounded-2xl flex items-center gap-4 px-5 py-4 transition-all hover:-translate-y-0.5 rise-in"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <span className="font-score text-[10px] w-10 flex items-center gap-1.5 text-mist-muted">
                  {String(i + 1).padStart(2, "0")}
                  {RankIcon && <RankIcon className={`w-3.5 h-3.5 ${rank.text}`} />}
                </span>
                <span className="flex-1 text-sm text-mist truncate">{row.name}</span>
                <span className="hidden sm:inline-block text-[11px] px-2.5 py-1 rounded-full bg-amber/15 text-amber w-24 text-center">
                  {row.league}
                </span>
                <span className="hidden md:inline text-xs text-mist-muted w-20 text-right">
                  {row.games}G / {row.skills}S
                </span>
                <span className="text-xs text-cyan w-20 text-right">{row.badges} badges</span>
                <span className="font-score text-sm text-amber w-20 text-right">
                  {row.points}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
