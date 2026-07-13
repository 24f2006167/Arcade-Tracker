"use client";

import { useEffect, useState } from "react";
import { Trophy, Award, History, type LucideIcon } from "lucide-react";

function useCountUp(target: number, durationMs = 1100) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let raf: number;
    const start = performance.now();
    const hasDecimal = target % 1 !== 0;

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / durationMs, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const raw = target * eased;
      // On final frame use exact target; otherwise round for smooth animation
      const next = progress >= 1 ? target : (hasDecimal ? Math.round(raw * 2) / 2 : Math.round(raw));
      setValue(next);
      if (progress < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);

  return value;
}

const ACCENTS = {
  amber: { text: "text-amber", from: "from-amber/20" },
  cyan: { text: "text-cyan", from: "from-cyan/20" },
  pink: { text: "text-pink", from: "from-pink/20" },
} as const;

export function ScoreboardStrip({
  items,
}: {
  items: {
    label: string;
    value: number;
    accent: keyof typeof ACCENTS;
    icon: "trophy" | "award" | "history";
  }[];
}) {
  const icons: Record<string, LucideIcon> = { trophy: Trophy, award: Award, history: History };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {items.map((item, i) => {
        const Icon = icons[item.icon];
        const accent = ACCENTS[item.accent];
        return (
          <div
            key={item.label}
            className={`gradient-ring glass-strong rounded-2xl relative overflow-hidden px-6 py-6 flex flex-col gap-3 rise-in`}
            style={{ animationDelay: `${i * 0.07}s` }}
          >
            <div className={`absolute -top-10 -right-10 w-28 h-28 rounded-full bg-gradient-to-br ${accent.from} to-transparent blur-2xl`} />
            <div className="relative flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-[0.18em] text-mist-muted">
                {item.label}
              </span>
              <Icon className={`w-4 h-4 ${accent.text} opacity-80`} strokeWidth={2} />
            </div>
            <ScoreNumber value={item.value} className={accent.text} />
          </div>
        );
      })}
    </div>
  );
}

function ScoreNumber({ value, className }: { value: number; className: string }) {
  const display = useCountUp(value);
  // Show one decimal place when the value has a fractional part
  const formatted = display % 1 !== 0 ? display.toFixed(1) : String(Math.round(display)).padStart(2, "0");
  return (
    <span className={`relative font-score text-[28px] sm:text-[32px] leading-none ${className}`}>
      {formatted}
    </span>
  );
}

