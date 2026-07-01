"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";
import { BadgeGrid } from "@/components/BadgeGrid";
import type { Badge } from "@/lib/scraper";

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

  useEffect(() => {
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

  return (
    <div className="space-y-8">
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
