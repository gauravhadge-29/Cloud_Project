import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown, Server, Clock, AlertTriangle,
  Info, XOctagon, Lightbulb, ShieldCheck, FileCode2,
} from "lucide-react";
import { cn } from "../lib/utils";

const SEV_CONFIG = {
  ERROR: {
    badge:  "badge-error",
    dot:    "bg-rose-500",
    ring:   "ring-rose-500/20 dark:ring-rose-500/15",
    bg:     "bg-rose-50/50 dark:bg-rose-950/10",
    icon:   XOctagon,
    stripe: "bg-rose-500",
    expl:   "bg-rose-50 border-rose-200 text-rose-900 dark:bg-rose-950/20 dark:border-rose-800/50 dark:text-rose-100",
    iconCl: "text-rose-600 dark:text-rose-400",
  },
  WARNING: {
    badge:  "badge-warning",
    dot:    "bg-amber-500",
    ring:   "ring-amber-500/20 dark:ring-amber-500/15",
    bg:     "bg-amber-50/50 dark:bg-amber-950/10",
    icon:   AlertTriangle,
    stripe: "bg-amber-400",
    expl:   "bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-950/20 dark:border-amber-800/50 dark:text-amber-100",
    iconCl: "text-amber-600 dark:text-amber-400",
  },
  INFO: {
    badge:  "badge-info",
    dot:    "bg-sky-500",
    ring:   "ring-sky-500/20 dark:ring-sky-500/15",
    bg:     "bg-sky-50/50 dark:bg-sky-950/10",
    icon:   Info,
    stripe: "bg-sky-400",
    expl:   "bg-sky-50 border-sky-200 text-sky-900 dark:bg-sky-950/20 dark:border-sky-800/50 dark:text-sky-100",
    iconCl: "text-sky-600 dark:text-sky-400",
  },
};

// Strip any old-format artifacts from narrative text
function cleanNarrative(text = "") {
  return text
    .replace(/\*\*[^*]+\*\*/g, "")            // remove **BOLD**
    .replace(/at\s+\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}[^:]*:\s*/gi, "") // remove timestamp prefix
    .replace(/\s*Log:\s*['"].*$/s, "")          // remove Log: '...' suffix
    .trim();
}

// ── Content-aware recommendation engine ───────────────────────────────
const RECOMMENDATION_RULES = [
  // IAM / permissions
  [/unauthorizedoperation|not authorized|accessdenied/i,
    "Grant the required IAM permission to the user or role. In the IAM console, attach a policy that allows the specific action (e.g., ec2:DescribeInstances) for the target resource."],
  [/invaliduserid|invalid user/i,
    "Verify the IAM user or role ARN in the request. Typos or deleted identities will cause this error."],
  [/nopasswordpolicy|password.*policy|nosuchentity.*password/i,
    "Set an IAM account password policy via IAM → Account settings → Password policy. Recommended: min. 8 chars, require uppercase, number, and symbol."],
  // S3
  [/replicationconfigurationnotfounderror/i,
    "If replication is not needed, no action required. To enable it, go to S3 → Bucket → Management → Replication rules and add a rule with a destination bucket."],
  [/nosuchlifecycleconfiguration/i,
    "Add a lifecycle rule to auto-expire objects: S3 → Bucket → Management → Lifecycle rules → Create rule."],
  [/nosuchwebsiteconfiguration/i,
    "Enable static website hosting: S3 → Bucket → Properties → Static website hosting → Enable."],
  [/nosuchcorsconfiguration/i,
    "Add a CORS policy to the bucket if cross-origin requests are needed: S3 → Bucket → Permissions → CORS."],
  [/nosuchtagset/i,
    "Add tags to the bucket for cost tracking and governance: S3 → Bucket → Properties → Tags."],
  [/nosuchbucket|nosuchkey/i,
    "The referenced S3 bucket or object key does not exist. Verify the bucket name, region, and key path. Ensure the resource hasn't been deleted."],
  // Lambda
  [/invalidparametervalueexception.*lambda|role.*cannot be assumed/i,
    "Update the Lambda execution role's trust policy to allow lambda.amazonaws.com to assume it. In IAM → Roles → [role] → Trust relationships, add the Lambda service principal."],
  [/resourcenotfoundexception.*lambda/i,
    "Deploy or re-deploy the Lambda function. Verify the function name and region match in the API call."],
  // API Gateway
  [/notfoundexception|invalid rest api|invalid.*identifier/i,
    "Check the API Gateway REST API ID and stage name. If the API was deleted, redeploy from your infrastructure-as-code (e.g., SAM or Terraform)."],
  [/badrequestexception.*authorizer/i,
    "Rename or delete the existing Lambda authorizer with the same name before creating a new one."],
  // Auth / credentials
  [/authfailure|authentication failed|invalid.*credentials/i,
    "Rotate the access keys for this IAM user (IAM → Users → Security credentials). Ensure the correct AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are used."],
  // Throttling
  [/throttl|rate exceeded|requestlimitexceeded/i,
    "Implement exponential back-off and jitter in the client. Consider requesting a service quota increase via AWS Support if this occurs repeatedly."],
  // Timeout
  [/timeout|timed out/i,
    "Increase the operation or connection timeout in your SDK/client config. Check VPC routing and security group rules if this is a cross-service call."],
  // Connection refused
  [/connection refused/i,
    "Ensure the target service is running and the port is open in the security group. Check the endpoint URL for correctness."],
  // CloudTrail
  [/describetrails|startlogging/i,
    "No action needed — this is routine CloudTrail audit activity. Ensure CloudTrail is enabled in all regions for compliance."],
  // EC2
  [/describeinstances|describevolumes|describesnapshots/i,
    "No action needed — this is a read-only metadata lookup. If unexpected, review IAM policies to restrict who can enumerate EC2 resources."],
];

function getRecommendation(message = "", narrative = "", sev = "INFO") {
  const text = (message + " " + narrative).toLowerCase();
  for (const [pattern, action] of RECOMMENDATION_RULES) {
    if (pattern.test(text)) return action;
  }
  // Generic fallbacks by severity
  if (sev === "ERROR")   return "Investigate the error code and message. Check IAM permissions, resource availability, and service quotas. Correlate with other events at the same timestamp in CloudTrail.";
  if (sev === "WARNING") return "Monitor for recurrence. If this warning appears frequently, investigate the underlying resource or configuration that is triggering it.";
  return "No immediate action required. This is a routine API call logged for audit and compliance purposes.";
}

function extractTitle(narrative = "", message = "") {
  const cleaned = cleanNarrative(narrative);
  if (cleaned) {
    const firstSentence = cleaned.split(/\.\s+/)[0];
    if (firstSentence.length > 8) return firstSentence;
  }
  return (message || "Cloud infrastructure event").slice(0, 80);
}

export default function SummaryCard({ item, narrative }) {
  const [open, setOpen] = useState(false);
  const sev    = item?.severity || "INFO";
  const cfg    = SEV_CONFIG[sev] || SEV_CONFIG.INFO;
  const SevIcon = cfg.icon;

  const title   = extractTitle(narrative, item?.message);
  const ts      = item?.timestamp ? String(item.timestamp).slice(0, 19).replace("T", " ") : null;

  return (
    <motion.article
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "overflow-hidden rounded-xl border border-slate-200/60 bg-white/80 shadow-soft",
        "dark:border-slate-800/50 dark:bg-slate-900/50",
        "ring-1 transition-shadow duration-200 hover:shadow-lift",
        cfg.ring
      )}
    >
      {/* ── Header ── */}
      <button
        type="button"
        className="flex w-full items-start gap-3 p-4 text-left"
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
      >
        {/* Severity icon */}
        <div className={cn("mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg", cfg.bg)}>
          <SevIcon className={cn("h-4 w-4", cfg.iconCl)} />
        </div>

        <div className="min-w-0 flex-1">
          {/* Badges */}
          <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
            <span className={cfg.badge}>{sev}</span>
            {ts && (
              <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500">
                <Clock className="h-2.5 w-2.5" />
                {ts}
              </span>
            )}
          </div>

          {/* Title — first sentence of the NLP narrative */}
          <p className="text-sm font-semibold leading-snug text-slate-800 dark:text-slate-100">
            {title}
          </p>
        </div>

        {/* Expand arrow */}
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="mt-1 flex-shrink-0"
        >
          <ChevronDown className="h-4 w-4 text-slate-400" />
        </motion.div>
      </button>

      {/* ── Expanded details ── */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="space-y-3 border-t border-slate-100 dark:border-slate-800 p-4 pt-3">

              {/* Source Log */}
              {item?.message && (
                <div>
                  <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    <FileCode2 className="h-3 w-3" />
                    Source Log
                  </div>
                  <div className="rounded-lg border border-slate-700/60 bg-[#0d1117] p-3">
                    <code className="block whitespace-pre-wrap break-all font-mono text-[11px] leading-[1.75] text-[#c9d1d9]">
                      {item.message}
                    </code>
                  </div>
                </div>
              )}

              {narrative && (
                <div>
                  <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-violet-500 dark:text-violet-400">
                    <Lightbulb className="h-3 w-3" />
                    NLP Summary
                  </div>
                  <p className={cn("rounded-lg border p-3 text-[13px] leading-relaxed", cfg.expl)}>
                    {cleanNarrative(narrative)}
                  </p>
                </div>
              )}

              {/* Recommended action */}
              <div>
                <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-500 dark:text-emerald-400">
                  <ShieldCheck className="h-3 w-3" />
                  Recommended Action
                </div>
                <p className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-3 text-[13px] leading-relaxed text-slate-700 dark:text-slate-300">
                  {getRecommendation(item?.message, narrative, sev)}
                </p>
              </div>

              {/* Priority score */}
              {item?.priority_score && (
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-semibold">Priority score:</span>
                  <span className={cn(
                    "rounded-md px-2 py-0.5 text-[11px] font-bold",
                    item.priority_score >= 3 ? "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
                    : item.priority_score === 2 ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                    : "bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300"
                  )}>
                    {item.priority_score === 3 ? "High" : item.priority_score === 2 ? "Medium" : "Low"}
                  </span>
                </div>
              )}

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}
