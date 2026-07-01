import { CheckCircle2 } from "lucide-react";
import { getMilestoneProgress, type BadgeBreakdown } from "@/lib/arcade";

export function MilestoneTracker({ breakdown }: { breakdown: BadgeBreakdown }) {
  const milestones = getMilestoneProgress(breakdown);

  return (
    <section className="space-y-4">
      <h2 className="font-display text-sm font-semibold text-mist">Milestones</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {milestones.map((m, i) => (
          <div
            key={m.id}
            className={`gradient-ring glass rounded-2xl px-5 py-5 space-y-3 rise-in ${
              m.achieved ? "shadow-lg shadow-amber/10" : ""
            }`}
            style={{ animationDelay: `${i * 0.06}s` }}
          >
            <div className="flex items-center justify-between">
              <span className="font-display text-sm text-mist">{m.label}</span>
              {m.achieved ? (
                <CheckCircle2 className="w-4 h-4 text-amber" />
              ) : (
                <span className="text-[11px] text-mist-muted">+{m.bonusPoints} bonus</span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-mist-muted">Games</span>
                <p className="text-mist font-medium">
                  {m.gamesDone} / {m.gamesRequired}
                </p>
              </div>
              <div>
                <span className="text-mist-muted">Skills</span>
                <p className="text-mist font-medium">
                  {m.skillsDone} / {m.skillsRequired}
                </p>
              </div>
            </div>
            <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  m.achieved ? "bg-amber" : "bg-gradient-to-r from-cyan to-pink"
                }`}
                style={{ width: `${m.pct}%` }}
              />
            </div>
            {m.achieved && (
              <p className="text-[11px] text-amber">Unlocked &middot; +{m.bonusPoints} bonus points</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
