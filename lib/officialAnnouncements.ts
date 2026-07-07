/**
 * lib/officialAnnouncements.ts
 * ---------------------------------------------------------------------------
 * Static verified announcements from Yugali (Google PM) extracted from:
 * https://discuss.google.dev/t/google-skills-arcade-2026-tiers/371066
 *
 * These are used as fallback seeds when the live Discourse API is unavailable.
 * Shared between /api/official-data and /api/announcements routes.
 */

export interface OfficialAnnouncement {
  id: string;
  title: string;
  summary: string;
  officialLink: string;
  publishedAt: string;
  author: string;
  authorUrl: string;
  isGoogleOfficial: boolean;
  source: "yugali-official" | "discourse" | "manual";
  imageUrl?: string;
}

export const YUGALI_ANNOUNCEMENTS: OfficialAnnouncement[] = [
  {
    id: "yugali-tiers-2026",
    title: "Google Skills Arcade 2026 Prize Tiers Announced",
    summary:
      "Big news! The 2026 prize tiers are officially announced: Trooper (50 pts, 6,000 spots), Ranger (75 pts, 4,000 spots), Champion (95 pts, 3,000 spots), Legend (120 pts, 2,500 spots). First-come first-served with a Waterfall System — if a tier fills up you roll down to the next.",
    officialLink: "https://discuss.google.dev/t/google-skills-arcade-2026-tiers/371066",
    publishedAt: "2026-06-10T10:13:26Z",
    author: "Yugali",
    authorUrl: "https://discuss.google.dev/u/Yugali",
    isGoogleOfficial: true,
    source: "yugali-official",
    imageUrl:
      "https://d2yds90mtvelsl.cloudfront.net/optimized/4X/f/4/b/f4bea84fd55c15790011f8811d47d338b05fa221_2_624x184.png",
  },
  {
    id: "yugali-facilitator-2026",
    title: "Arcade Facilitator Program 2026 Launches July 13",
    summary:
      "Your buddies in the Google Skills Arcade land on July 13, 2026, to ensure you never have to fly solo. Facilitator program runs July 13 – September 14, 2026. Milestones count ONLY badges earned during the Facilitator window.",
    officialLink: "https://rsvp.withgoogle.com/events/arcade-facilitator/home",
    publishedAt: "2026-06-10T10:13:26Z",
    author: "Yugali",
    authorUrl: "https://discuss.google.dev/u/Yugali",
    isGoogleOfficial: true,
    source: "yugali-official",
  },
  {
    id: "yugali-waterfall-2026",
    title: "Waterfall Prize System: How It Works",
    summary:
      "The Prize Counter is first-come, first-served starting from the Legend Tier. If a tier's prize pool fills up, your eligibility safely rolls down to the next tier below. The earlier you lock in your points, the higher up the waterfall you stay!",
    officialLink: "https://discuss.google.dev/t/google-skills-arcade-2026-tiers/371066",
    publishedAt: "2026-06-10T10:13:26Z",
    author: "Yugali",
    authorUrl: "https://discuss.google.dev/u/Yugali",
    isGoogleOfficial: true,
    source: "yugali-official",
  },
  {
    id: "yugali-points-system-2026",
    title: "Official Points System: Games, Skill Badges & Milestones",
    summary:
      "1 Arcade Point per Game badge (Arcade Adventure, Voyage, Trail, Base Camp). 1 Arcade Point per 2 Skill Badges. Bonus points for completing Milestones during the Facilitator window (Jul 13 – Sep 14, 2026).",
    officialLink: "https://rsvp.withgoogle.com/events/arcade-facilitator/points-system",
    publishedAt: "2026-06-10T00:00:00Z",
    author: "Yugali",
    authorUrl: "https://discuss.google.dev/u/Yugali",
    isGoogleOfficial: true,
    source: "yugali-official",
  },
  {
    id: "yugali-prize-counter-2026",
    title: "Prize Counter Opens After the 2026 Season Ends",
    summary:
      "The Arcade Prize Counter will open shortly after the 2026 season wraps up at the end of the year. Check the official Arcade Page weekly for remaining spots per tier. A real-time tracker will be updated every single week.",
    officialLink: "https://go.cloudskillsboost.google/arcade",
    publishedAt: "2026-06-10T10:13:26Z",
    author: "Yugali",
    authorUrl: "https://discuss.google.dev/u/Yugali",
    isGoogleOfficial: true,
    source: "yugali-official",
  },
];

/** Official tier spot limits — from Yugali's June 10, 2026 announcement */
export const OFFICIAL_TIERS = [
  {
    name: "Arcade Trooper",
    pointsMin: 50,
    pointsMax: 74 as number | null,
    spotsAvailable: 6000,
    color: "#22e5e5",
    description: "First 6,000 players to reach or roll down to this tier",
  },
  {
    name: "Arcade Ranger",
    pointsMin: 75,
    pointsMax: 94 as number | null,
    spotsAvailable: 4000,
    color: "#a78bfa",
    description: "First 4,000 players (including waterfall from Champion)",
  },
  {
    name: "Arcade Champion",
    pointsMin: 95,
    pointsMax: 119 as number | null,
    spotsAvailable: 3000,
    color: "#f97316",
    description: "First 3,000 players (including waterfall from Legend)",
  },
  {
    name: "Arcade Legend",
    pointsMin: 120,
    pointsMax: null as number | null,
    spotsAvailable: 2500,
    color: "#fbbf24",
    description: "First 2,500 players — first-come first-served from the top",
  },
];
