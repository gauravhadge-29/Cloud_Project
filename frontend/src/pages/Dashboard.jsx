import React, { useMemo } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle, BadgeInfo, Bug, CheckCircle2, ShieldAlert,
  TrendingUp, Layers, ArrowRight, Activity, RefreshCw
} from "lucide-react";
import StatsCard from "../components/StatsCard";

import SummaryCard from "../components/SummaryCard";
import { formatNumber } from "../lib/utils";
import { Link } from "react-router-dom";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
};

export default function DashboardPage({ analysis }) {
  const severity  = analysis?.summary?.severity || {};
  const prioritized = analysis?.summary?.prioritized_incidents || [];
  const narratives  = analysis?.summary?.incident_narratives || [];
  const timeline    = analysis?.summary?.timeline || [];
  const keywords    = analysis?.summary?.top_keywords || [];
  const clusters    = Object.keys(analysis?.summary?.cluster_distribution || {}).length;

  const anomalies = useMemo(() => {
    const err  = Number(severity.ERROR   || 0);
    const warn = Number(severity.WARNING || 0);
    return err > 0 ? Math.min(6, err) : warn > 3 ? 1 : 0;
  }, [severity]);

  const hasData = !!analysis;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">

      {/* ── Hero banner ─────────────────────────────────── */}
      <motion.div variants={item}>
        <div className="relative overflow-hidden rounded-2xl border border-cyan-500/20 bg-gradient-to-r from-cyan-600 via-cyan-500 to-emerald-500 p-6 shadow-glow">
          {/* Background decoration */}
          <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-8 left-1/3 h-32 w-32 rounded-full bg-emerald-400/20 blur-2xl" />

          <div className="relative flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Activity className="h-4 w-4 text-cyan-200" />
                <span className="text-xs font-semibold text-cyan-100 uppercase tracking-wider">Cloud Monitoring Dashboard</span>
              </div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight">
                Cloud Log Summarization
              </h1>
              <p className="mt-1 text-sm text-cyan-100 max-w-lg">
                NLP-powered log analysis with TF-IDF, clustering &amp; incident narrative generation.
                {hasData
                  ? ` Last run: ${formatNumber(analysis?.total_logs)} logs processed.`
                  : " Upload logs to get started."}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {hasData ? (
                <span className="inline-flex items-center gap-2 rounded-xl bg-white/20 backdrop-blur-sm px-4 py-2 text-sm font-bold text-white border border-white/30">
                  <CheckCircle2 className="h-4 w-4" />
                  Analysis ready
                </span>
              ) : (
                <Link
                  to="/upload"
                  className="inline-flex items-center gap-2 rounded-xl bg-white/20 backdrop-blur-sm px-4 py-2 text-sm font-bold text-white border border-white/30 hover:bg-white/30 transition-colors"
                >
                  Upload Logs
                  <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Stats grid ──────────────────────────────────── */}
      <motion.section variants={item} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatsCard
          label="Total Logs"
          value={analysis?.total_logs}
          icon={CheckCircle2}
          tone="info"
          trend={hasData ? "up" : undefined}
          trendLabel={hasData ? "Processed" : undefined}
        />
        <StatsCard label="Errors"    value={severity.ERROR   || 0} icon={Bug}         tone="danger"  hint={severity.ERROR > 0 ? "Requires attention" : undefined} />
        <StatsCard label="Warnings"  value={severity.WARNING || 0} icon={AlertTriangle} tone="warn"  />
        <StatsCard label="Info Logs" value={severity.INFO    || 0} icon={BadgeInfo}   tone="slate"   />
        <StatsCard
          label="Anomalies"
          value={anomalies}
          icon={ShieldAlert}
          tone={anomalies > 0 ? "danger" : "success"}
          hint={anomalies > 0 ? "Heuristic: error/warn density" : "No anomaly signal"}
        />
      </motion.section>



      {/* ── Executive summary + top incidents ───────────── */}
      <motion.section variants={item} className="grid gap-4 lg:grid-cols-2">

        {/* Executive summary */}
        <div className="rounded-2xl border border-slate-200/60 bg-white/75 p-5 shadow-soft backdrop-blur-xl dark:border-slate-800/50 dark:bg-slate-900/50">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <div className="text-sm font-extrabold text-slate-900 dark:text-white">Executive Summary</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">NLP-generated incident overview</div>
            </div>
            <div className="flex items-center gap-1.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/60 px-3 py-1.5">
              <Layers className="h-3.5 w-3.5 text-slate-500" />
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                {clusters} cluster{clusters !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            {analysis?.summary?.executive_summary ||
             analysis?.summary?.summary_text ||
             "Upload a log file to generate an AI-powered executive summary with incident clusters and root-cause narratives."}
          </p>

          {hasData && (
            <Link
              to="/analysis"
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:underline"
            >
              View full analysis <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>

        {/* Top incidents */}
        <div className="rounded-2xl border border-slate-200/60 bg-white/75 p-5 shadow-soft backdrop-blur-xl dark:border-slate-800/50 dark:bg-slate-900/50">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <div className="text-sm font-extrabold text-slate-900 dark:text-white">Top Incidents</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Prioritized by severity</div>
            </div>
            {hasData && (
              <Link
                to="/alerts"
                className="inline-flex items-center gap-1 rounded-lg bg-rose-50 dark:bg-rose-950/20 px-2.5 py-1 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/30 transition-colors"
              >
                <TrendingUp className="h-3 w-3" />
                View alerts
              </Link>
            )}
          </div>

          <div className="space-y-2">
            {prioritized.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <RefreshCw className="h-8 w-8 text-slate-300 dark:text-slate-600 mb-2" />
                <div className="text-sm font-semibold text-slate-500 dark:text-slate-400">No incidents yet</div>
                <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">Upload a log file to detect incidents</div>
              </div>
            ) : (
              prioritized.slice(0, 3).map((inc, idx) => (
                <SummaryCard key={`${inc.timestamp}-${idx}`} item={inc} narrative={narratives[idx]} />
              ))
            )}
          </div>
        </div>
      </motion.section>
    </motion.div>
  );
}
