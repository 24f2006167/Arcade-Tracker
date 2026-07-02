"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Search, ShieldX } from "lucide-react";
import { BadgeGrid } from "@/components/BadgeGrid";
import type { Badge } from "@/lib/scraper";

/** Returns true if this profileId is saved in the user's own localStorage. */
function isOwnedProfile(id: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const stored = localStorage.getItem("arcade_profiles");
    if (!stored) return false;
    const list: { id: string }[] = JSON.parse(stored);
    return list.some((p) => p.id === id);
  } catch {
    return false;
  }
}

const FILTERS: { label: string; value: Badge["type"] | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Games", value: "game" },
  { label: "Skill", value: "skill" },
  { label: "Trivia", value: "trivia" },
  { label: "Certification", value: "certification" },
  { label: "Special", value: "special" },
];

export default function BadgesPage() {
  const params = useParams<{ id: string }>();
  const [badges, setBadges] = useState<Badge[] | null>(null);
  const [name, setName] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Badge["type"] | "all">("all");
  const [accessGranted, setAccessGranted] = useState<boolean | null>(null);

  useEffect(() => {
    const owned = isOwnedProfile(params.id);
    setAccessGranted(owned);
    if (!owned) return;

    fetch(`/api/profile?id=${params.id}`)
      .then((r) => r.json())
      .then((json) => {
        const snapshots = json.snapshots ?? [];
        const latest = snapshots[snapshots.length - 1];
        setBadges(latest?.badges ?? []);
        setName(json.profile?.display_name ?? "");
      });
  }, [params.id]);

  const filtered = useMemo(() => {
    if (!badges) return [];
    return badges.filter((b) => {
      const matchesFilter = filter === "all" || b.type === filter;
      const matchesQuery = b.title.toLowerCase().includes(query.toLowerCase());
      return matchesFilter && matchesQuery;
    });
  }, [badges, query, filter]);

  // Access guard — show lock screen for profiles not owned by this user
  if (accessGranted === false) {
    return (
      <div className="flex flex-col items-center justify-center gap-8 py-28 text-center">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-pink/20 blur-2xl scale-150" />
          <div className="relative w-20 h-20 rounded-2xl glass-strong border border-pink/30 flex items-center justify-center">
            <ShieldX className="w-10 h-10 text-pink" />
          </div>
        </div>
        <div className="space-y-3 max-w-sm">
          <h1 className="font-display text-2xl font-semibold text-mist">Access Denied</h1>
          <p className="text-mist-muted text-sm leading-relaxed">
            This badge list belongs to another player. You can only view your{" "}
            <span className="text-mist font-medium">own badges</span> after
            tracking your profile.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan via-violet to-pink text-void text-sm font-semibold transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            Track your own profile
          </Link>
          <Link
            href="/leaderboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl glass border border-line/40 text-mist text-sm hover:bg-white/10 transition-colors"
          >
            Back to Leaderboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 py-12">
      <div className="space-y-2 rise-in">
        <Link
          href={`/dashboard/${params.id}`}
          className="inline-flex items-center gap-1.5 text-xs text-mist-muted hover:text-cyan transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to dashboard
        </Link>
        <h1 className="font-display text-3xl font-semibold text-mist">
          {name ? `${name}'s badges` : "Badges"}
        </h1>
        <p className="text-mist-muted text-sm">
          {badges ? `${badges.length} total` : "Loading..."}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 rise-in">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-mist-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search badge..."
            className="glass rounded-xl w-full pl-9 pr-4 py-2.5 text-sm text-mist placeholder:text-mist-muted/60 outline-none focus:ring-1 focus:ring-cyan/50"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-colors ${
                filter === f.value
                  ? "bg-gradient-to-r from-cyan via-violet to-pink text-void"
                  : "glass text-mist-muted hover:text-mist"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {!badges && <span className="text-mist-muted text-sm animate-pulse">Loading...</span>}

      {badges && <BadgeGrid badges={filtered} />}
    </div>
  );
}
