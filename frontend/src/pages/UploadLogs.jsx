import React from "react";
import { motion } from "framer-motion";
import LogUpload from "../components/LogUpload";
import { Upload, FileText, Zap, Database } from "lucide-react";

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
};

const STEPS = [
  { icon: Upload,    color: "from-cyan-500 to-blue-500",    title: "Upload",   desc: "Drop .log or .txt file" },
  { icon: Zap,       color: "from-violet-500 to-purple-600",title: "Process",  desc: "NLP pipeline runs" },
  { icon: FileText,  color: "from-emerald-500 to-green-600",title: "Summarize",desc: "Incidents narrated" },
  { icon: Database,  color: "from-amber-500 to-orange-500", title: "Store",    desc: "Results persisted" },
];

export default function UploadLogsPage({ onAnalyzed }) {
  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={fadeUp} className="rounded-2xl border border-slate-200/60 bg-white/75 p-6 shadow-soft backdrop-blur-xl dark:border-slate-800/50 dark:bg-slate-900/50">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-emerald-500 shadow-glow">
            <Upload className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-slate-900 dark:text-white">Upload Logs</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">NLP-powered analysis in seconds</p>
          </div>
        </div>

        {/* Pipeline steps */}
        <div className="flex flex-wrap gap-3">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={step.title} className="flex items-center gap-2">
                <div className={`flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br ${step.color} text-white`}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-200">{step.title}</div>
                  <div className="text-[10px] text-slate-400 dark:text-slate-500">{step.desc}</div>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="mx-1 hidden sm:block text-slate-300 dark:text-slate-600">→</div>
                )}
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Upload area */}
      <motion.div variants={fadeUp} className="rounded-2xl border border-slate-200/60 bg-white/75 p-6 shadow-soft backdrop-blur-xl dark:border-slate-800/50 dark:bg-slate-900/50">
        <div className="flex items-center justify-between gap-3 mb-5">
          <div>
            <div className="text-sm font-extrabold text-slate-900 dark:text-white">Select Log File</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Drag &amp; drop or click to browse • .log, .txt • Max 50 MB
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Pipeline ready
          </span>
        </div>
        <LogUpload onAnalyzed={onAnalyzed} />
      </motion.div>

      {/* Tips */}
      <motion.div variants={fadeUp} className="rounded-2xl border border-slate-200/60 bg-gradient-to-br from-slate-50 to-cyan-50/30 p-5 dark:border-slate-800/50 dark:from-slate-900/50 dark:to-cyan-950/10">
        <div className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3">Supported formats</div>
        <div className="grid gap-2 sm:grid-cols-2">
          {[
            { fmt: ".log", desc: "Standard application or server log files" },
            { fmt: ".txt", desc: "Plain text log exports and dumps" },
          ].map((f) => (
            <div key={f.fmt} className="flex items-center gap-2 rounded-xl bg-white/60 dark:bg-slate-800/40 px-3 py-2">
              <span className="font-mono text-xs font-bold text-cyan-600 dark:text-cyan-400">{f.fmt}</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">{f.desc}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
