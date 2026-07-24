"use client";

import { useEffect, useRef } from "react";
import { Sparkles } from "lucide-react";

interface AdBannerProps {
  slot: string;
  format?: string;
  responsive?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

export default function AdBanner({
  slot,
  format = "auto",
  responsive = true,
  style = { display: "block" },
  className = "",
}: AdBannerProps) {
  const adClientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
  const isMock =
    !adClientId ||
    adClientId === "ca-pub-1234567890123456" ||
    process.env.NODE_ENV === "development";

  const initialized = useRef(false);

  useEffect(() => {
    if (isMock) return;

    // Initialize adsbygoogle exactly once per element mount client-side
    if (!initialized.current) {
      initialized.current = true;
      try {
        const adsbygoogle = (window as any).adsbygoogle || [];
        adsbygoogle.push({});
      } catch (err) {
        console.error("AdSense push error:", err);
      }
    }
  }, [isMock]);

  if (isMock) {
    // Beautiful mock ad banner matching the cyberpunk/retro arcade glassmorphism theme
    return (
      <div className={`glass rounded-2xl p-5 border border-white/5 relative overflow-hidden my-6 bg-gradient-to-r from-pink/5 via-violet/5 to-cyan/5 rise-in ${className}`}>
        <div className="absolute top-2.5 right-3 text-[9px] font-bold text-mist-muted tracking-widest uppercase flex items-center gap-1 select-none">
          <Sparkles className="w-2.5 h-2.5 text-pink" /> Sponsored Ad
        </div>
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-cyan/15 flex items-center justify-center shrink-0 border border-cyan/20">
            <span className="text-xl">🚀</span>
          </div>
          <div className="flex-1 min-w-0 text-center md:text-left">
            <h4 className="text-xs font-bold text-cyan uppercase tracking-wider">Level Up Your Cloud Skills</h4>
            <p className="text-xs text-mist-muted mt-1 leading-relaxed">
              Unlock hands-on Google Cloud Skills Boost labs, earn official badges, and track your progress in real-time. Join the STS Community challenges!
            </p>
          </div>
          <a
            href="https://cloudskillsboost.google"
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 rounded-xl bg-pink/10 hover:bg-pink/20 border border-pink/20 hover:border-pink/40 text-pink text-xs font-semibold px-4 py-2.5 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
          >
            Learn More &rarr;
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className={`my-6 overflow-hidden flex justify-center w-full min-h-[100px] bg-black/10 rounded-2xl border border-white/5 p-2 ${className}`}>
      <ins
        className="adsbygoogle"
        style={style}
        data-ad-client={adClientId}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive ? "true" : "false"}
      />
    </div>
  );
}
