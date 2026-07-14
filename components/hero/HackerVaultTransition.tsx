"use client";

import { useEffect, useState, useRef } from "react";
import { Terminal } from "lucide-react";

const LOG_MESSAGES = [
  "[CONNECTING] Accessing go.cloudskillsboost.google/arcade...",
  "[OK] Connection established. Initializing secure scraper handshake.",
  "[CONNECTING] Accessing rsvp.withgoogle.com/events/arcade-facilitator...",
  "[BYPASS] Security authorization token successfully verified.",
  "[SECURE] Decrypting profile badge milestones...",
  "[OK] Loaded Trivia, Skill Badges & Milestones data.",
  "[SYSTEM] Overriding standard layout. Activating advanced dashboard UX..."
];

// Canvas matrix rain effect in pure Red
function RedMatrixRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", resize);
    resize();

    const katakana = "ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const alphabet = katakana.split("");

    const fontSize = 15;
    const columns = Math.ceil(canvas.width / fontSize);

    const rainDrops: number[] = [];
    for (let x = 0; x < columns; x++) {
      rainDrops[x] = Math.random() * -100;
    }

    const draw = () => {
      ctx.fillStyle = "rgba(0, 0, 0, 0.12)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "#ef4444";
      ctx.font = `bold ${fontSize}px monospace`;

      for (let i = 0; i < rainDrops.length; i++) {
        const text = alphabet[Math.floor(Math.random() * alphabet.length)];
        ctx.fillText(text, i * fontSize, rainDrops[i] * fontSize);

        if (rainDrops[i] * fontSize > canvas.height && Math.random() > 0.985) {
          rainDrops[i] = 0;
        }
        rainDrops[i] += 1.2; 
      }
    };

    const animate = () => {
      draw();
      animationFrameId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none select-none opacity-45"
    />
  );
}

export default function HackerVaultTransition({ 
  isTurningOff = false,
  onComplete 
}: { 
  isTurningOff?: boolean;
  onComplete: () => void 
}) {
  const [percent, setPercent] = useState(isTurningOff ? 100 : 0);
  const [logs, setLogs] = useState<string[]>(isTurningOff ? LOG_MESSAGES : []);
  const [logIndex, setLogIndex] = useState(isTurningOff ? LOG_MESSAGES.length : 0);
  const [isBlinkingOff, setIsBlinkingOff] = useState(isTurningOff);

  // Speech synthesis prompt & loading countdown (5 seconds total duration)
  useEffect(() => {
    if (isTurningOff) {
      // For turning OFF: trigger instant CRT collapse animation to standard mode
      const handle = setTimeout(() => {
        setIsBlinkingOff(true);
        setTimeout(onComplete, 380);
      }, 50);
      return () => clearTimeout(handle);
    }

    // Normal mode: 5 second loading countdown
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance("Access granted. Initializing decryption terminal.");
      utterance.rate = 1.15;
      utterance.pitch = 0.85;
      window.speechSynthesis.speak(utterance);
    }

    // Animate progress bar & percentage over 5 seconds (50 ticks of 100ms)
    const timer = setInterval(() => {
      setPercent((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setIsBlinkingOff(true);
          setTimeout(onComplete, 380);
          return 100;
        }
        return prev + 2;
      });
    }, 100);

    return () => clearInterval(timer);
  }, [isTurningOff, onComplete]);

  // Rolling decryption logs effect (Stretched to match the 5.0 seconds duration)
  useEffect(() => {
    if (isTurningOff || logIndex >= LOG_MESSAGES.length) return;
    
    const interval = setTimeout(() => {
      setLogs((prev) => [...prev, LOG_MESSAGES[logIndex]]);
      setLogIndex((prev) => prev + 1);
    }, 650);

    return () => clearTimeout(interval);
  }, [logIndex, isTurningOff]);

  return (
    <div className={`fixed inset-0 w-full h-full bg-black z-[9999] flex flex-col items-center justify-center p-6 select-none pointer-events-auto font-mono text-cyan transition-all duration-300 ${isBlinkingOff ? "crt-blink-off" : ""}`}>
      {/* 1. Heavy Red Code Matrix Rain backdrop */}
      <RedMatrixRain />

      {/* Background Matrix Glitch scanlines */}
      <div className="hud-scanlines absolute inset-0 opacity-40 pointer-events-none z-[1]" />
      <div className="hud-vignette absolute inset-0 opacity-95 pointer-events-none z-[2]" />

      {/* Cyber Vault vector switcher container */}
      <div className="relative w-80 h-48 flex flex-col items-center justify-center mb-6 overflow-hidden rounded-xl border border-red-500/35 bg-red-950/20 shadow-[0_0_35px_rgba(239,68,68,0.35)] select-none pointer-events-none p-4 z-[3]">
        {/* Red warning triangle vector */}
        <div className="relative w-24 h-20 flex items-center justify-center animate-[pulse_1.5s_infinite]">
          <svg className="w-full h-full text-red-500 drop-shadow-[0_0_12px_rgba(239,68,68,0.8)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M12 2L2 22H22L12 2Z" fill="rgba(239,68,68,0.18)" strokeLinejoin="round" />
            <line x1="12" y1="9" x2="12" y2="15" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="12" cy="18" r="1.25" fill="currentColor" />
          </svg>
        </div>

        {percent < 75 ? (
          <div className="mt-3 flex flex-col items-center gap-1.5 w-full">
            <div className="text-[10px] font-mono font-bold tracking-widest text-red-400 animate-pulse uppercase">
              DECRYPTING FIREWALL SECURITY...
            </div>
            {/* Green progress loader bar */}
            <div className="w-44 h-3 bg-black border border-red-500/40 rounded overflow-hidden p-0.5 shadow-[0_0_8px_rgba(34,197,94,0.15)]">
              <div 
                className="h-full bg-emerald-500 rounded-sm shadow-[0_0_6px_#10b981] transition-all duration-75" 
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="mt-3 flex flex-col items-center gap-1 text-center w-full animate-pulse">
            <div className="text-[11px] font-mono font-extrabold tracking-wider text-red-500 drop-shadow-[0_0_8px_#ff0000] uppercase glitch-text">
              CRITICAL: PHISHING ATTACK DETECTED
            </div>
            <div className="text-[9px] font-mono text-red-400/60 uppercase tracking-widest">
              SYSTEM OVERRIDE TRIGGERED
            </div>
          </div>
        )}

        {/* Scanline overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] pointer-events-none" />
      </div>

      {/* Title & Decrypt Loading Percent */}
      <div className="text-center space-y-2 mb-6 z-[3]">
        <h2 className="text-xl font-bold tracking-widest text-pink uppercase glitch-text">
          SYSTEM DECRYPTION IN PROGRESS
        </h2>
        <div className="text-4xl font-extrabold tracking-widest text-cyan font-score">
          {percent.toString().padStart(3, "0")}%
        </div>
      </div>

      {/* Progress loading bar */}
      <div className="w-full max-w-md h-2 bg-white/5 border border-cyan/35 rounded-full overflow-hidden mb-6 relative z-[3]">
        <div 
          className="h-full bg-gradient-to-r from-cyan via-indigo-500 to-pink shadow-[0_0_12px_#22e5e5] transition-all duration-75" 
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* Interactive terminal log viewer */}
      <div className="w-full max-w-lg h-36 bg-black/60 border border-cyan/20 rounded-xl p-4 overflow-y-auto space-y-1 text-left text-xs text-cyan/90 font-mono scrollbar-thin z-[3]">
        <div className="flex items-center gap-1.5 border-b border-cyan/20 pb-1 mb-2 text-cyan/50 font-bold uppercase tracking-wider text-[10px]">
          <Terminal className="w-3.5 h-3.5" />
          <span>Decryption Matrix Logs</span>
        </div>
        {logs.map((log, index) => {
          let color = "text-cyan/85";
          if (log.includes("[OK]")) color = "text-emerald-400 font-semibold";
          if (log.includes("[BYPASS]")) color = "text-amber-400 font-bold";
          if (log.includes("[SYSTEM]")) color = "text-pink font-semibold";
          return (
            <div key={index} className={`${color} leading-relaxed animate-fade-in`}>
              {log}
            </div>
          );
        })}
      </div>
    </div>
  );
}
