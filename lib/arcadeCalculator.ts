/**
 * lib/arcadeCalculator.ts
 * ---------------------------------------------------------------------------
 * Google Cloud Skills Arcade — Arcade Points calculation engine.
 *
 * WHY THIS FILE EXISTS
 * ---------------------------------------------------------------------------
 * The number shown on a Google Skills public profile ("100 Points") is the
 * profile's generic "Skills Points" total — it is NOT the same number the
 * official Arcade program uses to determine prize tiers ("33 Arcade
 * Points"). Arcade Points are derived from a specific subset of earned
 * badges (Arcade Games, Trivia Games, Skill Badges, Special/Bonus games,
 * Level badges, Certifications, Work Meets Play), each weighted
 * differently, on a per-season basis.
 *
 * This module NEVER reads profile.totalPoints. It re-derives Arcade Points
 * from the badge list itself, badge by badge, using a configurable rule
 * set (`SEASON_CONFIG` below).
 *
 * ---------------------------------------------------------------------------
 * VERIFIED AGAINST (2026-06-30):
 *   - https://go.cloudskillsboost.google/arcade (official "Arcade points: 1"
 *     labels shown per game: Arcade Base Camp, Arcade Trail, Arcade
 *     Adventure, Arcade Voyage, Logic Log — each = 1 Arcade point).
 *   - "Cloud Canvas" (Work Meets Play series): individual badges are NOT
 *     worth points per-badge. The official copy reads: "Complete all Work
 *     Meets Play badges from January 2026 to June 2026 to earn 7 Arcade
 *     Points, which will be added to your final prize counter tally" — i.e.
 *     a single completion bonus, not per-badge points.
 *   - https://arcadecalc.netlify.app/dashboard (third-party tracker),
 *     "Badge Categories" table observed: Base Camp 6 badges = 6 points (1
 *     each), Level Badges 8 badges = 8 points (1 each), Certification
 *     Badges 3 = 3 (1 each), Special Badges 2 = 4 (2 each), Trivia Badges
 *     12 = 12 (1 each), Lab Free Badges 0 = 0, Work Meets Play tracked
 *     separately as a bonus (shows "NaN" per-badge — confirming it is not
 *     a flat per-badge value).
 *
 * IMPORTANT — GAME NAMES ROTATE EVERY SEASON AND CANNOT BE KEYWORD-GUESSED
 * ---------------------------------------------------------------------------
 * Earlier versions of this file tried to detect Arcade games from generic
 * English words ("adventure", "trail", "voyage"...). That breaks the
 * moment Google ships a game with an unrelated creative name — e.g.
 * "Logic Log" or "Cloud Canvas" match none of those words. Google does not
 * reuse a fixed vocabulary; each month's game/skill/trivia badges get a
 * fresh themed name.
 *
 * The reliable fix is an explicit, per-season REGISTRY of badge titles
 * (`SEASON_CONFIG.gameBadgeTitles` / `specialBadgeTitles` /
 * `workMeetsPlay.badgeTitles`) that you update monthly as new games are
 * announced on go.cloudskillsboost.google/arcade. The generic keyword
 * rules are kept ONLY as a low-confidence fallback for titles that don't
 * match the registry, and such matches are flagged via `lowConfidence` so
 * the UI can surface them for manual review instead of silently trusting
 * a guess.
 * ---------------------------------------------------------------------------
 */

import { CATALOG_BADGES, ARCADE_GAMES } from "./catalog";

export type ArcadeCategory =
  | "arcade_game" // monthly named games (Base Camp, Trail, Adventure, Voyage, Logic Log, etc.) — registry-matched
  | "trivia_game" // weekly Trivia badges
  | "special_game" // one-off Special/Arcade Special games — registry-matched, worth more than a standard game
  | "work_meets_play" // monthly "Work Meets Play" series — 0 pts individually, bonus on full completion
  | "skill_badge" // standard "Skill Badge" labs
  | "lab_free_course" // Lab-Free courses — count toward badge totals but earn 0 pts
  | "certification" // Google Cloud certifications
  | "level_badge" // cumulative "Level N" completion badges — DO carry points (see evidence above)
  | "other"; // unrecognized — needs manual review, not assumed safe to score

export interface RawBadge {
  title: string;
  earnedDate?: string;
  imageUrl?: string;
}

export interface ClassifiedBadge extends RawBadge {
  category: ArcadeCategory;
  points: number;
  /** The rule id that matched this badge — useful for debugging / config tuning. */
  matchedRule: string;
  /**
   * True when this badge was classified via a generic keyword fallback
   * rather than an explicit title in this season's registry. Surface
   * these in the UI for manual review — they are guesses.
   */
  lowConfidence: boolean;
}

export interface PointValues {
  arcade_game: number;
  trivia_game: number;
  special_game: number;
  work_meets_play: number; // per-badge value; almost always 0 — bonus is separate, see workMeetsPlay config
  skill_badge: number;
  lab_free_course: number;
  certification: number;
  level_badge: number;
  other: number;
}

export interface TierConfig {
  name: string;
  points: number;
  /** Upper bound for this tier (points < next tier threshold). Undefined for the highest tier. */
  pointsMax?: number;
  /**
   * Official maximum prize spots for this tier — from Yugali (Google PM) June 10 2026 post:
   * Legend 2500, Champion 3000, Ranger 4000, Trooper 6000.
   * Waterfall: if a tier fills up you roll down to the next tier below.
   */
  spotsAvailable?: number;
}

export interface MilestoneConfig {
  id: number;
  label: string;
  gamesRequired: number;
  skillBadgesRequired: number;
  bonusPoints: number;
}

/** A one-time bonus for completing every badge in a themed monthly series (e.g. Work Meets Play). */
export interface CompletionBonusConfig {
  /** Exact/substring titles that belong to this series. */
  badgeTitles: string[];
  /** How many of `badgeTitles` must be earned to unlock the bonus. */
  requiredCount: number;
  bonusPoints: number;
  label: string;
}

export interface SeasonConfig {
  seasonId: string;
  seasonName: string;
  registrationOpens: string;
  facilitatorStarts: string;
  facilitatorEnds: string;
  /** Total games/skill badges available this season — drives progress bars. Update each season. */
  totalGamesAvailable: number;
  totalSkillBadgesAvailable: number;
  totalTriviaAvailable: number;
  /** Points awarded per category this season. */
  pointValues: PointValues;

  /**
   * Explicit per-season title registries. Update these every month as new
   * games are announced — this is the primary, high-confidence
   * classification path. Matching is case-insensitive substring match.
   */
  gameBadgeTitles: string[];
  specialBadgeTitles: string[];
  workMeetsPlay: CompletionBonusConfig;

  /** Cumulative Arcade Points prize tiers. */
  tiers: TierConfig[];
  /** Milestone definitions (games + skill badges thresholds -> bonus points). */
  milestones: MilestoneConfig[];
}

/**
 * ---------------------------------------------------------------------------
 * SEASON CONFIGURATION — update monthly as new games are announced on
 * go.cloudskillsboost.google/arcade. To roll over to a brand new season,
 * duplicate this object and swap `ACTIVE_SEASON_CONFIG` at the bottom.
 * ---------------------------------------------------------------------------
 */
export const SEASON_2026_CONFIG: SeasonConfig = {
  seasonId: "arcade-2026",
  seasonName: "Google Skills Arcade 2026",
  registrationOpens: "2026-07-13T11:30:00Z",
  facilitatorStarts: "2026-07-13T11:30:00Z",
  facilitatorEnds: "2026-09-14T23:59:59Z",

  totalGamesAvailable: 19,
  totalSkillBadgesAvailable: 66,
  totalTriviaAvailable: 12,

  pointValues: {
    arcade_game: 1, // confirmed: official Points System page — "For each Game badge... 1 Arcade point"
    trivia_game: 1, // confirmed via arcadecalc: 12 badges = 12 points
    special_game: 2, // observed via arcadecalc: 2 special badges = 4 points
    work_meets_play: 0, // confirmed: no per-badge points; see `workMeetsPlay` completion bonus below
    skill_badge: 0.5, // CONFIRMED official: "For every 2 Skill Badge completions... 1 Arcade Point"
    lab_free_course: 0, // confirmed via arcadecalc: 0 badges shown with 0 points
    certification: 1, // confirmed via arcadecalc: 3 badges = 3 points
    level_badge: 1, // confirmed via arcadecalc: 8 badges = 8 points (earlier assumption of 0 was wrong)
    other: 0,
  },

  // Add each month's released game title here as it's announced. Substring
  // match, case-insensitive, so "Arcade Base Camp" matches "base camp".
  // Confirmed from go.cloudskillsboost.google/arcade + skills.google/profile/badges
  // across Feb-Jul 2026: Base Camp, Trail, Adventure, Voyage are the four
  // recurring monthly games; Logic Log / Dialogue Design / Skill Up Summer
  // are one-off bonus games that have appeared in addition to the four.
  gameBadgeTitles: [
    "base camp",
    "arcade trail",
    "arcade adventure",
    "arcade voyage",
    "logic log",
    "dialogue design",
    "skill up summer",
    // Work Life Refresh is the Jan 2026 Work Meets Play badge. arcadecalc counts
    // it as a regular game badge (1 pt) rather than tracking it under Work Meets Play.
    "work life refresh",
    // Add new monthly game names here as Google announces them each month.
  ],

  // One-off special/bonus games that are worth more than a standard game (2 pts each).
  // Verified against arcadecalc.netlify.app which shows "Special Badges: 2 = 4 pts (2 each)".
  // This includes:
  //   - Festive/themed one-off bonus games (e.g. Holi-istic Infrastructures in Mar 2026)
  //   - "Certification Zone" arcade collection badges (appear as Special in arcadecalc)
  specialBadgeTitles: [
    "arcade special",
    "special monthly game",
    "new monthly game",
    // Festive/themed one-off bonus games (Jan-Jun 2026 season):
    "holi-istic",        // Holi-istic Infrastructures — Holi-themed bonus game (Mar 2026)
    "holi istic",        // alternate spacing variant
    "holistic infra",
    // Certification Zone badges appear as Special in arcadecalc (2 pts, not 1 pt cert):
    "certification zone", // e.g. "Google Skills Arcade Certification Zone January 2026"
  ],

  // Work Meets Play series: 0 points per badge.
  // NOTE: "Work Life Refresh" (Jan 2026 WMP badge) is intentionally NOT listed here—
  // arcadecalc classifies it as a regular game/trivia badge worth 1 pt. We treat it
  // as an arcade_game so it scores correctly.
  workMeetsPlay: {
    label: "Work Meets Play (Jan-Jun 2026)",
    badgeTitles: [
      "work meets play",
      "cloud canvas",
    ],
    requiredCount: 6, // one per month, Jan through Jun 2026
    bonusPoints: 7,
  },

  tiers: [
    // Official spot limits confirmed by Yugali (Google PM) — discuss.google.dev June 10 2026
    // Waterfall system: if a tier fills up, eligible players roll down to the tier below.
    { name: "Arcade Trooper",  points: 50,  pointsMax: 74,  spotsAvailable: 6000 },
    { name: "Arcade Ranger",   points: 75,  pointsMax: 94,  spotsAvailable: 4000 },
    { name: "Arcade Champion", points: 95,  pointsMax: 119, spotsAvailable: 3000 },
    { name: "Arcade Legend",   points: 120, spotsAvailable: 2500 },
  ],

  milestones: [
    { id: 1, label: "Milestone 1", gamesRequired: 6, skillBadgesRequired: 18, bonusPoints: 5 },
    { id: 2, label: "Milestone 2", gamesRequired: 8, skillBadgesRequired: 34, bonusPoints: 15 },
    { id: 3, label: "Milestone 3", gamesRequired: 10, skillBadgesRequired: 50, bonusPoints: 25 },
    { id: 4, label: "Ultimate Milestone", gamesRequired: 12, skillBadgesRequired: 66, bonusPoints: 35 },
  ],
};

/** The config the rest of the app should use. Swap this when a new season starts. */
export const ACTIVE_SEASON_CONFIG: SeasonConfig = SEASON_2026_CONFIG;

/**
 * The date window for the current cohort season.
 * Only badges earned within this window count toward Arcade Points.
 * Jan 1 2026 00:00 UTC → Dec 31 2026 23:59:59 UTC
 */
export const COHORT_START = new Date("2026-01-01T00:00:00Z");
export const COHORT_END   = new Date("2026-12-31T23:59:59Z");

/**
 * ---------------------------------------------------------------------------
 * CLASSIFICATION
 * ---------------------------------------------------------------------------
 * Order of precedence:
 *  1. Trivia (structural — Google always includes the word "trivia")
 *  2. Work Meets Play registry (explicit titles)
 *  3. Special game registry (explicit titles)
 *  4. Arcade game registry (explicit titles)            <- high confidence
 *  5. Certification / Level / Lab-free / Skill badge     <- structural keywords
 *  6. Generic game-name keyword fallback                 <- LOW CONFIDENCE
 *  7. other                                               <- needs manual review
 */
function titleIncludesAny(titleLower: string, candidates: string[]): boolean {
  return candidates.some((c) => titleLower.includes(c.toLowerCase()));
}

export function classifyBadgeTitle(
  title: string,
  config: SeasonConfig = ACTIVE_SEASON_CONFIG
): { category: ArcadeCategory; ruleId: string; lowConfidence: boolean } {
  const t = title.toLowerCase().trim();

  // 0. Catalog Lookup (High confidence matching from catalog.ts)
  const catalogMatch = 
    CATALOG_BADGES.find((b) => b.title.toLowerCase().trim() === t) ||
    ARCADE_GAMES.find((b) => b.title.toLowerCase().trim() === t);

  if (catalogMatch) {
    if (catalogMatch.type === "skill") {
      return { category: "skill_badge", ruleId: "catalog-skill", lowConfidence: false };
    }
    if (catalogMatch.type === "game") {
      const isSpecial = config.specialBadgeTitles.some((s) => t.includes(s.toLowerCase()));
      if (isSpecial) {
        return { category: "special_game", ruleId: "catalog-special", lowConfidence: false };
      }
      return { category: "arcade_game", ruleId: "catalog-game", lowConfidence: false };
    }
    if (catalogMatch.type === "trivia") {
      return { category: "trivia_game", ruleId: "catalog-trivia", lowConfidence: false };
    }
  }

  if (t.includes("trivia")) {
    return { category: "trivia_game", ruleId: "trivia", lowConfidence: false };
  }

  if (titleIncludesAny(t, config.workMeetsPlay.badgeTitles)) {
    return { category: "work_meets_play", ruleId: "work-meets-play-registry", lowConfidence: false };
  }

  if (titleIncludesAny(t, config.specialBadgeTitles)) {
    return { category: "special_game", ruleId: "special-registry", lowConfidence: false };
  }

  if (titleIncludesAny(t, config.gameBadgeTitles)) {
    return { category: "arcade_game", ruleId: "game-registry", lowConfidence: false };
  }

  if (t.includes("certified") || t.includes("certification")) {
    return { category: "certification", ruleId: "certification-keyword", lowConfidence: false };
  }

  if (/^level\s*[1-9]\d*\b/.test(t) || t.includes("game level")) {
    return { category: "level_badge", ruleId: "level-keyword", lowConfidence: false };
  }

  if (t.includes("lab-free") || t.includes("lab free")) {
    return { category: "lab_free_course", ruleId: "lab-free-keyword", lowConfidence: false };
  }

  const SKILL_KEYWORDS = [
    "skill badge", "get started with", "build", "implement", "perform", 
    "create", "manage", "deploy", "configure", "secure", "integrate", 
    "analyze", "optimize", "store", "process", "develop", "automate", 
    "automating", "architect", "architecting", "explore"
  ];
  if (titleIncludesAny(t, SKILL_KEYWORDS)) {
    return { category: "skill_badge", ruleId: "skill-badge-keyword", lowConfidence: false };
  }

  // --- Weekly "Sprint N" sub-badges ---------------------------------------
  // e.g. "Arcade March 2026 Sprint 1/2/3/4". These are weekly progress
  // components of a monthly Base Camp/Trail badge.
  //
  // VERIFIED via arcadecalc.netlify.app (Jun 2026): arcadecalc shows
  // "Level Badges: 8 = 8 pts (1 each)" for a profile with 8 sprint badges
  // (Feb Sprint 1-4 + Mar Sprint 1-4). Sprint badges score as level_badge
  // (1 pt each), NOT as 0 pts. Updated to match the reference.
  if (/\bsprint\s*\d/.test(t)) {
    return { category: "level_badge", ruleId: "sprint-as-level", lowConfidence: false };
  }

  // --- Low-confidence fallback ------------------------------------------
  // Generic theme words Google has used historically. These are guesses —
  // any badge classified here is flagged `lowConfidence: true` so the UI
  // can ask you to confirm it and (ideally) add its exact title to
  // `gameBadgeTitles` in the config above.
  const GENERIC_GAME_WORDS = ["adventure", "trail", "voyage", "quest"];
  if (titleIncludesAny(t, GENERIC_GAME_WORDS)) {
    return { category: "arcade_game", ruleId: "generic-keyword-fallback", lowConfidence: true };
  }

  return { category: "other", ruleId: "fallback-other", lowConfidence: true };
}

export function classifyBadges(
  badges: RawBadge[],
  config: SeasonConfig = ACTIVE_SEASON_CONFIG
): ClassifiedBadge[] {
  return badges.map((badge) => {
    const { category, ruleId, lowConfidence } = classifyBadgeTitle(badge.title, config);
    return {
      ...badge,
      category,
      points: config.pointValues[category],
      matchedRule: ruleId,
      lowConfidence,
    };
  });
}

/**
 * ---------------------------------------------------------------------------
 * AGGREGATE CALCULATION
 * ---------------------------------------------------------------------------
 */
export interface ArcadeBreakdown {
  arcadeGames: number;
  triviaGames: number;
  specialGames: number;
  workMeetsPlayBadges: number;
  skillBadges: number;
  labFreeCourses: number;
  certifications: number;
  levelBadges: number;
  other: number;
  totalBadges: number;
  /** Badges that were classified via the low-confidence fallback — surface these for manual review. */
  needsReview: ClassifiedBadge[];
}

export interface MilestoneResult extends MilestoneConfig {
  gamesDone: number;
  skillBadgesDone: number;
  achieved: boolean;
  pct: number;
}

export interface TierResult extends TierConfig {
  achieved: boolean;
  current: boolean;
  pointsToGo: number;
  pct: number;
  /**
   * Waterfall: if this tier's spot pool fills up, players roll down to the
   * next tier below. First-come first-served starting from Legend tier.
   */
  waterfallNote?: string;
}

export interface SwagEligibility {
  currentTier: TierConfig | null;
  eligible: boolean;
  nextTier: TierConfig | null;
  pointsNeeded: number;
}

export interface WorkMeetsPlayResult {
  label: string;
  badgesEarned: number;
  requiredCount: number;
  achieved: boolean;
  bonusPoints: number;
  pct: number;
}

export interface ArcadeResult {
  seasonId: string;
  classifiedBadges: ClassifiedBadge[];
  breakdown: ArcadeBreakdown;
  /** Points earned directly from per-badge categories, before any bonuses. */
  basePoints: number;
  /** Sum of bonus points unlocked from achieved milestones + completion bonuses (e.g. Work Meets Play). */
  bonusPoints: number;
  /** basePoints + bonusPoints — THIS is the number to show as "Arcade Points". */
  totalArcadePoints: number;
  milestones: MilestoneResult[];
  workMeetsPlay: WorkMeetsPlayResult;
  tiers: TierResult[];
  swag: SwagEligibility;
}

function emptyBreakdown(): ArcadeBreakdown {
  return {
    arcadeGames: 0,
    triviaGames: 0,
    specialGames: 0,
    workMeetsPlayBadges: 0,
    skillBadges: 0,
    labFreeCourses: 0,
    certifications: 0,
    levelBadges: 0,
    other: 0,
    totalBadges: 0,
    needsReview: [],
  };
}

export function computeBreakdown(classified: ClassifiedBadge[]): ArcadeBreakdown {
  const breakdown = emptyBreakdown();
  breakdown.totalBadges = classified.length;
  for (const badge of classified) {
    switch (badge.category) {
      case "arcade_game":
        breakdown.arcadeGames++;
        break;
      case "trivia_game":
        breakdown.triviaGames++;
        break;
      case "special_game":
        breakdown.specialGames++;
        break;
      case "work_meets_play":
        breakdown.workMeetsPlayBadges++;
        break;
      case "skill_badge":
        breakdown.skillBadges++;
        break;
      case "lab_free_course":
        breakdown.labFreeCourses++;
        break;
      case "certification":
        breakdown.certifications++;
        break;
      case "level_badge":
        breakdown.levelBadges++;
        break;
      default:
        breakdown.other++;
    }
    if (badge.lowConfidence) breakdown.needsReview.push(badge);
  }
  return breakdown;
}

export function computeMilestones(
  breakdown: ArcadeBreakdown,
  config: SeasonConfig = ACTIVE_SEASON_CONFIG
): MilestoneResult[] {
  return config.milestones.map((m) => {
    const gamesForMilestones = breakdown.arcadeGames + breakdown.specialGames;
    const gamesDone = Math.min(gamesForMilestones, m.gamesRequired);
    const skillBadgesDone = Math.min(breakdown.skillBadges, m.skillBadgesRequired);

    const achieved =
      gamesForMilestones >= m.gamesRequired &&
      breakdown.skillBadges >= m.skillBadgesRequired;

    const pct = Math.round(
      (gamesDone / m.gamesRequired) * 50 +
      (skillBadgesDone / m.skillBadgesRequired) * 50
    );
    return {
      ...m,
      gamesDone,
      skillBadgesDone,
      achieved,
      pct,
    };
  });
}

export function computeWorkMeetsPlay(
  breakdown: ArcadeBreakdown,
  config: SeasonConfig = ACTIVE_SEASON_CONFIG
): WorkMeetsPlayResult {
  const { label, requiredCount, bonusPoints } = config.workMeetsPlay;
  const badgesEarned = breakdown.workMeetsPlayBadges;
  const achieved = badgesEarned >= requiredCount;
  return {
    label,
    badgesEarned,
    requiredCount,
    achieved,
    bonusPoints: achieved ? bonusPoints : 0,
    pct: Math.min(100, Math.round((badgesEarned / requiredCount) * 100)),
  };
}

export function computeTiers(
  totalArcadePoints: number,
  config: SeasonConfig = ACTIVE_SEASON_CONFIG
): TierResult[] {
  let currentSet = false;
  return config.tiers.map((tier) => {
    const achieved = totalArcadePoints >= tier.points;
    const current = !achieved && !currentSet;
    if (current) currentSet = true;
    return {
      ...tier,
      achieved,
      current,
      pointsToGo: Math.max(tier.points - totalArcadePoints, 0),
      pct: Math.min(100, Math.round((totalArcadePoints / tier.points) * 100)),
    };
  });
}

export function computeSwagEligibility(
  totalArcadePoints: number,
  config: SeasonConfig = ACTIVE_SEASON_CONFIG
): SwagEligibility {
  let currentTier: TierConfig | null = null;
  let nextTier: TierConfig | null = null;
  for (const tier of config.tiers) {
    if (totalArcadePoints >= tier.points) currentTier = tier;
    else if (!nextTier) nextTier = tier;
  }
  return {
    currentTier,
    eligible: currentTier !== null,
    nextTier,
    pointsNeeded: nextTier ? Math.max(nextTier.points - totalArcadePoints, 0) : 0,
  };
}

/**
 * Main entry point. Pass the raw badge list scraped from a public profile —
 * never pass `profile.totalPoints`. Returns everything the dashboard needs.
 *
 * Only badges earned within the current cohort window (COHORT_START–COHORT_END)
 * are counted toward Arcade Points. Badges from prior cohorts are excluded.
 */
export function calculateArcadeResult(
  badges: RawBadge[],
  config: SeasonConfig = ACTIVE_SEASON_CONFIG,
  bonusMilestoneCompleted?: boolean
): ArcadeResult {
  // Step 1: classify ALL scraped badges (needed for full badge list display)
  const allClassified = classifyBadges(badges, config);

  // Step 2: restrict scoring to current-cohort badges only (Jan 1 – Dec 31 2026)
  const classifiedBadges = allClassified.filter((b) => {
    if (!b.earnedDate) return false;
    const d = new Date(b.earnedDate);
    if (isNaN(d.getTime())) return false;
    return d >= COHORT_START && d <= COHORT_END;
  });

  const breakdown = computeBreakdown(classifiedBadges);

  // Milestones count ONLY badges earned during the Facilitator window (July 13 to September 14, 2026)
  // Normalized to UTC dates (start of day) to ensure badges completed on July 13 are correctly included
  const facilitatorBadges = classifiedBadges.filter((b) => {
    if (!b.earnedDate) return false;
    const localDate = new Date(b.earnedDate);
    if (isNaN(localDate.getTime())) return false;
    const d = new Date(Date.UTC(localDate.getFullYear(), localDate.getMonth(), localDate.getDate()));
    const start = new Date("2026-07-13T00:00:00Z");
    const end = new Date("2026-09-14T23:59:59Z");
    return d >= start && d <= end;
  });

  const facilitatorBreakdown = computeBreakdown(facilitatorBadges);
  const milestones = computeMilestones(facilitatorBreakdown, config);
  const workMeetsPlay = computeWorkMeetsPlay(breakdown, config);

  const achievedMilestones = milestones.filter((m) => m.achieved);

  // Base points: sum of cohort-only badge points
  const basePoints = classifiedBadges.reduce((sum, b) => sum + b.points, 0);

  // Milestone bonus: highest achieved milestone (non-cumulative)
  let milestoneBonus = 0;
  if (achievedMilestones.length > 0) {
    const highest = [...achievedMilestones].sort((a, b) => b.id - a.id)[0];
    milestoneBonus = highest.bonusPoints;
  }

  // Bonus milestone points (10 pts)
  const targetGearBadges = [
    "gear",
    "create your first gemini enterprise application",
    "engineer ai agents with agent development kit",
    "deploy multi-agent architectures",
    "orchestrate multi-agent workflows with gemini enterprise"
  ];
  const hasGearBadge = classifiedBadges.some(b => {
    const title = b.title.toLowerCase();
    return targetGearBadges.some(tb => title.includes(tb));
  });
  const isBonusMilestoneCompleted = bonusMilestoneCompleted ?? hasGearBadge;
  const bonusMilestonePoints = isBonusMilestoneCompleted ? 10 : 0;

  const bonusPoints = milestoneBonus + bonusMilestonePoints;
  const totalArcadePoints = basePoints + bonusPoints;

  const tiers = computeTiers(totalArcadePoints, config);
  const swag = computeSwagEligibility(totalArcadePoints, config);

  return {
    seasonId: config.seasonId,
    classifiedBadges,
    breakdown,
    basePoints,
    bonusPoints,
    totalArcadePoints,
    milestones,
    workMeetsPlay,
    tiers,
    swag,
  };
}
