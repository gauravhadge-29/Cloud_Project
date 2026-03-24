import React from "react";
import { motion } from "framer-motion";
import { Menu, Moon, Sun, Bell, RefreshCw, Activity } from "lucide-react";
import { cn } from "../lib/utils";

export default function Navbar({ title, onOpenSidebar, theme, onToggleTheme }) {
  const now = new Date();
  const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  const dateStr = now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-16 items-center justify-between gap-3 px-4",
        "border-b border-slate-200/50 bg-white/75 backdrop-blur-2xl",
        "dark:border-slate-800/50 dark:bg-[#060d14]/80"
      )}
    >
      {/* Left: hamburger + page title */}
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onOpenSidebar}
          className={cn(
            "lg:hidden inline-flex h-9 w-9 items-center justify-center rounded-xl",
            "border border-slate-200/70 bg-white/80 shadow-soft",
            "hover:bg-white dark:border-slate-700/70 dark:bg-slate-800/50 dark:hover:bg-slate-800",
            "transition-colors duration-150"
          )}
          aria-label="Open navigation"
        >
          <Menu className="h-4 w-4 text-slate-600 dark:text-slate-300" />
        </button>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="truncate text-base font-extrabold tracking-tight text-slate-900 dark:text-white">
              {title}
            </h1>
          </div>
          <div className="hidden sm:block truncate text-[11px] text-slate-500 dark:text-slate-400">
            Cloud monitoring • NLP-powered • Real-time analysis
          </div>
        </div>
      </div>

      {/* Center: live indicator */}
      <div className="hidden md:flex items-center gap-6">
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/8 px-3 py-1.5">
          <motion.div
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            className="h-2 w-2 rounded-full bg-emerald-500"
          />
          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">System On</span>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <Activity className="h-3.5 w-3.5" />
          <span className="font-mono font-medium">{timeStr}</span>
          <span className="opacity-50">•</span>
          <span>{dateStr}</span>
        </div>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-2">
        {/* Refresh */}
        <button
          type="button"
          onClick={() => window.location.reload()}
          className={cn(
            "hidden sm:inline-flex h-9 w-9 items-center justify-center rounded-xl",
            "border border-slate-200/70 bg-white/80 shadow-soft",
            "hover:bg-white hover:rotate-180 transition-all duration-300",
            "dark:border-slate-700/70 dark:bg-slate-800/50 dark:hover:bg-slate-800"
          )}
          title="Refresh page"
          aria-label="Refresh"
        >
          <RefreshCw className="h-4 w-4 text-slate-500 dark:text-slate-400" />
        </button>

        {/* Notifications (decorative) */}
        <button
          type="button"
          className={cn(
            "relative hidden sm:inline-flex h-9 w-9 items-center justify-center rounded-xl",
            "border border-slate-200/70 bg-white/80 shadow-soft",
            "hover:bg-white dark:border-slate-700/70 dark:bg-slate-800/50 dark:hover:bg-slate-800",
            "transition-colors duration-150"
          )}
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4 text-slate-500 dark:text-slate-400" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full border-2 border-white bg-rose-500 dark:border-slate-800" />
        </button>

        {/* Theme toggle */}
        <button
          type="button"
          onClick={onToggleTheme}
          className={cn(
            "inline-flex h-9 w-9 items-center justify-center rounded-xl",
            "border border-slate-200/70 bg-white/80 shadow-soft",
            "hover:bg-white dark:border-slate-700/70 dark:bg-slate-800/50 dark:hover:bg-slate-800",
            "transition-all duration-200"
          )}
          aria-label="Toggle dark mode"
        >
          <motion.div
            key={theme}
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            transition={{ duration: 0.25 }}
          >
            {theme === "dark"
              ? <Sun className="h-4 w-4 text-amber-500" />
              : <Moon className="h-4 w-4 text-slate-500" />
            }
          </motion.div>
        </button>

        {/* User avatar */}
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-emerald-500 text-xs font-extrabold text-white shadow-soft shrink-0">
          CL
        </div>
      </div>
    </header>
  );
}
