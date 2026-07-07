"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import {
  AccountSwitcher,
  DashboardNavLink,
  SimulatorNavLink,
  AddProfileNavLink,
} from "@/components/AccountSwitcher";

export default function NavBar() {
  const [isOpen, setIsOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

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
          <AccountSwitcher />
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
        className={`lg:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? "max-h-screen opacity-100" : "max-h-0 opacity-0 pointer-events-none"
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

          {/* Account switcher — full width variant */}
          <div className="mt-3 pt-3 border-t border-line/40">
            <AccountSwitcher />
          </div>
        </div>
      </div>
    </nav>
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
