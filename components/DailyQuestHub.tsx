"use client";

import { useEffect, useState } from "react";
import { Flame, CheckCircle2, Circle, ExternalLink, Sparkles, Trophy, ArrowRight } from "lucide-react";

interface Quest {
  id: string;
  title: string;
  category: string;
  reward: string;
  link: string;
}

const DAILY_QUESTS: Quest[] = [
  {
    id: "quest-checkin",
    title: "Daily Arcade Tracker Check-in",
    category: "Streak",
    reward: "+1 Streak Point",
    link: "#",
  },
  {
    id: "quest-game",
    title: "Complete 1 July Arcade Game Lab",
    category: "Arcade Game",
    reward: "+1 Arcade Point",
    link: "https://go.cloudskillsboost.google/arcade",
  },
  {
    id: "quest-skill",
    title: "Finish 1 Skill Badge Challenge",
    category: "Skill Badge",
    reward: "Progress to +1 Point",
    link: "https://www.cloudskillsboost.google/catalog",
  },
  {
    id: "quest-bonus",
    title: "Build Vertex AI Agent for Bonus Milestone",
    category: "Bonus Challenge",
    reward: "+10 Bonus Points",
    link: "https://rsvp.withgoogle.com/events/arcade-facilitator/bonus-milestone",
  },
];

export function DailyQuestHub() {
  const [streak, setStreak] = useState(1);
  const [completed, setCompleted] = useState<Record<string, boolean>>({ "quest-checkin": true });

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      // Manage daily streak in localStorage
      const todayStr = new Date().toISOString().slice(0, 10);
      const lastCheck = localStorage.getItem("arcade_last_checkin");
      const currentStreak = Number(localStorage.getItem("arcade_streak_count") || "1");

      if (lastCheck !== todayStr) {
        const lastDate = lastCheck ? new Date(lastCheck) : null;
        const now = new Date();
        const diffDays = lastDate ? Math.floor((now.getTime() - lastDate.getTime()) / 86400000) : 0;
        
        let newStreak = currentStreak;
        if (diffDays === 1) {
          newStreak += 1;
        } else if (diffDays > 1) {
          newStreak = 1;
        }
        localStorage.setItem("arcade_last_checkin", todayStr);
        localStorage.setItem("arcade_streak_count", String(newStreak));
        setStreak(newStreak);
      } else {
        setStreak(currentStreak);
      }

      // Saved quest states for today
      const savedQuests = localStorage.getItem(`arcade_quests_${todayStr}`);
      if (savedQuests) {
        setCompleted(JSON.parse(savedQuests));
      }
    } catch (_) {}
  }, []);

  const toggleQuest = (id: string) => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const updated = { ...completed, [id]: !completed[id] };
    setCompleted(updated);
    try {
      localStorage.setItem(`arcade_quests_${todayStr}`, JSON.stringify(updated));
    } catch (_) {}
  };

  const completedCount = Object.values(completed).filter(Boolean).length;
  const totalQuests = DAILY_QUESTS.length;
  const pct = Math.round((completedCount / totalQuests) * 100);

  return (
    <section className="glass-strong rounded-2xl p-6 border border-white/10 space-y-5 rise-in relative overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber/20 to-pink/20 border border-amber/30 flex items-center justify-center text-amber shrink-0">
            <Flame className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-sm font-bold text-mist">Daily Arcade Quests</h2>
              <span className="inline-flex items-center gap-1 text-[10px] bg-amber/15 text-amber border border-amber/30 px-2.5 py-0.5 rounded-full font-bold">
                <Flame className="w-3 h-3 fill-amber" /> {streak} Day Streak
              </span>
            </div>
            <p className="text-xs text-mist-muted mt-0.5">
              Check in daily, complete quests, and keep your Arcade momentum alive!
            </p>
          </div>
        </div>

        {/* Progress pill */}
        <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-2 rounded-xl shrink-0">
          <Trophy className="w-4 h-4 text-cyan" />
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-mist-muted gap-4">
              <span>Today&apos;s Quests</span>
              <span className="text-cyan font-bold">{completedCount} / {totalQuests} ({pct}%)</span>
            </div>
            <div className="w-28 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-cyan via-violet to-pink rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {DAILY_QUESTS.map((q) => {
          const isDone = Boolean(completed[q.id]);
          return (
            <div
              key={q.id}
              onClick={() => toggleQuest(q.id)}
              className={`glass rounded-xl p-4 border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                isDone
                  ? "border-green-500/30 bg-green-500/5 hover:border-green-500/50"
                  : "border-white/5 hover:border-cyan/30 hover:bg-white/5"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <button type="button" className="shrink-0 text-mist hover:scale-110 transition-transform">
                  {isDone ? (
                    <CheckCircle2 className="w-5 h-5 text-green-400 fill-green-400/20" />
                  ) : (
                    <Circle className="w-5 h-5 text-mist-muted" />
                  )}
                </button>
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-md ${
                      isDone ? "bg-green-500/20 text-green-300" : "bg-white/10 text-mist-muted"
                    }`}>
                      {q.category}
                    </span>
                    <span className="text-[10px] text-amber font-semibold">{q.reward}</span>
                  </div>
                  <p className={`text-xs font-medium leading-snug truncate ${isDone ? "text-mist-muted line-through" : "text-mist"}`}>
                    {q.title}
                  </p>
                </div>
              </div>

              {q.link !== "#" && (
                <a
                  href={q.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="shrink-0 p-2 rounded-lg bg-white/5 hover:bg-cyan/20 text-mist-muted hover:text-cyan border border-white/5 transition-all"
                  title="Open in Google Cloud Skills Boost"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between pt-1 text-[11px] text-mist-muted border-t border-white/5">
        <span className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber" />
          <span>Complete all 4 daily quests to earn top community badges!</span>
        </span>
        <a
          href="https://go.cloudskillsboost.google/arcade"
          target="_blank"
          rel="noopener noreferrer"
          className="text-cyan hover:underline flex items-center gap-1 font-semibold"
        >
          Launch Games Catalog <ArrowRight className="w-3 h-3" />
        </a>
      </div>
    </section>
  );
}
