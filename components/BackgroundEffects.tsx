"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";
import CodeRain from "./hero/CodeRain";
import { useTheme } from "@/components/ThemeProvider";

export default function BackgroundEffects() {
  const [mounted, setMounted] = useState(false);
  const reduced = useReducedMotion() ?? false;
  const { theme, hackerMode } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const isLight = theme === "light";

  // Theme-specific CSS filters to match light and dark modes perfectly
  const logoFilter = isLight
    ? "sepia(1) saturate(2.8) hue-rotate(240deg) brightness(0.88) drop-shadow(0 0 45px rgba(124,58,237,0.35))"
    : "sepia(1) saturate(3.8) hue-rotate(165deg) brightness(0.95) drop-shadow(0 0 55px rgba(34,229,229,0.4))";

  return (
    <div className="fixed inset-0 w-full h-full pointer-events-none z-[-1] overflow-hidden">
      {/* 1. Global Code Rain Matrix background */}
      <CodeRain reduced={reduced} theme={theme} />

      {/* Conditional visual modes */}
      {hackerMode ? (
        <>
          {/* Hacker Mode active: Flat logo image rotating in 3D perspective over the entire screen */}
          <div
            className="absolute inset-0 w-full h-full flex items-center justify-center pointer-events-none select-none z-[1]"
            style={{
              opacity: isLight ? 0.16 : 0.14,
              transition: "opacity 0.5s ease",
              perspective: "1200px",
            }}
          >
            <div className="relative w-full h-full flex items-center justify-center animate-rotate-4d">
              <img
                src="/hacker-silhouette.png"
                alt="Hacker Silhouette"
                className="w-full h-full object-cover logo-glow-animate"
                style={{
                  filter: logoFilter,
                  transition: "filter 0.5s ease",
                }}
              />
              {/* Glowing Red Eyes positioned precisely on the full-screen logo face */}
              <div 
                className="absolute w-[8px] h-[8px] rounded-full bg-red-500 shadow-[0_0_12px_#ff0000] animate-[sudden-red-eyes_9s_infinite]" 
                style={{ 
                  left: "48.2%", 
                  top: "35.8%",
                  transform: "translate(-50%, -50%)"
                }} 
              />
              <div 
                className="absolute w-[8px] h-[8px] rounded-full bg-red-500 shadow-[0_0_12px_#ff0000] animate-[sudden-red-eyes_9s_infinite]" 
                style={{ 
                  left: "51.8%", 
                  top: "35.8%",
                  transform: "translate(-50%, -50%)"
                }} 
              />
            </div>
          </div>

          {/* Global HUD Scanlines overlay */}
          <div
            className="hud-scanlines"
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 2 }}
          />

          {/* Global CRT Vignette overlay */}
          <div
            className="hud-vignette"
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 3 }}
          />

          {/* Real-time Cybernetic Radar HUD Tracker in corner */}
          <div className="absolute bottom-8 right-8 z-[4] hidden md:flex flex-col items-center gap-2 select-none pointer-events-none">
            <div className="relative w-28 h-28 rounded-full border border-line flex items-center justify-center overflow-hidden glass transition-colors duration-300">
              <div className="absolute w-20 h-20 rounded-full border border-line border-dashed" />
              <div className="absolute w-12 h-12 rounded-full border border-line/50" />
              <div className="absolute w-full h-px bg-line/60" />
              <div className="absolute h-full w-px bg-line/60" />
              <div className="absolute inset-0 bg-gradient-to-tr from-cyan/15 via-transparent to-transparent origin-center animate-[spin_4.5s_linear_infinite] rounded-full" />
              <div className="absolute top-7 left-14 w-1.5 h-1.5 rounded-full bg-pink animate-pulse" />
              <div className="absolute bottom-10 right-10 w-1 h-1 rounded-full bg-cyan animate-pulse" style={{ animationDelay: "1.2s" }} />
              <div className="absolute top-16 left-6 w-1 h-1 rounded-full bg-amber animate-pulse" style={{ animationDelay: "2.4s" }} />
            </div>
            <div className="text-[9px] font-mono text-cyan tracking-widest flex items-center gap-1.5 uppercase transition-colors duration-300">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping" />
              HUD tracking
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Normal Mode active: Original flat hacker silhouette image scaled to FULL SCREEN (object-cover) */}
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-[1]"
            style={{
              opacity: isLight ? 0.15 : 0.14,
              transition: "opacity 0.5s ease",
            }}
          >
            <img
              src="/hacker-silhouette.png"
              alt="Hacker Silhouette"
              className="w-full h-full object-cover" // Scaled to occupy the absolute full screen viewport!
              style={{
                filter: logoFilter,
                transition: "filter 0.5s ease",
              }}
            />
          </div>
        </>
      )}
    </div>
  );
}
