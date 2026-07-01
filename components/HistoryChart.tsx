"use client";

import { useState } from "react";
import {
  XAxis, YAxis, Tooltip, ResponsiveContainer,
  Area, AreaChart, Line, LineChart, Bar, BarChart,
  ReferenceLine, CartesianGrid,
} from "recharts";
import { BarChart2, TrendingUp, Activity } from "lucide-react";

export interface HistoryPoint {
  fetched_at: string;
  total_points: number;
  total_badges: number;
  arcadePoints?: number;
}

type ChartMode = "area" | "line" | "bar";

// ─── Custom tooltip ──────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const displayLabel = payload[0].payload?.fullDate || label;
  return (
    <div style={{
      background: "rgba(8,6,20,0.95)",
      border: "1px solid rgba(178,137,255,0.3)",
      borderRadius: 14,
      padding: "10px 14px",
      backdropFilter: "blur(16px)",
      boxShadow: "0 8px 32px rgba(0,0,0,0.5), 0 0 20px rgba(178,137,255,0.1)",
    }}>
      <p style={{ color: "#8e8aab", fontSize: 10, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.1em" }}>
        {displayLabel}
      </p>
      <p style={{ color: "#22e5e5", fontSize: 20, fontWeight: 700, margin: 0, lineHeight: 1 }}>
        {payload[0].value}
        <span style={{ color: "#8e8aab", fontSize: 11, fontWeight: 400, marginLeft: 4 }}>pts</span>
      </p>
    </div>
  );
}

// ─── Custom glow dot (for Area/Line) ─────────────────────────────────────────
function GlowDot(props: any) {
  const { cx, cy, index, data } = props;
  const value = props.value;
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

// ─── Empty state ─────────────────────────────────────────────────────────────
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

// ─── Main component ───────────────────────────────────────────────────────────
export function HistoryChart({ data }: { data: HistoryPoint[] }) {
  const [mode, setMode] = useState<ChartMode>("area");

  if (data.length < 2) return <EmptyChart />;

  const isAllSameDay = data.length > 0 && data.every((d) => {
    const date1 = new Date(d.fetched_at).toDateString();
    const date2 = new Date(data[0].fetched_at).toDateString();
    return date1 === date2;
  });

  const chartData = data.map((d) => {
    const dateObj = new Date(d.fetched_at);
    return {
      date: isAllSameDay
        ? dateObj.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
        : dateObj.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      points: d.arcadePoints ?? d.total_points,
      fullDate: dateObj.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }),
    };
  });

  const maxPts    = Math.max(...chartData.map((d) => d.points));
  const minPts    = Math.min(...chartData.map((d) => d.points));
  const latestPts = chartData[chartData.length - 1].points;
  const growth    = latestPts - chartData[0].points;

  const sharedAxisProps = {
    stroke: "transparent" as const,
    tick: { fill: "#6b6880", fontSize: 10 },
    tickLine: false,
    axisLine: false,
  };

  const tooltipCursor = { stroke: "rgba(178,137,255,0.2)", strokeWidth: 1, strokeDasharray: "4 4" };

  const refLines = [50, 75, 95, 120].filter((t) => minPts <= t && maxPts >= t - 10).map((t) => (
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

  const margin = { top: 16, right: 16, left: -10, bottom: 0 };

  const modes: { id: ChartMode; label: string; Icon: typeof Activity }[] = [
    { id: "area", label: "Area",  Icon: Activity },
    { id: "line", label: "Line",  Icon: TrendingUp },
    { id: "bar",  label: "Bar",   Icon: BarChart2 },
  ];

  return (
    <div className="glass rounded-2xl overflow-hidden">
      {/* ── Stats header ── */}
      <div className="px-6 pt-5 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5">
        <div className="flex items-center gap-6">
          <div>
            <p className="text-[10px] text-mist-muted uppercase tracking-wider">Current</p>
            <p className="text-2xl font-bold text-cyan mt-0.5">
              {latestPts} <span className="text-xs text-mist-muted font-normal">pts</span>
            </p>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div>
            <p className="text-[10px] text-mist-muted uppercase tracking-wider">Peak</p>
            <p className="text-lg font-bold text-amber mt-0.5">
              {maxPts} <span className="text-xs text-mist-muted font-normal">pts</span>
            </p>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div>
            <p className="text-[10px] text-mist-muted uppercase tracking-wider">Growth</p>
            <p className={`text-lg font-bold mt-0.5 ${growth >= 0 ? "text-emerald-400" : "text-pink"}`}>
              {growth >= 0 ? "+" : ""}{growth}
              <span className="text-xs text-mist-muted font-normal ml-1">pts</span>
            </p>
          </div>
        </div>

        {/* ── Chart type switcher ── */}
        <div className="flex items-center gap-1 glass rounded-xl p-1 self-start sm:self-auto">
          {modes.map(({ id, label, Icon }) => (
            <button key={id} onClick={() => setMode(id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer ${
                mode === id
                  ? "bg-gradient-to-r from-violet/80 to-cyan/80 text-white shadow-md"
                  : "text-mist-muted hover:text-mist hover:bg-white/5"
              }`}>
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Chart canvas ── */}
      <div className="px-2 pb-4 pt-3" style={{ height: 230 }}>
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
              <Bar dataKey="points" fill="url(#barGrad)" radius={[6, 6, 0, 0]}
                maxBarSize={40} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* ── Legend ── */}
      <div className="px-6 pb-4 flex items-center gap-4 text-[10px] text-mist-muted">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-cyan inline-block" /> Latest
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber inline-block" /> Peak
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-4 border-t border-dashed border-amber/40 inline-block" /> Tier thresholds
        </span>
        <span className="ml-auto">{data.length} snapshots</span>
      </div>
    </div>
  );
}
