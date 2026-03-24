import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BellRing, XOctagon, AlertTriangle, Info,
  ChevronDown, ChevronLeft, ChevronRight,
  Lightbulb, ShieldCheck, FileCode2, Clock, Layers,
} from "lucide-react";
import { cn } from "../lib/utils";

const PAGE_SIZE = 6;

// ── Theme map ─────────────────────────────────────────────────────────
const ALERT_MAP = {
  ERROR: {
    badge:  "badge-error",
    bar:    "bg-rose-500",
    glow:   "shadow-[0_0_12px_rgba(239,68,68,0.15)]",
    border: "border-rose-200/50 dark:border-rose-800/30",
    icon:   XOctagon,
    expl:   "bg-rose-50 border-rose-200 text-rose-900 dark:bg-rose-950/20 dark:border-rose-800/50 dark:text-rose-100",
    iconBg: "bg-rose-100 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400",
    count:  "bg-rose-600 text-white",
  },
  WARNING: {
    badge:  "badge-warning",
    bar:    "bg-amber-500",
    glow:   "shadow-[0_0_12px_rgba(245,158,11,0.12)]",
    border: "border-amber-200/50 dark:border-amber-800/30",
    icon:   AlertTriangle,
    expl:   "bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-950/20 dark:border-amber-800/50 dark:text-amber-100",
    iconBg: "bg-amber-100 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400",
    count:  "bg-amber-500 text-white",
  },
  INFO: {
    badge:  "badge-info",
    bar:    "bg-sky-500",
    glow:   "",
    border: "border-sky-200/50 dark:border-sky-800/30",
    icon:   Info,
    expl:   "bg-sky-50 border-sky-200 text-sky-900 dark:bg-sky-950/20 dark:border-sky-800/50 dark:text-sky-100",
    iconBg: "bg-sky-100 dark:bg-sky-950/30 text-sky-600 dark:text-sky-400",
    count:  "bg-sky-500 text-white",
  },
};

// ── Helpers ───────────────────────────────────────────────────────────
const RECOMMENDATION_RULES = [
  [/unauthorizedoperation|not authorized|accessdenied/i,
    "Grant the required IAM permission to the user or role. Attach a policy that allows the specific action for the target resource."],
  [/nopasswordpolicy|password.*policy|nosuchentity.*password/i,
    "Set an IAM account password policy via IAM → Account settings → Password policy."],
  [/replicationconfigurationnotfounderror/i,
    "To enable S3 replication go to S3 → Bucket → Management → Replication rules and add a destination bucket rule."],
  [/nosuchlifecycleconfiguration/i,
    "Add a lifecycle rule: S3 → Bucket → Management → Lifecycle rules → Create rule."],
  [/nosuchwebsiteconfiguration/i,
    "Enable static website hosting: S3 → Bucket → Properties → Static website hosting → Enable."],
  [/nosuchcorsconfiguration/i,
    "Add a CORS policy if cross-origin requests are needed: S3 → Bucket → Permissions → CORS."],
  [/nosuchbucket|nosuchkey/i,
    "The S3 bucket or key does not exist. Verify the name, region, and path."],
  [/invalidparametervalueexception.*lambda|role.*cannot be assumed/i,
    "Update the Lambda execution role's trust policy to allow lambda.amazonaws.com to assume it."],
  [/authfailure|authentication failed|invalid.*credentials/i,
    "Rotate the IAM access keys (IAM → Users → Security credentials)."],
  [/throttl|rate exceeded|requestlimitexceeded/i,
    "Implement exponential back-off and jitter. Consider requesting a service quota increase via AWS Support."],
  [/timeout|timed out/i,
    "Increase the operation timeout in your SDK config. Check VPC routing and security group rules."],
  [/describetrails|startlogging/i,
    "No action needed — routine CloudTrail audit activity."],
  [/describeinstances|describevolumes/i,
    "No action needed — read-only metadata lookup."],
];

function getRecommendation(message = "", sev = "INFO") {
  const text = message.toLowerCase();
  for (const [pattern, action] of RECOMMENDATION_RULES) {
    if (pattern.test(text)) return action;
  }
  if (sev === "ERROR")   return "Investigate the error code and message. Check IAM permissions, resource availability, and service quotas. Correlate with CloudTrail events at the same timestamp.";
  if (sev === "WARNING") return "Monitor for recurrence. If it appears frequently, investigate the underlying resource or configuration.";
  return "No immediate action required. Routine API call logged for audit and compliance purposes.";
}

function cleanNarrative(text = "") {
  return text
    .replace(/\*\*[^*]+\*\*/g, "")
    .replace(/at\s+\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}[^:]*:\s*/gi, "")
    .replace(/\s*Log:\s*['"].*$/s, "")
    .trim();
}

function buildTitle(narrative = "", message = "") {
  const cleaned = cleanNarrative(narrative);
  if (cleaned) {
    const first = cleaned.split(/\.\s+/)[0];
    if (first.length > 8) return first;
  }
  return (message || "Cloud infrastructure event").slice(0, 90);
}

// ── Group incidents by template (normalized log pattern) ──────────────
function groupAlerts(incidents, narratives) {
  const groups = new Map(); // key: template → group obj

  incidents.forEach((x, i) => {
    const key       = (x.template || x.message || "").slice(0, 120);
    const narrative = cleanNarrative(narratives[i] || "");
    const ts        = x.timestamp ? String(x.timestamp).slice(0, 19).replace("T", " ") : "N/A";

    if (!groups.has(key)) {
      groups.set(key, {
        type:      x.severity || "INFO",
        title:     buildTitle(narratives[i], x.message),
        narrative,
        raw:       x.message || "",
        template:  key,
        count:     1,
        members:   [{ raw: x.message || "", when: ts }],
        priority:  x.priority_score || 1,
      });
    } else {
      const g = groups.get(key);
      g.count++;
      g.members.push({ raw: x.message || "", when: ts });
      // Escalate severity if needed
      if (x.severity === "ERROR" && g.type !== "ERROR") g.type = "ERROR";
    }
  });

  // Sort groups: ERROR first, then by count descending
  return [...groups.values()].sort((a, b) => {
    const sevScore = { ERROR: 3, WARNING: 2, INFO: 1 };
    if (sevScore[b.type] !== sevScore[a.type]) return sevScore[b.type] - sevScore[a.type];
    return b.count - a.count;
  });
}

// ── Demo data ─────────────────────────────────────────────────────────
const DEMO_GROUPS = [
  { type: "ERROR",   title: "S3 replication config not found",        count: 47, narrative: "Multiple failed S3 bucket replication checks detected — the replication configuration was not found.", raw: "", members: [] },
  { type: "ERROR",   title: "IAM password policy not configured",      count: 3,  narrative: "No account-level IAM password policy is configured, which may be a compliance risk.", raw: "", members: [] },
  { type: "WARNING", title: "API Gateway resource not found",          count: 8,  narrative: "API Gateway returned a NotFoundException — the REST API ID or stage does not exist.", raw: "", members: [] },
  { type: "INFO",    title: "CloudTrail audit logging activity",       count: 22, narrative: "CloudTrail is listing and starting audit trail logging — routine compliance activity.", raw: "", members: [] },
];

// ── Pagination ────────────────────────────────────────────────────────
function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;
  const pages   = Array.from({ length: totalPages }, (_, i) => i + 1);
  const visible = pages.filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1);
  const items   = [];
  visible.forEach((p, i) => {
    if (i > 0 && p - visible[i - 1] > 1) items.push("…");
    items.push(p);
  });
  return (
    <div className="flex items-center justify-center gap-1.5 pt-5 border-t border-slate-100 dark:border-slate-800 mt-4">
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
                ? "bg-rose-600 text-white shadow-sm"
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

// ── Group Alert Card ──────────────────────────────────────────────────
function GroupAlertCard({ group, idx }) {
  const [open, setOpen]           = useState(false);
  const [showLogs, setShowLogs]   = useState(false);

  const cfg  = ALERT_MAP[group.type] || ALERT_MAP.INFO;
  const Icon = cfg.icon;
  const isGroup = group.count > 1;

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -8 }}
      transition={{ delay: idx * 0.04, duration: 0.28 }}
      className={cn(
        "group relative overflow-hidden rounded-xl border bg-white/80 shadow-soft backdrop-blur-xl",
        "dark:bg-slate-900/50 transition-shadow duration-200 hover:shadow-lift",
        cfg.border, cfg.glow
      )}
    >
      <div className={cn("absolute left-0 top-0 h-full w-1 rounded-l-xl", cfg.bar)} />

      {/* Header */}
      <button type="button" onClick={() => setOpen(v => !v)}
        className="flex w-full items-start gap-3 p-4 pl-5 text-left" aria-expanded={open}>

        <div className="relative mt-0.5 shrink-0">
          <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl", cfg.iconBg)}>
            <Icon className="h-4 w-4" />
          </div>
          {group.type === "ERROR" && (
            <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-rose-500" />
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className={cfg.badge}>{group.type}</span>

            {/* Occurrence count badge */}
            {isGroup && (
              <span className={cn("inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold", cfg.count)}>
                <Layers className="h-2.5 w-2.5" />
                ×{group.count} occurrences
              </span>
            )}
          </div>

          <div className="text-sm font-bold text-slate-900 dark:text-white leading-snug">{group.title}</div>
          {group.narrative && (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
              {group.narrative}
            </p>
          )}
        </div>

        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }} className="mt-1 shrink-0">
          <ChevronDown className="h-4 w-4 text-slate-400" />
        </motion.div>
      </button>

      {/* Expanded details */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="space-y-3 border-t border-slate-100 dark:border-slate-800 p-4 pl-5 pt-3">

              {/* Representative source log */}
              {group.raw && (
                <div>
                  <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    <FileCode2 className="h-3 w-3" />
                    {isGroup ? `Representative Log (1 of ${group.count})` : "Source Log"}
                  </div>
                  <div className="rounded-lg border border-slate-700/60 bg-[#0d1117] p-3">
                    <code className="block whitespace-pre-wrap break-all font-mono text-[11px] leading-[1.75] text-[#c9d1d9]">
                      {group.raw}
                    </code>
                  </div>
                </div>
              )}

              {/* NLP Summary */}
              {group.narrative && (
                <div>
                  <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-violet-500 dark:text-violet-400">
                    <Lightbulb className="h-3 w-3" /> NLP Summary
                  </div>
                  <p className={cn("rounded-lg border p-3 text-[13px] leading-relaxed", cfg.expl)}>
                    {group.narrative}
                    {isGroup && (
                      <span className="ml-1 font-semibold opacity-70">
                        ({group.count} similar events detected.)
                      </span>
                    )}
                  </p>
                </div>
              )}

              {/* Recommended Action */}
              <div>
                <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-500 dark:text-emerald-400">
                  <ShieldCheck className="h-3 w-3" /> Recommended Action
                </div>
                <p className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-3 text-[13px] leading-relaxed text-slate-700 dark:text-slate-300">
                  {getRecommendation(group.raw, group.type)}
                  {isGroup && (
                    <span className="ml-1 text-rose-600 dark:text-rose-400 font-semibold">
                      This issue recurred {group.count} times — prioritize resolving it.
                    </span>
                  )}
                </p>
              </div>

              {/* Grouped log entries */}
              {isGroup && group.members.length > 0 && (
                <div>
                  <button
                    type="button"
                    onClick={() => setShowLogs(v => !v)}
                    className="flex w-full items-center justify-between rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 px-3 py-2 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <span className="flex items-center gap-1.5">
                      <Layers className="h-3 w-3" />
                      View all {group.count} occurrences
                    </span>
                    <motion.div animate={{ rotate: showLogs ? 180 : 0 }} transition={{ duration: 0.18 }}>
                      <ChevronDown className="h-3.5 w-3.5" />
                    </motion.div>
                  </button>

                  <AnimatePresence initial={false}>
                    {showLogs && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <ul className="mt-2 space-y-1.5 max-h-64 overflow-y-auto">
                          {group.members.map((m, mi) => (
                            <li key={mi} className="rounded-lg border border-slate-700/40 bg-[#0d1117] px-3 py-2">
                              <div className="flex items-center gap-2 mb-1">
                                <Clock className="h-2.5 w-2.5 text-slate-500 flex-shrink-0" />
                                <span className="text-[10px] font-mono text-slate-500">{m.when}</span>
                                <span className="ml-auto text-[10px] font-mono text-slate-600">#{mi + 1}</span>
                              </div>
                              <code className="block whitespace-pre-wrap break-all font-mono text-[10px] leading-relaxed text-[#8b949e]">
                                {m.raw}
                              </code>
                            </li>
                          ))}
                        </ul>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────
export default function AlertsPage({ analysis }) {
  const [page, setPage] = useState(1);

  const incidents  = analysis?.summary?.prioritized_incidents || [];
  const narratives = analysis?.summary?.incident_narratives   || [];

  const groups = useMemo(() => {
    if (incidents.length === 0) return DEMO_GROUPS;

    const g = groupAlerts(incidents, narratives);

    // Prepend summary banner if errors found
    const sev = analysis?.summary?.severity || {};
    if ((sev.ERROR || 0) > 0) {
      g.unshift({
        type: "ERROR",
        title: "Critical errors detected",
        count: sev.ERROR,
        narrative: `${sev.ERROR} error event(s) found across the log file. Expand individual groups below for details and recommended actions.`,
        raw: "",
        members: [],
      });
    }
    return g;
  }, [analysis, incidents, narratives]);

  const isDemo     = incidents.length === 0 && !analysis;
  const totalPages = Math.max(1, Math.ceil(groups.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const start      = (safePage - 1) * PAGE_SIZE;
  const pageItems  = groups.slice(start, start + PAGE_SIZE);

  const counts = useMemo(() => ({
    ERROR:   groups.filter(g => g.type === "ERROR").length,
    WARNING: groups.filter(g => g.type === "WARNING").length,
    INFO:    groups.filter(g => g.type === "INFO").length,
  }), [groups]);

  const totalIncidents = useMemo(() => groups.reduce((s, g) => s + (g.count || 1), 0), [groups]);

  const handlePageChange = (p) => {
    setPage(p);
    document.getElementById("alerts-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-slate-200/60 bg-white/75 p-5 shadow-soft backdrop-blur-xl dark:border-slate-800/50 dark:bg-slate-900/50"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-red-600 shadow-glow-red">
              <BellRing className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-slate-900 dark:text-white">System Alerts</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isDemo
                  ? "Demo mode — upload logs for real grouped alerts"
                  : `${groups.length} alert group${groups.length !== 1 ? "s" : ""} from ${totalIncidents} total incidents`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="badge-error">{counts.ERROR} ERROR</span>
            <span className="badge-warning">{counts.WARNING} WARN</span>
            <span className="badge-info">{counts.INFO} INFO</span>
          </div>
        </div>
      </motion.div>

      {/* Grouped alert feed */}
      <div id="alerts-section" className="rounded-2xl border border-slate-200/60 bg-white/75 p-5 shadow-soft backdrop-blur-xl dark:border-slate-800/50 dark:bg-slate-900/50">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-extrabold text-slate-900 dark:text-white">Grouped Alert Feed</p>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Similar events are automatically grouped — click ×N to view all occurrences
            </p>
          </div>
          {groups.length > 0 && (
            <span className="rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300 tabular-nums">
              {start + 1}–{Math.min(start + PAGE_SIZE, groups.length)} of {groups.length}
            </span>
          )}
        </div>

        <div className="space-y-2">
          <AnimatePresence mode="wait">
            {pageItems.map((group, idx) => (
              <GroupAlertCard key={`${group.title}-${start + idx}`} group={group} idx={idx} />
            ))}
          </AnimatePresence>
        </div>

        <Pagination page={safePage} totalPages={totalPages} onChange={handlePageChange} />
      </div>

    </div>
  );
}
