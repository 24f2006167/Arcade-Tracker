"use client";

import { useEffect, useRef, useState } from "react";

const BOOT_LINES = [
  "> Initialising STS Arcade Tracker...",
  "> Establishing secure connection...",
  "> Loading cryptographic modules...",
  "> Connecting to Google Skills API...",
  "> Fetching badge payload...",
  "> Decrypting profile data...",
  "> Mounting HUD visualizer...",
  "> Syncing leaderboard metrics...",
  "> STATUS [200 OK] — READY",
];

/**
 * Full-screen hacker boot animation that overlays the page for ~2.5s on first load,
 * then dissolves away. Only plays once per session.
 */
export default function HackerBootScreen() {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);
  const [lineIdx, setLineIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [glitch, setGlitch] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  // ── Canvas matrix rain ──────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const cols = Math.floor(canvas.width / 14);
    const drops = Array(cols).fill(1);
    const chars = "アイウエオカキクケコサシスセソタチツテトナニヌネノ01ABCDEF{}[]<>/\\|";

    const draw = () => {
      ctx.fillStyle = "rgba(5,6,15,0.06)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.font = "12px monospace";

      for (let i = 0; i < drops.length; i++) {
        const ch = chars[Math.floor(Math.random() * chars.length)];
        const x = i * 14;
        const y = drops[i] * 14;

        // Top character is bright
        ctx.fillStyle = "#22e5e5";
        ctx.fillText(ch, x, y);

        // Trailing characters fade to violet
        ctx.fillStyle = `rgba(179,137,255,${Math.random() * 0.4 + 0.1})`;
        ctx.fillText(chars[Math.floor(Math.random() * chars.length)], x, y - 14);

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
    // Progress bar: 0→100 over ~2.2s
    const total = 2200;
    const start = performance.now();
    const progFrame = () => {
      const pct = Math.min(((performance.now() - start) / total) * 100, 100);
      setProgress(pct);
      if (pct < 100) requestAnimationFrame(progFrame);
    };
    requestAnimationFrame(progFrame);

    // Terminal lines: one every 240ms
    const lineTimer = setInterval(() => {
      setLineIdx((prev) => Math.min(prev + 1, BOOT_LINES.length - 1));
    }, 240);

    // Glitch flash at ~1.8s
    const glitchTimeout = setTimeout(() => {
      setGlitch(true);
      setTimeout(() => setGlitch(false), 200);
    }, 1800);

    // Fade out at 2.5s
    const fadeTimeout = setTimeout(() => setFading(true), 2500);

    // Remove DOM at 3s
    const removeTimeout = setTimeout(() => setVisible(false), 3050);

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
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden pointer-events-none"
      style={{
        background: "#05060f",
        transition: fading ? "opacity 0.55s ease" : undefined,
        opacity: fading ? 0 : 1,
      }}
    >
      {/* Matrix rain canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ opacity: 0.35 }}
      />

      {/* Hacker figure silhouette */}
      <div className="absolute inset-0 flex items-center justify-center" aria-hidden>
        <div
          className="w-[420px] h-[420px] md:w-[560px] md:h-[560px] bg-contain bg-center bg-no-repeat opacity-25"
          style={{ backgroundImage: "url('/hacker-bg.png')" }}
        />
        {/* Glow overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="w-64 h-64 rounded-full"
            style={{
              background: "radial-gradient(circle, rgba(34,229,229,0.12) 0%, rgba(179,137,255,0.06) 50%, transparent 70%)",
              filter: "blur(40px)",
              animation: "pulse-glow 2.5s ease-in-out infinite",
            }}
          />
        </div>
      </div>

      {/* Center HUD panel */}
      <div
        className="relative z-10 flex flex-col items-center gap-6 w-full max-w-md px-6"
        style={{
          filter: glitch ? "drop-shadow(0 0 8px #22e5e5)" : undefined,
          transform: glitch ? `translate(${Math.random() * 4 - 2}px, 0)` : undefined,
        }}
      >
        {/* Logo / Title */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            {/* Animated hexagon badge */}
            <svg width="36" height="36" viewBox="0 0 36 36" className="animate-spin" style={{ animationDuration: "8s" }}>
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
              className="font-mono text-xl font-bold tracking-widest text-transparent"
              style={{ WebkitTextStrokeWidth: "1px", WebkitTextStrokeColor: "#22e5e5" }}
            >
              STS
            </span>
          </div>
          <p className="font-mono text-[10px] tracking-[0.3em] text-cyan/60 uppercase">
            Arcade Tracker · System Boot
          </p>
        </div>

        {/* Terminal log window */}
        <div className="w-full rounded-xl border border-cyan/20 bg-black/60 backdrop-blur-md p-4 font-mono text-[10px] leading-relaxed">
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
                color: line.includes("200 OK") ? "#22e5e5"
                  : line.includes(">") ? "#b389ff"
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
            <span>DECRYPTING PAYLOAD</span>
            <span>{Math.floor(progress)}%</span>
          </div>
        </div>

        {/* Scanlines across the whole overlay */}
        <div className="absolute inset-0 pointer-events-none hud-scanlines" style={{ opacity: 0.04 }} />
      </div>

      {/* Corner HUD accents */}
      <div className="absolute top-4 left-4 text-[8px] font-mono text-cyan/25 tracking-widest">
        STS//SECURE<br />VER 3.1.0
      </div>
      <div className="absolute top-4 right-4 text-[8px] font-mono text-cyan/25 tracking-widest text-right">
        SYSTEM BOOT<br />INITIALISED
      </div>
      <div className="absolute bottom-4 left-4 text-[8px] font-mono text-cyan/20">
        {new Date().toISOString().slice(0, 19).replace("T", " ")} UTC
      </div>
      <div className="absolute bottom-4 right-4 text-[8px] font-mono text-cyan/20 text-right">
        ARCADE TRACKER<br />SECURE MODE
      </div>

      {/* Corner bracket decorations */}
      {[
        "top-3 left-3 border-t border-l",
        "top-3 right-3 border-t border-r",
        "bottom-3 left-3 border-b border-l",
        "bottom-3 right-3 border-b border-r",
      ].map((cls, i) => (
        <div key={i} className={`absolute w-6 h-6 border-cyan/30 ${cls}`} />
      ))}
    </div>
  );
}
