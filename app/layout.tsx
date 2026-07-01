import type { Metadata } from "next";
import { Inter, Space_Grotesk, Press_Start_2P } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
});

const pressStart = Press_Start_2P({
  variable: "--font-score",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Arcade Tracker",
  description: "Track your Google Skills Arcade points, badges, and leaderboard.",
};

import { AccountSwitcher, DashboardNavLink } from "@/components/AccountSwitcher";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${spaceGrotesk.variable} ${pressStart.variable} h-full`}
    >
      <body className="min-h-full antialiased">
        <div className="aurora-field" aria-hidden>
          <div className="aurora-blob a1" />
          <div className="aurora-blob a2" />
          <div className="aurora-blob a3" />
          <div className="aurora-grain" />
        </div>

        <nav className="sticky top-0 z-50 glass border-b border-line/60">
          <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5 group">
              <span className="relative w-2.5 h-2.5 rounded-full bg-gradient-to-br from-cyan via-violet to-pink pulse-glow" />
              <span className="font-display font-semibold text-sm tracking-tight text-mist">
                Arcade Tracker
              </span>
            </Link>
            <div className="flex items-center gap-5 sm:gap-6 text-sm text-mist-muted">
              <Link href="/" className="hover:text-cyan transition-colors">
                Add profile
              </Link>
              <DashboardNavLink />
              <Link href="/leaderboard" className="hover:text-pink transition-colors">
                Leaderboard
              </Link>
              <Link href="/announcements" className="hover:text-violet transition-colors">
                Announcements
              </Link>
              <AccountSwitcher />
            </div>
          </div>
        </nav>
        <main className="mx-auto max-w-6xl px-6 py-12">{children}</main>
      </body>
    </html>
  );
}
