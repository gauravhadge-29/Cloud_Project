import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from "lucide-react";
import { cn } from "../lib/utils";

const ToastCtx = createContext(null);

const CONFIGS = {
  success: {
    icon: CheckCircle2,
    bar: "from-emerald-500 to-green-500",
    badge: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-200/60 dark:border-emerald-800/40",
    bg: "bg-white dark:bg-slate-900",
    title: "text-emerald-800 dark:text-emerald-200",
  },
  error: {
    icon: XCircle,
    bar: "from-rose-500 to-red-600",
    badge: "bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400",
    border: "border-rose-200/60 dark:border-rose-800/40",
    bg: "bg-white dark:bg-slate-900",
    title: "text-rose-800 dark:text-rose-200",
  },
  warning: {
    icon: AlertTriangle,
    bar: "from-amber-500 to-yellow-500",
    badge: "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
    border: "border-amber-200/60 dark:border-amber-800/40",
    bg: "bg-white dark:bg-slate-900",
    title: "text-amber-800 dark:text-amber-200",
  },
  info: {
    icon: Info,
    bar: "from-sky-500 to-blue-500",
    badge: "bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400",
    border: "border-sky-200/60 dark:border-sky-800/40",
    bg: "bg-white dark:bg-slate-900",
    title: "text-sky-800 dark:text-sky-200",
  },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const push = useCallback((toast) => {
    const id = crypto?.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random());
    const next = { id, type: "info", title: "", message: "", ...toast };
    setToasts((t) => [next, ...t].slice(0, 4));
    window.setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, toast?.durationMs ?? 4000);
  }, []);

  const dismiss = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const api = useMemo(() => ({ push }), [push]);

  return (
    <ToastCtx.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed right-4 top-20 z-[100] flex w-[min(380px,calc(100vw-2rem))] flex-col gap-2">
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => {
            const cfg = CONFIGS[t.type] || CONFIGS.info;
            const Icon = cfg.icon;
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, x: 40, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 40, scale: 0.95 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className={cn(
                  "pointer-events-auto overflow-hidden rounded-2xl border shadow-lift backdrop-blur-xl",
                  cfg.bg,
                  cfg.border
                )}
              >
                {/* Gradient top bar */}
                <div className={cn("h-1 w-full bg-gradient-to-r", cfg.bar)} />

                <div className="flex items-start gap-3 p-4">
                  {/* Icon badge */}
                  <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", cfg.badge)}>
                    <Icon className="h-5 w-5" />
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    {t.title && (
                      <div className={cn("text-sm font-extrabold leading-snug", cfg.title)}>
                        {t.title}
                      </div>
                    )}
                    {t.message && (
                      <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        {t.message}
                      </div>
                    )}
                  </div>

                  {/* Dismiss */}
                  <button
                    type="button"
                    className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    onClick={() => dismiss(t.id)}
                    aria-label="Dismiss"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
