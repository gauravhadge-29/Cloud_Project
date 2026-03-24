import React from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
  Area,
  AreaChart,
} from "recharts";
import { motion } from "framer-motion";
import { cn } from "../lib/utils";

/* ─── Color tokens ─────────────────────────────────────────────── */
const SEV_COLORS = {
  ERROR:   { fill: "#ef4444", glow: "rgba(239,68,68,0.3)" },
  WARNING: { fill: "#f59e0b", glow: "rgba(245,158,11,0.3)" },
  INFO:    { fill: "#3b82f6", glow: "rgba(59,130,246,0.3)" },
  DEBUG:   { fill: "#8b5cf6", glow: "rgba(139,92,246,0.3)" },
};

/* ─── Shared chart card wrapper ────────────────────────────────── */
function ChartCard({ title, subtitle, badge, children, className }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn(
        "rounded-2xl border border-slate-200/60 bg-white/75 p-5 backdrop-blur-xl shadow-soft",
        "dark:border-slate-800/50 dark:bg-slate-900/50",
        className
      )}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-extrabold text-slate-900 dark:text-white">{title}</div>
          {subtitle && (
            <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{subtitle}</div>
          )}
        </div>
        {badge && (
          <span className="shrink-0 inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {badge}
          </span>
        )}
      </div>
      {children}
    </motion.section>
  );
}

/* ─── Custom tooltip ────────────────────────────────────────────── */
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-200/50 bg-white/95 px-3 py-2 shadow-lift backdrop-blur-xl dark:border-slate-700/50 dark:bg-slate-900/95 text-xs">
      {label && <div className="font-bold text-slate-700 dark:text-slate-300 mb-1">{label}</div>}
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: entry.color }} />
          <span className="text-slate-500 dark:text-slate-400 capitalize">{entry.name}:</span>
          <span className="font-bold text-slate-900 dark:text-white">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

/* ─── Pie – severity distribution ───────────────────────────────── */
export function SeverityPie({ severity = {} }) {
  const data = Object.entries(severity)
    .filter(([, v]) => Number(v) > 0)
    .map(([name, value]) => ({ name, value: Number(value) }));

  const empty = data.length === 0;
  const fallback = [
    { name: "ERROR", value: 40 },
    { name: "WARNING", value: 35 },
    { name: "INFO", value: 25 },
  ];

  const chartData = empty ? fallback : data;

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    if (percent < 0.05) return null;
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight="700">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <ChartCard
      title="Severity Distribution"
      subtitle="Log level breakdown from latest run"
      badge={empty ? "Demo" : "Live"}
    >
      <div className="h-56">
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              outerRadius={88}
              innerRadius={50}
              paddingAngle={3}
              labelLine={false}
              label={renderCustomLabel}
            >
              {chartData.map((entry) => (
                <Cell
                  key={entry.name}
                  fill={SEV_COLORS[entry.name]?.fill || "#64748b"}
                  opacity={empty ? 0.35 : 1}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              iconType="circle"
              iconSize={8}
              formatter={(val) => (
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{val}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      {empty && (
        <p className="text-center text-xs text-slate-400 dark:text-slate-500 -mt-2">
          Upload logs to see real distribution
        </p>
      )}
    </ChartCard>
  );
}

/* ─── Bar – top keywords ────────────────────────────────────────── */
export function KeywordsBar({ keywords = [] }) {
  const data = keywords.slice(0, 10).map((k) => ({
    name: k.term?.length > 8 ? k.term.slice(0, 8) + "…" : k.term,
    count: k.count,
    full: k.term,
  }));

  const empty = data.length === 0;
  const fallback = [
    { name: "error",   count: 42, full: "error" },
    { name: "timeout", count: 31, full: "timeout" },
    { name: "connect", count: 27, full: "connect" },
    { name: "warning", count: 19, full: "warning" },
    { name: "pod",     count: 15, full: "pod" },
  ];

  return (
    <ChartCard
      title="Top Keywords"
      subtitle="TF-IDF token frequency signal"
      badge={empty ? "Demo" : "Live"}
    >
      <div className="h-56">
        <ResponsiveContainer>
          <BarChart data={empty ? fallback : data} barSize={22}>
            <defs>
              <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity={empty ? 0.3 : 1} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={empty ? 0.2 : 0.7} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.12)" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 10, fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
              width={28}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(6,182,212,0.06)" }} />
            <Bar dataKey="count" fill="url(#barGrad)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

/* ─── Area – log frequency over time ───────────────────────────── */
export function FrequencyLine({ timeline = [] }) {
  const buckets = new Map();
  for (const item of timeline) {
    const key = String(item.timestamp || "N/A").slice(0, 16);
    const curr = buckets.get(key) || { timestamp: key, count: 0 };
    curr.count += 1;
    buckets.set(key, curr);
  }
  const data = Array.from(buckets.values()).slice(0, 24);

  const empty = data.length === 0;
  const fallback = Array.from({ length: 12 }, (_, i) => ({
    timestamp: `T+${i}`,
    count: Math.floor(Math.random() * 12) + 2,
  }));

  return (
    <ChartCard
      title="Log Frequency Over Time"
      subtitle="Event density from timeline data"
      badge={empty ? "Demo" : "Live"}
    >
      <div className="h-56">
        <ResponsiveContainer>
          <AreaChart data={empty ? fallback : data}>
            <defs>
              <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={empty ? 0.2 : 0.4} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.12)" />
            <XAxis dataKey="timestamp" hide />
            <YAxis
              tick={{ fontSize: 10, fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
              width={28}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="count"
              stroke="#10b981"
              strokeWidth={2.5}
              fill="url(#areaGrad)"
              dot={false}
              activeDot={{ r: 5, strokeWidth: 0, fill: "#10b981" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

/* ─── Multi-line severity over time (bonus) ─────────────────────── */
export function SeverityTimeline({ timeline = [] }) {
  const byMinute = new Map();
  for (const item of timeline) {
    const key = String(item.timestamp || "N/A").slice(0, 16);
    const curr = byMinute.get(key) || { t: key, ERROR: 0, WARNING: 0, INFO: 0 };
    curr[item.severity] = (curr[item.severity] || 0) + 1;
    byMinute.set(key, curr);
  }
  const data = Array.from(byMinute.values()).slice(0, 20);

  const empty = data.length === 0;
  const fallback = Array.from({ length: 8 }, (_, i) => ({
    t: `T${i}`,
    ERROR: Math.floor(Math.random() * 5),
    WARNING: Math.floor(Math.random() * 8),
    INFO: Math.floor(Math.random() * 12) + 2,
  }));

  return (
    <ChartCard
      title="Severity Over Time"
      subtitle="Error / Warning / Info event rates"
      badge={empty ? "Demo" : "Live"}
    >
      <div className="h-56">
        <ResponsiveContainer>
          <LineChart data={empty ? fallback : data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.12)" />
            <XAxis dataKey="t" hide />
            <YAxis
              tick={{ fontSize: 10, fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
              width={28}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend iconType="circle" iconSize={7}
              formatter={(val) => (
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{val}</span>
              )}
            />
            <Line type="monotone" dataKey="ERROR"   stroke="#ef4444" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="WARNING" stroke="#f59e0b" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="INFO"    stroke="#3b82f6" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
