import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn, formatNumber } from "../lib/utils";

const toneConfig = {
  slate: {
    card: "from-slate-500/8 to-slate-500/0 ring-slate-500/15",
    icon: "from-slate-500 to-slate-600",
    glow: "shadow-soft",
    label: "text-slate-500 dark:text-slate-400",
    value: "text-slate-900 dark:text-white",
  },
  info: {
    card: "from-sky-500/10 to-sky-500/0 ring-sky-500/20",
    icon: "from-sky-500 to-blue-600",
    glow: "shadow-[0_0_20px_rgba(14,165,233,0.2)]",
    label: "text-sky-600 dark:text-sky-400",
    value: "text-slate-900 dark:text-white",
  },
  warn: {
    card: "from-amber-500/12 to-amber-500/0 ring-amber-500/20",
    icon: "from-amber-500 to-orange-600",
    glow: "shadow-[0_0_20px_rgba(245,158,11,0.2)]",
    label: "text-amber-600 dark:text-amber-400",
    value: "text-slate-900 dark:text-white",
  },
  danger: {
    card: "from-rose-500/12 to-rose-500/0 ring-rose-500/20",
    icon: "from-rose-500 to-red-600",
    glow: "shadow-[0_0_20px_rgba(239,68,68,0.25)]",
    label: "text-rose-600 dark:text-rose-400",
    value: "text-slate-900 dark:text-white",
  },
  success: {
    card: "from-emerald-500/12 to-emerald-500/0 ring-emerald-500/20",
    icon: "from-emerald-500 to-green-600",
    glow: "shadow-[0_0_20px_rgba(16,185,129,0.2)]",
    label: "text-emerald-600 dark:text-emerald-400",
    value: "text-slate-900 dark:text-white",
  },
};

function useCountUp(target, duration = 800) {
  const [count, setCount] = useState(0);
  const targetNum = Number(target) || 0;
  const frameRef = useRef(null);

  useEffect(() => {
    if (targetNum === 0) { setCount(0); return; }
    const start = performance.now();
    const step = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * targetNum));
      if (progress < 1) frameRef.current = requestAnimationFrame(step);
    };
    frameRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameRef.current);
  }, [targetNum, duration]);

  return count;
}

export default function StatsCard({
  label,
  value,
  icon: Icon,
  tone = "slate",
  suffix,
  hint,
  trend, // 'up' | 'down' | 'flat'
  trendLabel,
}) {
  const cfg = toneConfig[tone] || toneConfig.slate;
  const count = useCountUp(value);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white/75",
        "dark:border-slate-800/50 dark:bg-slate-900/50",
        "backdrop-blur-xl p-5",
        "ring-1 bg-gradient-to-br",
        "transition-all duration-300",
        cfg.card,
        cfg.glow
      )}
    >
      {/* Background pattern */}
      <div className="pointer-events-none absolute -right-4 -top-4 h-20 w-20 rounded-full opacity-5 bg-gradient-to-br from-current to-transparent blur-2xl" />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className={cn("text-[11px] font-semibold uppercase tracking-widest", cfg.label)}>
            {label}
          </div>

          <div className={cn("mt-2 text-3xl font-extrabold tabular-nums tracking-tight", cfg.value)}>
            {count !== undefined && count !== null ? formatNumber(count) : "—"}
            {suffix && (
              <span className="ml-1 text-lg font-bold text-slate-400 dark:text-slate-500">
                {suffix}
              </span>
            )}
          </div>

          {hint && (
            <div className="mt-1.5 text-xs text-slate-400 dark:text-slate-500 font-medium">
              {hint}
            </div>
          )}

          {trend && trendLabel && (
            <div className="mt-2 flex items-center gap-1.5">
              {trend === "up" && <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />}
              {trend === "down" && <TrendingDown className="h-3.5 w-3.5 text-rose-500" />}
              {trend === "flat" && <Minus className="h-3.5 w-3.5 text-slate-400" />}
              <span className={cn(
                "text-xs font-semibold",
                trend === "up" && "text-emerald-600 dark:text-emerald-400",
                trend === "down" && "text-rose-600 dark:text-rose-400",
                trend === "flat" && "text-slate-400",
              )}>
                {trendLabel}
              </span>
            </div>
          )}
        </div>

        {Icon && (
          <div className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
            "bg-gradient-to-br text-white shadow-soft",
            "transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3",
            cfg.icon
          )}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </motion.div>
  );
}
