import React from "react";
import { NavLink } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Upload,
  BarChart3,
  ScrollText,
  BellRing,
  Settings2,
  CloudLightning,
  X,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";
import { cn } from "../lib/utils";

const nav = [
  {
    group: "Overview",
    items: [
      { to: "/",          label: "Dashboard",     icon: LayoutDashboard, end: true, dot: "green" },
      { to: "/upload",    label: "Upload Logs",   icon: Upload },
    ],
  },
  {
    group: "Analytics",
    items: [
      { to: "/analysis",  label: "Log Analysis",        icon: BarChart3 },
      { to: "/security",  label: "Security Incidents",  icon: ShieldAlert, badge: "New" },
      { to: "/summaries", label: "Summaries",           icon: ScrollText },
      { to: "/alerts",    label: "System Alerts",       icon: BellRing, badge: "Live" },
    ],
  },

  {
    group: "System",
    items: [
      { to: "/settings",  label: "Settings",      icon: Settings2 },
    ],
  },
];

export default function Sidebar({ isOpen, onClose }) {
  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden"
            onClick={onClose}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-dvh w-72 flex flex-col",
          "border-r border-slate-200/50 bg-white/80 backdrop-blur-2xl",
          "dark:border-slate-800/50 dark:bg-[#060d14]/95",
          "transition-transform duration-300 ease-in-out lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Header / Logo */}
        <div className="relative flex h-16 items-center justify-between gap-3 px-5 border-b border-slate-200/50 dark:border-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-emerald-500 shadow-glow shrink-0">
              <CloudLightning className="h-5 w-5 text-white" strokeWidth={2.5} />
              <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-400 dark:border-[#060d14]" />
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-extrabold tracking-tight text-slate-900 dark:text-white">
                CloudLog<span className="text-gradient">NLP</span>
              </div>
              <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Monitoring Suite
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="lg:hidden inline-flex h-8 w-8 items-center justify-center rounded-xl hover:bg-slate-900/5 dark:hover:bg-white/5"
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4 text-slate-500" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto no-scrollbar px-3 py-4 space-y-6">
          {nav.map(({ group, items }) => (
            <div key={group}>
              <div className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                {group}
              </div>
              <ul className="space-y-0.5">
                {items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.to}>
                      <NavLink
                        to={item.to}
                        end={item.end}
                        onClick={() => onClose?.()}
                        className={({ isActive }) =>
                          cn(
                            "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-150",
                            isActive
                              ? [
                                  "bg-gradient-to-r from-cyan-500/15 to-emerald-500/10",
                                  "text-cyan-700 dark:text-cyan-300",
                                  "ring-1 ring-cyan-500/25 dark:ring-cyan-500/20",
                                ]
                              : [
                                  "text-slate-600 dark:text-slate-400",
                                  "hover:bg-slate-900/5 hover:text-slate-900",
                                  "dark:hover:bg-white/5 dark:hover:text-white",
                                ]
                          )
                        }
                      >
                        {({ isActive }) => (
                          <>
                            <div
                              className={cn(
                                "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all",
                                isActive
                                  ? "bg-gradient-to-br from-cyan-500 to-emerald-500 text-white shadow-glow"
                                  : "bg-slate-100 text-slate-500 group-hover:bg-slate-200 dark:bg-slate-800/60 dark:text-slate-400 dark:group-hover:bg-slate-700/60"
                              )}
                            >
                              <Icon className="h-4 w-4" />
                            </div>
                            <span className="flex-1 truncate">{item.label}</span>
                            {item.badge && (
                              <span className="inline-flex items-center rounded-full bg-rose-500/15 px-1.5 py-0.5 text-[10px] font-bold text-rose-600 dark:bg-rose-500/20 dark:text-rose-400">
                                {item.badge}
                              </span>
                            )}
                            {item.dot === "green" && (
                              <span className="flex h-2 w-2 shrink-0">
                                <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-emerald-400 opacity-75" />
                                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                              </span>
                            )}
                            {isActive && (
                              <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-60" />
                            )}
                          </>
                        )}
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-4 pb-5 pt-3 border-t border-slate-200/50 dark:border-slate-800/50">
          <div className="rounded-xl bg-gradient-to-br from-cyan-500/10 to-emerald-500/10 border border-cyan-500/20 dark:border-cyan-500/15 p-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-cyan-700 dark:text-cyan-400">Pipeline Active</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Upload logs to detect incidents & generate NLP summaries.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
