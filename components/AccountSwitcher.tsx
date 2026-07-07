"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { User, Trash2, Plus, LogOut, ChevronDown } from "lucide-react";

interface StoredProfile {
  id: string;
  name: string;
  points: number;
}

export function AccountSwitcher() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [profiles, setProfiles] = useState<StoredProfile[]>([]);
  const [activeProfile, setActiveProfile] = useState<StoredProfile | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load profiles from localStorage
  const loadProfiles = () => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem("arcade_profiles");
    try {
      let list: StoredProfile[] = stored ? JSON.parse(stored) : [];
      
      // Auto clean-up of legacy invalid "Google Skills" entries
      const cleaned = list.filter((p) => p.name !== "Google Skills" && p.name !== "Google Cloud Skills Boost");
      if (cleaned.length !== list.length) {
        localStorage.setItem("arcade_profiles", JSON.stringify(cleaned));
        list = cleaned;
      }

      setProfiles(list);

      // Set active profile based on URL parameter id
      if (params?.id) {
        const active = list.find((p) => p.id === params.id);
        if (active) {
          setActiveProfile(active);
        } else {
          setActiveProfile(null);
        }
      } else {
        setActiveProfile(null);
      }
    } catch (_) {}
  };

  useEffect(() => {
    loadProfiles();

    // Listen to changes in localStorage from other tabs
    window.addEventListener("storage", loadProfiles);
    return () => window.removeEventListener("storage", loadProfiles);
  }, [params?.id]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSwitch = (id: string) => {
    setIsOpen(false);
    router.push(`/dashboard/${id}`);
  };

  const handleRemove = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = profiles.filter((p) => p.id !== id);
    localStorage.setItem("arcade_profiles", JSON.stringify(updated));
    setProfiles(updated);

    if (params?.id === id) {
      setActiveProfile(null);
      // Redirect to home if active profile is removed
      router.push("/");
    }
  };

  const handleRemoveActive = () => {
    if (!activeProfile) return;
    const updated = profiles.filter((p) => p.id !== activeProfile.id);
    localStorage.setItem("arcade_profiles", JSON.stringify(updated));
    setProfiles(updated);
    setActiveProfile(null);
    setIsOpen(false);
    router.push("/");
  };

  // Render nothing if there are no profiles stored yet
  if (profiles.length === 0 && !activeProfile) {
    return (
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/20 text-xs text-mist-muted hover:text-mist transition-all duration-200"
      >
        <Plus className="w-3 h-3" /> Add Account
      </Link>
    );
  }

  const currentName = activeProfile?.name || "Select Account";
  const initial = currentName.charAt(0).toUpperCase();

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl glass hover:bg-white/10 text-xs text-mist font-medium transition-all duration-200 cursor-pointer border border-white/5 active:scale-95"
      >
        <span className="w-5 h-5 rounded-full bg-gradient-to-br from-cyan to-pink flex items-center justify-center font-bold text-void text-[10px]">
          {initial}
        </span>
        <span className="max-w-[80px] sm:max-w-[120px] truncate text-mist-muted hover:text-mist">
          {currentName}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-mist-muted transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 max-w-[calc(100vw-2rem)] rounded-2xl bg-[#0c0a1a] border border-white/10 shadow-2xl p-4 space-y-3.5 z-[100] animate-in fade-in slide-in-from-top-2 duration-150">
          {activeProfile && (
            <div className="space-y-1 pb-2 border-b border-white/5">
              <p className="text-[10px] text-mist-muted font-medium uppercase tracking-wider">Active Account</p>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan to-pink flex items-center justify-center font-bold text-void text-[11px]">
                  {initial}
                </span>
                <div>
                  <h4 className="text-xs font-semibold text-mist leading-tight">{activeProfile.name}</h4>
                  <p className="text-[10px] text-mist-muted">
                    {activeProfile.points} points
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <p className="text-[10px] text-mist-muted font-medium uppercase tracking-wider">Switch Account</p>
            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {profiles.map((p) => (
                <div
                  key={p.id}
                  onClick={() => handleSwitch(p.id)}
                  className={`flex items-center justify-between p-2 rounded-xl text-xs cursor-pointer transition-all duration-200 group ${
                    p.id === activeProfile?.id
                      ? "bg-white/10 border border-white/10 text-mist"
                      : "hover:bg-white/5 border border-transparent text-mist-muted hover:text-mist"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-5 h-5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-semibold text-[10px] text-mist-muted">
                      {p.name.charAt(0).toUpperCase()}
                    </span>
                    <div className="truncate">
                      <p className="font-medium truncate leading-tight">{p.name}</p>
                      <p className="text-[9px] text-mist-muted">{p.points} points</p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleRemove(p.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-pink/15 text-mist-muted hover:text-pink rounded-lg transition-all"
                    title="Remove profile"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-white/5 flex flex-col">
            <Link
              href="/"
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center gap-2 p-2 rounded-xl text-xs text-mist-muted hover:text-mist hover:bg-white/5 transition-all"
            >
              <Plus className="w-3.5 h-3.5 text-cyan" />
              <span>Add Another Account</span>
            </Link>
            {activeProfile && (
              <button
                onClick={handleRemoveActive}
                className="w-full flex items-center gap-2 p-2 rounded-xl text-xs text-pink/80 hover:text-pink hover:bg-pink/10 transition-all text-left"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Remove Current Account</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function DashboardNavLink() {
  const [profileId, setProfileId] = useState<string | null>(null);
  const params = useParams<{ id: string }>();

  const updateProfileId = () => {
    if (typeof window === "undefined") return;
    const last = localStorage.getItem("last_profile_id");
    setProfileId(last || params?.id || null);
  };

  useEffect(() => {
    updateProfileId();
    window.addEventListener("storage", updateProfileId);
    return () => window.removeEventListener("storage", updateProfileId);
  }, [params?.id]);

  if (!profileId) return null;

  return (
    <Link href={`/dashboard/${profileId}`} className="hover:text-cyan transition-colors">
      Dashboard
    </Link>
  );
}

export function SimulatorNavLink() {
  const [profileId, setProfileId] = useState<string | null>(null);
  const params = useParams<{ id: string }>();

  const updateProfileId = () => {
    if (typeof window === "undefined") return;
    const last = localStorage.getItem("last_profile_id");
    setProfileId(last || params?.id || null);
  };

  useEffect(() => {
    updateProfileId();
    window.addEventListener("storage", updateProfileId);
    return () => window.removeEventListener("storage", updateProfileId);
  }, [params?.id]);

  if (!profileId) return null;

  return (
    <Link href={`/dashboard/${profileId}/simulator`} className="hover:text-cyan transition-colors">
      Calculator
    </Link>
  );
}

export function AddProfileNavLink() {
  const [hasProfiles, setHasProfiles] = useState<boolean>(false);
  const params = useParams<{ id: string }>();

  const checkProfiles = () => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem("arcade_profiles");
    try {
      const list = stored ? JSON.parse(stored) : [];
      setHasProfiles(list.length > 0);
    } catch (_) {
      setHasProfiles(false);
    }
  };

  useEffect(() => {
    checkProfiles();
    window.addEventListener("storage", checkProfiles);
    window.addEventListener("profile_added", checkProfiles);
    return () => {
      window.removeEventListener("storage", checkProfiles);
      window.removeEventListener("profile_added", checkProfiles);
    };
  }, [params?.id]);

  if (hasProfiles) return null;

  return (
    <Link href="/add-profile" className="hover:text-cyan transition-colors">
      Add profile
    </Link>
  );
}
