import React, { useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, UploadCloud, CheckCircle2, AlertCircle, X, HardDrive, Clock, Zap } from "lucide-react";
import { uploadLogs } from "../lib/api";
import { cn } from "../lib/utils";
import { useToast } from "./Toast";

function bytesToLabel(bytes) {
  if (!bytes && bytes !== 0) return "—";
  const units = ["B", "KB", "MB", "GB"];
  let n = bytes, i = 0;
  while (n >= 1024 && i < units.length - 1) { n /= 1024; i++; }
  return `${n.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function validate(f) {
  if (!f) return "Select a .txt or .log file.";
  const ext = f.name.split(".").pop()?.toLowerCase();
  if (!["txt", "log"].includes(ext)) return "Unsupported format. Upload .txt or .log files only.";
  if (f.size > 50 * 1024 * 1024) return "File too large. Maximum size is 50 MB.";
  return "";
}

export default function LogUpload({ onAnalyzed }) {
  const inputRef = useRef(null);
  const { push } = useToast();
  const [file, setFile] = useState(null);
  const [drag, setDrag] = useState(false);
  const [progress, setProgress] = useState({ pct: 0, loaded: 0, total: 0 });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const fileMeta = useMemo(() => {
    if (!file) return null;
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    return { ext, size: file.size, name: file.name };
  }, [file]);

  const validationError = file ? validate(file) : null;

  const pick = () => inputRef.current?.click();

  const onDrop = (evt) => {
    evt.preventDefault();
    setDrag(false);
    setDone(false);
    const f = evt.dataTransfer.files?.[0] || null;
    setFile(f);
  };

  const clear = () => {
    setFile(null);
    setDone(false);
    setProgress({ pct: 0, loaded: 0, total: 0 });
  };

  const run = async () => {
    const err = validate(file);
    if (err) { push({ type: "error", title: "Invalid file", message: err }); return; }

    setLoading(true);
    setProgress({ pct: 0, loaded: 0, total: file.size || 0 });
    try {
      const data = await uploadLogs({ file, onProgress: (p) => setProgress(p) });
      onAnalyzed?.(data);
      setDone(true);
      push({ type: "success", title: "Analysis complete", message: "Summaries and charts updated." });
    } catch (e) {
      const message = e?.response?.data?.detail || "Upload failed. Ensure the backend is running.";
      push({ type: "error", title: "Upload failed", message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "relative rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer",
          drag
            ? "border-cyan-500 bg-cyan-500/5 scale-[1.01]"
            : validationError
            ? "border-rose-400/60 bg-rose-50/40 dark:bg-rose-950/10"
            : done
            ? "border-emerald-400/60 bg-emerald-50/40 dark:bg-emerald-950/10"
            : "border-slate-300/60 bg-white/60 dark:border-slate-700/60 dark:bg-slate-900/40",
          "hover:border-cyan-400/60 hover:bg-cyan-50/30 dark:hover:bg-cyan-950/10"
        )}
        onDragEnter={(e) => { e.preventDefault(); setDrag(true); }}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
        role="button"
        tabIndex={0}
        onClick={pick}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " " ? pick() : null)}
        aria-label="Drop log file here"
      >
        <input
          ref={inputRef}
          type="file"
          accept=".txt,.log"
          className="hidden"
          onChange={(e) => { setFile(e.target.files?.[0] || null); setDone(false); }}
        />

        <div className="flex flex-col items-center justify-center gap-4 px-6 py-10 text-center">
          {/* Icon */}
          <motion.div
            animate={drag ? { scale: 1.15, rotate: 5 } : { scale: 1, rotate: 0 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "flex h-16 w-16 items-center justify-center rounded-2xl",
              done
                ? "bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-glow-green"
                : "bg-gradient-to-br from-cyan-500 to-emerald-500 text-white shadow-glow"
            )}
          >
            {done
              ? <CheckCircle2 className="h-8 w-8" strokeWidth={2} />
              : file
              ? <FileText className="h-8 w-8" strokeWidth={1.8} />
              : <UploadCloud className="h-8 w-8" strokeWidth={1.8} />
            }
          </motion.div>

          {/* Text */}
          <div>
            <div className="text-base font-bold text-slate-800 dark:text-slate-100">
              {done
                ? "Analysis complete!"
                : file
                ? fileMeta.name
                : drag
                ? "Release to upload"
                : "Drop your log file here"
              }
            </div>
            <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {done
                ? "Navigate to Analysis or Summaries to view results"
                : file
                ? `${fileMeta.ext?.toUpperCase()} • ${bytesToLabel(fileMeta.size)}`
                : "or click to browse • .log, .txt supported • Max 50 MB"
              }
            </div>
          </div>

          {/* Format badges */}
          {!file && (
            <div className="flex items-center gap-2">
              {[".log", ".txt"].map((ext) => (
                <span key={ext} className="rounded-lg bg-slate-100 dark:bg-slate-800 px-2 py-1 text-xs font-mono font-medium text-slate-600 dark:text-slate-400">
                  {ext}
                </span>
              ))}
            </div>
          )}

          {/* Validation error */}
          {validationError && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-300/50 bg-rose-50 dark:bg-rose-950/20 px-3 py-2 text-xs text-rose-600 dark:text-rose-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {validationError}
            </div>
          )}
        </div>

        {/* Progress overlay */}
        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-6"
            >
              <div className="text-sm font-bold text-slate-700 dark:text-slate-200">
                Processing logs…
              </div>
              <div className="w-full max-w-xs">
                <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                  <span>{bytesToLabel(progress.loaded)} / {bytesToLabel(progress.total)}</span>
                  <span>{progress.pct || 0}%</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, Math.max(0, progress.pct || 0))}%` }}
                    transition={{ duration: 0.3 }}
                    className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* File info card */}
      <AnimatePresence>
        {file && !loading && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-xl border border-slate-200/60 bg-slate-50/80 dark:border-slate-800/50 dark:bg-slate-900/40 p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10">
                  <FileText className="h-4.5 w-4.5 text-cyan-600 dark:text-cyan-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-slate-800 dark:text-slate-200">{file.name}</div>
                  <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    <span className="flex items-center gap-1"><HardDrive className="h-3 w-3" />{bytesToLabel(file.size)}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(file.lastModified).toLocaleDateString()}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); clear(); }}
                  className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400"
                  aria-label="Remove file"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action buttons */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={clear}
          disabled={!file || loading}
          className="btn-ghost disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Clear
        </button>

        <motion.button
          type="button"
          onClick={run}
          disabled={!file || loading || !!validationError}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          className={cn(
            "inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-extrabold text-white",
            "bg-gradient-to-r from-cyan-500 to-emerald-500",
            "hover:from-cyan-400 hover:to-emerald-400",
            "shadow-soft hover:shadow-glow",
            "transition-all duration-200",
            "disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
          )}
        >
          <Zap className="h-4 w-4" />
          {loading ? "Processing…" : "Process Logs"}
        </motion.button>
      </div>
    </div>
  );
}
