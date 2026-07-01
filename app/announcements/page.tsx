"use client";

import { useEffect, useState } from "react";
import { Megaphone, ArrowUpRight } from "lucide-react";

interface Announcement {
  id: string;
  title: string;
  summary?: string;
  official_link?: string;
  published_at?: string;
  source?: string;
}

export default function AnnouncementsPage() {
  const [items, setItems] = useState<Announcement[] | null>(null);

  useEffect(() => {
    fetch("/api/announcements")
      .then((r) => r.json())
      .then((d) => setItems(d.announcements ?? []));
  }, []);

  return (
    <div className="space-y-10">
      <div className="space-y-2 rise-in">
        <span className="inline-flex items-center gap-1.5 text-xs text-mist-muted">
          <span className="w-1.5 h-1.5 rounded-full bg-violet pulse-glow" />
          Official updates
        </span>
        <h1 className="font-display text-3xl font-semibold text-mist">Google Announcements</h1>
        <p className="text-mist-muted text-sm">
          Curated highlights from Google Skills Arcade. Add new entries via the announcements API
          or directly in Supabase.
        </p>
      </div>

      {!items && <span className="text-mist-muted text-sm animate-pulse">Loading...</span>}

      {items && items.length === 0 && (
        <div className="glass rounded-2xl p-10 text-center text-mist-muted text-sm">
          No announcements yet.
        </div>
      )}

      {items && items.length > 0 && (
        <div className="space-y-3">
          {items.map((a, i) => (
            <a
              key={a.id}
              href={a.official_link || "#"}
              target={a.official_link ? "_blank" : undefined}
              rel="noreferrer"
              className="gradient-ring glass rounded-2xl flex items-start gap-4 px-5 py-5 transition-all hover:-translate-y-0.5 rise-in"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-violet/15 shrink-0">
                <Megaphone className="w-4 h-4 text-violet" />
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-widest text-violet">Official</span>
                  {a.published_at && (
                    <span className="text-[11px] text-mist-muted">
                      {new Date(a.published_at).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  )}
                </div>
                <p className="text-mist text-sm font-medium">{a.title}</p>
                {a.summary && <p className="text-mist-muted text-xs line-clamp-2">{a.summary}</p>}
              </div>
              {a.official_link && (
                <ArrowUpRight className="w-4 h-4 text-mist-muted shrink-0 mt-1" />
              )}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
