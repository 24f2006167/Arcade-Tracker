"use client";

import {
  useState, useEffect, useRef, useCallback,
} from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Sparkles, Trophy, Zap, RotateCw } from "lucide-react";
import {
  motion,
  useReducedMotion,
  AnimatePresence,
} from "framer-motion";

// ─────────────────────────────────────────────────────────────────────────────
// Cursor spotlight — pure rAF, no React re-renders
// ─────────────────────────────────────────────────────────────────────────────
function CursorSpotlight() {
  const divRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const posRef = useRef({ x: -1000, y: -1000 });

  const paint = useCallback(() => {
    const el = divRef.current;
    if (!el) return;
    const { x, y } = posRef.current;
    el.style.background = `radial-gradient(650px circle at ${x}px ${y}px,
      rgba(34,229,229,0.07) 0%,
      rgba(179,137,255,0.05) 35%,
      transparent 70%)`;
  }, []);

  useEffect(() => {
    // Skip on touch devices
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

  return (
    <div
      ref={divRef}
      aria-hidden
      className="cursor-spotlight"
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Animation config
// ─────────────────────────────────────────────────────────────────────────────
const EASE = [0.16, 1, 0.3, 1] as const;

const containerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: EASE },
  },
};

// reduced-motion: instant reveal
const itemVariantsReduced = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0 } },
};

// ─────────────────────────────────────────────────────────────────────────────
// Feature card data
// ─────────────────────────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: Trophy,
    label: "Live points & badges",
    desc: "Real-time Arcade Points pulled directly from your public Skills Boost profile.",
    color: "text-amber",
    glowColor: "rgba(255,194,75,0.18)",
    iconBg: "rgba(255,194,75,0.12)",
    id: "feat-live-points",
  },
  {
    icon: Zap,
    label: "History trend charts",
    desc: "Snapshot-over-time charts so you can see growth and momentum at a glance.",
    color: "text-cyan",
    glowColor: "rgba(34,229,229,0.18)",
    iconBg: "rgba(34,229,229,0.1)",
    id: "feat-history",
  },
  {
    icon: Sparkles,
    label: "Global leaderboard",
    desc: "Compare your rank across every tracked profile in the STS community.",
    color: "text-pink",
    glowColor: "rgba(255,111,179,0.18)",
    iconBg: "rgba(255,111,179,0.1)",
    id: "feat-leaderboard",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Feature Glass Card
// ─────────────────────────────────────────────────────────────────────────────
function FeatureCard({
  icon: Icon,
  label,
  desc,
  color,
  glowColor,
  iconBg,
  id,
  reduced,
}: (typeof FEATURES)[number] & { reduced: boolean }) {
  return (
    <motion.div
      id={id}
      className="feat-card px-5 py-5 flex flex-col items-start gap-3 text-left cursor-default"
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
      {/* Icon badge */}
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

// ─────────────────────────────────────────────────────────────────────────────
// Home page
// ─────────────────────────────────────────────────────────────────────────────
export default function Home() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const reduced = useReducedMotion() ?? false;

  // Choose variants based on motion preference
  const iv = reduced ? itemVariantsReduced : itemVariants;
  const cv = reduced
    ? { ...containerVariants, show: { transition: { staggerChildren: 0 } } }
    : containerVariants;

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

  return (
    <>
      {/* Cursor spotlight — outside React animation cycle */}
      {!reduced && <CursorSpotlight />}

      {/* ── Main stagger container ── */}
      <motion.div
        className="relative flex flex-col items-center text-center gap-14 py-14 px-4"
        variants={cv}
        initial="hidden"
        animate="show"
      >

        {/* ── 1. Eyebrow pill ── */}
        <motion.span
          variants={iv}
          className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 text-xs text-mist-muted"
        >
          <Sparkles className="w-3.5 h-3.5 text-violet" />
          Public profile tracking, reinvented
        </motion.span>

        {/* ── 2. Hero headline + subtext ── */}
        <motion.div variants={iv} className="space-y-5 max-w-2xl -mt-6">
          <h1 className="font-display text-5xl sm:text-6xl font-semibold leading-[1.05] tracking-tight text-mist">
            Track your{" "}
            <span className="gradient-text">Google Skills Arcade</span>{" "}
            run, beautifully.
          </h1>
        </motion.div>

        {/* ── 3. Subtext ── */}
        <motion.p
          variants={iv}
          className="text-mist-muted max-w-md mx-auto text-base leading-relaxed -mt-10"
        >
          Paste your public Skills Boost profile link or ID. We&apos;ll pull
          your points, badges, and start tracking your progress over time.
        </motion.p>

        {/* ── 4. Input / CTA ── */}
        <motion.form
          variants={iv}
          onSubmit={handleSubmit}
          className="w-full max-w-xl flex flex-col gap-3 -mt-6"
        >
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
              whileHover={reduced ? {} : { scale: 1.02 }}
              whileTap={reduced ? {} : { scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              {loading ? (
                <>
                  <RotateCw className="w-3.5 h-3.5 animate-spin" />
                  Fetching…
                </>
              ) : (
                <>
                  Track profile
                  <ArrowRight className="w-4 h-4" />
                </>
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
        </motion.form>

        {/* ── 5. Feature glass cards ── */}
        <motion.div
          variants={iv}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl -mt-4"
        >
          {FEATURES.map((f) => (
            <FeatureCard key={f.id} {...f} reduced={reduced} />
          ))}
        </motion.div>

        {/* ── 6. Footer note ── */}
        <motion.p
          variants={iv}
          className="text-xs text-mist-muted max-w-md -mt-6"
        >
          Your profile must have{" "}
          <span className="text-mist font-medium">Make profile public</span>{" "}
          enabled in Skills Boost account settings for this to work.
        </motion.p>

        {/* Bottom vignette */}
        <div
          className="pointer-events-none absolute bottom-0 inset-x-0 h-32"
          style={{
            background:
              "linear-gradient(to top, rgba(5,6,15,0.7) 0%, transparent 100%)",
          }}
          aria-hidden
        />
      </motion.div>
    </>
  );
}

