"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";
import CodeRain from "./hero/CodeRain";

export default function BackgroundEffects() {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  const reduced = useReducedMotion() ?? false;

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 w-full h-full pointer-events-none z-[-1] overflow-hidden">
      {/* 1. Global Code Rain Matrix background */}
      <CodeRain reduced={reduced} />

      {/* 2. Global Centered Hacker Hoodie Silhouette */}
      <div 
        className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-[1]"
        style={{ opacity: 0.14 }}
      >
        <img 
          src="/hacker-silhouette.png" 
          alt="Hacker Silhouette" 
          className="w-full max-w-[650px] aspect-square object-contain filter drop-shadow-[0_0_50px_rgba(34,229,229,0.15)]"
        />
      </div>

      {/* 3. Global HUD Scanlines overlay */}
      <div 
        className="hud-scanlines" 
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 2 }} 
      />

      {/* 4. Global CRT Vignette overlay */}
      <div 
        className="hud-vignette" 
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 3 }} 
      />
    </div>
  );
}
