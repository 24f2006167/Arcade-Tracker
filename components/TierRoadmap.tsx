import { getTierProgress } from "@/lib/arcade";

export function TierRoadmap({ points }: { points: number }) {
  const tiers = getTierProgress(points);

  return (
    <div className="glass-strong rounded-2xl px-6 py-6 space-y-5 rise-in">
      <h2 className="font-display text-sm font-semibold text-mist">Prize tier roadmap</h2>
      <div className="space-y-4">
        {tiers.map((tier) => (
          <div key={tier.name} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span
                className={`font-medium ${
                  tier.achieved ? "text-amber" : tier.current ? "text-cyan" : "text-mist-muted"
                }`}
              >
                {tier.name}
                {tier.achieved && " \u2713"}
              </span>
              <span className="text-mist-muted">
                {Math.min(points, tier.points)} / {tier.points}
                {tier.current && tier.pointsToGo > 0 && (
                  <span className="text-cyan"> &middot; {tier.pointsToGo} to go</span>
                )}
              </span>
            </div>
            <div className="h-2 rounded-full bg-white/5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  tier.achieved
                    ? "bg-gradient-to-r from-amber to-pink"
                    : "bg-gradient-to-r from-cyan to-violet"
                }`}
                style={{ width: `${tier.pct}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
