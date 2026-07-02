"use client";

import dynamic from "next/dynamic";

// Boot screen uses canvas + window.addEventListener — must never SSR
const HackerBootScreen = dynamic(
  () => import("@/components/HackerBootScreen"),
  { ssr: false }
);

export default function HackerBootWrapper() {
  return <HackerBootScreen />;
}
