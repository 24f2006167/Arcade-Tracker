import { Gamepad2, Brain, Wrench, ShieldCheck, Sparkles, Circle, ExternalLink, Calendar, BookOpen, type LucideIcon } from "lucide-react";
import Link from "next/link";
import type { Badge } from "@/lib/scraper";
import { slugify } from "@/lib/slugify";
import { SOLUTIONS } from "@/lib/solutions";

const TYPE_CONFIG: Record<
  Badge["type"],
  { icon: LucideIcon; text: string; chip: string; ring: string; bg: string }
> = {
  game:          { icon: Gamepad2,    text: "text-pink",       chip: "bg-pink/15",    ring: "hover:shadow-pink/25",   bg: "from-pink/10 to-transparent" },
  trivia:        { icon: Brain,       text: "text-cyan",       chip: "bg-cyan/15",    ring: "hover:shadow-cyan/25",   bg: "from-cyan/10 to-transparent" },
  skill:         { icon: Wrench,      text: "text-amber",      chip: "bg-amber/15",   ring: "hover:shadow-amber/25",  bg: "from-amber/10 to-transparent" },
  certification: { icon: ShieldCheck, text: "text-violet",     chip: "bg-violet/15",  ring: "hover:shadow-violet/25", bg: "from-violet/10 to-transparent" },
  special:       { icon: Sparkles,    text: "text-pink",       chip: "bg-pink/15",    ring: "hover:shadow-pink/25",   bg: "from-pink/10 to-transparent" },
  other:         { icon: Circle,      text: "text-mist-muted", chip: "bg-white/10",   ring: "hover:shadow-white/10",  bg: "from-white/5 to-transparent" },
};

/** Slugs of badges that have an entry in the solutions catalog */
const SOLUTION_SLUGS = new Set(SOLUTIONS.map((s) => s.badgeSlug));

function hasSolution(badgeTitle: string): boolean {
  return SOLUTION_SLUGS.has(slugify(badgeTitle));
}

export function BadgeGrid({ badges }: { badges: Badge[] }) {
  if (badges.length === 0) {
    return (
      <div className="glass rounded-2xl p-10 text-center text-mist-muted text-sm">
        No badges found. The profile may be private or empty.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {badges.map((badge, i) => {
        const cfg = TYPE_CONFIG[badge.type];
        const Icon = cfg.icon;
        const showSolutionBtn = badge.type === "skill" || badge.type === "game";
        const solutionSlug = slugify(badge.title);
        const solutionExists = hasSolution(badge.title);

        const inner = (
          <>
            {/* Badge image or fallback icon */}
            {badge.imageUrl ? (
              <div className={`relative w-full aspect-square rounded-xl overflow-hidden bg-gradient-to-b ${cfg.bg} flex items-center justify-center mb-1`}>
                <img
                  src={badge.imageUrl}
                  alt={badge.title}
                  className="w-full h-full object-contain p-1.5 transition-transform duration-300 group-hover:scale-105"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = "none";
                    target.nextElementSibling?.classList.remove("hidden");
                  }}
                />
                {/* fallback icon */}
                <div className={`hidden w-10 h-10 rounded-xl flex items-center justify-center ${cfg.chip}`}>
                  <Icon className={`w-5 h-5 ${cfg.text}`} strokeWidth={2.2} />
                </div>
              </div>
            ) : (
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${cfg.chip} mb-1`}>
                <Icon className={`w-5 h-5 ${cfg.text}`} strokeWidth={2.2} />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <span className={`text-[9px] uppercase tracking-widest ${cfg.text} opacity-90 font-semibold`}>
                {badge.type}
              </span>
              <p className="text-mist text-xs mt-0.5 leading-snug line-clamp-3 font-medium">{badge.title}</p>
            </div>

            {badge.earnedDate && (
              <div className="mt-auto pt-1.5 border-t border-white/8 flex items-center gap-1">
                <Calendar className="w-2.5 h-2.5 text-mist-muted shrink-0" />
                <p className="text-[10px] text-mist-muted">{badge.earnedDate}</p>
              </div>
            )}

            {badge.pageUrl && (
              <ExternalLink className="absolute top-2.5 right-2.5 w-3 h-3 text-mist-muted opacity-0 group-hover:opacity-70 transition-opacity" />
            )}
          </>
        );

        const sharedClass = `gradient-ring glass rounded-2xl group relative px-3 py-3 flex flex-col gap-2 transition-all hover:-translate-y-1 hover:shadow-lg ${cfg.ring} rise-in cursor-pointer`;

        const card = badge.pageUrl ? (
          <a
            key={`card-${badge.title}-${i}`}
            href={badge.pageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={sharedClass}
            style={{ animationDelay: `${Math.min(i, 12) * 0.04}s` }}
            title={`Open ${badge.title} on skills.google`}
          >
            {inner}
          </a>
        ) : (
          <div
            key={`card-${badge.title}-${i}`}
            className={sharedClass}
            style={{ animationDelay: `${Math.min(i, 12) * 0.04}s` }}
          >
            {inner}
          </div>
        );

        return (
          <div key={`${badge.title}-${i}`} className="flex flex-col gap-1.5" style={{ animationDelay: `${Math.min(i, 12) * 0.04}s` }}>
            {card}

            {/* Solution button — only for skill / game badges */}
            {showSolutionBtn && (
              solutionExists ? (
                <Link
                  href={`/solution/${solutionSlug}`}
                  className="flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-[10px] font-semibold transition-all
                    bg-gradient-to-r from-cyan/10 via-violet/10 to-pink/10
                    border border-cyan/20
                    text-cyan hover:text-void hover:from-cyan hover:via-violet hover:to-pink
                    hover:border-transparent hover:shadow-md hover:shadow-cyan/20
                    active:scale-[0.97]"
                  title={`View solution for ${badge.title}`}
                >
                  <BookOpen className="w-3 h-3" />
                  Solution
                </Link>
              ) : (
                <div
                  className="flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-[10px] font-medium
                    border border-white/8 text-mist-muted/50 cursor-default select-none"
                  title="Solution coming soon"
                >
                  <BookOpen className="w-3 h-3" />
                  Coming Soon
                </div>
              )
            )}
          </div>
        );
      })}
    </div>
  );
}

