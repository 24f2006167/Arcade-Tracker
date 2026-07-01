import { Gamepad2, Brain, Wrench, ShieldCheck, Sparkles, Circle, ExternalLink, Calendar, type LucideIcon } from "lucide-react";
import type { Badge } from "@/lib/scraper";

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

        if (badge.pageUrl) {
          return (
            <a
              key={`${badge.title}-${i}`}
              href={badge.pageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={sharedClass}
              style={{ animationDelay: `${Math.min(i, 12) * 0.04}s` }}
              title={`Open ${badge.title} on skills.google`}
            >
              {inner}
            </a>
          );
        }

        return (
          <div
            key={`${badge.title}-${i}`}
            className={sharedClass}
            style={{ animationDelay: `${Math.min(i, 12) * 0.04}s` }}
          >
            {inner}
          </div>
        );
      })}
    </div>
  );
}
