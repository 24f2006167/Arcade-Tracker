"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Menu, X, Sun, Moon, BookOpen } from "lucide-react";
import {
  AccountSwitcher,
  DashboardNavLink,
  SimulatorNavLink,
  AddProfileNavLink,
} from "@/components/AccountSwitcher";
import { useTheme } from "@/components/ThemeProvider";
import { SolutionPickerModal } from "@/components/SolutionPicker";

export default function NavBar() {
  const [isOpen, setIsOpen] = useState(false);
  const [solutionsOpen, setSolutionsOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const { theme, toggle, hackerMode, toggleHackerMode } = useTheme();

  // Close drawer on Escape key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Close drawer on outside click (outside the entire nav element)
  useEffect(() => {
    if (!isOpen) return;
    const onOutside = (e: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    // slight delay so the hamburger click doesn't immediately close
    const id = setTimeout(() => document.addEventListener("mousedown", onOutside), 50);
    return () => {
      clearTimeout(id);
      document.removeEventListener("mousedown", onOutside);
    };
  }, [isOpen]);

  // Prevent body scroll when drawer is open on mobile
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const close = () => setIsOpen(false);

  return (
    <>
    <nav className="sticky top-0 z-50 glass border-b border-line/60" ref={drawerRef}>
      {/* ── Main bar ─────────────────────────────────────────────── */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-3">
        {/* Logo */}
        <Link
          href="/"
          onClick={close}
          className="flex items-center gap-2 group shrink-0 min-w-0"
        >
          <img
            src="https://avatars.githubusercontent.com/u/117688092?v=4"
            alt="STS Logo"
            className="w-6 h-6 rounded-md object-contain border border-white/10 group-hover:scale-105 transition-transform shrink-0"
          />
          <span className="font-display font-semibold text-sm tracking-tight text-mist truncate">
            STS Arcade Tracker
          </span>
        </Link>

        {/* Desktop nav (≥1024 px) */}
        <div className="hidden lg:flex items-center gap-5 xl:gap-6 text-sm text-mist-muted shrink-0">
          <AddProfileNavLink />
          <DashboardNavLink />
          <SimulatorNavLink />
          <Link
            href="/leaderboard"
            className="hover:text-pink transition-colors whitespace-nowrap"
          >
            Leaderboard
          </Link>
          <Link
            href="/announcements"
            className="hover:text-violet transition-colors whitespace-nowrap"
          >
            Announcements
          </Link>
          <Link
            href="/facilitator-guide"
            className="hover:text-cyan transition-colors whitespace-nowrap"
          >
            Prep Guide
          </Link>
          <AccountSwitcher />
          {/* Lab Solutions picker */}
          <button
            onClick={() => setSolutionsOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-cyan/25 bg-cyan/8 text-cyan text-[11px] font-semibold hover:bg-cyan hover:text-void transition-all duration-200 active:scale-95 whitespace-nowrap"
          >
            <BookOpen className="w-3 h-3" />
            Lab Solutions
          </button>
          {/* Hacker Mode button */}
          <button
            onClick={toggleHackerMode}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-mono font-bold tracking-wider transition-all duration-300 active:scale-95 cursor-pointer uppercase ${
              hackerMode
                ? "bg-red-500/10 border-red-500/30 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.2)]"
                : "bg-white/5 border-line/40 text-mist-muted hover:text-mist hover:bg-white/10"
            }`}
            style={{ flexShrink: 0 }}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${hackerMode ? "bg-red-500 animate-pulse" : "bg-mist-muted"}`} />
            Hacker Mode: {hackerMode ? "ON" : "OFF"}
          </button>
          {/* Theme toggle */}
          <button
            id="theme-toggle-btn"
            onClick={toggle}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            className="flex items-center justify-center w-8 h-8 rounded-full glass hover:bg-white/10 text-mist-muted hover:text-mist transition-all duration-200 active:scale-90 cursor-pointer"
            style={{ flexShrink: 0 }}
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4" style={{ color: "#ffc24b", filter: "drop-shadow(0 0 6px rgba(255,194,75,0.5))" }} />
            ) : (
              <Moon className="w-4 h-4" style={{ color: "#7c3aed" }} />
            )}
          </button>
        </div>

        {/* Hamburger button (visible below 1024 px) */}
        <button
          aria-label={isOpen ? "Close menu" : "Open menu"}
          aria-expanded={isOpen}
          aria-controls="mobile-drawer"
          onClick={() => setIsOpen((v) => !v)}
          className="lg:hidden flex items-center justify-center w-9 h-9 rounded-xl glass hover:bg-white/10 text-mist-muted hover:text-mist transition-all shrink-0 active:scale-95"
        >
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* ── Mobile / Tablet drawer (below 1024 px) ───────────────── */}
      <div
        id="mobile-drawer"
        className={`lg:hidden overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? "max-h-screen opacity-100" : "max-h-0 opacity-0 pointer-events-none"
          }`}
        aria-hidden={!isOpen}
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6 pb-5 pt-2 flex flex-col gap-1 border-t border-line/40">
          {/* Nav links */}
          <NavDrawerLink href="/" onClick={close}>
            Home
          </NavDrawerLink>

          {/* These client components render null if no profile exists — that's fine */}
          <DrawerDashboardLink onClick={close} />
          <DrawerSimulatorLink onClick={close} />
          <DrawerAddProfileLink onClick={close} />

          <NavDrawerLink href="/leaderboard" onClick={close} accent="pink">
            Leaderboard
          </NavDrawerLink>
          <NavDrawerLink href="/announcements" onClick={close} accent="violet">
            Announcements
          </NavDrawerLink>
          <NavDrawerLink href="/facilitator-guide" onClick={close} accent="cyan">
            Prep Guide
          </NavDrawerLink>
          <button
            onClick={() => { setSolutionsOpen(true); close(); }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-cyan hover:bg-cyan/8 transition-all duration-150 w-full text-left"
          >
            <BookOpen className="w-4 h-4" />
            Lab Solutions
          </button>

          {/* Account switcher — full width variant */}
          <div className="mt-3 pt-3 border-t border-line/40">
            <AccountSwitcher />
          </div>

          {/* Hacker Mode in mobile drawer */}
          <button
            onClick={() => { toggleHackerMode(); close(); }}
            className={`mt-2 flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-mono font-bold tracking-wider transition-all duration-150 w-full cursor-pointer uppercase ${
              hackerMode
                ? "bg-red-500/10 text-red-400 border border-red-500/20"
                : "text-mist-muted hover:text-mist hover:bg-white/5 border border-transparent"
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${hackerMode ? "bg-red-500 animate-pulse" : "bg-mist-muted"}`} />
            Hacker Mode: {hackerMode ? "ON" : "OFF"}
          </button>

          {/* Theme toggle in mobile drawer */}
          <button
            onClick={() => { toggle(); close(); }}
            className="mt-2 flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-mist-muted hover:text-mist hover:bg-white/5 transition-all duration-150 w-full cursor-pointer"
          >
            {theme === "dark" ? (
              <><Sun className="w-4 h-4" style={{ color: "#ffc24b" }} /> Switch to Light Mode</>
            ) : (
              <><Moon className="w-4 h-4" style={{ color: "#7c3aed" }} /> Switch to Dark Mode</>
            )}
          </button>
        </div>
      </div>
    </nav>
    <SolutionPickerModal open={solutionsOpen} onClose={() => setSolutionsOpen(false)} />
    </>
  );
}

// ── Small helper wrappers so we can pass onClick into the client nav links ──

function NavDrawerLink({
  href,
  onClick,
  children,
  accent,
}: {
  href: string;
  onClick: () => void;
  children: React.ReactNode;
  accent?: "pink" | "violet" | "cyan";
}) {
  const colorMap = {
    pink: "hover:text-pink",
    violet: "hover:text-violet",
    cyan: "hover:text-cyan",
  };
  const accentClass = accent ? colorMap[accent] : "hover:text-cyan";

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-mist-muted ${accentClass} hover:bg-white/5 transition-all duration-150`}
    >
      {children}
    </Link>
  );
}

// Thin wrappers that forward the onClick close handler around the pure client components
function DrawerDashboardLink({ onClick }: { onClick: () => void }) {
  // DashboardNavLink renders null if no profile — we wrap it in a div with onClick
  return (
    <div onClick={onClick} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-mist-muted hover:text-cyan hover:bg-white/5 transition-all duration-150 cursor-pointer">
      <DashboardNavLink />
    </div>
  );
}

function DrawerSimulatorLink({ onClick }: { onClick: () => void }) {
  return (
    <div onClick={onClick} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-mist-muted hover:text-cyan hover:bg-white/5 transition-all duration-150 cursor-pointer">
      <SimulatorNavLink />
    </div>
  );
}

function DrawerAddProfileLink({ onClick }: { onClick: () => void }) {
  return (
    <div onClick={onClick} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-mist-muted hover:text-cyan hover:bg-white/5 transition-all duration-150 cursor-pointer">
      <AddProfileNavLink />
    </div>
  );
}
