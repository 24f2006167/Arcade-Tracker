"use client";

import { useEffect, useRef } from "react";

export default function CodeRain({ reduced }: { reduced: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    let animationFrameId: number;
    let isVisible = true;

    // IntersectionObserver to pause loop when scrolled out of view
    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
      },
      { threshold: 0.05 }
    );
    observer.observe(container);

    const resizeCanvas = () => {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Matrix rain configuration
    const fontSize = 14;
    const columns = Math.ceil(canvas.width / 24); // Spacing columns
    const drops: number[] = [];
    const columnGlyphs: string[][] = [];

    // Initialize drops and cached glyphs per column
    const tokens = [
      "0", "1", "x", "y", "z", "f", "g", "const", "=>", "{}", "[]", "()", 
      "async", "await", "fetch", "api", "points", "badges", "run", "STS", 
      "Arcade", "Google", "track", "id", "url", "db", "res", "map", "filter", 
      "&&", "||", "===", "npm", "fiber", "drei"
    ];

    for (let i = 0; i < columns; i++) {
      drops[i] = Math.random() * -100; // Start at different random negative positions
      columnGlyphs[i] = Array.from({ length: 40 }, () => tokens[Math.floor(Math.random() * tokens.length)]);
    }

    // Gradients for colors (Teal, Violet, Pink)
    const colors = ["#22e5e5", "#b389ff", "#ff6fb3"];

    let lastTime = 0;
    const fps = 24; // Limit fps for performance
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

      // Semi-transparent background clear to create the trail fade effect
      ctx.fillStyle = "rgba(5, 6, 15, 0.12)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = `bold ${fontSize}px monospace`;

      for (let i = 0; i < columns; i++) {
        const x = i * 24;
        const y = drops[i] * fontSize;

        // Select glyph
        const glyphIndex = Math.floor(drops[i]) % columnGlyphs[i].length;
        const text = columnGlyphs[i][Math.abs(glyphIndex)] || "0";

        // Draw text with a gradient/alternating colors
        // The leading character is white/brightest
        if (Math.random() > 0.98) {
          ctx.fillStyle = "#ffffff";
        } else {
          // Choose color based on column/row position for an organic gradient look
          ctx.fillStyle = colors[(i + Math.floor(drops[i])) % colors.length];
        }

        // Adjust opacity based on height or random variation
        ctx.globalAlpha = 0.18; // Keep it low opacity as an ambient texture
        ctx.fillText(text, x, y);
        ctx.globalAlpha = 1.0;

        // Reset drop to top randomly
        if (y > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
          // Regenerate random glyphs for this column
          columnGlyphs[i] = Array.from({ length: 40 }, () => tokens[Math.floor(Math.random() * tokens.length)]);
        }

        drops[i] += 0.65; // Speed of falling
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    if (reduced) {
      // Draw a static faint grid instead of animated rain
      ctx.fillStyle = "#05060f";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.strokeStyle = "rgba(179, 137, 255, 0.05)";
      ctx.lineWidth = 1;
      const gridSpacing = 40;
      
      ctx.beginPath();
      for (let x = 0; x < canvas.width; x += gridSpacing) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
      }
      for (let y = 0; y < canvas.height; y += gridSpacing) {
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
      }
      ctx.stroke();
    } else {
      animationFrameId = requestAnimationFrame(draw);
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", resizeCanvas);
      observer.disconnect();
    };
  }, [reduced]);

  return (
    <div ref={containerRef} className="absolute inset-0 w-full h-full pointer-events-none select-none z-0">
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
}
