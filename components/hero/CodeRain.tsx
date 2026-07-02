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

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Dynamic variables initialized/re-initialized on resize
    let columns = 0;
    let drops: number[] = [];
    let columnGlyphs: string[][] = [];

    // Hacker Matrix C++ & HUD tokens list (matching user screenshot)
    const tokens = [
      "#include <string>",
      "using namespace std;",
      "char buf[11];",
      "int a, b, c;",
      "sscanf(s.c_str(), \"%d-%d-%d\", &a, &b, &c);",
      "sprintf(buf, \"%02d/%02d/%d\", c, b, a);",
      "string find_date(string card_no)",
      "int main()",
      "cout << find_date(\"2012-09-28\") << endl;",
      "system(\"pause\");",
      "return 0;",
      "2166.846",
      "3645.508",
      "1092.483",
      "8314.920",
      "[ACCESS GRANTED]",
      "[SYSTEM OVERRIDE]",
      "[COMPILING...]",
      "char", "int", "string", "cout", "endl", "0x00", "0xff",
      "0", "1", "x", "y", "z", "[]", "{}", "()", "++", "--"
    ];

    const resizeCanvas = () => {
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width || window.innerWidth;
      canvas.height = rect.height || window.innerHeight;

      // Sparse columns at 36px spacing for low density background rain
      columns = Math.ceil(canvas.width / 36);
      drops = [];
      columnGlyphs = [];

      for (let i = 0; i < columns; i++) {
        drops[i] = Math.random() * -100;
        columnGlyphs[i] = Array.from(
          { length: 50 },
          () => tokens[Math.floor(Math.random() * tokens.length)]
        );
      }
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Matrix configuration
    const fontSize = 12;
    // Cyan, Neon Teal, Deep Blue, Violet, Pink
    const colors = ["#22e5e5", "#00d2ff", "#00a2ff", "#b389ff", "#ff6fb3"];

    let lastTime = 0;
    const fps = 24; 
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

      // Fade older frames faster with 0.22 opacity overlay
      ctx.fillStyle = "rgba(5, 6, 15, 0.22)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = `bold ${fontSize}px monospace`;

      for (let i = 0; i < columns; i++) {
        const x = i * 36;
        const y = drops[i] * (fontSize + 6);

        const glyphIndex = Math.floor(drops[i]) % (columnGlyphs[i]?.length || 40);
        const text = columnGlyphs[i]?.[Math.abs(glyphIndex)] || "1";

        // Assign colors (no shadow glow to prevent bright glares)
        if (Math.random() > 0.985) {
          ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
        } else {
          ctx.fillStyle = colors[(i + Math.floor(drops[i])) % colors.length];
        }
        ctx.shadowBlur = 0; // Completely disable shadow glow for ultra-dim flat text

        // Ultra-faint low opacity (between 0.015 and 0.035)
        ctx.globalAlpha = 0.015 + (i % 5) * 0.005; 
        ctx.fillText(text, x, y);
        ctx.globalAlpha = 1.0;

        // Reset drop
        if (y > canvas.height && Math.random() > 0.985) {
          drops[i] = 0;
          columnGlyphs[i] = Array.from(
            { length: 50 },
            () => tokens[Math.floor(Math.random() * tokens.length)]
          );
        }

        drops[i] += 0.5; // Steady fall speed
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    if (reduced) {
      // Static ambient Grid configuration
      ctx.fillStyle = "#05060f";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.strokeStyle = "rgba(179, 137, 255, 0.04)";
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
