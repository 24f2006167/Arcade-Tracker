"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Sparkles, RotateCw, Trophy, Zap } from "lucide-react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import Loading from "../loading";

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
    color: "text-[#22e5e5]",
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

export default function AddProfilePage() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
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
        try {
          list = stored ? JSON.parse(stored) : [];
        } catch (_) {}
        const finalPoints = data.arcadeResult?.totalArcadePoints ?? 0;
        list = list.filter((p: any) => p.id !== data.profileId);
        list.push({ id: data.profileId, name: data.name, points: finalPoints });
        localStorage.setItem("arcade_profiles", JSON.stringify(list));
        localStorage.setItem("last_profile_id", data.profileId);

        // Notify layout AddProfileNavLink to instantly hide itself
        window.dispatchEvent(new Event("profile_added"));
      }

      router.push(`/dashboard/${data.profileId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch profile");
      setLoading(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="fixed inset-0 z-[9999]"
          >
            <Loading />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="min-h-[85vh] flex flex-col items-center justify-center py-16 px-4 relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-3xl flex flex-col items-center gap-8"
        >
          {/* Form container card */}
          <div className="w-full max-w-xl flex flex-col gap-6">
            {/* Eyebrow */}
            <div className="w-full flex justify-center">
              <span className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 text-xs text-mist-muted">
                <Sparkles className="w-3.5 h-3.5 text-violet" />
                Public profile tracking, reinvented
              </span>
            </div>

            {/* Heading */}
            <div className="space-y-4">
              <h1 className="font-display text-4xl sm:text-5xl font-semibold leading-[1.08] tracking-tight text-mist">
                Track your <span className="gradient-text">Google Skills Arcade</span> run.
              </h1>
              <p className="text-mist-muted max-w-md mx-auto text-sm sm:text-base leading-relaxed">
                Paste your public Skills Boost profile link or ID. We&apos;ll pull
                your points, badges, and start tracking your progress over time.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3">
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
                    className="text-xs text-pink/90 font-mono"
                  >
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>
            </form>
          </div>

          {/* Feature cards grid shifted here */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full mt-6">
            {FEATURES.map((f, i) => (
              <FeatureCard key={f.id} {...f} reduced={false} index={i} />
            ))}
          </div>

          {/* Collapsible settings guide & redirect */}
          <div className="w-full max-w-md flex flex-col items-center gap-3">
            <p className="text-xs text-mist-muted">
              Your profile must have{" "}
              <span className="text-mist font-medium">Make profile public</span>{" "}
              enabled in Skills Boost account settings for this to work.
            </p>
            
            <button
              type="button"
              onClick={() => setShowGuide(!showGuide)}
              className="text-xs text-cyan hover:text-cyan/80 hover:underline inline-flex items-center gap-1.5 transition-colors focus:outline-none cursor-pointer"
            >
              <span>{showGuide ? "Hide instructions" : "How to find your public URL?"}</span>
            </button>

            <AnimatePresence>
              {showGuide && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3, ease: EASE }}
                  className="overflow-hidden w-full text-left"
                >
                  <div className="glass rounded-2xl p-5 border border-white/5 space-y-4 mt-2">
                    <h3 className="text-xs font-semibold text-mist flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-amber animate-pulse" />
                      Public Profile Setup Instructions
                    </h3>
                    
                    <div className="space-y-3.5 text-xs text-mist-muted">
                      <div className="flex gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-semibold text-mist shrink-0">1</span>
                        <p className="leading-relaxed">
                          Click the redirect button below to open your Google Skills Boost <strong>Account Settings</strong>.
                        </p>
                      </div>

                      <div className="flex gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-semibold text-mist shrink-0">2</span>
                        <p className="leading-relaxed">
                          Locate the <strong>Public visibility</strong> section on the page.
                        </p>
                      </div>

                      <div className="flex gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-semibold text-mist shrink-0">3</span>
                        <p className="leading-relaxed">
                          Enable the checkbox <strong className="text-amber">Make profile public</strong>. <em>(Required setting so our scraper can index your progress!)</em>
                        </p>
                      </div>

                      <div className="flex gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-semibold text-mist shrink-0">4</span>
                        <p className="leading-relaxed">
                          Copy the public profile URL shown under it (e.g. <code>https://www.skills.google/public_profiles/a5309058...</code>) and paste it into the track input box above.
                        </p>
                      </div>
                    </div>

                    <a
                      href="https://www.skills.google/my_account/profile"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 w-full rounded-xl bg-cyan/10 hover:bg-cyan/20 border border-cyan/20 text-cyan font-semibold py-2.5 text-xs transition-all cursor-pointer"
                    >
                      Go to settings & find URL
                      <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </>
  );
}
