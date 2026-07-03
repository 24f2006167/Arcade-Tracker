"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Mic, MicOff, X, Bot, Volume2, VolumeX, Send, Navigation } from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────
interface Message {
  id: number;
  role: "user" | "agent";
  text: string;
  action?: { label: string; href: string };
}

interface UserProfile {
  id: string;
  name: string;
  points: number;
}

// ─── Read user context from localStorage ───────────────────────────────────────
function getUserContext(): { profiles: UserProfile[]; lastProfileId: string | null } {
  if (typeof window === "undefined") return { profiles: [], lastProfileId: null };
  try {
    const raw = localStorage.getItem("arcade_profiles");
    const profiles: UserProfile[] = raw ? JSON.parse(raw) : [];
    const lastProfileId = localStorage.getItem("last_profile_id");
    return { profiles, lastProfileId };
  } catch {
    return { profiles: [], lastProfileId: null };
  }
}

// ─── Navigation intent detection ──────────────────────────────────────────────
interface NavIntent {
  keywords: string[];
  label: string;
  getPath: (ctx: ReturnType<typeof getUserContext>) => string | null;
  response: (ctx: ReturnType<typeof getUserContext>) => string;
}

const NAV_INTENTS: NavIntent[] = [
  {
    keywords: ["home", "go home", "home page", "main page", "back home", "homepage", "start"],
    label: "Go to Home",
    getPath: () => "/",
    response: () => "Heading to the home page now! 🏠",
  },
  {
    keywords: ["dashboard", "my dashboard", "go dashboard", "open dashboard", "take me dashboard",
               "show dashboard", "view dashboard", "dashbord", "dash board"],
    label: "Go to Dashboard",
    getPath: (ctx) => ctx.lastProfileId ? `/dashboard/${ctx.lastProfileId}` : null,
    response: (ctx) =>
      ctx.lastProfileId
        ? `Taking you to your dashboard${ctx.profiles[0]?.name ? `, ${ctx.profiles[0].name}` : ""}! 🎮`
        : "I couldn't find a tracked profile. Add your profile on the home page first!",
  },
  {
    keywords: ["leaderboard", "leader board", "leaderbord", "leader bord", "leder board",
               "show leaderboard", "go leaderboard", "open leaderboard", "rankings",
               "ranking page", "top scores", "score board", "scoreboard", "high scores",
               "leaderboard page", "leader board page"],
    label: "Go to Leaderboard",
    getPath: () => "/leaderboard",
    response: () => "Opening the leaderboard! See how you rank! 🏆",
  },
  {
    keywords: ["announcements", "announcement", "anouncemets", "news", "updates",
               "latest news", "go announcements", "open announcements"],
    label: "Go to Announcements",
    getPath: () => "/announcements",
    response: () => "Taking you to Announcements to see the latest updates! 📢",
  },
  {
    keywords: ["simulator", "calculator", "simualtor", "calculater", "points calculator",
               "forecast", "open calculator", "open simulator", "calc", "sim",
               "point calculator", "points sim"],
    label: "Open Simulator",
    getPath: (ctx) => ctx.lastProfileId ? `/dashboard/${ctx.lastProfileId}/simulator` : null,
    response: (ctx) =>
      ctx.lastProfileId
        ? "Opening the Points Simulator for you! Forecast your Arcade journey! ✨"
        : "Please add a profile first to use the Simulator.",
  },
  {
    keywords: ["badges", "my badges", "view badges", "all badges", "open badges",
               "show badges", "badge page", "badge list", "badgs", "bdges"],
    label: "View Badges",
    getPath: (ctx) => ctx.lastProfileId ? `/dashboard/${ctx.lastProfileId}/badges` : null,
    response: (ctx) =>
      ctx.lastProfileId
        ? "Opening your badges page! 🏅"
        : "Please add a profile first to view badges.",
  },
  {
    keywords: ["add profile", "track profile", "new profile", "add account",
               "track my profile", "add my profile", "register", "sign up"],
    label: "Add a Profile",
    getPath: () => "/",
    response: () => "Taking you to the home page where you can add your profile! Paste your Google Skills Boost URL to get started. 🚀",
  },
];


// ─── FAQ intent engine ─────────────────────────────────────────────────────────
const FAQ_INTENTS: { keywords: string[]; response: (ctx: ReturnType<typeof getUserContext>) => string }[] = [
  {
    keywords: ["hello", "hi", "hey", "greetings", "sup"],
    response: (ctx) => {
      const name = ctx.profiles.find(p => p.id === ctx.lastProfileId)?.name;
      return name
        ? `Hey ${name}! I'm your Arcade Assistant. I can navigate the app for you or answer questions about your Arcade progress! Try saying "take me to my dashboard" or "open the leaderboard".`
        : "Hey! I'm your Arcade Assistant. I can navigate the app for you — try saying 'take me to my dashboard' or 'open the leaderboard'!";
    },
  },
  {
    keywords: ["my points", "how many points", "my score", "my arcade points", "what are my points"],
    response: (ctx) => {
      const profile = ctx.profiles.find(p => p.id === ctx.lastProfileId);
      return profile
        ? `You have ${profile.points} Arcade Points, ${profile.name}! ${profile.points >= 120 ? "You're an Arcade Legend! 🏆" : profile.points >= 95 ? "You're an Arcade Champion! 🥇" : profile.points >= 75 ? "You're an Arcade Ranger! 🥈" : profile.points >= 50 ? "You're an Arcade Trooper! 🥉" : `You need ${50 - profile.points} more points for Arcade Trooper!`}`
        : "I don't see a tracked profile yet. Head to the home page to add your profile!";
    },
  },
  {
    keywords: ["who am i", "my name", "my profile", "my account", "current profile"],
    response: (ctx) => {
      const profile = ctx.profiles.find(p => p.id === ctx.lastProfileId);
      return profile
        ? `You're logged in as ${profile.name} with ${profile.points} Arcade Points! You have ${ctx.profiles.length} tracked profile${ctx.profiles.length > 1 ? "s" : ""}.`
        : "No profile tracked yet. Go to the home page and add your Google Skills Boost profile URL!";
    },
  },
  {
    keywords: ["how many profiles", "all profiles", "my accounts", "tracked profiles", "switch profile"],
    response: (ctx) => {
      if (!ctx.profiles.length) return "No profiles tracked yet! Add one from the home page.";
      return `You have ${ctx.profiles.length} tracked profile${ctx.profiles.length > 1 ? "s" : ""}: ${ctx.profiles.map(p => `${p.name} (${p.points} pts)`).join(", ")}. Use the account switcher in the top navigation to switch!`;
    },
  },
  {
    keywords: ["arcade point", "point system", "how points", "scoring", "how do points work"],
    response: () => "Arcade Points: Game badges = 1pt each. Every 2 skill badges = 1pt. Trivia badges = 1pt each. Special games = 2pts each. Level badges = 1pt. Milestone bonuses add extra on top!",
  },
  {
    keywords: ["milestone", "bonus point"],
    response: () => "4 Milestones: M1 = 6 games + 18 skills → 5 bonus pts. M2 = 8 games + 34 skills → 15 pts. M3 = 10 games + 50 skills → 25 pts. Ultimate = 12 games + 66 skills → 35 pts!",
  },
  {
    keywords: ["tier", "trooper", "ranger", "champion", "legend", "swag", "prize"],
    response: () => "Swag Tiers: Arcade Trooper (50 pts) → Arcade Ranger (75 pts) → Arcade Champion (95 pts) → Arcade Legend (120 pts). Each unlocks Google swag prizes!",
  },
  {
    keywords: ["facilitator", "program", "july", "september"],
    response: () => "Facilitator Program: July 13 – September 14, 2026. Milestones are only tracked for badges earned in this window!",
  },
  {
    keywords: ["work meets play", "cloud canvas"],
    response: () => "Work Meets Play: Complete all 6 monthly badges (Jan–Jun 2026) to earn 7 bonus Arcade Points!",
  },
  {
    keywords: ["cohort", "season", "2026", "current season"],
    response: () => "Only badges earned in 2026 (Jan 1 – Dec 31) count toward your Arcade Points. Previous cohort badges are excluded.",
  },
  {
    keywords: ["help", "what can you", "what do you", "commands"],
    response: () => "I can navigate the app AND answer questions! Try:\n• 'Take me to my dashboard'\n• 'Open the leaderboard'\n• 'Open the simulator'\n• 'View my badges'\n• 'What are my points?'\n• 'Tell me about milestones'",
  },
  {
    keywords: ["thank", "thanks", "awesome", "great", "nice", "cool"],
    response: () => "You're welcome! Keep pushing for that Arcade Legend tier! 💪",
  },
  {
    keywords: ["bye", "goodbye", "close", "see you"],
    response: () => "Good luck on your Arcade journey! 🎮",
  },
];

// ─── Fuzzy matching engine ─────────────────────────────────────────────────────

/** Remove all non-alpha characters and lowercase — "leader board!" → "leaderboard" */
function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** Levenshtein edit distance between two strings */
function editDistance(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
  return dp[m][n];
}

/** Similarity score 0–1 (1 = identical) */
function similarity(a: string, b: string): number {
  if (!a && !b) return 1;
  const maxLen = Math.max(a.length, b.length);
  if (!maxLen) return 1;
  return 1 - editDistance(a, b) / maxLen;
}

/**
 * Score how well an input string matches a keyword.
 * Handles: exact match, substring, space-collapsed match, typos.
 */
function scoreKeyword(rawInput: string, rawKeyword: string): number {
  const inp = rawInput.toLowerCase().trim();
  const kw  = rawKeyword.toLowerCase().trim();

  // 1. Exact match
  if (inp === kw) return 1.0;

  // 2. Input contains the keyword as a substring
  if (inp.includes(kw)) return 0.95;

  // 3. Keyword contains the input as a substring
  if (kw.includes(inp)) return 0.88;

  // 4. Space-collapsed comparison ("leader board" → "leaderboard")
  const normInp = normalize(inp);
  const normKw  = normalize(kw);
  if (normInp === normKw) return 0.93;
  if (normInp.includes(normKw)) return 0.90;
  if (normKw.includes(normInp)) return 0.85;

  // 5. Token-based: check each keyword token against each input token
  const kwTokens  = kw.split(/\s+/).map(normalize).filter(Boolean);
  const inpTokens = inp.split(/\s+/).map(normalize).filter(Boolean);

  // For each keyword token, find best fuzzy match among input tokens
  if (kwTokens.length && inpTokens.length) {
    const tokenScores = kwTokens.map(kwt =>
      Math.max(...inpTokens.map(it => similarity(it, kwt)))
    );
    const avgTokenScore = tokenScores.reduce((a, b) => a + b, 0) / tokenScores.length;
    if (avgTokenScore > 0.75) return avgTokenScore * 0.88;
  }

  // 6. Full fuzzy similarity on normalized strings
  const sim = similarity(normInp, normKw);
  if (sim > 0.70) return sim * 0.80;

  return 0;
}

/** Score all keywords for an intent and return the best score */
function scoreIntent(input: string, keywords: string[]): number {
  return Math.max(...keywords.map(kw => scoreKeyword(input, kw)));
}

/** Threshold below which we consider no match found */
const MATCH_THRESHOLD = 0.55;

function processMessage(text: string, ctx: ReturnType<typeof getUserContext>) {
  // Score every nav intent
  let bestNavScore = 0;
  let bestNav: NavIntent | null = null;
  for (const nav of NAV_INTENTS) {
    const s = scoreIntent(text, nav.keywords);
    if (s > bestNavScore) { bestNavScore = s; bestNav = nav; }
  }

  // Score every FAQ intent
  let bestFaqScore = 0;
  let bestFaq: typeof FAQ_INTENTS[0] | null = null;
  for (const faq of FAQ_INTENTS) {
    const s = scoreIntent(text, faq.keywords);
    if (s > bestFaqScore) { bestFaqScore = s; bestFaq = faq; }
  }

  // Pick whichever category wins (nav gets slight priority on ties)
  if (bestNavScore >= MATCH_THRESHOLD && bestNavScore >= bestFaqScore - 0.05) {
    const nav = bestNav!;
    const path = nav.getPath(ctx);
    return { text: nav.response(ctx), navigateTo: path, navLabel: nav.label };
  }

  if (bestFaqScore >= MATCH_THRESHOLD && bestFaq) {
    return { text: bestFaq.response(ctx), navigateTo: null, navLabel: null };
  }

  return {
    text: "I'm not sure about that. Try: 'take me to leaderboard', 'my points', 'open simulator', or 'help'!",
    navigateTo: null,
    navLabel: null,
  };
}


// ─── Component ─────────────────────────────────────────────────────────────────
export default function VoiceAgent() {
  const router = useRouter();


  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [muted, setMuted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 0,
      role: "agent",
      text: "Hi! I'm your Arcade Assistant 🎮 I can navigate the app for you — try saying \"take me to my dashboard\" or \"open the leaderboard\"!",
    },
  ]);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [inputText, setInputText] = useState("");

  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const msgId = useRef(1);

  useEffect(() => {
    setMounted(true);
    if (typeof window === "undefined") return;
    synthRef.current = window.speechSynthesis;

    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SR) {
      setVoiceSupported(true);
      const rec = new SR();
      rec.continuous = false;
      rec.interimResults = true;
      rec.lang = "en-US";
      rec.onresult = (e: any) => {
        let interim = "", final = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const t = e.results[i][0].transcript;
          if (e.results[i].isFinal) final += t;
          else interim += t;
        }
        setTranscript(final || interim);
        if (final) handleSend(final.trim(), true);
      };
      rec.onend = () => { setListening(false); setTranscript(""); };
      rec.onerror = () => { setListening(false); setTranscript(""); };
      recognitionRef.current = rec;
    }
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, transcript]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  const speak = useCallback((text: string) => {
    if (muted || !synthRef.current) return;
    synthRef.current.cancel();
    // Strip emoji for cleaner speech
    const cleanText = text.replace(/[\u{1F000}-\u{1FFFF}]/gu, "").replace(/[🎮🏆🥇🥈🥉🏅📢🚀✨🏠💪]/g, "");
    const utt = new SpeechSynthesisUtterance(cleanText);
    utt.rate = 1.05; utt.pitch = 1; utt.volume = 1;
    const voices = synthRef.current.getVoices();
    const preferred = voices.find(v => v.lang.startsWith("en") && (v.name.includes("Google") || v.name.includes("Samantha") || v.name.includes("Natural")));
    if (preferred) utt.voice = preferred;
    utt.onstart = () => setSpeaking(true);
    utt.onend = () => setSpeaking(false);
    utt.onerror = () => setSpeaking(false);
    synthRef.current.speak(utt);
  }, [muted]);

  const handleSend = useCallback((text: string, fromVoice = false) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const ctx = getUserContext();
    const result = processMessage(trimmed, ctx);

    const userMsg: Message = { id: msgId.current++, role: "user", text: trimmed };
    const agentMsg: Message = {
      id: msgId.current++,
      role: "agent",
      text: result.text,
      action: result.navigateTo ? { label: result.navLabel!, href: result.navigateTo } : undefined,
    };

    setMessages((prev) => [...prev, userMsg, agentMsg]);
    if (!fromVoice) setInputText("");
    setTimeout(() => speak(result.text), 200);

    // Navigate after a short delay so user sees the message first
    if (result.navigateTo) {
      setTimeout(() => {
        router.push(result.navigateTo!);
      }, 800);
    }
  }, [speak, router]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend(inputText);
  };

  const toggleMic = useCallback(() => {
    if (!recognitionRef.current) return;
    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
    } else {
      synthRef.current?.cancel();
      setSpeaking(false);
      setTranscript("");
      try { recognitionRef.current.start(); setListening(true); } catch {}
    }
  }, [listening]);

  const handleClose = () => {
    recognitionRef.current?.stop();
    synthRef.current?.cancel();
    setListening(false); setSpeaking(false);
    setOpen(false); setTranscript("");
  };

  if (!mounted) return null;

  return (
    <>
      {/* Floating orb */}
      {!open && (
        <button onClick={() => setOpen(true)} aria-label="Open Arcade Assistant" className="fixed bottom-6 right-6 z-50 group">
          <span className="relative flex items-center justify-center w-14 h-14">
            <span className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan via-violet to-pink opacity-60 blur-md group-hover:opacity-90 transition-opacity duration-300" />
            <span className="relative flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-cyan via-violet to-pink shadow-lg group-hover:scale-105 transition-transform duration-200">
              <Bot className="w-6 h-6 text-void" />
            </span>
            <span className="absolute inset-0 rounded-full border-2 border-cyan/40 animate-ping" />
          </span>
        </button>
      )}

      {/* Agent panel */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-80 sm:w-96 flex flex-col rounded-2xl overflow-hidden shadow-2xl border border-white/10"
          style={{ background: "rgba(10,12,20,0.97)", backdropFilter: "blur(24px)" }}>

          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-white/8 shrink-0"
            style={{ background: "linear-gradient(135deg,rgba(34,229,229,0.08),rgba(139,92,246,0.08))" }}>
            <div className="relative shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-gradient-to-br from-cyan via-violet to-pink">
              <Bot className="w-4 h-4 text-void" />
              {(listening || speaking) && <span className="absolute inset-0 rounded-full border-2 border-cyan/60 animate-ping" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-display text-sm font-semibold text-mist leading-none">Arcade Assistant</p>
              <p className="text-[10px] text-mist-muted mt-0.5">
                {listening ? "🎙 Listening…" : speaking ? "🔊 Speaking…" : "Navigate & ask anything"}
              </p>
            </div>
            {voiceSupported && (
              <button onClick={() => setMuted(m => !m)}
                className="p-1.5 rounded-lg text-mist-muted hover:text-mist hover:bg-white/10 transition-colors"
                aria-label={muted ? "Unmute" : "Mute"}>
                {muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>
            )}
            <button onClick={handleClose} className="p-1.5 rounded-lg text-mist-muted hover:text-mist hover:bg-white/10 transition-colors" aria-label="Close">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3"
            style={{ maxHeight: "320px", minHeight: "200px" }}>
            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "agent" && (
                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-cyan to-violet flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-2.5 h-2.5 text-void" />
                  </div>
                )}
                <div className="flex flex-col gap-1.5 max-w-[82%]">
                  <div className={`rounded-2xl px-3 py-2 text-xs leading-relaxed whitespace-pre-line ${
                    msg.role === "user"
                      ? "bg-gradient-to-r from-cyan/20 to-violet/20 text-mist border border-cyan/20 rounded-tr-sm"
                      : "bg-white/6 text-mist-muted border border-white/8 rounded-tl-sm"
                  }`}>
                    {msg.text}
                  </div>
                  {/* Navigation action button */}
                  {msg.action && (
                    <button
                      onClick={() => router.push(msg.action!.href)}
                      className="self-start inline-flex items-center gap-1.5 text-[10px] font-semibold px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan/20 to-violet/20 border border-cyan/30 text-cyan hover:bg-cyan/20 transition-colors"
                    >
                      <Navigation className="w-3 h-3" />
                      {msg.action.label}
                    </button>
                  )}
                </div>
              </div>
            ))}

            {transcript && (
              <div className="flex justify-end">
                <div className="max-w-[82%] rounded-2xl rounded-tr-sm px-3 py-2 text-xs text-mist-muted border border-white/10 bg-white/4 italic animate-pulse">
                  {transcript}…
                </div>
              </div>
            )}
          </div>

          {/* Waveform */}
          {listening && (
            <div className="px-4 py-1.5 flex items-center justify-center gap-0.5 shrink-0">
              {[...Array(16)].map((_, i) => (
                <span key={i} className="w-0.5 rounded-full bg-gradient-to-t from-cyan to-violet"
                  style={{ height: `${6 + Math.sin(i * 0.8) * 10 + 6}px`, animation: `wave ${0.4 + (i % 4) * 0.1}s ease-in-out infinite alternate`, animationDelay: `${i * 0.04}s` }} />
              ))}
            </div>
          )}

          {/* Quick action chips */}
          {messages.length <= 1 && (
            <div className="px-3 pb-2 flex flex-wrap gap-1.5 shrink-0">
              {["My dashboard", "Leaderboard", "My points", "Simulator"].map((chip) => (
                <button key={chip} onClick={() => handleSend(chip)}
                  className="text-[10px] px-2.5 py-1 rounded-full glass border border-white/10 text-mist-muted hover:text-mist hover:border-cyan/30 transition-colors">
                  {chip}
                </button>
              ))}
            </div>
          )}

          {/* Input row */}
          <form onSubmit={handleFormSubmit} className="flex items-center gap-2 px-3 py-3 border-t border-white/8 shrink-0">
            <input ref={inputRef} type="text" value={inputText} onChange={e => setInputText(e.target.value)}
              placeholder="Type or ask to navigate…"
              className="flex-1 bg-white/6 border border-white/10 rounded-xl px-3 py-2 text-xs text-mist placeholder:text-mist-muted/50 outline-none focus:border-cyan/40 focus:bg-white/8 transition-colors"
              disabled={listening} />
            <button type="submit" disabled={!inputText.trim() || listening} aria-label="Send"
              className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-cyan to-violet text-void hover:scale-105 active:scale-95 transition-transform disabled:opacity-30 disabled:scale-100 shrink-0">
              <Send className="w-3.5 h-3.5" />
            </button>
            {voiceSupported && (
              <button type="button" onClick={toggleMic} disabled={speaking} aria-label={listening ? "Stop" : "Speak"}
                className="relative flex items-center justify-center w-10 h-10 rounded-xl shrink-0 transition-all duration-300 disabled:opacity-40"
                style={listening ? {} : { animation: "mic-glow 2s ease-in-out infinite" }}
              >
                {/* Glow layer */}
                <span className={`absolute inset-0 rounded-xl blur-sm ${
                  listening
                    ? "bg-pink"
                    : "bg-gradient-to-br from-cyan via-violet to-pink opacity-70"
                }`} />
                {/* Button face */}
                <span className={`relative flex items-center justify-center w-10 h-10 rounded-xl ${
                  listening
                    ? "bg-pink/30 border-2 border-pink text-pink"
                    : "bg-gradient-to-br from-cyan via-violet to-pink text-void"
                }`}>
                  {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </span>
                {/* Pulse rings */}
                {listening && <span className="absolute inset-0 rounded-xl border-2 border-pink animate-ping opacity-75" />}
                {!listening && <span className="absolute inset-[-3px] rounded-[14px] border border-cyan/40 animate-ping opacity-50" />}
              </button>
            )}
          </form>
        </div>
      )}

      <style>{`
        @keyframes wave {
          from { transform: scaleY(0.3); }
          to   { transform: scaleY(1); }
        }
        @keyframes mic-glow {
          0%, 100% {
            filter: drop-shadow(0 0 4px rgba(34,229,229,0.8)) drop-shadow(0 0 10px rgba(139,92,246,0.5));
            transform: scale(1);
          }
          50% {
            filter: drop-shadow(0 0 8px rgba(34,229,229,1)) drop-shadow(0 0 20px rgba(236,72,153,0.7));
            transform: scale(1.05);
          }
        }
      `}</style>
    </>
  );
}
