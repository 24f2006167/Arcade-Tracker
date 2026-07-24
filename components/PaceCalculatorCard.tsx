"use client";

import { useMemo } from "react";
import { Target, TrendingUp, Zap, Clock, Sparkles, CheckCircle2, Flame, Award } from "lucide-react";
import { SEASON, getNextTier, TIERS } from "@/lib/arcade";

interface PaceCalculatorCardProps {
  currentPoints: number;
  totalBadges: number;
}

export function PaceCalculatorCard({ currentPoints, totalBadges }: PaceCalculatorCardProps) {
  const nextTier = useMemo(() => getNextTier(currentPoints), [currentPoints]);
  const ultimateTier = TIERS[TIERS.length - 1]; // Arcade Legend (120 pts)
  const targetTier = nextTier || ultimateTier;

  const daysRemaining = useMemo(() => {
    const endMs = new Date(SEASON.facilitatorEnds).getTime();
    const nowMs = Date.now();
    return Math.max(1, Math.ceil((endMs - nowMs) / (1000 * 60 * 60 * 24)));
  }, []);

  const pointsNeededNext = Math.max(0, targetTier.points - currentPoints);
  const pointsNeededLegend = Math.max(0, ultimateTier.points - currentPoints);

  const dailyPaceNext = (pointsNeededNext / daysRemaining).toFixed(2);
  const dailyPaceLegend = (pointsNeededLegend / daysRemaining).toFixed(2);

  const isLegendAchieved = currentPoints >= ultimateTier.points;

  // Recommendations
  const recommendations = useMemo(() => {
    const list = [];
    if (isLegendAchieved) {
      list.push({ title: "Legend Status Unlocked!", desc: "You reached max tier. Keep completing badges for community rank 1!", icon: Award, color: "text-amber" });
    } else {
      if (pointsNeededNext > 0) {
        list.push({
          title: `Next Goal: ${targetTier.name}`,
          desc: `Earn ${pointsNeededNext} more pts in ${daysRemaining} days (~${dailyPaceNext} pts/day).`,
          icon: Target,
          color: "text-cyan",
        });
      }
      if (!isLegendAchieved && targetTier.name !== ultimateTier.name) {
        list.push({
          title: `Ultimate Goal: ${ultimateTier.name}`,
          desc: `Need ${pointsNeededLegend} total pts (~${dailyPaceLegend} pts/day) for top tier swags.`,
          icon: Flame,
          color: "text-pink",
        });
      }
      list.push({
        title: "Optimal Strategy",
        desc: "Combine 1 Arcade Game (+1pt) with 2 Skill Badges (+1pt) each week.",
        icon: Zap,
        color: "text-amber",
      });
    }
    return list;
  }, [isLegendAchieved, pointsNeededNext, pointsNeededLegend, targetTier, ultimateTier, daysRemaining, dailyPaceNext, dailyPaceLegend]);

  return (
    <div className="glass-strong rounded-2xl p-6 border border-white/10 space-y-5 rise-in relative overflow-hidden bg-gradient-to-br from-cyan/5 via-transparent to-violet/5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-cyan/15 border border-cyan/30 flex items-center justify-center text-cyan shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display text-sm font-bold text-mist">Facilitator Pace Analyzer</h3>
              <span className="text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan/15 text-cyan font-semibold border border-cyan/20">
                Live AI Smart Pace
              </span>
            </div>
            <p className="text-xs text-mist-muted mt-0.5">
              Daily target calculator until Sept 14, 2026 deadline
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl text-mist-muted self-start sm:self-auto">
          <Clock className="w-3.5 h-3.5 text-pink" />
          <span><strong className="text-mist">{daysRemaining}</strong> days left</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="glass rounded-xl p-4 border border-white/5 flex flex-col justify-between gap-1">
          <span className="text-[10px] text-mist-muted uppercase tracking-wider font-medium">Daily Pace (Next Tier)</span>
          <p className="font-score text-xl text-cyan">
            {isLegendAchieved ? "0.00" : dailyPaceNext} <span className="text-xs text-mist-muted font-sans font-normal">pts/day</span>
          </p>
          <span className="text-[10px] text-mist-muted">
            {isLegendAchieved ? "Goal reached!" : `Needed for ${targetTier.name}`}
          </span>
        </div>

        <div className="glass rounded-xl p-4 border border-white/5 flex flex-col justify-between gap-1">
          <span className="text-[10px] text-mist-muted uppercase tracking-wider font-medium">Daily Pace (Arcade Legend)</span>
          <p className="font-score text-xl text-pink">
            {isLegendAchieved ? "0.00" : dailyPaceLegend} <span className="text-xs text-mist-muted font-sans font-normal">pts/day</span>
          </p>
          <span className="text-[10px] text-mist-muted">
            {isLegendAchieved ? "Legend unlocked!" : `Needed for 120 pts`}
          </span>
        </div>

        <div className="glass rounded-xl p-4 border border-white/5 flex flex-col justify-between gap-1">
          <span className="text-[10px] text-mist-muted uppercase tracking-wider font-medium font-sans">Status Check</span>
          <div className="flex items-center gap-1.5 mt-1">
            <CheckCircle2 className={`w-4 h-4 ${isLegendAchieved ? "text-green-400" : "text-amber"}`} />
            <span className="text-xs font-bold text-mist">
              {isLegendAchieved ? "Legend Unlocked 🏆" : Number(dailyPaceNext) <= 0.5 ? "On Track 🟢" : "Push Needed ⚡"}
            </span>
          </div>
          <span className="text-[10px] text-mist-muted">
            {Number(dailyPaceNext) <= 0.5 ? "Maintain 2-3 badges/week" : "Increase weekly badge velocity"}
          </span>
        </div>
      </div>

      <div className="space-y-2 pt-1">
        <span className="text-[10px] font-bold uppercase tracking-widest text-mist-muted flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-cyan" /> Personalized Action Plan
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {recommendations.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="glass rounded-xl p-3 border border-white/5 flex items-start gap-2.5">
                <div className={`p-1.5 rounded-lg bg-white/5 ${item.color} shrink-0 mt-0.5`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="space-y-0.5 min-w-0">
                  <p className="text-xs font-bold text-mist leading-tight truncate">{item.title}</p>
                  <p className="text-[10px] text-mist-muted leading-snug">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
