"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Terminal,
  Copy,
  Check,
  Zap,
  ChevronDown,
  ChevronRight,
  BookOpen,
  Variable,
  Lock,
  ExternalLink,
  Lightbulb,
  Play,
  Info,
} from "lucide-react";
import { getSolutionBySlug, type BadgeSolution, type LabSolution, type SolutionStep } from "@/lib/solutions";

// ── Auth guard ───────────────────────────────────────────────────────────────
function isProfileTracked(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const stored = localStorage.getItem("arcade_profiles");
    if (!stored) return false;
    const list: unknown[] = JSON.parse(stored);
    return list.length > 0;
  } catch {
    return false;
  }
}

// ── Copy button ───────────────────────────────────────────────────────────────
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handle = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handle}
      title="Copy to clipboard"
      className={`shrink-0 p-1.5 rounded-md transition-all ${
        copied
          ? "bg-emerald-500/20 text-emerald-400"
          : "bg-white/5 text-mist-muted hover:bg-white/10 hover:text-mist"
      }`}
    >
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

// ── Terminal code block ──────────────────────────────────────────────────────
function TerminalBlock({
  commands,
  accent = "cyan",
}: {
  commands: string[];
  accent?: "cyan" | "green" | "amber" | "violet";
}) {
  const text = commands.join("\n");
  const colorMap = {
    cyan: "border-cyan/30 shadow-cyan/10",
    green: "border-emerald-500/30 shadow-emerald-500/10",
    amber: "border-amber/30 shadow-amber/10",
    violet: "border-violet/30 shadow-violet/10",
  };
  const promptMap = {
    cyan: "text-cyan",
    green: "text-emerald-400",
    amber: "text-amber",
    violet: "text-violet",
  };

  return (
    <div
      className={`relative rounded-xl border bg-void/80 backdrop-blur font-mono text-sm overflow-hidden shadow-lg ${colorMap[accent]}`}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/8 bg-white/3">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
        </div>
        <span className="text-[10px] text-mist-muted/60 uppercase tracking-widest">Cloud Shell</span>
        <CopyButton text={text} />
      </div>
      {/* Commands */}
      <div className="p-4 space-y-1.5 overflow-x-auto">
        {commands.map((cmd, i) => (
          <div key={i} className="flex gap-2">
            <span className={`${promptMap[accent]} select-none shrink-0`}>$</span>
            <span className="text-mist/90 whitespace-pre break-all">{cmd}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Step card ────────────────────────────────────────────────────────────────
function StepCard({
  step,
  index,
}: {
  step: SolutionStep;
  index: number;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3">
        <div className="shrink-0 w-7 h-7 rounded-lg bg-gradient-to-br from-cyan/20 to-violet/20 border border-cyan/30 flex items-center justify-center text-xs font-bold text-cyan">
          {index + 1}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-mist">{step.title}</h4>
          {step.description && (
            <p className="text-xs text-mist-muted mt-0.5 leading-relaxed">{step.description}</p>
          )}
        </div>
      </div>
      <div className="ml-10">
        <TerminalBlock commands={step.commands} />
        {step.note && (
          <div className="mt-2 flex items-start gap-2 text-xs text-amber/80">
            <Lightbulb className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>{step.note}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Lab accordion ────────────────────────────────────────────────────────────
function LabCard({ lab }: { lab: LabSolution }) {
  const [open, setOpen] = useState(false);
  const hasQuick = !!lab.quickScript;

  return (
    <div className="glass rounded-2xl border border-line/40 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-white/3 transition-colors"
      >
        <div className="shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-violet/20 to-cyan/20 border border-violet/30 flex items-center justify-center">
          <BookOpen className="w-4 h-4 text-violet" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-violet/70 uppercase tracking-widest">{lab.labId}</span>
            {hasQuick && (
              <span className="inline-flex items-center gap-1 text-[9px] bg-emerald-500/15 text-emerald-400 rounded px-1.5 py-0.5 font-semibold uppercase tracking-wide">
                <Zap className="w-2.5 h-2.5" /> Quick Script
              </span>
            )}
          </div>
          <p className="text-sm font-semibold text-mist truncate">{lab.labTitle}</p>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          {lab.labUrl && (
            <a
              href={lab.labUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              title="Open lab"
              className="p-1.5 rounded-lg text-mist-muted hover:text-cyan transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
          {open ? (
            <ChevronDown className="w-4 h-4 text-mist-muted" />
          ) : (
            <ChevronRight className="w-4 h-4 text-mist-muted" />
          )}
        </div>
      </button>

      {/* Body */}
      {open && (
        <div className="border-t border-line/30 px-5 pb-6 pt-5 space-y-6">
          {/* Quick Script */}
          {lab.quickScript && (
            <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <Zap className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">⚡ Quick Complete</span>
              </div>
              <p className="text-xs text-mist-muted leading-relaxed">{lab.quickScript.description}</p>
              <TerminalBlock commands={lab.quickScript.commands} accent="green" />
            </div>
          )}

          {/* Variables */}
          {lab.variables && lab.variables.length > 0 && (
            <div className="rounded-xl border border-amber/20 bg-amber/5 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-amber/20 flex items-center justify-center">
                  <Variable className="w-3.5 h-3.5 text-amber" />
                </div>
                <span className="text-xs font-bold text-amber uppercase tracking-widest">Set Variables First</span>
              </div>
              <p className="text-xs text-mist-muted">
                Run these commands in Cloud Shell <strong className="text-mist">before</strong> any step below.
                Values are shown in the <strong className="text-mist">Lab panel</strong> on the left side.
              </p>
              <div className="space-y-3">
                {lab.variables.map((v) => (
                  <div key={v.name} className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <code className="text-[11px] font-mono font-bold text-amber bg-amber/10 px-1.5 py-0.5 rounded">
                        ${v.name}
                      </code>
                      <span className="text-xs text-mist-muted">{v.label}</span>
                    </div>
                    {v.autoDetect ? (
                      <div className="space-y-1">
                        <p className="text-[11px] text-mist-muted/70">Auto-detect (run this):</p>
                        <TerminalBlock commands={[v.autoDetect]} accent="amber" />
                      </div>
                    ) : (
                      <p className="text-[11px] text-mist-muted/70 flex items-start gap-1">
                        <Info className="w-3 h-3 shrink-0 mt-0.5" />
                        {v.hint}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Steps */}
          {lab.steps.length > 0 && (
            <div className="space-y-5">
              <h4 className="text-xs font-bold text-mist-muted uppercase tracking-widest flex items-center gap-2">
                <Play className="w-3.5 h-3.5" />
                Step-by-Step Commands
              </h4>
              {lab.steps.map((step, i) => (
                <StepCard key={i} step={step} index={i} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Access Gate ──────────────────────────────────────────────────────────────
function AccessGate() {
  return (
    <div className="flex flex-col items-center justify-center gap-8 py-28 text-center">
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-violet/20 blur-2xl scale-150" />
        <div className="relative w-20 h-20 rounded-2xl glass-strong border border-violet/30 flex items-center justify-center">
          <Lock className="w-10 h-10 text-violet" />
        </div>
      </div>
      <div className="space-y-3 max-w-sm">
        <h1 className="font-display text-2xl font-semibold text-mist">Track Your Profile First</h1>
        <p className="text-mist-muted text-sm leading-relaxed">
          Solutions are only available to participants who have added their Google Arcade profile.
          Track your profile to unlock lab solutions.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan via-violet to-pink text-void text-sm font-semibold transition-transform hover:scale-[1.02] active:scale-[0.98]"
        >
          Add Your Profile
        </Link>
        <Link
          href="/leaderboard"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl glass border border-line/40 text-mist text-sm hover:bg-white/10 transition-colors"
        >
          Back to Leaderboard
        </Link>
      </div>
    </div>
  );
}

// ── Not found ────────────────────────────────────────────────────────────────
function NoSolution({ slug }: { slug: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-8 py-28 text-center">
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-cyan/10 blur-2xl scale-150" />
        <div className="relative w-20 h-20 rounded-2xl glass-strong border border-cyan/30 flex items-center justify-center">
          <Terminal className="w-10 h-10 text-cyan" />
        </div>
      </div>
      <div className="space-y-3 max-w-md">
        <h1 className="font-display text-2xl font-semibold text-mist">No Solution Yet</h1>
        <p className="text-mist-muted text-sm leading-relaxed">
          We haven't added a solution guide for{" "}
          <span className="text-mist font-medium">&ldquo;{slug.replace(/-/g, " ")}&rdquo;</span> yet.
          Check back soon or suggest it!
        </p>
      </div>
      <Link
        href="/"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl glass border border-line/40 text-mist text-sm hover:bg-white/10 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
      </Link>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function SolutionPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug as string;
  const [accessGranted, setAccessGranted] = useState<boolean | null>(null);
  const [solution, setSolution] = useState<BadgeSolution | null | undefined>(undefined);

  useEffect(() => {
    const ok = isProfileTracked();
    setAccessGranted(ok);
    if (ok) {
      const s = getSolutionBySlug(slug);
      setSolution(s ?? null);
    }
  }, [slug]);

  // Loading
  if (accessGranted === null) {
    return (
      <div className="py-28 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-cyan/30 border-t-cyan animate-spin" />
      </div>
    );
  }

  if (!accessGranted) return <AccessGate />;
  if (solution === undefined) return null;
  if (solution === null) return <NoSolution slug={slug} />;

  return (
    <div className="space-y-8 py-12 max-w-4xl mx-auto">
      {/* Back link */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs text-mist-muted hover:text-cyan transition-colors rise-in"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to dashboard
      </Link>

      {/* Header */}
      <div className="rise-in space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold text-cyan bg-cyan/10 border border-cyan/25 rounded-full px-3 py-1">
            <Terminal className="w-3 h-3" /> Lab Solutions
          </span>
          {solution.badgeUrl && (
            <a
              href={solution.badgeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[10px] text-mist-muted hover:text-mist transition-colors"
            >
              View Badge Course <ExternalLink className="w-2.5 h-2.5" />
            </a>
          )}
        </div>
        <h1 className="font-display text-3xl font-bold text-mist leading-tight">
          {solution.badgeTitle}
        </h1>
        {solution.description && (
          <p className="text-mist-muted text-sm leading-relaxed max-w-2xl">{solution.description}</p>
        )}
      </div>

      {/* How to use callout */}
      <div className="rise-in rounded-xl border border-violet/25 bg-violet/5 px-5 py-4 flex gap-3">
        <div className="shrink-0 w-8 h-8 rounded-lg bg-violet/20 flex items-center justify-center mt-0.5">
          <Info className="w-4 h-4 text-violet" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-mist">How to use these solutions</p>
          <p className="text-xs text-mist-muted leading-relaxed">
            Open <strong className="text-mist">Google Cloud Shell</strong> in your lab, then paste the commands.
            Look for <span className="text-emerald-400 font-semibold">⚡ Quick Complete</span> labs — just 3 commands and you're done.
            For others, set the <span className="text-amber font-semibold">variables</span> first, then follow each step.
          </p>
        </div>
      </div>

      {/* Lab list */}
      <div className="space-y-4 rise-in">
        <h2 className="text-xs font-bold text-mist-muted uppercase tracking-widest">
          {solution.labs.length} Lab{solution.labs.length !== 1 ? "s" : ""} in this Badge
        </h2>
        {solution.labs.map((lab) => (
          <LabCard key={lab.labId} lab={lab} />
        ))}
      </div>

      {/* Footer note */}
      <div className="rise-in text-center text-xs text-mist-muted/60 pb-8">
        Solutions are community-sourced. Always verify commands match your lab's current version.
      </div>
    </div>
  );
}
