import * as cheerio from "cheerio";

export interface Badge {
  title: string;
  type: "game" | "trivia" | "skill" | "certification" | "special" | "other";
  earnedDate?: string;
  imageUrl?: string;
  /** Direct link to the badge's page on skills.google — use as href for badge cards. */
  pageUrl?: string;
}

export interface ProfileData {
  name: string;
  publicId: string;
  totalPoints: number;
  totalBadges: number;
  badges: Badge[];
  raw?: unknown;
}

const PROFILE_BASE = "https://www.skills.google/public_profiles/";

const FETCH_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
};

function classifyBadge(title: string): Badge["type"] {
  const t = title.toLowerCase();
  if (t.includes("trivia")) return "trivia";
  if (
    t.includes("arcade") ||
    t.includes("base camp") ||
    t.includes("arcade trail") ||
    t.includes("arcade adventure") ||
    t.includes("arcade voyage") ||
    t.includes("logic log") ||
    t.includes("dialogue design") ||
    t.includes("skill up summer") ||
    t.includes("game") ||
    t.includes("voyage") ||
    t.includes("trail") ||
    t.includes("adventure")
  )
    return "game";
  if (t.includes("certified") || t.includes("certification"))
    return "certification";
  if (
    t.includes("skill badge") ||
    t.includes("get started with") ||
    t.includes("build and") ||
    t.includes("level ")
  )
    return "skill";
  return "other";
}

/**
 * Parse the public profile HTML to extract:
 *   - display name
 *   - total skills points (shown as "N points" in bold)
 *   - list of badges directly with their titles, images, and dates.
 */
function parseProfileHtml(html: string, publicId: string): {
  name: string;
  totalPoints: number;
  badges: Badge[];
} {
  const $ = cheerio.load(html);

  // Name from og:title → "Sujeet C | Google Skills"
  const ogTitle = $('meta[property="og:title"]').attr("content") ?? "";
  const name =
    ogTitle.replace(/\s*\|.*$/, "").trim() ||
    $("title").text().replace(/\s*\|.*$/, "").trim() ||
    "Unknown";

  // Total skills points (NOT arcade points — kept for reference)
  const pointsText = $("strong")
    .filter((_, el) => /\d+\s*points/i.test($(el).text()))
    .first()
    .text();
  const pointsMatch = pointsText.match(/(\d+)/);
  const totalPoints = pointsMatch ? parseInt(pointsMatch[1], 10) : 0;

  const badges: Badge[] = [];

  $(".profile-badge").each((_, el) => {
    const anchor = $(el).find("a.badge-image");
    const href = anchor.attr("href") ?? "";
    const badgeUrl = href.startsWith("http")
      ? href
      : `https://www.skills.google${href}`;
    const imageUrl = anchor.find("img").attr("src") ?? "";
    
    // Real title is in .ql-title-medium
    const title = $(el).find(".ql-title-medium").text().trim();
    
    // Earned date is in .ql-body-medium
    const earnedText = $(el).find(".ql-body-medium").text().trim();
    const dateMatch = earnedText.match(/Earned\s+([A-Za-z]+\s+\d+,\s+\d{4})/);
    const earnedDate = dateMatch ? dateMatch[1] : "";

    if (title && badgeUrl && badgeUrl.includes("/badges/")) {
      badges.push({
        title,
        type: classifyBadge(title),
        earnedDate: earnedDate || undefined,
        imageUrl: imageUrl || undefined,
        pageUrl: badgeUrl,
      });
    }
  });

  return { name, totalPoints, badges };
}

/**
 * Main entry point.
 *
 * Fast single-phase scrape:
 *  1. Fetch the public profile page → extract name, points, and all badges directly from the document HTML.
 *  This avoids making concurrent network requests for each individual badge,
 *  drastically improving performance and avoiding function timeouts in serverless environments.
 */
export async function fetchPublicProfile(publicId: string): Promise<ProfileData> {
  const profileUrl = `${PROFILE_BASE}${publicId}`;
  const res = await fetch(profileUrl, {
    headers: FETCH_HEADERS,
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    throw new Error(
      `Failed to fetch profile (HTTP ${res.status}). Check the public ID/URL.`
    );
  }

  // Detect redirects to landing pages (which indicates the profile doesn't exist or is private)
  if (res.url && !res.url.toLowerCase().includes(publicId.toLowerCase())) {
    throw new Error(
      "Profile is private or does not exist. Please check the public ID/URL and ensure visibility is set to public."
    );
  }

  const html = await res.text();
  const { name, totalPoints, badges } = parseProfileHtml(html, publicId);

  const lowerName = name.toLowerCase();
  if (lowerName === "google skills" || lowerName === "google cloud skills boost" || lowerName === "skills") {
    throw new Error(
      "Profile is private or does not exist. Please check the public ID/URL and ensure visibility is set to public."
    );
  }

  return {
    name,
    publicId,
    totalPoints,
    totalBadges: badges.length,
    badges,
  };
}

export function extractPublicIdFromUrl(input: string): string {
  const trimmed = input.trim();
  const match = trimmed.match(/public_profiles\/([a-zA-Z0-9-]+)/);
  return match ? match[1] : trimmed;
}

export interface BonusMilestoneInfo {
  title: string;
  description: string;
  completed: boolean;
  completedBadgeTitle: string;
  pointsAwarded: number;
}

export async function fetchBonusMilestoneInfo(userBadges: { title: string }[]): Promise<BonusMilestoneInfo> {
  const description = `Introducing the Bonus Milestone 🏆

For the first time ever, there is more than one way to earn "Bonus Points" in the Arcade Facilitator program and this time we want to make sure that you actually step away with some industry-ready skills after completing this and even create your FIRST AI Agent.

To earn an EXTRA 10 Bonus points:
1. Complete the 4 GEAR Skill Badges on Google Cloud Skills Boost:
   - Create Your First Gemini Enterprise Application
   - Engineer AI Agents with Agent Development Kit (ADK)
   - Deploy Multi-Agent Architectures
   - Orchestrate Multi-agent Workflows with Gemini Enterprise
2. Setup Google Cloud Free Trial Billing (with $300 credits for 90 days if not already set up).
3. Build your first AI Agent using Vertex AI (Agent Platform) and grant permission to the verifier email address.
4. Submit project details (Unique Project Name and Unique Billing ID) for verification.`;

  let completed = false;
  let completedBadgeTitle = "";
  const targetBadges = [
    "gear",
    "create your first gemini enterprise application",
    "engineer ai agents with agent development kit",
    "deploy multi-agent architectures",
    "orchestrate multi-agent workflows with gemini enterprise"
  ];
  for (const b of userBadges) {
    if (!b.title) continue;
    const lowerTitle = b.title.toLowerCase();
    if (targetBadges.some(tb => lowerTitle.includes(tb))) {
      completed = true;
      completedBadgeTitle = b.title;
      break;
    }
  }

  return {
    title: "Bonus Milestone",
    description,
    completed,
    completedBadgeTitle,
    pointsAwarded: completed ? 10 : 0
  };
}
