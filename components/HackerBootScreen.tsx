"use client";

import { useEffect, useRef, useState, useCallback } from "react";

const BOOT_LINES = [
  "> Loading STS Arcade Tracker...",
  "> Fetching your badges...",
  "> Loading your progress...",
  "> Connecting to the cloud...",
  "> Syncing leaderboard data...",
  "> Preparing your dashboard...",
  "> Calibrating the HUD...",
  "> STATUS [READY] — Welcome back",
];

/**
 * Full-screen cyberpunk boot animation that overlays the page on first load.
 * - Total duration: ≤1.8 s (tap/click to skip at any time).
 * - Matrix rain density + opacity scales with viewport width so it doesn't
 *   overwhelm small screens.
 * - Only plays once per session (sessionStorage flag).
 */
export default function HackerBootScreen() {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);
  const [lineIdx, setLineIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [glitch, setGlitch] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  // Resolve density params based on current viewport width
  const getDensityConfig = () => {
    if (typeof window === "undefined") return { colSpacing: 16, opacity: 0.3 };
    const w = window.innerWidth;
    if (w < 480) return { colSpacing: 22, opacity: 0.15 };   // mobile — sparse
    if (w < 768) return { colSpacing: 18, opacity: 0.22 };   // large phone
    if (w < 1024) return { colSpacing: 16, opacity: 0.28 };  // tablet
    return { colSpacing: 14, opacity: 0.35 };                  // desktop — full
  };

  // ── Skip handler ────────────────────────────────────────────────────────────
  const skip = useCallback(() => {
    setProgress(100);
    setFading(true);
    setTimeout(() => setVisible(false), 500);
  }, []);

  // ── Canvas matrix rain ──────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let { colSpacing, opacity } = getDensityConfig();
    canvas.style.opacity = String(opacity);

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      // Recalculate density on resize
      const cfg = getDensityConfig();
      colSpacing = cfg.colSpacing;
      opacity = cfg.opacity;
      canvas.style.opacity = String(opacity);
    };
    resize();
    window.addEventListener("resize", resize);

    const chars = "アイウエオカキクケコサシスセソタチツテトナニヌネノ01ABCDEF{}[]<>/\\|";
    let drops: number[] = [];

    const initDrops = () => {
      const cols = Math.floor(canvas.width / colSpacing);
      drops = Array(cols).fill(1);
    };
    initDrops();

    const draw = () => {
      ctx.fillStyle = "rgba(5,6,15,0.06)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.font = `${Math.max(10, colSpacing - 4)}px monospace`;

      const currentCols = Math.floor(canvas.width / colSpacing);
      // Sync drops array length if window was resized
      if (drops.length !== currentCols) initDrops();

      for (let i = 0; i < drops.length; i++) {
        const ch = chars[Math.floor(Math.random() * chars.length)];
        const x = i * colSpacing;
        const y = drops[i] * colSpacing;

        ctx.fillStyle = "#22e5e5";
        ctx.fillText(ch, x, y);

        ctx.fillStyle = `rgba(179,137,255,${Math.random() * 0.4 + 0.1})`;
        ctx.fillText(chars[Math.floor(Math.random() * chars.length)], x, y - colSpacing);

        if (y > canvas.height && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      }
      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  // ── Boot sequence: progress bar + terminal lines ───────────────────────────
  useEffect(() => {
    // Total visible duration: 1.5 s progress + 0.5 s fade = 2 s wall time max
    const TOTAL_MS = 1500;
    const start = performance.now();

    const progFrame = () => {
      const pct = Math.min(((performance.now() - start) / TOTAL_MS) * 100, 100);
      setProgress(pct);
      if (pct < 100) requestAnimationFrame(progFrame);
    };
    requestAnimationFrame(progFrame);

    // Terminal lines: spread 8 lines over 1.4 s → ~175 ms each
    const lineTimer = setInterval(() => {
      setLineIdx((prev) => Math.min(prev + 1, BOOT_LINES.length - 1));
    }, 175);

    // Glitch flash at ~1.1 s
    const glitchTimeout = setTimeout(() => {
      setGlitch(true);
      setTimeout(() => setGlitch(false), 180);
    }, 1100);

    // Fade out at 1.5 s
    const fadeTimeout = setTimeout(() => setFading(true), 1500);

    // Remove DOM at 2.05 s
    const removeTimeout = setTimeout(() => setVisible(false), 2050);

    return () => {
      clearInterval(lineTimer);
      clearTimeout(glitchTimeout);
      clearTimeout(fadeTimeout);
      clearTimeout(removeTimeout);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      aria-hidden
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden"
      style={{
        background: "#05060f",
        transition: fading ? "opacity 0.55s ease" : undefined,
        opacity: fading ? 0 : 1,
        // Allow pointer events only on the skip button (handled below via child)
        pointerEvents: fading ? "none" : "auto",
      }}
    >
      {/* Matrix rain canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
      />

      {/* Hacker figure silhouette */}
      <div className="absolute inset-0 flex items-center justify-center" aria-hidden>
        <div
          className="w-64 h-64 sm:w-[420px] sm:h-[420px] md:w-[560px] md:h-[560px] bg-contain bg-center bg-no-repeat opacity-20"
          style={{ backgroundImage: "url('/hacker-bg.png')" }}
        />
        {/* Glow overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="w-48 h-48 sm:w-64 sm:h-64 rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(34,229,229,0.12) 0%, rgba(179,137,255,0.06) 50%, transparent 70%)",
              filter: "blur(40px)",
              animation: "pulse-glow 2.5s ease-in-out infinite",
            }}
          />
        </div>
      </div>

      {/* Center HUD panel */}
      <div
        className="relative z-10 flex flex-col items-center gap-4 sm:gap-6 w-full max-w-xs sm:max-w-md px-4 sm:px-6"
        style={{
          filter: glitch ? "drop-shadow(0 0 8px #22e5e5)" : undefined,
          transform: glitch ? `translate(${Math.random() * 4 - 2}px, 0)` : undefined,
        }}
      >
        {/* Logo / Title */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <svg
              width="32"
              height="32"
              viewBox="0 0 36 36"
              className="animate-spin shrink-0"
              style={{ animationDuration: "8s" }}
            >
              <polygon
                points="18,2 33,10 33,26 18,34 3,26 3,10"
                fill="none"
                stroke="#22e5e5"
                strokeWidth="1.5"
                opacity="0.8"
              />
              <polygon
                points="18,7 28,12.5 28,23.5 18,29 8,23.5 8,12.5"
                fill="none"
                stroke="#b389ff"
                strokeWidth="0.8"
                opacity="0.5"
              />
            </svg>
            <span
              className="font-mono text-lg sm:text-xl font-bold tracking-widest text-transparent"
              style={{ WebkitTextStrokeWidth: "1px", WebkitTextStrokeColor: "#22e5e5" }}
            >
              STS
            </span>
          </div>
          <p className="font-mono text-[10px] tracking-[0.25em] sm:tracking-[0.3em] text-cyan/60 uppercase">
            Arcade Tracker · Loading
          </p>
        </div>

        {/* Terminal log window */}
        <div className="w-full rounded-xl border border-cyan/20 bg-black/60 backdrop-blur-md p-3 sm:p-4 font-mono text-[10px] leading-relaxed">
          <div className="flex items-center gap-1.5 mb-3 border-b border-white/5 pb-2">
            <span className="w-2 h-2 rounded-full bg-red-400/70" />
            <span className="w-2 h-2 rounded-full bg-amber/60" />
            <span className="w-2 h-2 rounded-full bg-green-400/60" />
            <span className="ml-2 text-white/20 text-[9px]">boot.log</span>
          </div>
          {BOOT_LINES.slice(0, lineIdx + 1).map((line, i) => (
            <div
              key={i}
              className="flex gap-2"
              style={{
                color: line.includes("READY")
                  ? "#22e5e5"
                  : line.includes(">")
                  ? "#b389ff"
                  : "#8e8aab",
                opacity: i < lineIdx ? 0.6 : 1,
              }}
            >
              {line}
            </div>
          ))}
          {/* Blinking cursor */}
          <span
            className="inline-block w-1.5 h-3 bg-cyan/70 ml-0.5"
            style={{ animation: "pulse-glow 0.8s ease-in-out infinite" }}
          />
        </div>

        {/* Progress bar */}
        <div className="w-full space-y-2">
          <div className="h-[2px] bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-100"
              style={{
                width: `${progress}%`,
                background: "linear-gradient(90deg, #22e5e5, #b389ff, #ff6fb3)",
                boxShadow: "0 0 8px rgba(34,229,229,0.6)",
              }}
            />
          </div>
          <div className="flex justify-between text-[9px] font-mono text-cyan/40 tracking-widest uppercase">
            <span>Loading</span>
            <span>{Math.floor(progress)}%</span>
          </div>
        </div>

        {/* Scanlines across the whole overlay */}
        <div className="absolute inset-0 pointer-events-none hud-scanlines" style={{ opacity: 0.04 }} />
      </div>

      {/* Tap-to-skip pill — only interactive element */}
      <button
        onClick={skip}
        aria-label="Skip boot animation"
        className="absolute bottom-8 sm:bottom-10 left-1/2 -translate-x-1/2 z-20 px-4 py-1.5 rounded-full border border-cyan/20 bg-black/40 backdrop-blur-sm font-mono text-[10px] text-cyan/50 hover:text-cyan hover:border-cyan/50 transition-all duration-200 active:scale-95"
        style={{ pointerEvents: fading ? "none" : "auto" }}
      >
        tap to skip →
      </button>

      {/* Corner HUD accents */}
      <div className="absolute top-4 left-4 text-[8px] font-mono text-cyan/25 tracking-widest pointer-events-none">
        STS//ARCADE<br />VER 3.1.0
      </div>
      <div className="absolute top-4 right-4 text-[8px] font-mono text-cyan/25 tracking-widest text-right pointer-events-none">
        ARCADE TRACKER<br />LOADING
      </div>
      <div className="absolute bottom-4 left-4 text-[8px] font-mono text-cyan/20 pointer-events-none">
        {new Date().toISOString().slice(0, 19).replace("T", " ")} UTC
      </div>
      <div className="absolute bottom-4 right-4 text-[8px] font-mono text-cyan/20 text-right pointer-events-none">
        ARCADE TRACKER<br />READY
      </div>

      {/* Corner bracket decorations */}
      {[
        "top-3 left-3 border-t border-l",
        "top-3 right-3 border-t border-r",
        "bottom-3 left-3 border-b border-l",
        "bottom-3 right-3 border-b border-r",
      ].map((cls, i) => (
        <div key={i} className={`absolute w-6 h-6 border-cyan/30 pointer-events-none ${cls}`} />
      ))}
    </div>
  );
}
