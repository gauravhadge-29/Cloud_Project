import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Save, Settings2, Server, Link as LinkIcon, Info } from "lucide-react";
import { getApiBase } from "../lib/api";
import { getStoredApiBase, setStoredApiBase } from "../lib/storage";
import { useToast } from "../components/Toast";

export default function SettingsPage() {
  const { push } = useToast();
  const [apiBase, setApiBase] = useState(getStoredApiBase() || "");
  const effective = useMemo(() => getApiBase(), [apiBase]);

  const save = () => {
    setStoredApiBase(apiBase.trim());
    push({ type: "success", title: "Settings saved", message: "API base URL updated successfully." });
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
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-slate-600 to-slate-800 shadow-soft">
            <Settings2 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-slate-900 dark:text-white">Settings</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Configure runtime options and backend connection</p>
          </div>
        </div>
      </motion.div>

      {/* API Base URL */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="rounded-2xl border border-slate-200/60 bg-white/75 p-5 shadow-soft backdrop-blur-xl dark:border-slate-800/50 dark:bg-slate-900/50"
      >
        <div className="flex items-center gap-2 mb-4">
          <Server className="h-4 w-4 text-cyan-500" />
          <div className="text-sm font-extrabold text-slate-900 dark:text-white">Backend API Configuration</div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
              API Base URL
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[240px]">
                <LinkIcon className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  value={apiBase}
                  onChange={(e) => setApiBase(e.target.value)}
                  placeholder="http://localhost:8000"
                  className="w-full rounded-xl border border-slate-200/70 bg-white/80 py-2.5 pl-9 pr-3 text-sm text-slate-800 shadow-soft outline-none focus:ring-2 focus:ring-cyan-500/30 dark:border-slate-800/50 dark:bg-slate-950/50 dark:text-slate-100 font-mono"
                />
              </div>
              <button type="button" onClick={save} className="btn-primary shrink-0">
                <Save className="h-4 w-4" />
                Save
              </button>
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-xl bg-slate-50/80 dark:bg-slate-950/30 border border-slate-200/50 dark:border-slate-800/50 p-3">
            <Info className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
              <p>Leave blank to use <code className="rounded bg-slate-200 dark:bg-slate-800 px-1 py-0.5 font-mono text-[10px]">REACT_APP_API_BASE</code> env var, or fall back to <code className="rounded bg-slate-200 dark:bg-slate-800 px-1 py-0.5 font-mono text-[10px]">http://localhost:8000</code></p>
              <p>Effective URL: <code className="rounded bg-cyan-100 dark:bg-cyan-950/30 text-cyan-700 dark:text-cyan-400 px-1 py-0.5 font-mono text-[10px]">{effective}</code></p>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Display settings */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl border border-slate-200/60 bg-white/75 p-5 shadow-soft backdrop-blur-xl dark:border-slate-800/50 dark:bg-slate-900/50"
      >
        <div className="flex items-center gap-2 mb-4">
          <Settings2 className="h-4 w-4 text-emerald-500" />
          <div className="text-sm font-extrabold text-slate-900 dark:text-white">Display Settings</div>
        </div>

        <div className="space-y-3">
          {[
            { label: "Dark mode", desc: "Toggle from the top navigation bar (moon/sun icon)", value: null },
            { label: "Max preview rows", desc: "Analysis page shows up to 6 preprocessed examples", value: "6" },
            { label: "Max incidents shown", desc: "Dashboard shows top 3 incidents; Summaries page shows up to 6", value: "3 / 6" },
          ].map((opt) => (
            <div key={opt.label} className="flex items-center justify-between gap-4 py-2 border-b border-slate-100 dark:border-slate-800/50 last:border-0">
              <div>
                <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">{opt.label}</div>
                <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{opt.desc}</div>
              </div>
              {opt.value && (
                <span className="shrink-0 rounded-lg bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-xs font-mono font-bold text-slate-600 dark:text-slate-400">
                  {opt.value}
                </span>
              )}
            </div>
          ))}
        </div>
      </motion.section>

      {/* About */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="rounded-2xl border border-cyan-200/50 bg-gradient-to-br from-cyan-50/60 to-emerald-50/60 p-5 dark:border-cyan-800/30 dark:from-cyan-950/20 dark:to-emerald-950/20"
      >
        <div className="text-xs font-semibold text-cyan-700 dark:text-cyan-400 uppercase tracking-wider mb-2">About</div>
        <div className="text-sm font-bold text-slate-800 dark:text-slate-200">Cloud Log Summarization System Using NLP</div>
        <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Drag-and-drop log analysis powered by TF-IDF, k-means clustering, and narrative generation.
          Inspired by AWS CloudWatch &amp; Datadog.
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {["React", "Tailwind CSS", "Framer Motion", "Recharts", "FastAPI"].map((tech) => (
            <span key={tech} className="rounded-full border border-slate-200/60 dark:border-slate-700/60 bg-white/60 dark:bg-slate-900/40 px-2.5 py-0.5 text-[10px] font-semibold text-slate-600 dark:text-slate-400">
              {tech}
            </span>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
