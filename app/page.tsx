"use client";

import {
  useState, useRef, useEffect, useCallback,
} from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
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
  const [input, setInput]   = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState<string | null>(null);
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

  // Scroll container — useScroll targets this ref
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const springConfig = { stiffness: 100, damping: 25, mass: 0.5 };
  
  // Hero opacity and scale transforms
  const heroOpacityRaw = useTransform(scrollYProgress, [0, 0.75], [1, 0]);
  const heroScaleRaw = useTransform(scrollYProgress, [0, 0.75], [1, 0.85]);
  const heroYRaw = useTransform(scrollYProgress, [0, 0.75], [0, -50]);
  
  const heroOpacity = useSpring(heroOpacityRaw, springConfig);
  const heroScale = useSpring(heroScaleRaw, springConfig);
  const heroY = useSpring(heroYRaw, springConfig);

  // Content (Stage 2) transforms
  const contentOpacityRaw = useTransform(scrollYProgress, [0.35, 0.95], [0, 1]);
  const contentYRaw = useTransform(scrollYProgress, [0.35, 0.95], [120, 0]);
  
  const contentOpacity = useSpring(contentOpacityRaw, springConfig);
  const contentY = useSpring(contentYRaw, springConfig);

  // ─── Profile submit ───────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");

      if (typeof window !== "undefined" && data.profileId) {
        const stored = localStorage.getItem("arcade_profiles");
        let list: any[] = [];
        try { list = stored ? JSON.parse(stored) : []; } catch (_) {}
        const finalPoints = data.arcadeResult?.totalArcadePoints ?? 0;
        list = list.filter((p: any) => p.id !== data.profileId);
        list.push({ id: data.profileId, name: data.name, points: finalPoints });
        localStorage.setItem("arcade_profiles", JSON.stringify(list));
        localStorage.setItem("last_profile_id", data.profileId);
      }

      router.push(`/dashboard/${data.profileId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch profile");
      setLoading(false);
    }
  }

  // ─── Reduced-motion: flat single-stage layout ─────────────────────────────
  if (reduced) {
    return (
      <div className="flex flex-col items-center text-center gap-14 py-14 px-4">
        <span className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 text-xs text-mist-muted">
          <Sparkles className="w-3.5 h-3.5 text-violet" />
          Public profile tracking, reinvented
        </span>
        <div className="space-y-5 max-w-2xl -mt-6">
          <h1 className="font-display text-5xl sm:text-6xl font-semibold leading-[1.05] tracking-tight text-mist">
            Track your{" "}
            <span className="gradient-text">Google Skills Arcade</span>{" "}
            run, beautifully.
          </h1>
        </div>
        <p className="text-mist-muted max-w-md mx-auto text-base leading-relaxed -mt-10">
          Paste your public Skills Boost profile link or ID. We&apos;ll pull
          your points, badges, and start tracking your progress over time.
        </p>
        <form onSubmit={handleSubmit} className="w-full max-w-xl flex flex-col gap-3 -mt-6">
          <div className="url-input-wrap glass-strong gradient-ring rounded-2xl p-2 flex flex-col sm:flex-row gap-2">
            <input
              id="profile-url-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="https://www.skills.google/public_profiles/..."
              className="flex-1 bg-transparent px-4 py-3 text-sm text-mist placeholder:text-mist-muted focus:outline-none"
              disabled={loading}
              aria-label="Skills Boost profile URL or ID"
            />
            <button
              id="track-profile-btn"
              type="submit"
              disabled={loading}
              className="cta-btn rounded-xl bg-gradient-to-r from-cyan via-violet to-pink text-void font-semibold px-6 py-3 text-sm flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <><RotateCw className="w-3.5 h-3.5 animate-spin" />Fetching…</>
              ) : (
                <>Track profile<ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </div>
          {error && <p className="text-sm text-pink text-left px-2">{error}</p>}
        </form>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl -mt-4">
          {FEATURES.map((f, i) => (
            <FeatureCard key={f.id} {...f} reduced index={i} />
          ))}
        </div>
        <p className="text-xs text-mist-muted max-w-md -mt-6">
          Your profile must have{" "}
          <span className="text-mist font-medium">Make profile public</span>{" "}
          enabled in Skills Boost account settings for this to work.
        </p>
      </div>
    );
  }

  // ─── Full two-stage scroll experience ─────────────────────────────────────
  return (
    <>
      <CursorSpotlight />

      <div className="relative w-full">
        {/* ── STAGE 1: Spacer + Sticky 3D hero ── */}
        <div ref={heroRef} className="relative w-full h-[100vh] md:h-[100dvh]">
          <div className="sticky top-0 left-0 w-full h-[100vh] md:h-[100dvh] overflow-hidden z-0 bg-void">
            {/* Cyber HUD elements layering: */}
            
            {/* 1. Code Rain canvas (ambient texture background) */}
            <CodeRain reduced={reduced} />

            {/* 2. R3F canvas (ambient 3D objects target) */}
            <div className="hero-canvas-wrap">
              <HeroScene mouseRef={mouseRef} />
            </div>

            {/* 3. HUD Scanlines overlay */}
            <div className="hud-scanlines" />

            {/* 4. CRT Vignette overlay */}
            <div className="hud-vignette" />

            {/* 5. Title/visual elements (fading/scaling on scroll) */}
            <motion.div 
              style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}
              className="absolute inset-0 flex flex-col items-center justify-center gap-5 px-6 pointer-events-none select-none z-10 will-change-transform"
            >
              {/* Eyebrow */}
              <motion.span
                className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 text-xs text-mist-muted"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, ease: EASE, delay: 0.3 }}
              >
                <Sparkles className="w-3.5 h-3.5 text-violet" />
                Public profile tracking, reinvented
              </motion.span>

              {/* Headline */}
              <motion.h1
                className="glitch-text font-display text-5xl sm:text-6xl md:text-7xl font-semibold leading-[1.04] tracking-tight text-mist text-center max-w-3xl"
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: EASE, delay: 0.45 }}
              >
                Track your{" "}
                <span className="gradient-text">Google Skills Arcade</span>{" "}
                run, beautifully.
              </motion.h1>

              {/* Subtext */}
              <motion.p
                className="text-mist-muted max-w-sm text-sm sm:text-base leading-relaxed text-center"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, ease: EASE, delay: 0.6 }}
              >
                Scroll down to get started.
              </motion.p>
            </motion.div>

            {/* Scroll cue */}
            <motion.div
              style={{ opacity: heroOpacity }}
              className="scroll-cue-wrap absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 pointer-events-none z-10"
              aria-label="Scroll to continue"
            >
              <span className="text-[10px] uppercase tracking-widest text-mist-muted/60">
                scroll
              </span>
              <ChevronDown className="scroll-cue w-5 h-5 text-mist-muted/70" />
            </motion.div>
          </div>
        </div>

        {/* ── STAGE 2: Functional UI ── */}
        <motion.div 
          style={{ opacity: contentOpacity, y: contentY }}
          className="relative z-10 flex flex-col items-center text-center gap-12 px-4 py-20 pb-24 bg-void border-t border-line/20 will-change-transform"
        >
          {/* Eyebrow */}
          <RevealItem delay={0} reduced={reduced} className="w-full flex justify-center">
            <span className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 text-xs text-mist-muted">
              <Sparkles className="w-3.5 h-3.5 text-violet" />
              Public profile tracking, reinvented
            </span>
          </RevealItem>

          {/* Headline */}
          <RevealItem delay={0.08} reduced={reduced} className="-mt-6 max-w-2xl">
            <h2 className="font-display text-4xl sm:text-5xl font-semibold leading-[1.05] tracking-tight text-mist">
              Track your{" "}
              <span className="gradient-text">Google Skills Arcade</span>{" "}
              run, beautifully.
            </h2>
          </RevealItem>

          {/* Subtext */}
          <RevealItem delay={0.16} reduced={reduced} className="-mt-6">
            <p className="text-mist-muted max-w-md mx-auto text-base leading-relaxed">
              Paste your public Skills Boost profile link or ID. We&apos;ll pull
              your points, badges, and start tracking your progress over time.
            </p>
          </RevealItem>

          {/* Input / CTA */}
          <RevealItem delay={0.24} reduced={reduced} className="w-full max-w-xl -mt-4">
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <div className="url-input-wrap glass-strong gradient-ring rounded-2xl p-2 flex flex-col sm:flex-row gap-2">
                <input
                  id="profile-url-input"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="https://www.skills.google/public_profiles/..."
                  className="flex-1 bg-transparent px-4 py-3 text-sm text-mist placeholder:text-mist-muted focus:outline-none"
                  disabled={loading}
                  aria-label="Skills Boost profile URL or ID"
                />
                <motion.button
                  id="track-profile-btn"
                  type="submit"
                  disabled={loading}
                  className="cta-btn rounded-xl bg-gradient-to-r from-cyan via-violet to-pink text-void font-semibold px-6 py-3 text-sm flex items-center justify-center gap-2 disabled:opacity-60"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                  {loading ? (
                    <><RotateCw className="w-3.5 h-3.5 animate-spin" />Fetching…</>
                  ) : (
                    <>Track profile<ArrowRight className="w-4 h-4" /></>
                  )}
                </motion.button>
              </div>
              <AnimatePresence mode="wait">
                {error && (
                  <motion.p
                    key="err"
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2 }}
                    className="text-sm text-pink text-left px-2"
                  >
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>
            </form>
          </RevealItem>

          {/* Feature cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl -mt-2">
            {FEATURES.map((f, i) => (
              <FeatureCard key={f.id} {...f} reduced={reduced} index={i} />
            ))}
          </div>

          {/* Footer note */}
          <RevealItem delay={0} reduced={reduced} className="-mt-4">
            <p className="text-xs text-mist-muted max-w-md">
              Your profile must have{" "}
              <span className="text-mist font-medium">Make profile public</span>{" "}
              enabled in Skills Boost account settings for this to work.
            </p>
          </RevealItem>
        </motion.div>
      </div>
    </>
  );
}
