"use client";

import {
  useState, useRef, useEffect, useCallback,
} from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Sparkles, Trophy, Zap, RotateCw, ChevronDown } from "lucide-react";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useReducedMotion,
  AnimatePresence,
  useInView,
} from "framer-motion";
import CodeRain from "@/components/hero/CodeRain";

// ─── Lazy-load the R3F canvas (ssr:false — never runs on the server) ──────────
const HeroScene = dynamic(() => import("@/components/hero/HeroScene"), {
  ssr: false,
  loading: () => null,
});

// ─── Animation constants ──────────────────────────────────────────────────────
const EASE = [0.16, 1, 0.3, 1] as const;

// ─── Feature card data ────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: Trophy,
    label: "Live points & badges",
    desc: "Real-time Arcade Points pulled directly from your public Skills Boost profile.",
    color: "text-amber",
    glowColor: "rgba(255,194,75,0.20)",
    iconBg: "rgba(255,194,75,0.12)",
    id: "feat-live-points",
  },
  {
    icon: Zap,
    label: "History trend charts",
    desc: "Snapshot-over-time charts so you can see growth and momentum at a glance.",
    color: "text-cyan",
    glowColor: "rgba(34,229,229,0.20)",
    iconBg: "rgba(34,229,229,0.10)",
    id: "feat-history",
  },
  {
    icon: Sparkles,
    label: "Global leaderboard",
    desc: "Compare your rank across every tracked profile in the STS community.",
    color: "text-pink",
    glowColor: "rgba(255,111,179,0.20)",
    iconBg: "rgba(255,111,179,0.10)",
    id: "feat-leaderboard",
  },
];

// ─── Feature glass card ───────────────────────────────────────────────────────
function FeatureCard({
  icon: Icon, label, desc, color, glowColor, iconBg, id, reduced, index,
}: (typeof FEATURES)[number] & { reduced: boolean; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      id={id}
      className="feat-card px-5 py-5 flex flex-col items-start gap-3 text-left cursor-default"
      initial={reduced ? false : { opacity: 0, y: 28 }}
      animate={reduced ? undefined : inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 28 }}
      transition={reduced ? undefined : {
        duration: 0.55,
        ease: EASE,
        delay: index * 0.1,
      }}
      whileHover={
        reduced
          ? {}
          : {
              y: -3,
              boxShadow: `0 8px 40px -4px ${glowColor}, 0 0 0 1px rgba(255,255,255,0.07)`,
              transition: { duration: 0.25, ease: EASE },
            }
      }
    >
      <span
        className="flex items-center justify-center w-9 h-9 rounded-xl"
        style={{ background: iconBg }}
      >
        <Icon className={`w-4 h-4 ${color}`} />
      </span>
      <div>
        <p className="text-sm font-semibold text-mist">{label}</p>
        <p className="text-xs text-mist-muted mt-1 leading-relaxed">{desc}</p>
      </div>
    </motion.div>
  );
}

// ─── Animated content section item ───────────────────────────────────────────
function RevealItem({
  children,
  delay = 0,
  reduced,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  reduced: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={reduced ? false : { opacity: 0, y: 30 }}
      animate={reduced ? undefined : inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={reduced ? undefined : { duration: 0.55, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}

// ─── Cursor spotlight (outside React render cycle) ────────────────────────────
function CursorSpotlight() {
  const divRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const posRef = useRef({ x: -1000, y: -1000 });

  const paint = useCallback(() => {
    const el = divRef.current;
    if (!el) return;
    const { x, y } = posRef.current;
    el.style.background = `radial-gradient(650px circle at ${x}px ${y}px,
      rgba(34,229,229,0.05) 0%,
      rgba(179,137,255,0.04) 35%,
      transparent 70%)`;
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(hover: none)").matches) return;
    const onMove = (e: MouseEvent) => {
      posRef.current = { x: e.clientX, y: e.clientY };
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(paint);
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, [paint]);

  return <div ref={divRef} aria-hidden className="cursor-spotlight" />;
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function Home() {
  const router = useRouter();
  const reduced = useReducedMotion() ?? false;

  // Mouse position for R3F parallax (normalised -1 → +1)
  const mouseRef = useRef({ x: 0, y: 0 });
  useEffect(() => {
    if (reduced) return;
    const onMove = (e: MouseEvent) => {
      mouseRef.current = {
        x: (e.clientX / window.innerWidth  - 0.5) * 2,
        y: -(e.clientY / window.innerHeight - 0.5) * 2,
      };
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [reduced]);

  // Scroll container ref
  const heroRef = useRef<HTMLDivElement>(null);

  // ─── Reduced-motion fallback ──────────────────────────────────────────────
  if (reduced) {
    return (
      <div className="flex flex-col items-center text-center gap-14 py-14 px-4">
        <span className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 text-xs text-mist-muted">
          <Sparkles className="w-3.5 h-3.5 text-violet" />
          Public profile tracking, reinvented
        </span>
        <div className="space-y-5 max-w-2xl -mt-6">
          <h1 className="font-display text-5xl sm:text-6xl font-semibold leading-[1.05] tracking-tight text-mist">
            Track your <span className="gradient-text">Google Skills Arcade</span> run, beautifully.
          </h1>
        </div>
        <p className="text-mist-muted max-w-md mx-auto text-base leading-relaxed -mt-10">
          Visualise milestones, simulate badge targets, and check live global leaderboards instantly.
        </p>
        <div className="w-full max-w-sm mx-auto -mt-6">
          <Link href="/add-profile">
            <button className="w-full rounded-2xl bg-gradient-to-r from-cyan via-violet to-pink text-void font-semibold px-8 py-4 text-base flex items-center justify-center gap-2">
              Track a profile
              <ArrowRight className="w-5 h-5" />
            </button>
          </Link>
        </div>
      </div>
    );
  }

  // ─── Full single-screen experience ─────────────────────────────────────
  return (
    <>
      <CursorSpotlight />

      <div ref={heroRef} className="relative w-full max-w-7xl mx-auto h-[82vh] md:h-[85vh] flex flex-col md:flex-row items-center justify-between px-6 md:px-16 overflow-hidden z-10">
        {/* 1. R3F canvas (aligned to the right on desktop, background on mobile) */}
        <div className="hero-canvas-wrap absolute inset-0 md:left-[52%] md:right-0 md:w-[48%] h-full pointer-events-none z-10">
          <HeroScene mouseRef={mouseRef} />
        </div>

        {/* 2. Title and CTA button overlay (aligned left on desktop, centered on mobile) */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.65, ease: EASE }}
          className="relative flex flex-col items-center md:items-start text-center md:text-left gap-6 select-none z-20 max-w-xl md:max-w-lg md:mr-auto"
        >
          {/* Eyebrow */}
          <span className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 text-xs text-mist-muted">
            <Sparkles className="w-3.5 h-3.5 text-violet" />
            Public profile tracking, reinvented
          </span>

          {/* Headline */}
          <h1 className="glitch-text font-display text-4xl sm:text-5xl md:text-6xl font-semibold leading-[1.08] tracking-tight text-mist">
            Track your <span className="gradient-text">Google Skills Arcade</span> run, beautifully.
          </h1>

          {/* Subtext */}
          <p className="text-mist-muted max-w-md text-sm sm:text-base leading-relaxed">
            Visualise milestones, simulate badge targets, and check live global leaderboards instantly.
          </p>

          {/* CTA Link Button */}
          <div className="w-full max-w-xs mt-2 pointer-events-auto">
            <Link href="/add-profile">
              <motion.button
                id="landing-cta-btn"
                className="w-full rounded-2xl bg-gradient-to-r from-cyan via-violet to-pink text-void font-semibold px-8 py-4 text-base flex items-center justify-center gap-2"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                Track a profile
                <ArrowRight className="w-5 h-5" />
              </motion.button>
            </Link>
          </div>
        </motion.div>
      </div>
    </>
  );
}
