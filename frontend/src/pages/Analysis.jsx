import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle, Bug, CheckCircle2,
  BarChart3, Clock, Hash, Code2,
  ChevronLeft, ChevronRight,
  ArrowUpDown, Filter, X,
  ArrowUp, ArrowDown,
} from "lucide-react";

import StatsCard from "../components/StatsCard";
import LogDetailModal from "../components/LogDetailModal";
import { cn } from "../lib/utils";

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const fadeUp  = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.32 } } };

// ── Severity theme map ────────────────────────────────────────────────
const SEV = {
  ERROR: {
    stripe:  "bg-rose-500",
    badge:   "bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300",
    dot:     "bg-rose-500",
    explBox: "border-rose-200 bg-rose-50/80 text-rose-900 dark:border-rose-800/50 dark:bg-rose-950/25 dark:text-rose-100",
    labelTx: "text-rose-500 dark:text-rose-400",
    filterActive: "bg-rose-600 text-white border-rose-600",
    filterIdle:   "border-rose-300 text-rose-600 hover:bg-rose-50 dark:border-rose-700 dark:text-rose-400 dark:hover:bg-rose-950/30",
  },
  WARNING: {
    stripe:  "bg-amber-400",
    badge:   "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
    dot:     "bg-amber-400",
    explBox: "border-amber-200 bg-amber-50/80 text-amber-900 dark:border-amber-800/50 dark:bg-amber-950/25 dark:text-amber-100",
    labelTx: "text-amber-500 dark:text-amber-400",
    filterActive: "bg-amber-500 text-white border-amber-500",
    filterIdle:   "border-amber-300 text-amber-600 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-950/30",
  },
  INFO: {
    stripe:  "bg-sky-400",
    badge:   "bg-sky-100 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300",
    dot:     "bg-sky-400",
    explBox: "border-sky-200 bg-sky-50/80 text-sky-900 dark:border-sky-800/50 dark:bg-sky-950/25 dark:text-sky-100",
    labelTx: "text-sky-500 dark:text-sky-400",
    filterActive: "bg-sky-500 text-white border-sky-500",
    filterIdle:   "border-sky-300 text-sky-600 hover:bg-sky-50 dark:border-sky-700 dark:text-sky-400 dark:hover:bg-sky-950/30",
  },
};

const SEVERITY_ORDER = { ERROR: 3, WARNING: 2, INFO: 1 };

function detectLevel(raw = "") {
  if (/error|fail|exception|denied|unauthorized/i.test(raw)) return "ERROR";
  if (/warn|timeout|retry/i.test(raw)) return "WARNING";
  return "INFO";
}

// ── LogEntryCard ──────────────────────────────────────────────────────
function LogEntryCard({ row, globalIdx, onAnalyze }) {
  const level = detectLevel(row.raw);
  const t     = SEV[level];

  return (
    <motion.li
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="flex overflow-hidden rounded-xl border border-slate-200/60 bg-white/40 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)] backdrop-blur-sm transition-all hover:bg-white/80 dark:border-slate-800/60 dark:bg-slate-900/40 dark:hover:bg-slate-900/60"
    >
      <div className={cn("w-[4px] flex-shrink-0", t.stripe)} />
      <div className="flex-1 px-5 py-4 space-y-3">

        {/* Header */}
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn("inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-semibold leading-none tracking-wide", t.badge)}>
            <span className={cn("h-1.5 w-1.5 rounded-full", t.dot)} />
            {level}
          </span>
          {row.timestamp && row.timestamp !== "N/A" && (
            <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-2 py-0.5 text-[11px] font-mono text-slate-500 dark:text-slate-400">
              <Clock className="h-3 w-3 flex-shrink-0 opacity-70" />
              {row.timestamp}
            </span>
          )}

          <span className="ml-auto font-mono text-[11px] font-semibold text-slate-300 dark:text-slate-600 tabular-nums select-none">
            #{String(globalIdx + 1).padStart(3, "0")}
          </span>
        </div>

        {/* Metadata Tags */}
        {row.metadata && Object.keys(row.metadata).length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {Object.entries(row.metadata).map(([key, value]) => (
              <span key={key} className="inline-flex items-center gap-1.5 rounded-md border border-slate-200/50 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/30 px-2 py-0.5 text-[10px] font-semibold shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                <span className="text-slate-400 dark:text-slate-500/80 uppercase tracking-widest text-[9px]">{key}</span> 
                <span className="text-slate-600 dark:text-slate-300 font-mono tracking-tight">{value}</span>
              </span>
            ))}
          </div>
        )}

        {/* Two columns */}
        <div className="grid gap-3 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">Raw Log Entry</p>
            <div className="flex-1 rounded-lg border border-slate-700/70 bg-[#0d1117] p-3">
              <code className="block whitespace-pre-wrap break-all font-mono text-[11.5px] leading-[1.75] text-[#c9d1d9]">
                {row.raw || "—"}
              </code>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <p className={cn("text-[10px] font-semibold uppercase tracking-widest", t.labelTx)}>NLP Explanation</p>
            <div className={cn("flex-1 rounded-lg border p-3 text-[13px] leading-relaxed", t.explBox)}>
              {row.explanation || "Routine cloud infrastructure API call — no error or anomaly detected."}
            </div>
          </div>
        </div>

        {/* Analyze button */}
        <div>
          <button
            onClick={() => onAnalyze({ message: row.raw, timestamp: row.timestamp, severity: level, template: row.template || "", metadata: {} })}
            className="inline-flex items-center gap-1.5 rounded-lg border border-violet-400 bg-violet-50 dark:bg-violet-950/20 px-3 py-1.5 text-[11px] font-semibold text-violet-700 dark:text-violet-300 hover:bg-violet-100 dark:hover:bg-violet-950/40 transition-colors"
          >
            🔍 Deep Analysis
          </button>
        </div>

      </div>
    </motion.li>
  );
}

// ── Pagination ────────────────────────────────────────────────────────
const PAGE_SIZE = 8;

function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  const visible = pages.filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1);
  const items = [];
  visible.forEach((p, i) => {
    if (i > 0 && p - visible[i - 1] > 1) items.push("…");
    items.push(p);
  });

  return (
    <div className="flex items-center justify-center gap-1.5 py-4 px-6 border-t border-slate-100 dark:border-slate-800">
      <button onClick={() => onChange(page - 1)} disabled={page === 1}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
        <ChevronLeft className="h-4 w-4" />
      </button>
      {items.map((item, i) =>
        item === "…" ? (
          <span key={`e${i}`} className="px-1 text-xs text-slate-400 select-none">…</span>
        ) : (
          <button key={item} onClick={() => onChange(item)}
            className={cn("flex h-8 w-8 items-center justify-center rounded-lg text-sm font-semibold transition-colors",
              item === page
                ? "bg-violet-600 text-white shadow-sm"
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

// ── Main page ─────────────────────────────────────────────────────────
const SORT_OPTIONS = [
  { value: "default",    label: "Default Order" },
  { value: "ts-asc",    label: "Time: Oldest First" },
  { value: "ts-desc",   label: "Time: Newest First" },
  { value: "sev-desc",  label: "Severity: High → Low" },
  { value: "sev-asc",   label: "Severity: Low → High" },
];

export default function AnalysisPage({ analysis }) {
  const sev      = analysis?.summary?.severity || {};
  const timeline = analysis?.summary?.timeline || [];
  const keywords = analysis?.summary?.top_keywords || [];
  const preview  = analysis?.processed_preview || [];
  const total    = analysis?.total_logs ?? null;

  const [page,          setPage]          = useState(1);
  const [filterLevel,   setFilterLevel]   = useState("ALL");
  const [sortKey,       setSortKey]       = useState("default");
  const [sortOpen,      setSortOpen]      = useState(false);
  const [selectedLog,   setSelectedLog]   = useState(null);

  // ── Counts come from the backend summary (covers ALL logs, not just the preview) ──
  const counts = {
    ERROR:   sev.ERROR   ?? 0,
    WARNING: sev.WARNING ?? 0,
    INFO:    sev.INFO    ?? 0,
  };

  // ── Apply filter + sort ──
  const processed = useMemo(() => {
    let rows = [...preview];

    // Filter
    if (filterLevel !== "ALL") {
      rows = rows.filter(r => detectLevel(r.raw) === filterLevel);
    }

    // Sort
    if (sortKey === "ts-asc")   rows.sort((a, b) => (a.timestamp || "").localeCompare(b.timestamp || ""));
    if (sortKey === "ts-desc")  rows.sort((a, b) => (b.timestamp || "").localeCompare(a.timestamp || ""));
    if (sortKey === "sev-desc") rows.sort((a, b) => SEVERITY_ORDER[detectLevel(b.raw)] - SEVERITY_ORDER[detectLevel(a.raw)]);
    if (sortKey === "sev-asc")  rows.sort((a, b) => SEVERITY_ORDER[detectLevel(a.raw)] - SEVERITY_ORDER[detectLevel(b.raw)]);

    return rows;
  }, [preview, filterLevel, sortKey]);

  const totalPages = Math.max(1, Math.ceil(processed.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const start      = (safePage - 1) * PAGE_SIZE;
  const pageItems  = processed.slice(start, start + PAGE_SIZE);

  const handleFilter = (level) => {
    setFilterLevel(level);
    setPage(1);
  };

  const handleSort = (key) => {
    setSortKey(key);
    setSortOpen(false);
    setPage(1);
  };

  const handlePageChange = (p) => {
    setPage(p);
    document.getElementById("log-entries-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const currentSortLabel = SORT_OPTIONS.find(o => o.value === sortKey)?.label ?? "Sort";
  const isFiltered = filterLevel !== "ALL";
  const isSorted   = sortKey    !== "default";

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">

      {/* ── Page header ── */}
      <motion.div variants={fadeUp} className="rounded-2xl border border-slate-200/60 bg-white/75 p-5 shadow-soft backdrop-blur-xl dark:border-slate-800/50 dark:bg-slate-900/50">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-soft">
            <BarChart3 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-slate-900 dark:text-white">Log Analysis</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              NLP-powered clustering and severity insights from your uploaded cloud logs
            </p>
          </div>
        </div>
      </motion.div>

      {/* ── Stats row ── */}
      <motion.section variants={fadeUp} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard label="Total Logs" value={total}            icon={CheckCircle2}  tone="info"   />
        <StatsCard label="Errors"     value={sev.ERROR   ?? 0} icon={Bug}           tone="danger" />
        <StatsCard label="Warnings"   value={sev.WARNING ?? 0} icon={AlertTriangle} tone="warn"   />
        <StatsCard label="Clusters"
          value={Object.keys(analysis?.summary?.cluster_distribution ?? {}).length || 0}
          icon={Hash} tone="slate" />
      </motion.section>



      {/* ── Processed Log Entries ── */}
      <motion.section
        id="log-entries-section"
        variants={fadeUp}
        className="overflow-visible rounded-2xl border border-slate-200/60 bg-white/75 shadow-soft backdrop-blur-xl dark:border-slate-800/50 dark:bg-slate-900/50"
      >

        {/* Section header */}
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-violet-50 dark:bg-violet-950/30">
              <Code2 className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">Processed Log Entries</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Each event with its raw source and auto-generated NLP explanation
              </p>
            </div>
          </div>
          {processed.length > 0 && (
            <span className="flex-shrink-0 self-center rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300 tabular-nums">
              {start + 1}–{Math.min(start + PAGE_SIZE, processed.length)} of {processed.length}
            </span>
          )}
        </div>

        {/* ─── Filter + Sort toolbar ─── */}
        {preview.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30 px-6 py-3">

            {/* Filter pills */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 select-none">
                <Filter className="h-3 w-3" />
                Filter
              </span>

              {["ALL", "ERROR", "WARNING", "INFO"].map((lvl) => {
                const isActive = filterLevel === lvl;
                const count    = lvl === "ALL" ? preview.length : counts[lvl] ?? 0;
                const t        = lvl !== "ALL" ? SEV[lvl] : null;

                return (
                  <button
                    key={lvl}
                    onClick={() => handleFilter(lvl)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-md border px-3 py-1 text-[11px] font-semibold transition-all duration-150",
                      lvl === "ALL"
                        ? isActive
                          ? "bg-slate-700 text-white border-slate-700 dark:bg-slate-200 dark:text-slate-900 dark:border-slate-200"
                          : "border-slate-300 text-slate-600 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                        : isActive
                          ? t.filterActive
                          : t.filterIdle
                    )}
                  >
                    {lvl !== "ALL" && (
                      <span className={cn("h-1.5 w-1.5 rounded-full", t.dot)} />
                    )}
                    {lvl}
                    <span className={cn(
                      "rounded px-1 py-0.5 text-[10px] font-bold tabular-nums",
                      isActive ? "bg-white/20 text-inherit" : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
                    )}>
                      {count}
                    </span>
                  </button>
                );
              })}

              {/* Clear filter */}
              {isFiltered && (
                <button onClick={() => handleFilter("ALL")}
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                  <X className="h-3 w-3" />
                  Clear
                </button>
              )}
            </div>

            {/* Sort dropdown */}
            <div className="relative">
              <button
                onClick={() => setSortOpen(!sortOpen)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-[11px] font-semibold transition-colors",
                  isSorted
                    ? "border-violet-400 bg-violet-50 text-violet-700 dark:border-violet-700 dark:bg-violet-950/30 dark:text-violet-300"
                    : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                )}
              >
                <ArrowUpDown className="h-3.5 w-3.5" />
                {currentSortLabel}
                {isSorted && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleSort("default"); }}
                    className="ml-1 text-violet-400 hover:text-violet-600"
                    aria-label="Clear sort"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </button>

              <AnimatePresence>
                {sortOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -4 }}
                    transition={{ duration: 0.12 }}
                    className="absolute right-0 top-full z-50 mt-1.5 w-52 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl"
                  >
                    <p className="px-3 pt-2.5 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      Sort By
                    </p>
                    {SORT_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => handleSort(opt.value)}
                        className={cn(
                          "flex w-full items-center gap-2.5 px-3 py-2 text-[12px] text-left transition-colors",
                          sortKey === opt.value
                            ? "bg-violet-50 dark:bg-violet-950/30 font-semibold text-violet-700 dark:text-violet-300"
                            : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                        )}
                      >
                        {opt.value.includes("asc")  && !opt.value.includes("ts") && <ArrowUp   className="h-3 w-3 flex-shrink-0 opacity-60" />}
                        {opt.value.includes("desc") && !opt.value.includes("ts") && <ArrowDown  className="h-3 w-3 flex-shrink-0 opacity-60" />}
                        {opt.value.includes("ts")   && <Clock      className="h-3 w-3 flex-shrink-0 opacity-60" />}
                        {opt.value === "default"    && <ArrowUpDown className="h-3 w-3 flex-shrink-0 opacity-60" />}
                        {opt.label}
                        {sortKey === opt.value && (
                          <span className="ml-auto h-1.5 w-1.5 rounded-full bg-violet-500" />
                        )}
                      </button>
                    ))}
                    <div className="pb-1.5" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Column labels strip */}
        {processed.length > 0 && (
          <div className="hidden md:grid md:grid-cols-2 gap-3 border-b border-slate-100 dark:border-slate-800 px-8 py-2 bg-slate-50/40 dark:bg-slate-800/20">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 pl-4">Raw Log Entry</span>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-violet-500 dark:text-violet-400">NLP Explanation</span>
          </div>
        )}

        {/* Entries */}
        {preview.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-6">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800/60">
              <BarChart3 className="h-6 w-6 text-slate-400 dark:text-slate-500" />
            </div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No log data to display</p>
            <p className="mt-1.5 max-w-xs text-xs leading-relaxed text-slate-400 dark:text-slate-500">
              Go to <span className="font-semibold text-slate-600 dark:text-slate-300">Upload Logs</span> and submit a{" "}
              <code className="rounded bg-slate-100 dark:bg-slate-800 px-1 py-0.5 font-mono text-[10px]">.log</code> or{" "}
              <code className="rounded bg-slate-100 dark:bg-slate-800 px-1 py-0.5 font-mono text-[10px]">.txt</code> file.
            </p>
          </div>
        ) : processed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-center px-6">
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">No entries match the current filter</p>
            <button onClick={() => handleFilter("ALL")}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
              <X className="h-3.5 w-3.5" />
              Clear Filter
            </button>
          </div>
        ) : (
          <>
            <div className="p-4 sm:p-6">
              <ul className="flex flex-col gap-4">
                <AnimatePresence mode="wait">
                  {pageItems.map((row, i) => (
                    <LogEntryCard
                      key={`${row.timestamp}-${start + i}-${filterLevel}-${sortKey}`}
                      row={row}
                      globalIdx={start + i}
                      onAnalyze={setSelectedLog}
                    />
                  ))}
                </AnimatePresence>
              </ul>
            </div>
            <Pagination page={safePage} totalPages={totalPages} onChange={handlePageChange} />
          </>
        )}

      </motion.section>

      {selectedLog && (
        <LogDetailModal incident={selectedLog} onClose={() => setSelectedLog(null)} />
      )}

    </motion.div>
  );
}
