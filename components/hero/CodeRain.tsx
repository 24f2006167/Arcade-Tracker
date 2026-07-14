"use client";

import { useEffect, useRef } from "react";

type Theme = "dark" | "light";

export default function CodeRain({ reduced, theme }: { reduced: boolean; theme?: Theme }) {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const themeRef     = useRef<Theme>(theme ?? "dark");

  // Keep themeRef current so the canvas loop can read it without re-mounting
  useEffect(() => {
    themeRef.current = theme ?? "dark";
  }, [theme]);

  // ── Immediately clear canvas to new bg color when theme changes ──
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx    = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const isLight = (theme ?? "dark") === "light";
    // Hard-clear: paint the full base color so accumulated dark paint is wiped
    ctx.globalAlpha = 1;
    ctx.fillStyle   = isLight ? "#f0f2ff" : "#05060f";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, [theme]);

  useEffect(() => {
    const canvas    = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    let animationFrameId: number;
    let isVisible = true;

    const observer = new IntersectionObserver(
      ([entry]) => { isVisible = entry.isIntersecting; },
      { threshold: 0.05 }
    );
    observer.observe(container);

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let columns      = 0;
    let drops: number[] = [];
    let columnGlyphs: string[][] = [];

    const tokens = [
      "#include <string>", "using namespace std;", "char buf[11];",
      "int a, b, c;", "sscanf(s.c_str(), \"%d-%d-%d\", &a, &b, &c);",
      "sprintf(buf, \"%02d/%02d/%d\", c, b, a);",
      "string find_date(string card_no)", "int main()",
      "cout << find_date(\"2012-09-28\") << endl;",
      "system(\"pause\");", "return 0;",
      "2166.846", "3645.508", "1092.483", "8314.920",
      "[ACCESS GRANTED]", "[SYSTEM OVERRIDE]", "[COMPILING...]",
      "char", "int", "string", "cout", "endl",
      "0x00", "0xff", "0", "1", "x", "y", "z", "[]", "{}", "()", "++", "--",
    ];

    const resizeCanvas = () => {
      const rect    = container.getBoundingClientRect();
      canvas.width  = rect.width  || window.innerWidth;
      canvas.height = rect.height || window.innerHeight;
      columns       = Math.ceil(canvas.width / 36);
      drops         = [];
      columnGlyphs  = [];
      for (let i = 0; i < columns; i++) {
        drops[i]        = Math.random() * -100;
        columnGlyphs[i] = Array.from({ length: 50 }, () => tokens[Math.floor(Math.random() * tokens.length)]);
      }
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const fontSize = 12;
    let lastTime   = 0;
    const fps      = 24;
    const interval = 1000 / fps;

    const draw = (timestamp: number) => {
      if (!isVisible || reduced) {
        animationFrameId = requestAnimationFrame(draw);
        return;
      }

      const elapsed = timestamp - lastTime;
      if (elapsed < interval) {
        animationFrameId = requestAnimationFrame(draw);
        return;
      }
      lastTime = timestamp - (elapsed % interval);

      const isLight = themeRef.current === "light";

      // Background fade — lighter overlay on light mode (warm white tint)
      ctx.fillStyle = isLight
        ? "rgba(240, 242, 255, 0.30)"   // soft lavender-white wipe
        : "rgba(5, 6, 15, 0.22)";       // dark void wipe
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Colors: muted dark ink tones in light mode, vivid neon in dark mode
      const darkColors  = ["#22e5e5", "#00d2ff", "#00a2ff", "#b389ff", "#ff6fb3"];
      const lightColors = ["#0891b2", "#7c3aed", "#0e7490", "#6d28d9", "#be185d"];
      const colors = isLight ? lightColors : darkColors;

      ctx.font = `bold ${fontSize}px monospace`;

      for (let i = 0; i < columns; i++) {
        const x = i * 36;
        const y = drops[i] * (fontSize + 6);

        const glyphIndex = Math.floor(drops[i]) % (columnGlyphs[i]?.length || 40);
        const text       = columnGlyphs[i]?.[Math.abs(glyphIndex)] || "1";

        ctx.fillStyle = Math.random() > 0.985
          ? (isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.08)")
          : colors[(i + Math.floor(drops[i])) % colors.length];

        ctx.shadowBlur  = 0;
        // Light mode: slightly more visible glyphs
        ctx.globalAlpha = isLight
          ? 0.025 + (i % 5) * 0.006
          : 0.015 + (i % 5) * 0.005;

        ctx.fillText(text, x, y);
        ctx.globalAlpha = 1.0;

        if (y > canvas.height && Math.random() > 0.985) {
          drops[i]        = 0;
          columnGlyphs[i] = Array.from({ length: 50 }, () => tokens[Math.floor(Math.random() * tokens.length)]);
        }

        drops[i] += 0.5;
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    if (reduced) {
      // Static grid for reduced-motion — theme-aware
      const isLight = themeRef.current === "light";
      ctx.fillStyle = isLight ? "#f0f2ff" : "#05060f";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = isLight
        ? "rgba(124, 58, 237, 0.06)"
        : "rgba(179, 137, 255, 0.04)";
      ctx.lineWidth = 1;
      const gridSpacing = 40;
      ctx.beginPath();
      for (let x = 0; x < canvas.width; x += gridSpacing) { ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); }
      for (let y = 0; y < canvas.height; y += gridSpacing) { ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); }
      ctx.stroke();
    } else {
      animationFrameId = requestAnimationFrame(draw);
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", resizeCanvas);
      observer.disconnect();
    };
  }, [reduced]); // intentionally exclude theme — themeRef handles live updates

  return (
    <div ref={containerRef} className="absolute inset-0 w-full h-full pointer-events-none select-none z-0">
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
}
