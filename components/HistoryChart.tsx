"use client";

import { useState, useMemo } from "react";
import {
  XAxis, YAxis, Tooltip, ResponsiveContainer,
  Area, AreaChart, Line, LineChart, Bar, BarChart,
  ReferenceLine, CartesianGrid, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Cell,
} from "recharts";
import { BarChart2, TrendingUp, Activity, Calendar, Zap, Award } from "lucide-react";

export interface HistoryPoint {
  fetched_at: string;
  total_points: number;
  total_badges: number;
  arcadePoints?: number;
}

type ChartMode = "area" | "line" | "bar";
type TimeRange = "week" | "month" | "all" | "weekday";

const DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAYS_FULL  = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS     = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const TIER_THRESHOLDS = [50, 75, 95, 120];

// ── Badge-delta tooltip ────────────────────────────────────────────────────────
function WeeklyTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const badges = d.badges ?? 0;
  return (
    <div style={{
      background: "rgba(6,5,18,0.97)",
      border: "1px solid rgba(34,229,229,0.35)",
      borderRadius: 14,
      padding: "12px 16px",
      backdropFilter: "blur(20px)",
      boxShadow: "0 8px 32px rgba(0,0,0,0.6), 0 0 20px rgba(34,229,229,0.1)",
      minWidth: 140,
    }}>
      <p style={{ color: "#8e8aab", fontSize: 10, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.1em" }}>
        {d.fullDay}
      </p>
      <p style={{ color: "#22e5e5", fontSize: 22, fontWeight: 800, margin: 0, lineHeight: 1, fontFamily: "monospace" }}>
        {badges}
        <span style={{ color: "#8e8aab", fontSize: 11, fontWeight: 400, marginLeft: 4 }}>
          badge{badges !== 1 ? "s" : ""}
        </span>
      </p>
      {d.pts > 0 && (
        <p style={{ color: "#b389ff", fontSize: 10, margin: "4px 0 0" }}>
          +{d.pts} pts earned
        </p>
      )}
      {badges === 0 && (
        <p style={{ color: "#8e8aab", fontSize: 10, margin: "4px 0 0", fontStyle: "italic" }}>
          No activity
        </p>
      )}
    </div>
  );
}

// ── Custom Tooltip (general) ───────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const pt  = payload[0];
  const val = pt.value;
  const fullDate = pt.payload?.fullDate || label;
  const badges   = pt.payload?.badges;
  return (
    <div style={{
      background: "rgba(6,5,18,0.97)",
      border: "1px solid rgba(178,137,255,0.35)",
      borderRadius: 14,
      padding: "12px 16px",
      backdropFilter: "blur(20px)",
      boxShadow: "0 8px 32px rgba(0,0,0,0.6), 0 0 24px rgba(178,137,255,0.12)",
      minWidth: 140,
    }}>
      <p style={{ color: "#8e8aab", fontSize: 10, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.1em" }}>
        {fullDate}
      </p>
      <p style={{ color: "#22e5e5", fontSize: 22, fontWeight: 800, margin: 0, lineHeight: 1, fontFamily: "monospace" }}>
        {typeof val === "number" ? (val % 1 === 0 ? val : val.toFixed(1)) : val}
        <span style={{ color: "#8e8aab", fontSize: 11, fontWeight: 400, marginLeft: 4 }}>pts</span>
      </p>
      {badges !== undefined && (
        <p style={{ color: "#b389ff", fontSize: 10, marginTop: 4, margin: "4px 0 0" }}>
          🎖 {badges} badge{badges !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}

// ── Glow dot ──────────────────────────────────────────────────────────────────
function GlowDot(props: any) {
  const { cx, cy, index, data, value } = props;
  const isLast = index === (data?.length ?? 0) - 1;
  const isMax  = data && value === Math.max(...data.map((d: any) => d.points));
  const color  = isLast ? "#22e5e5" : isMax ? "#f59e0b" : "#b389ff";
  return (
    <g>
      <circle cx={cx} cy={cy} r={isLast ? 8 : isMax ? 7 : 4} fill="none"
        stroke={color} strokeOpacity={0.3} strokeWidth={isLast ? 4 : 3} />
      <circle cx={cx} cy={cy} r={isLast ? 4 : isMax ? 3.5 : 2.5}
        fill={color} stroke="rgba(0,0,0,0.3)" strokeWidth={1} />
    </g>
  );
}

// ── Empty State ──────────────────────────────────────────────────────────────
function EmptyChart() {
  return (
    <div className="glass rounded-2xl p-10 text-center relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-cyan/5 to-violet/5 pointer-events-none" />
      <div className="relative">
        <p className="text-3xl mb-2">📊</p>
        <p className="text-mist text-sm font-medium">Building your history…</p>
        <p className="text-mist-muted text-xs mt-1 max-w-xs mx-auto">
          Refresh the profile a few times (e.g. once a day) to see your Arcade Points trend over time.
        </p>
      </div>
    </div>
  );
}

// ── Weekly: badges earned EACH DAY (delta, not cumulative) ────────────────────
function WeeklyDeltaChart({ data }: { data: HistoryPoint[] }) {
  // Build a map of YYYY-MM-DD → total badges delta for that day
  const weekData = useMemo(() => {
    // Sort ascending
    const sorted = [...data].sort((a, b) =>
      new Date(a.fetched_at).getTime() - new Date(b.fetched_at).getTime()
    );

    // Compute per-snapshot badge deltas
    const dayMap: Record<string, { badges: number; pts: number; dayName: string; fullDay: string; date: Date }> = {};

    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1];
      const cur  = sorted[i];
      const dt   = new Date(cur.fetched_at);
      const key  = `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,"0")}-${String(dt.getDate()).padStart(2,"0")}`;

      const bdgDelta = Math.max(0, (cur.total_badges ?? 0)  - (prev.total_badges ?? 0));
      const ptsDelta = Math.max(0, (cur.arcadePoints ?? cur.total_points ?? 0) - (prev.arcadePoints ?? prev.total_points ?? 0));

      if (!dayMap[key]) {
        dayMap[key] = {
          badges: 0, pts: 0,
          dayName: DAYS_SHORT[dt.getDay()],
          fullDay: `${DAYS_FULL[dt.getDay()]}, ${MONTHS[dt.getMonth()]} ${dt.getDate()}`,
          date: dt,
        };
      }
      dayMap[key].badges += bdgDelta;
      dayMap[key].pts    += ptsDelta;
    }

    // Build last-7-days slots (always show 7 days even if no data)
    const today = new Date();
    const result = [];
    for (let i = 6; i >= 0; i--) {
      const d   = new Date(today);
      d.setDate(today.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
      const isToday = i === 0;
      result.push({
        day: DAYS_SHORT[d.getDay()],
        date: `${MONTHS[d.getMonth()]} ${d.getDate()}`,
        fullDay: `${DAYS_FULL[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`,
        badges: dayMap[key]?.badges ?? 0,
        pts:    dayMap[key]?.pts    ?? 0,
        isToday,
        key,
      });
    }
    return result;
  }, [data]);

  const maxBadges  = Math.max(...weekData.map(d => d.badges), 1);
  const totalWeek  = weekData.reduce((s, d) => s + d.badges, 0);
  const activeDays = weekData.filter(d => d.badges > 0).length;
  const bestDay    = weekData.reduce((best, d) => d.badges > best.badges ? d : best, weekData[0]);

  // Custom bar with glow
  const CustomBar = (props: any) => {
    const { x, y, width, height, payload } = props;
    if (height <= 0) return null;
    const isToday = payload?.isToday;
    const isBest  = payload?.badges === maxBadges && payload?.badges > 0;
    const fill    = isToday ? "url(#todayGrad)" : isBest ? "url(#bestGrad)" : "url(#normalGrad)";
    const glow    = isToday ? "0 0 16px rgba(34,229,229,0.6)" : isBest ? "0 0 12px rgba(245,158,11,0.5)" : "0 0 8px rgba(179,137,255,0.3)";
    return (
      <g>
        {/* Glow halo */}
        <rect x={x - 2} y={y - 2} width={width + 4} height={height + 4}
          rx={8} fill={fill} opacity={0.15} />
        {/* Main bar */}
        <rect x={x} y={y} width={width} height={height}
          rx={6} fill={fill} style={{ filter: glow }} />
        {/* Badge count label above bar */}
        {payload?.badges > 0 && (
          <text x={x + width / 2} y={y - 6} textAnchor="middle"
            fill={isToday ? "#22e5e5" : isBest ? "#f59e0b" : "#b389ff"}
            fontSize={10} fontWeight={700} fontFamily="monospace">
            +{payload.badges}
          </text>
        )}
      </g>
    );
  };

  return (
    <div>
      {/* ── Stats row ── */}
      <div style={{ display: "flex", gap: 16, marginBottom: 16, flexWrap: "wrap" }}>
        {[
          { label: "This Week", value: totalWeek, unit: "badges", color: "#22e5e5", icon: "🎖" },
          { label: "Active Days", value: `${activeDays}/7`, unit: "days", color: "#b389ff", icon: "📅" },
          { label: "Best Day", value: bestDay?.badges > 0 ? bestDay.day : "—", unit: bestDay?.badges > 0 ? `${bestDay.badges} badges` : "", color: "#f59e0b", icon: "🏆" },
        ].map(s => (
          <div key={s.label} style={{
            flex: 1, minWidth: 90,
            padding: "10px 14px",
            borderRadius: 12,
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}>
            <p style={{ fontSize: 9, color: "#8e8aab", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 4px" }}>
              {s.icon} {s.label}
            </p>
            <p style={{ fontSize: 18, fontWeight: 800, color: s.color, fontFamily: "monospace", margin: 0 }}>
              {s.value}
              {s.unit && <span style={{ fontSize: 10, color: "#8e8aab", marginLeft: 4, fontWeight: 400 }}>{s.unit}</span>}
            </p>
          </div>
        ))}
      </div>

      {/* ── Bar chart ── */}
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={weekData} margin={{ top: 20, right: 12, left: -10, bottom: 0 }} barCategoryGap="28%">
          <defs>
            <linearGradient id="normalGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#b389ff" stopOpacity={0.9} />
              <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.4} />
            </linearGradient>
            <linearGradient id="todayGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22e5e5" stopOpacity={0.95} />
              <stop offset="100%" stopColor="#0891b2" stopOpacity={0.5} />
            </linearGradient>
            <linearGradient id="bestGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.95} />
              <stop offset="100%" stopColor="#d97706" stopOpacity={0.5} />
            </linearGradient>
            <linearGradient id="areaFillW" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22e5e5" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#22e5e5" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="4 4" vertical={false} />
          <XAxis
            dataKey="day"
            tick={({ x, y, payload, index }) => {
              const item = weekData[index];
              const isToday  = item?.isToday;
              const hasBadge = item?.badges > 0;
              return (
                <g transform={`translate(${x},${y})`}>
                  <text x={0} y={0} dy={14} textAnchor="middle"
                    fill={isToday ? "#22e5e5" : hasBadge ? "#b389ff" : "#6b6880"}
                    fontSize={10} fontWeight={isToday || hasBadge ? 700 : 400}>
                    {payload.value}
                  </text>
                  {isToday && (
                    <circle cx={0} cy={22} r={2} fill="#22e5e5" />
                  )}
                </g>
              );
            }}
            tickLine={false} axisLine={false}
          />
          <YAxis
            tick={{ fill: "#6b6880", fontSize: 9 }}
            tickLine={false} axisLine={false} width={20}
            allowDecimals={false}
            label={{ value: "badges", angle: -90, position: "insideLeft", fill: "#6b6880", fontSize: 8, dx: 14 }}
          />
          <Tooltip content={<WeeklyTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
          <Bar dataKey="badges" shape={<CustomBar />} maxBarSize={48} />
        </BarChart>
      </ResponsiveContainer>

      {/* ── Day breakdown ── */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 12 }}>
        {weekData.map(d => (
          <div key={d.key} style={{
            flex: "1 1 60px",
            padding: "6px 8px",
            borderRadius: 10,
            background: d.isToday
              ? "rgba(34,229,229,0.08)"
              : d.badges > 0
              ? "rgba(179,137,255,0.06)"
              : "rgba(255,255,255,0.02)",
            border: d.isToday
              ? "1px solid rgba(34,229,229,0.2)"
              : d.badges > 0
              ? "1px solid rgba(179,137,255,0.15)"
              : "1px solid rgba(255,255,255,0.04)",
            textAlign: "center",
          }}>
            <p style={{ fontSize: 9, color: d.isToday ? "#22e5e5" : "#8e8aab", margin: "0 0 2px", fontWeight: d.isToday ? 700 : 400 }}>
              {d.day}{d.isToday ? " ●" : ""}
            </p>
            <p style={{
              fontSize: 14, fontWeight: 800, fontFamily: "monospace", margin: 0,
              color: d.badges > 0 ? (d.isToday ? "#22e5e5" : "#b389ff") : "#8e8aab",
            }}>
              {d.badges > 0 ? `+${d.badges}` : "—"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Weekday Radar (all-time pattern) ─────────────────────────────────────────
function WeekdayRadar({ data }: { data: HistoryPoint[] }) {
  const weekdayData = useMemo(() => {
    const counts: Record<number, { points: number; badges: number; count: number }> = {};
    for (let i = 0; i < 7; i++) counts[i] = { points: 0, badges: 0, count: 0 };
    for (let i = 1; i < data.length; i++) {
      const day      = new Date(data[i].fetched_at).getDay();
      const ptsDelta = Math.max(0, (data[i].arcadePoints ?? 0) - (data[i-1].arcadePoints ?? 0));
      const bdgDelta = Math.max(0, (data[i].total_badges ?? 0)  - (data[i-1].total_badges ?? 0));
      counts[day].points += ptsDelta;
      counts[day].badges += bdgDelta;
      if (ptsDelta > 0 || bdgDelta > 0) counts[day].count++;
    }
    return DAYS_SHORT.map((d, i) => ({
      day: d,
      points: parseFloat(counts[i].points.toFixed(1)),
      badges: counts[i].badges,
      sessions: counts[i].count,
    }));
  }, [data]);

  const maxPts = Math.max(...weekdayData.map(d => d.points), 1);

  return (
    <div style={{ display: "flex", gap: "24px", alignItems: "stretch", flexWrap: "wrap" }}>
      <div style={{ flex: "0 0 260px", display: "flex", flexDirection: "column", gap: 8 }}>
        <p style={{ fontSize: 10, color: "#8e8aab", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>
          Points earned by weekday (all time)
        </p>
        <ResponsiveContainer width="100%" height={200}>
          <RadarChart data={weekdayData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
            <PolarGrid stroke="rgba(255,255,255,0.06)" />
            <PolarAngleAxis dataKey="day" tick={{ fill: "#8e8aab", fontSize: 10 }} />
            <PolarRadiusAxis angle={90} domain={[0, maxPts]} tick={{ fill: "#6b6880", fontSize: 8 }} />
            <Radar name="Points" dataKey="points" stroke="#22e5e5" fill="#22e5e5" fillOpacity={0.18} strokeWidth={2} />
            <Radar name="Badges" dataKey="badges" stroke="#b389ff" fill="#b389ff" fillOpacity={0.10} strokeWidth={1.5} />
            <Tooltip content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              return (
                <div style={{ background: "rgba(6,5,18,0.97)", border: "1px solid rgba(178,137,255,0.3)", borderRadius: 10, padding: "8px 12px", fontSize: 11 }}>
                  <p style={{ color: "#f3f1ff", fontWeight: 700, margin: "0 0 4px" }}>{label}</p>
                  {payload.map((p: any) => (
                    <p key={p.name} style={{ color: p.stroke, margin: "2px 0" }}>{p.name}: <b>{p.value}</b></p>
                  ))}
                </div>
              );
            }} />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <div style={{ flex: 1, minWidth: 220, display: "flex", flexDirection: "column", gap: 10 }}>
        <p style={{ fontSize: 10, color: "#8e8aab", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>
          All-time daily breakdown
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {weekdayData.map(d => {
            const pct     = maxPts > 0 ? (d.points / maxPts) * 100 : 0;
            const isToday = DAYS_SHORT[new Date().getDay()] === d.day;
            return (
              <div key={d.day} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: isToday ? "#22e5e5" : "#8e8aab", width: 28, flexShrink: 0, fontFamily: "monospace" }}>
                  {d.day}{isToday && <span style={{ marginLeft: 3, fontSize: 7, color: "#22e5e5" }}>●</span>}
                </span>
                <div style={{ flex: 1, height: 8, borderRadius: 8, background: "rgba(255,255,255,0.04)", overflow: "hidden" }}>
                  <div style={{
                    height: "100%", width: `${pct}%`,
                    background: isToday ? "linear-gradient(90deg,#22e5e5,#b389ff)" : "linear-gradient(90deg,#b389ffaa,#22e5e5aa)",
                    borderRadius: 8,
                    boxShadow: isToday ? "0 0 8px rgba(34,229,229,0.6)" : "none",
                    transition: "width 0.8s cubic-bezier(0.16,1,0.3,1)",
                  }} />
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, color: d.points > 0 ? "#f3f1ff" : "#8e8aab", fontFamily: "monospace", width: 36, textAlign: "right" }}>
                  {d.points > 0 ? `+${d.points}` : "—"}
                </span>
                {d.badges > 0 && <span style={{ fontSize: 9, color: "#b389ff", width: 28, textAlign: "right" }}>🎖{d.badges}</span>}
              </div>
            );
          })}
        </div>
        <p style={{ fontSize: 9, color: "#8e8aab", margin: "4px 0 0" }}>Based on {data.length} snapshots · deltas between consecutive snapshots</p>
      </div>
    </div>
  );
}

// ── Monthly View ──────────────────────────────────────────────────────────────
function MonthlyBars({ data }: { data: HistoryPoint[] }) {
  const monthly = useMemo(() => {
    const map: Record<string, { key: string; label: string; points: number; badges: number; sessions: number }> = {};
    for (const d of data) {
      const dt  = new Date(d.fetched_at);
      const key = `${dt.getFullYear()}-${dt.getMonth()}`;
      const lbl = `${MONTHS[dt.getMonth()]} ${dt.getFullYear()}`;
      if (!map[key]) map[key] = { key, label: lbl, points: d.arcadePoints ?? 0, badges: d.total_badges, sessions: 1 };
      else {
        const cur = d.arcadePoints ?? 0;
        if (cur > map[key].points) { map[key].points = cur; map[key].badges = d.total_badges; }
        map[key].sessions++;
      }
    }
    return Object.values(map).sort((a, b) => a.key.localeCompare(b.key));
  }, [data]);

  if (monthly.length < 1) return null;
  const maxPts = Math.max(...monthly.map(m => m.points), 1);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <p style={{ fontSize: 10, color: "#8e8aab", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>
        Peak Arcade Points per month
      </p>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={monthly} margin={{ top: 8, right: 12, left: -10, bottom: 0 }} barCategoryGap="28%">
          <defs>
            <linearGradient id="monthBarGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#b389ff" stopOpacity={0.95} />
              <stop offset="100%" stopColor="#22e5e5" stopOpacity={0.4} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="4 4" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: "#6b6880", fontSize: 9 }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fill: "#6b6880", fontSize: 9 }} tickLine={false} axisLine={false} width={28} />
          {TIER_THRESHOLDS.filter(t => t <= maxPts + 10).map(t => (
            <ReferenceLine key={t} y={t} stroke="rgba(245,158,11,0.18)" strokeDasharray="3 3"
              label={{ value: `${t}pt`, fill: "rgba(245,158,11,0.45)", fontSize: 8, position: "insideTopRight" }} />
          ))}
          <Tooltip content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const d = payload[0].payload;
            return (
              <div style={{ background: "rgba(6,5,18,0.97)", border: "1px solid rgba(178,137,255,0.3)", borderRadius: 12, padding: "10px 14px" }}>
                <p style={{ color: "#8e8aab", fontSize: 9, margin: "0 0 4px", textTransform: "uppercase" }}>{d.label}</p>
                <p style={{ color: "#22e5e5", fontSize: 18, fontWeight: 800, margin: 0, fontFamily: "monospace" }}>{d.points} pts</p>
                <p style={{ color: "#b389ff", fontSize: 10, margin: "2px 0 0" }}>🎖 {d.badges} badges · {d.sessions} snapshots</p>
              </div>
            );
          }} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
          <Bar dataKey="points" fill="url(#monthBarGrad)" radius={[6, 6, 0, 0]} maxBarSize={48} />
        </BarChart>
      </ResponsiveContainer>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {monthly.map((m, i) => {
          const prev  = monthly[i - 1];
          const delta = prev ? m.points - prev.points : null;
          return (
            <div key={m.key} style={{ padding: "6px 12px", borderRadius: 20, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 10, color: "#8e8aab" }}>{m.label}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#22e5e5", fontFamily: "monospace" }}>{m.points}pts</span>
              {delta !== null && delta !== 0 && (
                <span style={{ fontSize: 9, fontWeight: 700, color: delta > 0 ? "#34d399" : "#f87171" }}>
                  {delta > 0 ? `+${delta}` : delta}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main HistoryChart ─────────────────────────────────────────────────────────
export function HistoryChart({ data }: { data: HistoryPoint[] }) {
  const [mode,  setMode]  = useState<ChartMode>("area");
  const [range, setRange] = useState<TimeRange>("week"); // default = weekly delta view

  if (data.length < 2) return <EmptyChart />;

  const filtered = useMemo(() => {
    if (range === "all" || range === "weekday" || range === "week") return data;
    const now    = Date.now();
    const cutoff = now - 30 * 86400_000;
    const slice  = data.filter(d => new Date(d.fetched_at).getTime() >= cutoff);
    return slice.length >= 2 ? slice : data.slice(-20);
  }, [data, range]);

  const isAllSameDay = filtered.every(d =>
    new Date(d.fetched_at).toDateString() === new Date(filtered[0].fetched_at).toDateString()
  );

  const chartData = filtered.map(d => {
    const dt = new Date(d.fetched_at);
    return {
      date: isAllSameDay
        ? dt.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
        : dt.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      points: d.arcadePoints ?? d.total_points,
      badges: d.total_badges,
      fullDate: dt.toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }),
    };
  });

  const maxPts    = Math.max(...chartData.map(d => d.points));
  const minPts    = Math.min(...chartData.map(d => d.points));
  const latestPts = chartData[chartData.length - 1].points;
  const growth    = latestPts - chartData[0].points;
  const avg       = parseFloat((chartData.reduce((s, d) => s + d.points, 0) / chartData.length).toFixed(1));

  const sharedAxisProps = {
    stroke: "transparent" as const,
    tick: { fill: "#6b6880", fontSize: 10 },
    tickLine: false,
    axisLine: false,
  };
  const tooltipCursor = { stroke: "rgba(178,137,255,0.2)", strokeWidth: 1, strokeDasharray: "4 4" };
  const margin = { top: 16, right: 16, left: -10, bottom: 0 };

  const refLines = TIER_THRESHOLDS
    .filter(t => minPts <= t && maxPts >= t - 10)
    .map(t => (
      <ReferenceLine key={t} y={t} stroke="rgba(245,158,11,0.18)" strokeDasharray="3 3"
        label={{ value: `${t}pt`, fill: "rgba(245,158,11,0.45)", fontSize: 9, position: "insideTopRight" }} />
    ));

  const gradientDefs = (
    <defs>
      <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"   stopColor="#22e5e5" stopOpacity={0.35} />
        <stop offset="40%"  stopColor="#b389ff" stopOpacity={0.15} />
        <stop offset="100%" stopColor="#ff6fb3" stopOpacity={0} />
      </linearGradient>
      <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%"   stopColor="#22e5e5" />
        <stop offset="50%"  stopColor="#b389ff" />
        <stop offset="100%" stopColor="#ff6fb3" />
      </linearGradient>
      <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"   stopColor="#b389ff" stopOpacity={0.9} />
        <stop offset="100%" stopColor="#22e5e5" stopOpacity={0.4} />
      </linearGradient>
    </defs>
  );

  const chartModes: { id: ChartMode; label: string; Icon: typeof Activity }[] = [
    { id: "area", label: "Area",  Icon: Activity },
    { id: "line", label: "Line",  Icon: TrendingUp },
    { id: "bar",  label: "Bar",   Icon: BarChart2 },
  ];

  const timeRanges: { id: TimeRange; label: string; icon?: string }[] = [
    { id: "week",    label: "Weekly",  icon: "📅" },
    { id: "month",   label: "30D",     icon: "📆" },
    { id: "all",     label: "All",     icon: "📈" },
    { id: "weekday", label: "Pattern", icon: "🌀" },
  ];

  return (
    <div className="glass rounded-2xl overflow-hidden">

      {/* ── Stats header ── */}
      <div className="px-6 pt-5 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5">
        <div className="flex items-center gap-5 flex-wrap">
          {[
            { label: "Current", value: latestPts, color: "text-cyan",         suffix: "pts" },
            { label: "Peak",    value: maxPts,    color: "text-amber",        suffix: "pts" },
            { label: "Growth",  value: growth,    color: growth >= 0 ? "text-emerald-400" : "text-pink", suffix: "pts", prefix: growth >= 0 ? "+" : "" },
            { label: "Avg",     value: avg,       color: "text-violet",       suffix: "pts" },
          ].map((s, i, arr) => (
            <div key={s.label} className="flex items-center gap-5">
              <div>
                <p className="text-[10px] text-mist-muted uppercase tracking-wider">{s.label}</p>
                <p className={`text-xl font-bold ${s.color} mt-0.5 font-mono`}>
                  {(s as any).prefix}{s.value}
                  <span className="text-xs text-mist-muted font-normal ml-1">{s.suffix}</span>
                </p>
              </div>
              {i < arr.length - 1 && <div className="w-px h-8 bg-white/10" />}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
          {/* Time range */}
          <div className="flex items-center gap-0.5 glass rounded-xl p-1">
            {timeRanges.map(({ id, label, icon }) => (
              <button key={id} onClick={() => setRange(id)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all duration-200 cursor-pointer ${
                  range === id
                    ? "bg-gradient-to-r from-cyan/70 to-violet/70 text-white shadow-md"
                    : "text-mist-muted hover:text-mist hover:bg-white/5"
                }`}>
                <span>{icon}</span>{label}
              </button>
            ))}
          </div>

          {/* Chart type switcher — hidden for special views */}
          {(range === "all" || range === "month") && (
            <div className="flex items-center gap-0.5 glass rounded-xl p-1">
              {chartModes.map(({ id, label, Icon }) => (
                <button key={id} onClick={() => setMode(id)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-all duration-200 cursor-pointer ${
                    mode === id
                      ? "bg-gradient-to-r from-violet/80 to-cyan/80 text-white shadow-md"
                      : "text-mist-muted hover:text-mist hover:bg-white/5"
                  }`}>
                  <Icon className="w-3 h-3" />
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Chart body ── */}
      <div className="px-4 pb-4 pt-4">
        {range === "week" ? (
          <WeeklyDeltaChart data={data} />
        ) : range === "weekday" ? (
          <div style={{ padding: "8px 8px 0" }}>
            <WeekdayRadar data={data} />
          </div>
        ) : (
          <>
            <div style={{ height: 240 }}>
              <ResponsiveContainer width="100%" height="100%">
                {mode === "area" ? (
                  <AreaChart data={chartData} margin={margin}>
                    {gradientDefs}
                    <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="4 4" vertical={false} />
                    <XAxis dataKey="date" {...sharedAxisProps} />
                    <YAxis {...sharedAxisProps} width={32} />
                    {refLines}
                    <Tooltip content={<CustomTooltip />} cursor={tooltipCursor} />
                    <Area type="monotoneX" dataKey="points"
                      stroke="url(#lineGrad)" strokeWidth={2.5}
                      fill="url(#areaFill)"
                      dot={(p: any) => <GlowDot {...p} data={chartData} />}
                      activeDot={{ r: 5, fill: "#22e5e5", stroke: "rgba(34,229,229,0.3)", strokeWidth: 4 }} />
                  </AreaChart>
                ) : mode === "line" ? (
                  <LineChart data={chartData} margin={margin}>
                    {gradientDefs}
                    <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="4 4" vertical={false} />
                    <XAxis dataKey="date" {...sharedAxisProps} />
                    <YAxis {...sharedAxisProps} width={32} />
                    {refLines}
                    <Tooltip content={<CustomTooltip />} cursor={tooltipCursor} />
                    <Line type="monotone" dataKey="points"
                      stroke="url(#lineGrad)" strokeWidth={2.5}
                      dot={(p: any) => <GlowDot {...p} data={chartData} />}
                      activeDot={{ r: 5, fill: "#b389ff", stroke: "rgba(179,137,255,0.3)", strokeWidth: 4 }} />
                  </LineChart>
                ) : (
                  <BarChart data={chartData} margin={margin} barCategoryGap="30%">
                    {gradientDefs}
                    <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="4 4" vertical={false} />
                    <XAxis dataKey="date" {...sharedAxisProps} />
                    <YAxis {...sharedAxisProps} width={32} />
                    {refLines}
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                    <Bar dataKey="points" fill="url(#barGrad)" radius={[6, 6, 0, 0]} maxBarSize={40} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
            {range === "month" && (
              <div className="border-t border-white/5 pt-4 mt-4">
                <MonthlyBars data={data} />
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Legend ── */}
      <div className="px-6 pb-4 flex items-center gap-4 text-[10px] text-mist-muted border-t border-white/5 pt-3 flex-wrap">
        {range === "week" ? (
          <>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-cyan inline-block" /> Today</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-violet inline-block" /> Badge earned</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber inline-block" /> Best day</span>
            <span className="ml-auto flex items-center gap-1 font-mono">Shows badges earned each day (not cumulative)</span>
          </>
        ) : (
          <>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-cyan inline-block" /> Latest</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber inline-block" /> Peak</span>
            <span className="flex items-center gap-1.5"><span className="w-4 border-t border-dashed border-amber/40 inline-block" /> Tier thresholds</span>
            <span className="ml-auto flex items-center gap-1">
              <Zap className="w-3 h-3 text-cyan" />
              {filtered.length} snapshots
            </span>
          </>
        )}
      </div>
    </div>
  );
}
