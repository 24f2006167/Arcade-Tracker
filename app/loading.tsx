"use client";

import { useEffect, useState } from "react";
import { Terminal } from "lucide-react";

const CODE_LINES = [
  "#include <string>",
  "using namespace std;",
  "string find_date(string card_no) {",
  "  char buf[11]; int a, b, c;",
  "  sscanf(s.c_str(), \"%d-%d-%d\", &a, &b, &c);",
  "  sprintf(buf, \"%02d/%02d/%d\", c, b, a);",
  "  return buf;",
  "}",
  "int main() {",
  "  cout << find_date(\"2012-09-28\") << endl;",
  "  system(\"pause\"); return 0;",
  "}",
  "// Initialising Google Cloud API link...",
  "const client = new GoogleArcadeAPI({ secure: true });",
  "await client.connect(); // Establishing handshake",
  "STATUS: [200 OK] SECURE CONNECTION handshakes.",
  "const profileId = decryptedPayload.id;",
  "console.log('Decrypted badge payload count:', data.length);",
  "const points = data.milestones.totalArcadePoints;",
  "const badges = data.badges.filter(b => b.earned);",
  "dispatch({ type: 'SYNC_STATS', payload: { points, badges } });",
  "// Compiling visual HUD simulation metrics...",
  "const targetMilestone = 35 + 10; // Max milestone + bonus",
  "console.log('Milestone simulator mounted: SUCCESS');",
  "// Establishing public database synchronisation..."
];

export default function Loading() {
  const [percent, setPercent] = useState(0);
  const [status, setStatus] = useState("COMPILING SECURE INTERFACE...");
  const [logs, setLogs] = useState<string[]>([
    "Initialising compilation environment...",
    "Loading secure cryptographic library..."
  ]);

  useEffect(() => {
    // 1. Percentage counter
    const timer = setInterval(() => {
      setPercent((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          return 100;
        }
        return prev + Math.floor(Math.random() * 9) + 4;
      });
    }, 110);

    // 2. Status text cycling
    const statusTexts = [
      "COMPILING SECURE INTERFACE...",
      "ESTABLISHING CONNECTIVITY...",
      "FETCHING ARCADE PROFILE METADATA...",
      "DECRYPTING BADGE PAYLOAD...",
      "MOUNTING GRAPHICAL HUD VISUALIZER..."
    ];
    const statusTimer = setInterval(() => {
      setStatus(statusTexts[Math.floor(Math.random() * statusTexts.length)]);
    }, 850);

    // 3. Dynamic hacker coding terminal line push
    let lineIdx = 0;
    const logsTimer = setInterval(() => {
      setLogs((prev) => {
        const nextLine = CODE_LINES[lineIdx % CODE_LINES.length];
        lineIdx++;
        // Maintain last 5 lines for a clean scrolling terminal viewport
        return [...prev.slice(-4), nextLine];
      });
    }, 160);

    return () => {
      clearInterval(timer);
      clearInterval(statusTimer);
      clearInterval(logsTimer);
    };
  }, []);

  return (
    <div className="fixed inset-0 w-full h-full bg-[#05060f] z-[9999] flex flex-col items-center justify-center gap-6 pointer-events-auto">
      {/* Centered Hacker Silhouette loader */}
      <div className="relative w-28 h-28 flex items-center justify-center">
        {/* Pulse glow background */}
        <div className="absolute inset-0 rounded-full bg-[#22e5e5]/10 blur-3xl animate-pulse" />
        
        {/* Hacker Silhouette Logo pulsing */}
        <img 
          src="/hacker-silhouette.png" 
          alt="Hacker Logo" 
          className="w-22 h-22 object-contain animate-pulse filter drop-shadow-[0_0_20px_rgba(34,229,229,0.3)]"
          style={{ animationDuration: "2.5s" }}
        />
      </div>

      <div className="flex flex-col items-center gap-4 max-w-sm w-full px-6 text-center">
        {/* Status Text */}
        <div className="flex items-center justify-center gap-2 text-xs font-mono text-[#22e5e5] tracking-wider uppercase animate-pulse">
          <Terminal className="w-3.5 h-3.5" />
          {status}
        </div>

        {/* Scrolling Hacker Code Terminal Box */}
        <div className="w-full h-32 rounded-xl bg-black/40 border border-white/5 p-3.5 text-[9px] font-mono text-[#22e5e5]/70 text-left overflow-hidden flex flex-col gap-1 leading-relaxed">
          {logs.map((log, idx) => (
            <div key={idx} className="flex gap-2 whitespace-nowrap">
              <span className="text-[#8e8aab]">&gt;</span>
              <span className="truncate">{log}</span>
            </div>
          ))}
          <div className="w-1.5 h-3 bg-[#22e5e5]/40 animate-pulse mt-0.5" />
        </div>

        {/* HUD Progress Bar */}
        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden border border-white/5">
          <div 
            className="h-full bg-gradient-to-r from-[#22e5e5] via-[#b389ff] to-[#ff6fb3] rounded-full transition-all duration-150"
            style={{ width: `${Math.min(percent, 100)}%` }}
          />
        </div>

        {/* Progress Percentage */}
        <div className="text-[10px] font-mono text-[#8e8aab] tracking-widest uppercase">
          DECRYPT STAGE: {Math.min(percent, 100)}%
        </div>
      </div>
    </div>
  );
}
