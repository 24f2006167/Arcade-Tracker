"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  BookOpen,
  X,
  Search,
  Zap,
  ChevronRight,
  Terminal,
  ExternalLink,
  Wrench,
  Gamepad2,
} from "lucide-react";
import { SOLUTIONS, type BadgeSolution } from "@/lib/solutions";

// ── Helper: flatten all labs into a searchable list ──────────────────────────
interface FlatLab {
  labId: string;
  labTitle: string;
  labUrl?: string;
  badgeTitle: string;
  badgeSlug: string;
  hasQuickScript: boolean;
}

const ALL_LABS: FlatLab[] = SOLUTIONS.flatMap((badge) =>
  badge.labs.map((lab) => ({
    labId: lab.labId,
    labTitle: lab.labTitle,
    labUrl: lab.labUrl,
    badgeTitle: badge.badgeTitle,
    badgeSlug: badge.badgeSlug,
    hasQuickScript: !!lab.quickScript,
  }))
);

// ── Grouped view: badge → labs ────────────────────────────────────────────────
interface BadgeGroup {
  badge: BadgeSolution;
  labs: FlatLab[];
}

function groupByBadge(filtered: FlatLab[]): BadgeGroup[] {
  const map = new Map<string, BadgeGroup>();
  for (const lab of filtered) {
    if (!map.has(lab.badgeSlug)) {
      const badge = SOLUTIONS.find((s) => s.badgeSlug === lab.badgeSlug)!;
      map.set(lab.badgeSlug, { badge, labs: [] });
    }
    map.get(lab.badgeSlug)!.labs.push(lab);
  }
  return Array.from(map.values());
}

// ── Main modal component ──────────────────────────────────────────────────────
export function SolutionPickerModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus search on open
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 80);
    } else {
      setQuery("");
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const q = query.toLowerCase().trim();
  const filtered =
    q === ""
      ? ALL_LABS
      : ALL_LABS.filter(
          (l) =>
            l.labTitle.toLowerCase().includes(q) ||
            l.labId.toLowerCase().includes(q) ||
            l.badgeTitle.toLowerCase().includes(q)
        );

  const groups = groupByBadge(filtered);
  const totalLabs = ALL_LABS.length;
  const totalBadges = SOLUTIONS.length;

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-void/80 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal panel */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
      >
        <div
          className="pointer-events-auto w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl border border-line/50 bg-void/95 backdrop-blur-xl shadow-2xl shadow-cyan/10 overflow-hidden"
          style={{ animation: "modalIn 0.18s ease-out" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* ── Header ── */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-line/40">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan/20 to-violet/20 border border-cyan/30 flex items-center justify-center shrink-0">
              <Terminal className="w-4 h-4 text-cyan" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-bold text-mist">Lab Solutions</h2>
              <p className="text-[10px] text-mist-muted">
                {totalBadges} badges · {totalLabs} labs with solutions
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-mist-muted hover:text-mist hover:bg-white/8 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* ── Search ── */}
          <div className="px-4 py-3 border-b border-line/30">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 focus-within:border-cyan/40 transition-colors">
              <Search className="w-3.5 h-3.5 text-mist-muted shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search lab name, GSP code, or badge…"
                className="flex-1 bg-transparent text-sm text-mist placeholder:text-mist-muted/50 outline-none"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="text-mist-muted hover:text-mist transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* ── Lab list ── */}
          <div className="flex-1 overflow-y-auto custom-scroll px-4 py-3 space-y-5">
            {groups.length === 0 ? (
              <div className="py-12 text-center text-mist-muted text-sm">
                No labs found for &ldquo;{query}&rdquo;
              </div>
            ) : (
              groups.map(({ badge, labs }) => (
                <div key={badge.badgeSlug} className="space-y-2">
                  {/* Badge group header */}
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-md bg-violet/15 border border-violet/25 flex items-center justify-center shrink-0">
                      <Wrench className="w-2.5 h-2.5 text-violet" />
                    </div>
                    <span className="text-[10px] font-bold text-violet/80 uppercase tracking-widest truncate flex-1">
                      {badge.badgeTitle}
                    </span>
                    <span className="text-[9px] text-mist-muted/60 shrink-0">
                      {labs.length} lab{labs.length !== 1 ? "s" : ""}
                    </span>
                  </div>

                  {/* Lab rows */}
                  <div className="space-y-1 ml-1">
                    {labs.map((lab) => (
                      <Link
                        key={lab.labId}
                        href={`/solution/${badge.badgeSlug}#${lab.labId}`}
                        onClick={onClose}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-transparent hover:border-cyan/20 hover:bg-white/4 transition-all group"
                      >
                        {/* Lab ID chip */}
                        <span className="shrink-0 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-cyan/10 text-cyan border border-cyan/20">
                          {lab.labId}
                        </span>

                        {/* Lab title */}
                        <span className="flex-1 text-xs text-mist-muted group-hover:text-mist transition-colors truncate">
                          {lab.labTitle}
                        </span>

                        {/* Quick script badge */}
                        {lab.hasQuickScript && (
                          <span className="shrink-0 inline-flex items-center gap-0.5 text-[8px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 rounded px-1.5 py-0.5 font-semibold uppercase tracking-wide">
                            <Zap className="w-2 h-2" />
                            Quick
                          </span>
                        )}

                        {/* External lab link */}
                        {lab.labUrl && (
                          <a
                            href={lab.labUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="shrink-0 p-1 rounded text-mist-muted/40 hover:text-cyan transition-colors"
                            title="Open lab on skills.google"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}

                        <ChevronRight className="w-3 h-3 text-mist-muted/30 group-hover:text-cyan transition-colors shrink-0" />
                      </Link>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* ── Footer ── */}
          <div className="px-5 py-3 border-t border-line/30 flex items-center justify-between">
            <p className="text-[10px] text-mist-muted/60">
              {filtered.length} of {totalLabs} labs shown
            </p>
            <p className="text-[10px] text-mist-muted/50">
              Press <kbd className="px-1 py-0.5 rounded bg-white/8 font-mono">Esc</kbd> to close
            </p>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes modalIn {
          from {
            opacity: 0;
            transform: scale(0.96) translateY(8px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        .custom-scroll::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scroll::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 999px;
        }
        .custom-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </>
  );
}

// ── Trigger button — use this anywhere ───────────────────────────────────────
export function SolutionPickerButton({
  label = "Solutions",
  className = "",
}: {
  label?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={
          className ||
          `flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-[10px] font-semibold transition-all
          bg-gradient-to-r from-cyan/10 via-violet/10 to-pink/10
          border border-cyan/20
          text-cyan hover:text-void hover:from-cyan hover:via-violet hover:to-pink
          hover:border-transparent hover:shadow-md hover:shadow-cyan/20
          active:scale-[0.97] w-full`
        }
      >
        <BookOpen className="w-3 h-3" />
        {label}
      </button>
      <SolutionPickerModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
