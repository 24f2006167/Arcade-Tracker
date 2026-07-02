"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Sparkles, ShieldX } from "lucide-react";
import { PointsSimulator } from "@/components/PointsSimulator";
import type { ArcadeResult } from "@/lib/arcadeCalculator";
import type { Badge, BonusMilestoneInfo } from "@/lib/scraper";

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

interface ProfileResponse {
  profile: { id: string; public_id: string; display_name: string };
  snapshots: any[];
  arcadeResult: ArcadeResult;
  bonusMilestone?: BonusMilestoneInfo;
}

export default function SimulatorPage() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<ProfileResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [accessGranted, setAccessGranted] = useState<boolean | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/profile?id=${params.id}`);
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || "Failed to load profile");
      return;
    }
    setData(json);
  }, [params.id]);

  useEffect(() => {
    const owned = isOwnedProfile(params.id);
    setAccessGranted(owned);
    if (owned) load();
  }, [params.id, load]);

  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <p className="text-pink text-sm">{error}</p>
        <Link
          href={`/dashboard/${params.id}`}
          className="text-xs text-cyan hover:underline flex items-center gap-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
        </Link>
      </div>
    );
  }

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
            This simulator belongs to another player. You can only use the
            simulator for your{" "}
            <span className="text-mist font-medium">own profile</span>.
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

  if (accessGranted === null || !data) {
    return (
      <div className="flex flex-col items-center gap-3 py-24">
        <span className="text-mist-muted text-sm animate-pulse">Loading simulator...</span>
      </div>
    );
  }

  const bonusMilestoneAnnounced = !!(
    data.bonusMilestone?.description &&
    data.bonusMilestone.description.length > 100 &&
    !data.bonusMilestone.description.includes("will be posted here soon")
  );

  return (
    <div className="max-w-2xl mx-auto space-y-8 rise-in py-12">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href={`/dashboard/${params.id}`}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl glass hover:bg-white/10 text-xs text-mist-muted hover:text-mist transition-all duration-200 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Dashboard
        </Link>
        <div className="text-right">
          <span className="inline-flex items-center gap-1.5 text-xs text-mist-muted">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan pulse-glow" />
            Simulating for {data.profile.display_name}
          </span>
        </div>
      </div>

      {/* Hero Header */}
      <div className="text-center space-y-3">
        <span className="inline-flex items-center gap-1.5 text-xs text-cyan bg-cyan/10 border border-cyan/20 px-3.5 py-1.5 rounded-full font-semibold">
          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
          Interactive Swags & Points Calculator
        </span>
        <h1 className="font-display text-3xl font-bold tracking-tight text-mist">
          Forecast Your Arcade Journey
        </h1>
        <p className="text-xs text-mist-muted max-w-md mx-auto leading-relaxed">
          Forecast what points, milestone bonuses, and swag prize tiers you will unlock next by checking combinations of badges below.
        </p>
      </div>

      {/* Simulator Component */}
      <PointsSimulator
        currentArcade={data.arcadeResult}
        initialBonusMilestone={bonusMilestoneAnnounced && !!data.bonusMilestone?.completed}
      />
    </div>
  );
}
