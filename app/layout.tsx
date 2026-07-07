import type { Metadata } from "next";
import { Inter, Space_Grotesk, Press_Start_2P } from "next/font/google";
import "./globals.css";
import BackgroundEffects from "@/components/BackgroundEffects";
import HackerBootWrapper from "@/components/HackerBootWrapper";


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
  title: "STS Arcade Tracker",
  description: "Track your Google Skills Arcade points, badges, and leaderboard.",
  icons: {
    icon: [
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/favicon.png",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "STS Arcade Tracker",
    description: "Track your Google Skills Arcade points, badges, and leaderboard.",
    images: [{ url: "/favicon.png", width: 512, height: 512, alt: "STS Arcade Tracker" }],
  },
  twitter: {
    card: "summary",
    title: "STS Arcade Tracker",
    description: "Track your Google Skills Arcade points, badges, and leaderboard.",
    images: ["/favicon.png"],
  },
  verification: {
    google: "7WPzAaeNIRGkKp12lRapCdGKW-LDnZWdHmTgTSRoVTI",
  },
};

import NavBar from "@/components/NavBar";
import VoiceAgent from "@/components/VoiceAgent"; // EXPERIMENTAL — remove if not keeping

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
          <div className="aurora-blob a4" />
          <div className="aurora-grain" />
        </div>

        <BackgroundEffects />
        <HackerBootWrapper />

        <NavBar />

        <main className="mx-auto max-w-6xl px-4 sm:px-6 overflow-x-hidden">{children}</main>

        {/* EXPERIMENTAL: Voice Agent — remove the line below + VoiceAgent.tsx to revert */}
        <VoiceAgent />
      </body>
    </html>
  );
}
