"use client";

import { useState } from "react";
import { Plus, Minus, Calculator, Sparkles, Check, HelpCircle } from "lucide-react";
import type { ArcadeResult } from "@/lib/arcadeCalculator";

interface PointsSimulatorProps {
  currentArcade: ArcadeResult;
  initialBonusMilestone: boolean;
}

export function PointsSimulator({ currentArcade, initialBonusMilestone }: PointsSimulatorProps) {
  // Simulator State (initialized with current actual profile values)
  const [simGames, setSimGames] = useState(currentArcade.breakdown.arcadeGames);
  const [simSkills, setSimSkills] = useState(currentArcade.breakdown.skillBadges);
  const [simTrivia, setSimTrivia] = useState(currentArcade.breakdown.triviaGames);
  const [simSpecial, setSimSpecial] = useState(currentArcade.breakdown.specialGames);
  const [simLevel, setSimLevel] = useState(currentArcade.breakdown.levelBadges);
  const [simBonusMilestone, setSimBonusMilestone] = useState(initialBonusMilestone);

  // Constants
  const TIERS = [
    { name: "Arcade Trooper", points: 50 },
    { name: "Arcade Ranger", points: 75 },
    { name: "Arcade Champion", points: 95 },
    { name: "Arcade Legend", points: 120 },
  ];

  // Calculate simulated base points (cumulative sum of all badges)
  const simulatedBasePoints =
    simGames * 1 +
    simTrivia * 1 +
    simSpecial * 2 +
    simLevel * 1 +
    Math.floor(simSkills / 2) * 1; // 2 skills = 1 pt

  // Calculate simulated milestone points and base points
  // Milestone rules:
  // Milestone 1: 6 games + 18 skills -> 5 bonus
  // Milestone 2: 8 games + 34 skills -> 15 bonus
  // Milestone 3: 10 games + 50 skills -> 25 bonus
  // Ultimate Milestone: 12 games + 66 skills -> 35 bonus
  let simMilestonePoints = 0;
  let activeMilestone = "";

  if (simGames >= 12 && simSkills >= 66) {
    simMilestonePoints = 35;
    activeMilestone = "Ultimate Milestone";
  } else if (simGames >= 10 && simSkills >= 50) {
    simMilestonePoints = 25;
    activeMilestone = "Milestone 3";
  } else if (simGames >= 8 && simSkills >= 34) {
    simMilestonePoints = 15;
    activeMilestone = "Milestone 2";
  } else if (simGames >= 6 && simSkills >= 18) {
    simMilestonePoints = 5;
    activeMilestone = "Milestone 1";
  }

  // Bonus milestone: Only eligible if they reached at least Milestone 1 (+5 pts)
  const isEligibleForBonusMilestone = simMilestonePoints > 0;
  const simBonusMilestonePoints = (simBonusMilestone && isEligibleForBonusMilestone) ? 10 : 0;

  const totalSimulatedPoints =
    simulatedBasePoints +
    simMilestonePoints +
    simBonusMilestonePoints;

  // Determine tier based on simulated points
  let simulatedTier = "Unranked";
  let nextTier = TIERS[0];
  for (const tier of TIERS) {
    if (totalSimulatedPoints >= tier.points) {
      simulatedTier = tier.name;
    } else {
      nextTier = tier;
      break;
    }
  }

  // Calculate needed points for next tier
  const pointsToNextTier = nextTier ? nextTier.points - totalSimulatedPoints : 0;
  const progressPct = nextTier
    ? Math.min(100, Math.round((totalSimulatedPoints / nextTier.points) * 100))
    : 100;

  // Reset simulator
  const handleReset = () => {
    setSimGames(currentArcade.breakdown.arcadeGames);
    setSimSkills(currentArcade.breakdown.skillBadges);
    setSimTrivia(currentArcade.breakdown.triviaGames);
    setSimSpecial(currentArcade.breakdown.specialGames);
    setSimLevel(currentArcade.breakdown.levelBadges);
    setSimBonusMilestone(initialBonusMilestone);
  };

  const isSimulated =
    simGames !== currentArcade.breakdown.arcadeGames ||
    simSkills !== currentArcade.breakdown.skillBadges ||
    simTrivia !== currentArcade.breakdown.triviaGames ||
    simSpecial !== currentArcade.breakdown.specialGames ||
    simLevel !== currentArcade.breakdown.levelBadges ||
    simBonusMilestone !== initialBonusMilestone;

  return (
    <div className="glass-strong rounded-3xl p-6 space-y-6 relative overflow-hidden gradient-ring transition-all duration-300">
      {/* Glow highlight */}
      {isSimulated && (
        <div className="absolute inset-0 bg-cyan/5 border border-cyan/20 rounded-3xl pointer-events-none transition-all duration-300 animate-pulse" />
      )}

      {/* Header */}
      <div className="flex items-center justify-between relative">
        <div className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-cyan" />
          <h2 className="font-display text-sm font-semibold text-mist">Points Simulator</h2>
        </div>
        {isSimulated && (
          <button
            onClick={handleReset}
            className="text-[10px] bg-white/5 hover:bg-white/10 text-cyan px-2.5 py-1 rounded-lg border border-cyan/20 transition-all font-medium"
          >
            Reset Simulator
          </button>
        )}
      </div>

      <p className="text-xs text-mist-muted leading-relaxed">
        Adjust game, skill, or milestone quantities below to forecast your points, milestone bonuses, and swag tier qualification instantly.
      </p>

      {/* Controls Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          {
            label: "Arcade Games",
            value: simGames,
            setter: setSimGames,
            weight: "1 pt / badge",
            color: "text-pink border-pink/20",
          },
          {
            label: "Skill Badges",
            value: simSkills,
            setter: setSimSkills,
            weight: "1 pt / 2 badges",
            color: "text-amber border-amber/20",
          },
          {
            label: "Trivia Games",
            value: simTrivia,
            setter: setSimTrivia,
            weight: "1 pt / badge",
            color: "text-cyan border-cyan/20",
          },
          {
            label: "Special Games",
            value: simSpecial,
            setter: setSimSpecial,
            weight: "2 pts / badge",
            color: "text-violet border-violet/20",
          },
        ].map((ctrl) => (
          <div
            key={ctrl.label}
            className="glass bg-white/[0.02] border border-white/5 rounded-2xl p-3 flex items-center justify-between"
          >
            <div>
              <p className="text-xs font-semibold text-mist">{ctrl.label}</p>
              <p className="text-[9px] text-mist-muted mt-0.5">{ctrl.weight}</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => ctrl.setter(Math.max(0, ctrl.value - 1))}
                className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-mist flex items-center justify-center transition-all cursor-pointer"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="text-sm font-bold text-mist w-6 text-center">{ctrl.value}</span>
              <button
                onClick={() => ctrl.setter(ctrl.value + 1)}
                className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-mist flex items-center justify-center transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Checkboxes and Milestones */}
      <div className="space-y-3">
        <label className={`flex items-center justify-between glass bg-white/[0.02] border border-white/5 rounded-2xl p-3 cursor-pointer hover:bg-white/[0.04] transition-all ${!isEligibleForBonusMilestone ? "opacity-50 cursor-not-allowed" : ""}`}>
          <div>
            <p className="text-xs font-semibold text-mist">Facilitator Bonus Milestone</p>
            <p className="text-[9px] text-mist-muted mt-0.5">
              {!isEligibleForBonusMilestone ? "Requires Milestone 1 completion" : "+10 Bonus Points"}
            </p>
          </div>
          <input
            type="checkbox"
            checked={simBonusMilestone}
            disabled={!isEligibleForBonusMilestone}
            onChange={(e) => setSimBonusMilestone(e.target.checked)}
            className="w-4 h-4 accent-cyan cursor-pointer disabled:cursor-not-allowed"
          />
        </label>

        {/* Milestone Indicator */}
        <div className="flex items-center justify-between text-xs px-2">
          <span className="text-mist-muted">Simulated Milestone Bonus:</span>
          <span className={`font-semibold ${simMilestonePoints > 0 ? "text-violet" : "text-mist-muted"}`}>
            {activeMilestone ? `${activeMilestone} (+${simMilestonePoints} pts)` : "None"}
          </span>
        </div>
      </div>

      {/* Simulator Results Header & Progress Bar */}
      <div className="pt-4 border-t border-white/5 space-y-4">
        <div className="flex justify-between items-end">
          <div>
            <p className="text-[10px] text-mist-muted uppercase tracking-wider font-semibold">Simulated Total</p>
            <p className="text-3xl font-black text-cyan mt-1 flex items-baseline gap-1">
              {totalSimulatedPoints}
              <span className="text-xs text-mist-muted font-normal">pts</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-mist-muted uppercase tracking-wider font-semibold">Simulated Tier</p>
            <span className="inline-flex items-center gap-1 mt-1 text-xs font-bold text-amber bg-amber/10 px-3 py-1 rounded-full border border-amber/20">
              <Sparkles className="w-3 h-3" />
              {simulatedTier}
            </span>
          </div>
        </div>

        {/* Next Tier Progress Bar */}
        {nextTier ? (
          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px] text-mist-muted">
              <span>Next: {nextTier.name} ({nextTier.points} pts)</span>
              <span>{pointsToNextTier} pts to go</span>
            </div>
            <div className="h-2 rounded-full bg-white/5 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan via-violet to-pink transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl p-2.5 text-center text-xs font-medium flex items-center justify-center gap-1.5">
            <Check className="w-4 h-4" /> Max Tier (Arcade Legend) achieved!
          </div>
        )}
      </div>
    </div>
  );
}
