import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ScrollText, ChevronLeft, ChevronRight } from "lucide-react";
import SummaryCard from "../components/SummaryCard";
import { cn } from "../lib/utils";

const PAGE_SIZE = 6;

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
    <div className="flex items-center justify-center gap-1.5 pt-4 border-t border-slate-100 dark:border-slate-800 mt-4">
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
                ? "bg-emerald-600 text-white shadow-sm"
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

export default function SummariesPage({ latestAnalysis }) {
  const [page, setPage] = useState(1);

  const incidentCards = useMemo(() => {
    const inc        = latestAnalysis?.summary?.prioritized_incidents || [];
    const narratives = latestAnalysis?.summary?.incident_narratives   || [];
    return inc.map((x, i) => ({ item: x, narrative: narratives[i] }));
  }, [latestAnalysis]);

  const totalPages = Math.max(1, Math.ceil(incidentCards.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const start      = (safePage - 1) * PAGE_SIZE;
  const pageItems  = incidentCards.slice(start, start + PAGE_SIZE);

  const handlePageChange = (p) => {
    setPage(p);
    document.getElementById("summaries-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-slate-200/60 bg-white/75 p-5 shadow-soft backdrop-blur-xl dark:border-slate-800/50 dark:bg-slate-900/50"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-glow-green">
            <ScrollText className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-slate-900 dark:text-white">Summaries</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              NLP-generated summaries for all prioritized incidents
            </p>
          </div>
        </div>
      </motion.div>

      {/* Incident narrative cards */}
      <motion.section
        id="summaries-section"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="rounded-2xl border border-slate-200/60 bg-white/75 p-5 shadow-soft backdrop-blur-xl dark:border-slate-800/50 dark:bg-slate-900/50"
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="text-sm font-extrabold text-slate-900 dark:text-white">
              Incident Narratives
            </div>
            <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Expand a card for the full NLP summary, source log, and recommended action
            </div>
          </div>
          {incidentCards.length > 0 && (
            <span className="rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300 tabular-nums">
              {start + 1}–{Math.min(start + PAGE_SIZE, incidentCards.length)} of {incidentCards.length}
            </span>
          )}
        </div>

        {incidentCards.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-center text-slate-400 dark:text-slate-500">
            <ScrollText className="h-10 w-10 mb-3 opacity-30" />
            <div className="text-sm font-semibold">No summaries yet</div>
            <div className="text-xs mt-1 opacity-70">Upload a log file to generate incident narratives</div>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <AnimatePresence mode="wait">
                {pageItems.map(({ item, narrative }, idx) => (
                  <SummaryCard key={`${item.timestamp}-${start + idx}`} item={item} narrative={narrative} />
                ))}
              </AnimatePresence>
            </div>
            <Pagination page={safePage} totalPages={totalPages} onChange={handlePageChange} />
          </>
        )}
      </motion.section>

    </div>
  );
}
