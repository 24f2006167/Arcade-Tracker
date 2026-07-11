"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ExternalLink,
  Info,
  Sparkles,
  Play,
  Clock,
  UserCheck,
  CreditCard,
  ShieldCheck,
  Settings,
  Compass,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const EASE = [0.16, 1, 0.3, 1] as const;

interface Chapter {
  id: string;
  title: string;
  shortDesc: string;
  duration: string;
  stepNumber: number;
  detailedSteps: string[];
  visualType: "signout" | "promo" | "lab" | "credits" | "subscribe" | "visibility";
  linkUrl?: string;
  linkLabel?: string;
}

const CHAPTERS: Chapter[] = [
  {
    id: "chapter-1",
    stepNumber: 1,
    title: "Sign Out & Prepare Session",
    shortDesc: "Log out of Google Cloud Skills Boost to prevent session caching errors.",
    duration: "1:30",
    detailedSteps: [
      "Open the official Google Cloud Skills Boost website in your browser.",
      "Click your profile avatar in the top-right corner.",
      "Click 'Sign Out' to fully terminate your current active session.",
      "Important: Doing this ensures the new promotion link and referral code register correctly on your account without conflicts."
    ],
    visualType: "signout",
    linkUrl: "https://www.cloudskillsboost.google",
    linkLabel: "Open Skills Boost Site",
  },
  {
    id: "chapter-2",
    stepNumber: 2,
    title: "Claim Promo Code (Sign In AFTER)",
    shortDesc: "Open the promo link first, then sign in to receive your initial 9 credits.",
    duration: "2:15",
    detailedSteps: [
      "Obtain the unique promotion link and code from your Arcade Facilitator's video description or message.",
      "Copy the promotion code directly to your clipboard.",
      "Open the facilitator's catalog promotion link in a new tab.",
      "Sign in to your Google Cloud Skills Boost account ONLY AFTER opening the promo page.",
      "Verify that you receive 9 credits immediately. (Note: If you do not see 9 credits, the promo code has expired)."
    ],
    visualType: "promo",
  },
  {
    id: "chapter-3",
    stepNumber: 3,
    title: "Start a Free Hands-On Lab",
    shortDesc: "Launch a 'No Cost' hands-on lab and let it run to trigger your free membership.",
    duration: "3:45",
    detailedSteps: [
      "Search the catalog for any hands-on lab (e.g. 'A Tour of Google Cloud Hands-on Labs').",
      "Look for the 'No Cost' label so that starting the lab does not consume your credits.",
      "Click the green 'Start Lab' button. There should be no popups asking for credits.",
      "Crucial Step: Let the lab run active for at least 3 to 5 minutes (5 minutes is recommended).",
      "After the timer passes 5 minutes, click the red 'End Lab' button."
    ],
    visualType: "lab",
  },
  {
    id: "chapter-4",
    stepNumber: 4,
    title: "Refresh & Confirm (DO NOT Start Badges Yet)",
    shortDesc: "Confirm your 400 free credits and review critical Facilitator rules.",
    duration: "1:50",
    detailedSteps: [
      "Click on your profile avatar in the top-right corner to check credits.",
      "If you don't see 400 credits right away, refresh the browser page 2 to 3 times.",
      "Verify that your credit balance has updated to 400+ credits and subscription shows Starter.",
      "CRITICAL RULE: Do NOT start or complete any Skill Badges yet! You must wait until you are officially enrolled in the Facilitator Program, otherwise they will not count for points."
    ],
    visualType: "credits",
  },
  {
    id: "chapter-5",
    stepNumber: 5,
    title: "Arcade Subscription & Pre-Registration",
    shortDesc: "Register for the Arcade Program using your exact Skills Boost email.",
    duration: "2:40",
    detailedSteps: [
      "Open the official Google Cloud Arcade Subscriber subscription page.",
      "Fill out the subscriber form with your details.",
      "Important: Make sure to use the exact same email address you use for Google Cloud Skills Boost.",
      "Check 'Yes' to subscribing. This subscription is mandatory to receive your prize counter link and swags in December.",
      "Remember: Only one account and one mobile number per participant is allowed to avoid disqualification."
    ],
    visualType: "subscribe",
    linkUrl: "https://go.cloudskillsboost.google/arcade",
    linkLabel: "Open Arcade Subscriber Form",
  },
  {
    id: "chapter-6",
    stepNumber: 6,
    title: "Enable Public Profile Settings",
    shortDesc: "Make your profile public so the tracker and Google can audit your badges.",
    duration: "2:10",
    detailedSteps: [
      "Log in to skills.google with your Arcade registered account.",
      "Click your avatar in the top-right and navigate to 'Account Settings'.",
      "Scroll to the 'Public visibility' section.",
      "Enable the checkbox that says 'Make profile public'.",
      "Copy the green public profile URL (e.g., https://www.skills.google/public_profiles/...) and keep it handy for tracking your progress."
    ],
    visualType: "visibility",
    linkUrl: "https://www.skills.google/my_account/profile",
    linkLabel: "Open Profile Settings",
  },
];

export default function FacilitatorGuidePage() {
  const [activeChapterId, setActiveChapterId] = useState<string>("chapter-1");

  const activeChapter = CHAPTERS.find((c) => c.id === activeChapterId) || CHAPTERS[0];

  return (
    <div className="space-y-10 py-10">
      {/* Back button */}
      <div className="flex items-center justify-between rise-in">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl glass hover:bg-white/10 text-xs text-mist-muted hover:text-mist transition-all duration-200 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Home
        </Link>
      </div>

      {/* Hero Header */}
      <div className="space-y-4 rise-in text-center max-w-3xl mx-auto">
        <span className="inline-flex items-center gap-1.5 text-xs text-cyan bg-cyan/10 border border-cyan/20 px-3 py-1 rounded-full font-semibold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
          Arcade 2026 Ultimate Prep Guide
        </span>
        <h1 className="font-display text-4xl font-bold tracking-tight text-mist leading-tight sm:text-5xl">
          Get <span className="gradient-text">400+ Free Credits</span> & Pre-Register
        </h1>
        <p className="text-sm text-mist-muted max-w-xl mx-auto leading-relaxed">
          Follow our visual step-by-step masterclass to claim your credits, configure visibility, and subscribe to the Arcade Facilitator Program.
        </p>
      </div>

      {/* Main Course Player Component */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 rise-in">
        {/* Left Column: Interactive Chapters Selector (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-3">
          <p className="text-xs uppercase tracking-widest text-mist-muted font-bold px-1 mb-1">
            Course Chapters ({CHAPTERS.length})
          </p>

          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {CHAPTERS.map((ch) => {
              const isActive = ch.id === activeChapterId;
              return (
                <button
                  key={ch.id}
                  onClick={() => setActiveChapterId(ch.id)}
                  className={`w-full text-left p-4 rounded-2xl transition-all border flex items-center justify-between gap-4 cursor-pointer focus:outline-none ${
                    isActive
                      ? "bg-white/5 border-cyan/40 shadow-lg shadow-cyan/5"
                      : "bg-white/3 border-white/5 hover:border-white/10 hover:bg-white/4"
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* Chapter Number/Status */}
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-semibold shrink-0 transition-colors ${
                        isActive ? "bg-cyan text-void" : "bg-white/5 text-mist-muted"
                      }`}
                    >
                      {ch.stepNumber}
                    </div>

                    {/* Chapter text */}
                    <div className="min-w-0">
                      <p
                        className={`text-xs font-semibold truncate ${
                          isActive ? "text-mist" : "text-mist-muted"
                        }`}
                      >
                        {ch.title}
                      </p>
                      <p className="text-[10px] text-mist-muted truncate mt-0.5 max-w-[280px]">
                        {ch.shortDesc}
                      </p>
                    </div>
                  </div>

                  {/* Chapter Duration / Icon */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Clock className="w-3 h-3 text-mist-muted" />
                    <span className="text-[10px] text-mist-muted font-mono">{ch.duration}</span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="glass rounded-xl p-3 border border-white/5 text-[10px] text-mist-muted flex gap-2 leading-relaxed">
            <Info className="w-3.5 h-3.5 text-violet shrink-0 mt-0.5" />
            <p>
              Complete all chapters sequentially to ensure eligibility and avoid account suspension or points cancellation.
            </p>
          </div>
        </div>

        {/* Right Column: Visual Video Player & Chapters details (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Mock Video Player / Visual Preview */}
          <div className="relative aspect-video rounded-3xl overflow-hidden border border-white/5 bg-void flex items-center justify-center group shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/80 z-10" />

            {/* Render dynamically corresponding visual design according to visualType */}
            {activeChapter.visualType === "signout" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-gradient-to-br from-violet/20 via-void to-pink/10">
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shadow-2xl mb-4 group-hover:scale-105 transition-transform duration-300">
                  <UserCheck className="w-8 h-8 text-pink" />
                </div>
                <p className="text-mist font-semibold text-sm">Google Cloud Skills Boost</p>
                <div className="mt-3 flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-1.5 rounded-full text-[10px] text-mist-muted font-mono">
                  <span>Session Status:</span>
                  <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                  <span className="text-red-400 font-semibold">Logged Out</span>
                </div>
              </div>
            )}

            {activeChapter.visualType === "promo" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-gradient-to-br from-cyan/20 via-void to-violet/10">
                <div className="w-4/5 max-w-sm glass rounded-2xl border border-white/10 p-5 shadow-2xl space-y-3.5">
                  <div className="flex items-center justify-between text-[10px] text-mist-muted border-b border-white/5 pb-2">
                    <span>Skills Boost Catalog</span>
                    <span className="text-cyan font-mono font-semibold">PROMO CODE VALID</span>
                  </div>
                  <div className="space-y-1 text-left">
                    <span className="text-[9px] uppercase tracking-wider text-mist-muted">Enter Promo Code</span>
                    <div className="h-9 bg-white/5 border border-cyan/40 rounded-xl flex items-center px-3 justify-between">
                      <span className="text-[10px] font-mono text-cyan truncate">ARCADE-FAC-CREDITS-2026</span>
                      <span className="text-[9px] bg-cyan/20 text-cyan px-2 py-0.5 rounded-full font-bold">SUBMITTED</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeChapter.visualType === "lab" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-gradient-to-br from-pink/15 via-void to-cyan/15">
                <div className="relative w-24 h-24 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin" style={{ animationDuration: "8s" }} />
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex flex-col items-center justify-center text-emerald-400 shadow-2xl">
                    <Play className="w-5 h-5 fill-current" />
                    <span className="text-[9px] font-mono font-bold mt-1">07:45</span>
                  </div>
                </div>
                <p className="text-mist font-semibold text-xs mt-4">Lab Status: Hands-on Lab Running</p>
                <p className="text-[10px] text-mist-muted mt-1 max-w-xs">Do not click End Lab until timer passes 7 minutes!</p>
              </div>
            )}

            {activeChapter.visualType === "credits" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-gradient-to-br from-amber/20 via-void to-pink/10">
                <div className="glass rounded-2xl border border-white/10 p-5 shadow-2xl text-center space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-amber/15 border border-amber/30 flex items-center justify-center text-amber mx-auto animate-bounce">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-mist-muted uppercase tracking-wider">Account Membership</p>
                    <h4 className="text-mist font-bold text-lg mt-0.5">Starter Subscription</h4>
                  </div>
                  <div className="bg-white/5 border border-white/8 px-4 py-1.5 rounded-xl inline-flex items-center gap-1.5">
                    <span className="text-[10px] text-mist-muted">Credits:</span>
                    <span className="text-amber font-mono font-bold text-sm">400</span>
                  </div>
                </div>
              </div>
            )}

            {activeChapter.visualType === "subscribe" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-gradient-to-br from-violet/20 via-void to-cyan/15">
                <div className="glass rounded-2xl border border-emerald-500/30 p-5 shadow-2xl text-center space-y-3.5 max-w-sm">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-mist font-bold text-xs">Arcade Cohort Subscription</h4>
                    <p className="text-[10px] text-mist-muted mt-1 leading-relaxed">
                      Subscription form submitted successfully. Eligibility verified.
                    </p>
                  </div>
                  <div className="flex justify-center gap-2 pt-1">
                    <span className="text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">1 Account Registered</span>
                    <span className="text-[9px] bg-cyan/20 text-cyan border border-cyan/30 px-2 py-0.5 rounded-full font-bold">Verified</span>
                  </div>
                </div>
              </div>
            )}

            {activeChapter.visualType === "visibility" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-gradient-to-br from-pink/20 via-void to-violet/10">
                <div className="glass rounded-2xl border border-white/10 p-5 shadow-2xl text-left space-y-3 w-4/5 max-w-xs">
                  <div className="flex items-center gap-1.5 border-b border-white/5 pb-2 text-[10px] text-mist-muted">
                    <Settings className="w-3.5 h-3.5 text-cyan" />
                    <span>Public Visibility Setting</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-cyan border border-cyan flex items-center justify-center text-void">
                      <Play className="w-2.5 h-2.5 fill-current rotate-90" />
                    </div>
                    <span className="text-xs text-mist font-medium">Make profile public</span>
                  </div>
                  <div className="h-6 bg-white/5 border border-white/10 rounded-lg flex items-center px-2 text-[9px] text-cyan font-mono truncate">
                    https://www.skills.google/public_profiles/...
                  </div>
                </div>
              </div>
            )}

            {/* Video duration badge */}
            <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-md text-[10px] text-mist-muted font-mono z-20 flex items-center gap-1">
              <Play className="w-2.5 h-2.5 fill-current text-cyan" />
              <span>Chapter {activeChapter.stepNumber}</span>
            </div>

            {/* Overlay controller bar */}
            <div className="absolute bottom-4 left-4 right-4 z-20 flex items-center justify-between text-xs text-mist-muted/80 px-2">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 cursor-pointer text-mist">
                  <Play className="w-3 h-3 fill-current ml-0.5 text-cyan" />
                </div>
                <span className="font-mono text-[10px]">Chapter Walkthrough</span>
              </div>
              <div className="h-1 bg-white/10 rounded-full flex-1 mx-4 max-w-[200px] sm:max-w-xs relative overflow-hidden">
                <div
                  className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-cyan to-violet"
                  style={{ width: `${(activeChapter.stepNumber / CHAPTERS.length) * 100}%` }}
                />
              </div>
              <span className="font-mono text-[10px]">
                {activeChapter.stepNumber} / {CHAPTERS.length}
              </span>
            </div>
          </div>

          {/* Chapter Details and Description */}
          <div className="glass rounded-3xl p-6 border border-white/5 space-y-5">
            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-widest text-cyan font-bold">
                Step {activeChapter.stepNumber} Instructions
              </span>
              <h2 className="font-display text-xl font-bold text-mist">{activeChapter.title}</h2>
              <p className="text-xs text-mist-muted">{activeChapter.shortDesc}</p>
            </div>

            <div className="space-y-3 pt-2">
              {activeChapter.detailedSteps.map((step, idx) => (
                <div key={idx} className="flex gap-3 text-xs leading-relaxed text-mist-muted">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan shrink-0 mt-2" />
                  <p>{step}</p>
                </div>
              ))}
            </div>

            {activeChapter.linkUrl && (
              <div className="pt-4 border-t border-white/5 flex flex-col sm:flex-row gap-3">
                <a
                  href={activeChapter.linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cta-btn inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan via-violet to-pink text-void font-bold px-5 py-2.5 text-xs transition-transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                >
                  {activeChapter.linkLabel} <ExternalLink className="w-3.5 h-3.5 text-void" />
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Visual Analytics / Calculations Section */}
      <div className="glass rounded-3xl p-8 border border-white/5 relative overflow-hidden rise-in">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan/5 via-violet/5 to-pink/5 pointer-events-none" />
        <div className="relative space-y-6">
          <div className="space-y-2">
            <h3 className="font-display text-lg font-bold text-mist flex items-center gap-2">
              <Compass className="w-5 h-5 text-pink" />
              Free Credits To Arcade Points ROI Calculator
            </h3>
            <p className="text-xs text-mist-muted">
              Here is how 400 credits translate into swag-qualifying milestones.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/4 border border-white/5 rounded-2xl p-4 space-y-1">
              <span className="text-[10px] text-mist-muted uppercase tracking-wider">Start Credits</span>
              <p className="text-xl font-bold text-amber">400 Credits</p>
              <p className="text-[10px] text-mist-muted">Acquired for free using promo</p>
            </div>
            <div className="bg-white/4 border border-white/5 rounded-2xl p-4 space-y-1">
              <span className="text-[10px] text-mist-muted uppercase tracking-wider">Avg Lab Cost</span>
              <p className="text-xl font-bold text-cyan">5 Credits</p>
              <p className="text-[10px] text-mist-muted">Average cost per skill badge lab</p>
            </div>
            <div className="bg-white/4 border border-white/5 rounded-2xl p-4 space-y-1">
              <span className="text-[10px] text-mist-muted uppercase tracking-wider">Total Labs Completed</span>
              <p className="text-xl font-bold text-violet">~80 Labs</p>
              <p className="text-[10px] text-mist-muted">Sufficient for 40 Skill Badges</p>
            </div>
            <div className="bg-white/4 border border-white/5 rounded-2xl p-4 space-y-1">
              <span className="text-[10px] text-mist-muted uppercase tracking-wider">Estimated Score</span>
              <p className="text-xl font-bold text-pink">+20 Arcade Points</p>
              <p className="text-[10px] text-mist-muted">From skill badges completions</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
