import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldAlert, ShieldCheck, AlertTriangle,
  Clock, Activity, ChevronDown, ChevronRight, ChevronLeft,
  XOctagon, Server, Lock, Fingerprint
} from "lucide-react";
import { cn } from "../lib/utils";

const PAGE_SIZE = 6;

// ── Theme map ─────────────────────────────────────────────────────────
const SEV_MAP = {
  HIGH: {
    badge:  "badge-error",
    bar:    "bg-rose-500",
    glow:   "shadow-[0_0_12px_rgba(239,68,68,0.15)]",
    border: "border-rose-200/50 dark:border-rose-800/30",
    iconBg: "bg-rose-100 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400",
    count:  "bg-rose-600 text-white",
  },
  MEDIUM: {
    badge:  "badge-warning",
    bar:    "bg-amber-500",
    glow:   "shadow-[0_0_12px_rgba(245,158,11,0.12)]",
    border: "border-amber-200/50 dark:border-amber-800/30",
    iconBg: "bg-amber-100 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400",
    count:  "bg-amber-500 text-white",
  },
  LOW: {
    badge:  "badge-info",
    bar:    "bg-sky-500",
    glow:   "",
    border: "border-sky-200/50 dark:border-sky-800/30",
    iconBg: "bg-sky-100 dark:bg-sky-950/30 text-sky-600 dark:text-sky-400",
    count:  "bg-sky-500 text-white",
  },
};

// ── Anomaly Detection Engine ──────────────────────────────────────────

function getIntervalKey(timestamp, intervalMinutes = 5) {
  const d = new Date(timestamp);
  if (isNaN(d.getTime())) return null;
  const coeff = 1000 * 60 * intervalMinutes;
  return new Date(Math.floor(d.getTime() / coeff) * coeff).toISOString();
}

function detectAnomalies(records) {
  if (!records || records.length === 0) return [];

  // Group by 5-min intervals
  const buckets = new Map();
  records.forEach(r => {
    const key = getIntervalKey(r.timestamp, 5);
    if (!key) return;
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(r);
  });

  const anomalies = [];

  const RISK_PATTERNS = [
    { type: "AUTH", name: "Authentication / Privilege Risk", regex: /unauthorized|accessdenied|authfailure|invalid.*credentials|nopasswordpolicy|cannot be assumed/i, sev: "HIGH", icon: Lock },
    { type: "ABUSE", name: "Possible API Abuse / Throttling", regex: /throttl|rate exceeded/i, sev: "MEDIUM", icon: Activity },
    { type: "PROBE", name: "Suspicious Resource Probing", regex: /notfoundexception|nosuchbucket|nosuchkey/i, sev: "LOW", icon: Server },
  ];

  for (const [interval, logs] of buckets.entries()) {
    const errorLogs = logs.filter(l => l.severity === "ERROR");
    
    // 1. Error Spike (Burst)
    if (errorLogs.length >= 5) {
      anomalies.push({
        id: `burst-${interval}`,
        time: interval,
        type: "BURST",
        name: "High Volume Error Spike",
        severity: errorLogs.length >= 15 ? "HIGH" : "MEDIUM",
        desc: `Detected a sudden spike of ${errorLogs.length} errors within a 5-minute window. This may indicate a service outage or coordinated attack.`,
        logs: errorLogs,
        count: errorLogs.length,
        icon: AlertTriangle,
      });
    }

    // 2. Specific Patterns
    for (const pattern of RISK_PATTERNS) {
      const matched = logs.filter(l => pattern.regex.test((l.raw || "").toLowerCase()));
      if (matched.length > 0) {
        // Flag if multiple, or if HIGH severity
        if (matched.length >= 3 || pattern.sev === "HIGH") {
          anomalies.push({
            id: `${pattern.type}-${interval}`,
            time: interval,
            type: pattern.type,
            name: pattern.name,
            severity: pattern.sev,
            desc: `Detected ${matched.length} occurrences of ${pattern.name.toLowerCase()} within 5 minutes.`,
            logs: matched,
            count: matched.length,
            icon: pattern.icon,
          });
        }
      }
    }
  }

  // Sort: NEWEST first, then strictly by severity (HIGH > MEDIUM > LOW)
  return anomalies.sort((a, b) => {
    if (a.time !== b.time) return new Date(b.time) - new Date(a.time);
    const score = { HIGH: 3, MEDIUM: 2, LOW: 1 };
    return score[b.severity] - score[a.severity];
  });
}

// ── Demo Data ─────────────────────────────────────────────────────────

const DEMO_ANOMALIES = [
  {
    id: "demo-1", time: new Date().toISOString(), type: "AUTH", name: "Authentication / Privilege Risk", severity: "HIGH",
    desc: "Detected 4 occurrences of authentication / privilege risk within 5 minutes.", count: 4, icon: Lock,
    logs: [{ timestamp: new Date().toISOString(), raw: "AccessDenied: User is not authorized to perform: ec2:DescribeInstances" }]
  },
  {
    id: "demo-2", time: new Date(Date.now() - 300000).toISOString(), type: "BURST", name: "High Volume Error Spike", severity: "MEDIUM",
    desc: "Detected a sudden spike of 8 errors within a 5-minute window.", count: 8, icon: AlertTriangle,
    logs: [{ timestamp: new Date(Date.now() - 300000).toISOString(), raw: "ConnectionRefused: Target service is unreachable" }]
  }
];

// ── Pagination ────────────────────────────────────────────────────────
function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;
  const pages   = Array.from({ length: totalPages }, (_, i) => i + 1);
  const visible = pages.filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1);
  const items   = [];
  visible.forEach((p, i) => {
    if (i > 0 && p - visible[i - 1] > 1) items.push("…");
    items.push(p);
  });
  return (
    <div className="flex items-center justify-center gap-1.5 pt-5 border-t border-slate-100 dark:border-slate-800 mt-4">
      <button onClick={() => onChange(page - 1)} disabled={page === 1}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
        <ChevronLeft className="h-4 w-4" />
      </button>
      {items.map((item, i) =>
        item === "…" ? (
          <span key={`e${i}`} className="px-1 text-xs text-slate-400">…</span>
        ) : (
          <button key={item} onClick={() => onChange(item)}
            className={cn("flex h-8 w-8 items-center justify-center rounded-lg text-sm font-semibold transition-colors",
              item === page
                ? "bg-indigo-600 text-white shadow-sm"
                : "border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
            )}>
            {item}
          </button>
        )
      )}
      <button onClick={() => onChange(page + 1)} disabled={page === totalPages}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

// ── Anomaly Card ──────────────────────────────────────────────────────
function AnomalyCard({ anomaly, idx }) {
  const [open, setOpen] = useState(false);
  const cfg = SEV_MAP[anomaly.severity] || SEV_MAP.LOW;
  const Icon = anomaly.icon;

  const displayTime = new Date(anomaly.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const tz = new Date(anomaly.time).toLocaleTimeString('en-US', { timeZoneName: 'short' }).split(' ')[2];

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -8 }}
      transition={{ delay: idx * 0.04, duration: 0.28 }}
      className={cn(
        "group relative overflow-hidden rounded-xl border bg-white/80 shadow-soft backdrop-blur-xl",
        "dark:bg-slate-900/50 transition-shadow duration-200 hover:shadow-lift",
        cfg.border, cfg.glow
      )}
    >
      <div className={cn("absolute left-0 top-0 h-full w-1 rounded-l-xl", cfg.bar)} />

      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex w-full items-start gap-3 p-4 pl-5 text-left"
        aria-expanded={open}
      >
        <div className="relative mt-0.5 shrink-0">
          <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl", cfg.iconBg)}>
            <Icon className="h-4 w-4" />
          </div>
          {anomaly.severity === "HIGH" && (
            <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-rose-500" />
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className={cfg.badge}>{anomaly.severity} RISK</span>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500">
              <Clock className="h-2.5 w-2.5" />
              {displayTime} {tz}
            </span>
            <span className={cn("inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold", cfg.count)}>
              ×{anomaly.count} events
            </span>
          </div>

          <div className="text-sm font-bold text-slate-900 dark:text-white leading-snug">{anomaly.name}</div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
            {anomaly.desc}
          </p>
        </div>

        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }} className="mt-1 shrink-0">
          <ChevronDown className="h-4 w-4 text-slate-400" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="space-y-3 border-t border-slate-100 dark:border-slate-800 p-4 pl-5 pt-3">
              <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                <Fingerprint className="h-3 w-3" /> Event Evidence ({Math.min(anomaly.logs.length, 50)} captured)
              </div>
              <ul className="space-y-1.5 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                {anomaly.logs.slice(0, 50).map((l, i) => (
                  <li key={i} className="rounded-lg border border-slate-700/40 bg-[#0d1117] px-3 py-2">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-mono text-slate-500">
                        {new Date(l.timestamp).toISOString().slice(11, 19)}
                      </span>
                    </div>
                    <code className="block whitespace-pre-wrap break-all font-mono text-[10px] leading-relaxed text-[#8b949e]">
                      {l.raw}
                    </code>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────

export default function SecurityPage({ analysis }) {
  const [page, setPage] = useState(1);

  const anomalies = useMemo(() => {
    if (!analysis || !analysis.processed_preview) return DEMO_ANOMALIES;
    return detectAnomalies(analysis.processed_preview);
  }, [analysis]);

  const isDemo = (!analysis || !analysis.processed_preview);

  const totalPages = Math.max(1, Math.ceil(anomalies.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const start      = (safePage - 1) * PAGE_SIZE;
  const pageItems  = anomalies.slice(start, start + PAGE_SIZE);

  const counts = useMemo(() => ({
    HIGH:   anomalies.filter(a => a.severity === "HIGH").length,
    MEDIUM: anomalies.filter(a => a.severity === "MEDIUM").length,
    LOW:    anomalies.filter(a => a.severity === "LOW").length,
  }), [anomalies]);

  const handlePageChange = (p) => {
    setPage(p);
    document.getElementById("security-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-slate-200/60 bg-white/75 p-5 shadow-soft backdrop-blur-xl dark:border-slate-800/50 dark:bg-slate-900/50"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-glow shrink-0">
              <ShieldAlert className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-slate-900 dark:text-white">Security Incidents</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isDemo
                  ? "Demo mode — upload logs for real threat detection."
                  : `Detected ${anomalies.length} suspicious event groups via 5-minute time window analysis.`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="badge-error">{counts.HIGH} HIGH RISK</span>
            <span className="badge-warning">{counts.MEDIUM} MED RISK</span>
            <span className="badge-info">{counts.LOW} LOW RISK</span>
          </div>
        </div>
      </motion.div>

      {/* Anomaly Feed */}
      <div id="security-section" className="rounded-2xl border border-slate-200/60 bg-white/75 p-5 shadow-soft backdrop-blur-xl dark:border-slate-800/50 dark:bg-slate-900/50">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-extrabold text-slate-900 dark:text-white">Detected Anomalies</p>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Correlated bursts of errors and authentication failures.
            </p>
          </div>
          {anomalies.length > 0 && (
            <span className="rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300 tabular-nums">
              {start + 1}–{Math.min(start + PAGE_SIZE, anomalies.length)} of {anomalies.length}
            </span>
          )}
        </div>

        {anomalies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-center text-slate-400 dark:text-slate-500">
            <ShieldCheck className="h-10 w-10 mb-3 opacity-30 text-emerald-500" />
            <div className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">No Security Risks Detected</div>
            <div className="text-xs mt-1 opacity-70">Log analysis found no suspicious bursts or access failures in the current dataset.</div>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence mode="wait">
              {pageItems.map((anomaly, idx) => (
                <AnomalyCard key={anomaly.id} anomaly={anomaly} idx={idx} />
              ))}
            </AnimatePresence>
            <Pagination page={safePage} totalPages={totalPages} onChange={handlePageChange} />
          </div>
        )}
      </div>

    </div>
  );
}
