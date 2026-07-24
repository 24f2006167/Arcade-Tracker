"use client";

import { useEffect, useRef } from "react";

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
    return null;
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
