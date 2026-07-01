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

    // Expansive digital matrix tokens list
    const tokens = [
      // Binary digits
      "0", "1", "0", "1",
      // Hex pairs
      "0x00", "0xff", "0x1a", "0x3b", "0x7e", "0x0f", "0x2c", "0xe2", "0xd5", "0xbc",
      // Code fragments / Keywords / Operators
      "const", "=>", "{}", "[]", "()", "async", "await", "fetch", "api", "points", 
      "badges", "run", "STS", "Arcade", "Google", "track", "id", "url", "db", "res", 
      "map", "filter", "&&", "||", "===", "npm", "fiber", "drei", "import", "return", 
      "let", "class", "interface", "export", "default", "from", "Object", "Array", 
      "Promise", "typeof", "instanceof", "+=", "-=", ">=", "++", "--", "?.", "??"
    ];

    const resizeCanvas = () => {
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width || window.innerWidth;
      canvas.height = rect.height || window.innerHeight;

      // Spacing columns at 20px for high density matrix code rain
      columns = Math.ceil(canvas.width / 20);
      drops = [];
      columnGlyphs = [];

      for (let i = 0; i < columns; i++) {
        // Stagger drops starting positions
        drops[i] = Math.random() * -100;
        // Generate pre-cached pool of glyphs for each column
        columnGlyphs[i] = Array.from(
          { length: 50 },
          () => tokens[Math.floor(Math.random() * tokens.length)]
        );
      }
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Matrix rain configuration
    const fontSize = 12;
    const colors = ["#22e5e5", "#b389ff", "#ff6fb3"];

    let lastTime = 0;
    const fps = 24; // Limit FPS to save CPU/GPU cycles
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

      // Semi-transparent overlay to fade older rain frames
      ctx.fillStyle = "rgba(5, 6, 15, 0.14)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = `bold ${fontSize}px monospace`;

      for (let i = 0; i < columns; i++) {
        const x = i * 20;
        const y = drops[i] * (fontSize + 4);

        // Select pre-cached token for column
        const glyphIndex = Math.floor(drops[i]) % (columnGlyphs[i]?.length || 40);
        const text = columnGlyphs[i]?.[Math.abs(glyphIndex)] || "1";

        // Leading char is bright white, others are themed gradients
        if (Math.random() > 0.985) {
          ctx.fillStyle = "#ffffff";
        } else {
          ctx.fillStyle = colors[(i + Math.floor(drops[i])) % colors.length];
        }

        // Faint low opacity so content text stays extremely readable
        ctx.globalAlpha = 0.12 + (i % 5) * 0.01; // Vary opacity between 0.12 - 0.16
        ctx.fillText(text, x, y);
        ctx.globalAlpha = 1.0;

        // Reset drop back to top
        if (y > canvas.height && Math.random() > 0.98) {
          drops[i] = 0;
          columnGlyphs[i] = Array.from(
            { length: 50 },
            () => tokens[Math.floor(Math.random() * tokens.length)]
          );
        }

        drops[i] += 0.55; // Controlled falling speed
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
