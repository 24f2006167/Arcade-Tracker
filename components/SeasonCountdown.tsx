"use client";

import { useEffect, useState } from "react";
import { Timer, Calendar } from "lucide-react";
import { getCountdown, SEASON } from "@/lib/arcade";

export function SeasonCountdown() {
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const facilitatorStart = new Date(SEASON.facilitatorStarts);
  const programStarted   = now >= facilitatorStart;
  const endCountdown     = getCountdown(SEASON.facilitatorEnds, now);
  const startCountdown   = getCountdown(SEASON.facilitatorStarts, now);

  // Pick the right countdown to display
  const countdown = programStarted ? endCountdown : startCountdown;
  const label     = endCountdown.expired
    ? "Facilitator Program ended"
    : programStarted
    ? "Arcade Facilitator Program ends in"
    : "Facilitator Program starts in";

  return (
    <div className="glass rounded-2xl px-6 py-4 flex items-center justify-between gap-4 rise-in">
      <div className="flex items-center gap-2.5">
        {programStarted ? (
          <Timer className="w-4 h-4 text-pink" />
        ) : (
          <Calendar className="w-4 h-4 text-violet" />
        )}
        <div className="flex flex-col">
          <span className="text-xs text-mist-muted">{label}</span>
          <a
            href="https://rsvp.withgoogle.com/events/arcade-facilitator/home"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[9px] text-cyan hover:underline mt-0.5"
          >
            Official Program Website →
          </a>
        </div>
      </div>
      {!countdown.expired && (
        <div className="flex items-center gap-3 font-score text-[11px] text-mist">
          <span>{String(countdown.days).padStart(2, "0")}d</span>
          <span className="text-mist-muted">:</span>
          <span>{String(countdown.hours).padStart(2, "0")}h</span>
          <span className="text-mist-muted">:</span>
          <span>{String(countdown.minutes).padStart(2, "0")}m</span>
        </div>
      )}
    </div>
  );
}
