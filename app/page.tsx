"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Sparkles, Trophy, Zap } from "lucide-react";

export default function Home() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");

      // Save to localStorage switcher list
      if (typeof window !== "undefined" && data.profileId) {
        const stored = localStorage.getItem("arcade_profiles");
        let list = [];
        try {
          list = stored ? JSON.parse(stored) : [];
        } catch (_) {}

        const bonusMilestoneAnnounced = !!(data.bonusMilestone?.description && data.bonusMilestone.description.length > 100 && !data.bonusMilestone.description.includes("will be posted here soon"));
        const autoBonusPoints = (bonusMilestoneAnnounced && data.bonusMilestone?.completed) ? 10 : 0;
        const finalPoints = (data.arcadeResult?.totalArcadePoints ?? 0) + autoBonusPoints;

        list = list.filter((p: any) => p.id !== data.profileId);
        list.push({
          id: data.profileId,
          name: data.name,
          points: finalPoints,
        });
        localStorage.setItem("arcade_profiles", JSON.stringify(list));
        localStorage.setItem("last_profile_id", data.profileId);
      }

      router.push(`/dashboard/${data.profileId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch profile");
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center text-center gap-14 py-12">
      <div className="space-y-6 max-w-2xl rise-in">
        <span className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 text-xs text-mist-muted">
          <Sparkles className="w-3.5 h-3.5 text-violet" />
          Public profile tracking, reinvented
        </span>
        <h1 className="font-display text-5xl sm:text-6xl font-semibold leading-[1.05] text-mist">
          Track your{" "}
          <span className="gradient-text">Google Skills Arcade</span>{" "}
          run, beautifully.
        </h1>
        <p className="text-mist-muted max-w-md mx-auto text-base">
          Paste your public Skills Boost profile link or ID. We&apos;ll pull
          your points, badges, and start tracking your progress over time.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="w-full max-w-xl flex flex-col gap-3 rise-in"
        style={{ animationDelay: "0.1s" }}
      >
        <div className="glass-strong gradient-ring rounded-2xl p-2 flex flex-col sm:flex-row gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="https://www.skills.google/public_profiles/..."
            className="flex-1 bg-transparent px-4 py-3 text-sm text-mist placeholder:text-mist-muted focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="group rounded-xl bg-gradient-to-r from-cyan via-violet to-pink text-void font-medium px-6 py-3 text-sm transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? "Fetching..." : "Track profile"}
            {!loading && (
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            )}
          </button>
        </div>
        {error && <p className="text-sm text-pink text-left px-2">{error}</p>}
      </form>

      <div
        className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl rise-in"
        style={{ animationDelay: "0.2s" }}
      >
        {[
          { icon: Trophy, label: "Live points & badges", color: "text-amber" },
          { icon: Zap, label: "History trend charts", color: "text-cyan" },
          { icon: Sparkles, label: "Global leaderboard", color: "text-pink" },
        ].map((f) => (
          <div key={f.label} className="glass rounded-2xl px-5 py-4 flex items-center gap-3">
            <f.icon className={`w-4 h-4 ${f.color}`} />
            <span className="text-sm text-mist-muted">{f.label}</span>
          </div>
        ))}
      </div>

      <p className="text-xs text-mist-muted max-w-md rise-in" style={{ animationDelay: "0.3s" }}>
        Your profile must have{" "}
        <span className="text-mist">Make profile public</span> enabled in
        Skills Boost account settings for this to work.
      </p>
    </div>
  );
}
