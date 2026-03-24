import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CloudLightning, ArrowLeft, Home } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="space-y-6"
      >
        {/* Icon */}
        <div className="flex justify-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 border border-cyan-500/20">
            <CloudLightning className="h-12 w-12 text-cyan-500" />
          </div>
        </div>

        {/* Text */}
        <div>
          <div className="text-6xl font-black text-gradient tabular-nums">404</div>
          <h1 className="mt-2 text-xl font-extrabold text-slate-800 dark:text-slate-100">Page not found</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
            This route doesn't exist in the monitoring dashboard.
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-center gap-3">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="btn-secondary text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Go back
          </button>
          <Link to="/" className="btn-primary text-sm">
            <Home className="h-4 w-4" />
            Dashboard
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
