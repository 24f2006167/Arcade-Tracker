"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import { PointsSimulator } from "@/components/PointsSimulator";
import type { ArcadeResult } from "@/lib/arcadeCalculator";
import type { Badge, BonusMilestoneInfo } from "@/lib/scraper";

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
    load();
  }, [load]);

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

  if (!data) {
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
