"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light";

const ThemeContext = createContext<{
  theme: Theme;
  toggle: () => void;
  hackerMode: boolean;
  toggleHackerMode: () => void;
  isTransitioning: boolean;
  isTurningOff: boolean;
  completeTransition: () => void;
}>({ 
  theme: "dark", 
  toggle: () => {}, 
  hackerMode: false, 
  toggleHackerMode: () => {},
  isTransitioning: false,
  isTurningOff: false,
  completeTransition: () => {}
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");
  const [hackerMode, setHackerMode] = useState<boolean>(false);
  const [isTransitioning, setTransitioning] = useState<boolean>(false);
  const [isTurningOff, setIsTurningOff] = useState<boolean>(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    const saved = localStorage.getItem("sts-theme") as Theme | null;
    if (saved === "light" || saved === "dark") {
      setTheme(saved);
      document.documentElement.classList.toggle("light", saved === "light");
    }

    const savedHacker = localStorage.getItem("sts-hacker-mode");
    if (savedHacker !== null) {
      setHackerMode(savedHacker === "true");
    }
  }, []);

  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("sts-theme", next);
    document.documentElement.classList.toggle("light", next === "light");
  };

  const toggleHackerMode = () => {
    const next = !hackerMode;
    setTransitioning(true);
    if (next) {
      setIsTurningOff(false);
      setHackerMode(true);
      localStorage.setItem("sts-hacker-mode", "true");
    } else {
      setIsTurningOff(true);
    }
  };

  const completeTransition = () => {
    setTransitioning(false);
    if (isTurningOff) {
      setHackerMode(false);
      localStorage.setItem("sts-hacker-mode", "false");
      setIsTurningOff(false);
    }
  };

  // Avoid flash: suppress render until we know the saved preference
  if (!mounted) return <>{children}</>;

  return (
    <ThemeContext.Provider value={{ theme, toggle, hackerMode, toggleHackerMode, isTransitioning, isTurningOff, completeTransition }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
