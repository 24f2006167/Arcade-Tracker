import type { Badge } from "@/lib/scraper";

/**
 * Season / facilitator configuration.
 * Update these dates each season — they drive the countdown banner,
 * the "Upcoming events" list, and the swag-eligibility estimate.
 */
export const SEASON = {
  name: "Google Skills Arcade 2026",
  registrationOpens: "2026-07-13T00:00:00Z",
  facilitatorStarts: "2026-07-13T00:00:00Z",
  facilitatorEnds: "2026-09-14T23:59:59Z",
};

/** Arcade Points prize tiers (point thresholds are cumulative). */
export interface Tier {
  name: string;
  points: number;
}

export const TIERS: Tier[] = [
  { name: "Arcade Trooper",  points: 50 },
  { name: "Arcade Ranger",   points: 75 },
  { name: "Arcade Champion", points: 95 },
  { name: "Arcade Legend",   points: 120 },
];

/** Milestones are usually defined by a combination of game + skill badge counts. */
export interface Milestone {
  id: number;
  label: string;
  gamesRequired: number;
  skillsRequired: number;
  bonusPoints: number;
}

export const MILESTONES: Milestone[] = [
  { id: 1, label: "Milestone 1", gamesRequired: 6, skillsRequired: 18, bonusPoints: 5 },
  { id: 2, label: "Milestone 2", gamesRequired: 8, skillsRequired: 34, bonusPoints: 15 },
  { id: 3, label: "Milestone 3", gamesRequired: 10, skillsRequired: 50, bonusPoints: 25 },
  { id: 4, label: "Ultimate Milestone", gamesRequired: 12, skillsRequired: 66, bonusPoints: 35 },
];

export interface BadgeBreakdown {
  games: number;
  skills: number;
  trivia: number;
  certifications: number;
  special: number;
  other: number;
  total: number;
}

export function getBadgeBreakdown(badges: Badge[]): BadgeBreakdown {
  const breakdown: BadgeBreakdown = {
    games: 0,
    skills: 0,
    trivia: 0,
    certifications: 0,
    special: 0,
    other: 0,
    total: badges.length,
  };
  for (const b of badges) {
    if (b.type === "game") breakdown.games++;
    else if (b.type === "skill") breakdown.skills++;
    else if (b.type === "trivia") breakdown.trivia++;
    else if (b.type === "certification") breakdown.certifications++;
    else if (b.type === "special") breakdown.special++;
    else breakdown.other++;
  }
  return breakdown;
}

export interface TierProgress extends Tier {
  achieved: boolean;
  current: boolean;
  pointsToGo: number;
  pct: number; // 0-100, clamped, relative to this tier's threshold
}

/** Returns every tier with progress info relative to the player's current points. */
export function getTierProgress(points: number): TierProgress[] {
  let currentSet = false;
  return TIERS.map((tier) => {
    const achieved = points >= tier.points;
    const current = !achieved && !currentSet;
    if (current) currentSet = true;
    return {
      ...tier,
      achieved,
      current,
      pointsToGo: Math.max(tier.points - points, 0),
      pct: Math.min(100, Math.round((points / tier.points) * 100)),
    };
  });
}

/** The highest tier the player currently qualifies for (or null if below Trooper). */
export function getCurrentTier(points: number): Tier | null {
  let best: Tier | null = null;
  for (const tier of TIERS) {
    if (points >= tier.points) best = tier;
  }
  return best;
}

/** The next tier the player hasn't reached yet (or null if all tiers cleared). */
export function getNextTier(points: number): Tier | null {
  return TIERS.find((t) => points < t.points) ?? null;
}

export interface MilestoneProgress extends Milestone {
  gamesDone: number;
  skillsDone: number;
  achieved: boolean;
  pct: number;
}

export function getMilestoneProgress(breakdown: BadgeBreakdown): MilestoneProgress[] {
  return MILESTONES.map((m) => {
    const gamesDone = Math.min(breakdown.games, m.gamesRequired);
    const skillsDone = Math.min(breakdown.skills, m.skillsRequired);
    const achieved =
      breakdown.games >= m.gamesRequired &&
      breakdown.skills >= m.skillsRequired;
    const pct = Math.round(
      ((gamesDone / m.gamesRequired) * 50 +
        (skillsDone / m.skillsRequired) * 50)
    );
    return { ...m, gamesDone, skillsDone, achieved, pct };
  });
}

export interface Countdown {
  totalMs: number;
  days: number;
  hours: number;
  minutes: number;
  expired: boolean;
}

export function getCountdown(targetIso: string, now: Date = new Date()): Countdown {
  const totalMs = new Date(targetIso).getTime() - now.getTime();
  if (totalMs <= 0) {
    return { totalMs: 0, days: 0, hours: 0, minutes: 0, expired: true };
  }
  const days = Math.floor(totalMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((totalMs / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((totalMs / (1000 * 60)) % 60);
  return { totalMs, days, hours, minutes, expired: false };
}
