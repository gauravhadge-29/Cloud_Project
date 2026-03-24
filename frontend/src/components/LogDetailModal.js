import React, { useState } from "react";
import axios from "axios";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:8000";

const SEVERITY_COLORS = {
  ERROR: "#d62828",
  WARNING: "#f4a261",
  INFO: "#2a9d8f",
};

function LogDetailModal({ incident, onClose }) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const runAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.post(`${API_BASE}/api/analyze-log`, {
        log_line: incident.message,
        template: incident.template || "",
        severity: incident.severity || "",
        metadata: incident.metadata || {},
      });
      setAnalysis(data);
    } catch (e) {
      setError("Failed to connect to the AI analysis engine. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const sevColor = SEVERITY_COLORS[incident.severity] || "#555";

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div style={styles.header}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ ...styles.badge, backgroundColor: sevColor }}>{incident.severity}</span>
            <h3 style={{ margin: 0, fontSize: "1rem", color: "#1a1a2e" }}>Log Detail Analysis</h3>
          </div>
          <button onClick={onClose} style={styles.closeBtn} title="Close">✕</button>
        </div>

        {/* Raw Log */}
        <div style={styles.section}>
          <div style={styles.label}>Raw Log Line</div>
          <code style={styles.codeBlock}>{incident.message}</code>
        </div>

        {/* Metadata pills */}
        {incident.metadata && Object.keys(incident.metadata).length > 0 && (
          <div style={styles.section}>
            <div style={styles.label}>Extracted Cloud Context</div>
            <div style={styles.pillRow}>
              {Object.entries(incident.metadata).map(([k, v]) => (
                <span key={k} style={styles.pill}>
                  <strong>{k}:</strong>&nbsp;{v}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Timestamp + Template */}
        <div style={styles.twoCol}>
          <div style={styles.section}>
            <div style={styles.label}>Timestamp</div>
            <div style={styles.value}>{incident.timestamp || "N/A"}</div>
          </div>
          <div style={styles.section}>
            <div style={styles.label}>Drain3 Template</div>
            <code style={{ ...styles.codeBlock, fontSize: "0.75rem" }}>{incident.template || "—"}</code>
          </div>
        </div>

        {/* AI Analysis Section */}
        {!analysis && !loading && (
          <button onClick={runAnalysis} style={styles.analyzeBtn}>
            🔍 Run Deep Analysis
          </button>
        )}

        {loading && (
          <div style={styles.loadingBox}>
            <div style={styles.spinner} />
            <span style={{ color: "#0077b6", fontSize: "0.9rem" }}>Analyzing log entry…</span>
          </div>
        )}

        {error && <div style={styles.errorBox}>{error}</div>}

        {analysis && !analysis.error && (
          <div style={styles.analysisBox}>
            <div style={styles.analysisTitle}>🤖 Deep Log Analysis</div>

            <AIRow icon="📝" label="Summary" value={analysis.summary} />
            <AIRow icon="⚠️" label="Severity Reasoning" value={analysis.severity_reasoning} />
            <AIRow icon="🔍" label="Root Cause" value={analysis.root_cause} />
            <AIRow icon="💥" label="Potential Impact" value={analysis.impact} />
            <AIRow icon="✅" label="Recommended Action" value={analysis.recommended_action} />

            {analysis.cloud_resources && analysis.cloud_resources.length > 0 && (
              <div style={styles.aiRow}>
                <div style={styles.aiLabel}>☁️ Cloud Resources Involved</div>
                <div style={styles.pillRow}>
                  {analysis.cloud_resources.map((r, i) => (
                    <span key={i} style={{ ...styles.pill, backgroundColor: "#e0f0ff", color: "#0055aa" }}>{r}</span>
                  ))}
                </div>
              </div>
            )}

            {analysis.related_aws_services && analysis.related_aws_services.length > 0 && (
              <div style={styles.aiRow}>
                <div style={styles.aiLabel}>🔧 Related AWS Services</div>
                <div style={styles.pillRow}>
                  {analysis.related_aws_services.map((s, i) => (
                    <span key={i} style={{ ...styles.pill, backgroundColor: "#fff0e0", color: "#994400" }}>{s}</span>
                  ))}
                </div>
              </div>
            )}

            <button onClick={runAnalysis} style={{ ...styles.analyzeBtn, marginTop: "12px", opacity: 0.7, fontSize: "0.8rem" }}>
              🔄 Re-run Analysis
            </button>
          </div>
        )}

        {analysis && analysis.error && (
          <div style={styles.errorBox}>{analysis.error}</div>
        )}
      </div>
    </div>
  );
}

function AIRow({ icon, label, value }) {
  if (!value) return null;
  return (
    <div style={styles.aiRow}>
      <div style={styles.aiLabel}>{icon} {label}</div>
      <div style={styles.aiValue}>{value}</div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.55)",
    zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center",
    padding: "16px",
  },
  modal: {
    background: "#fff", borderRadius: "12px", width: "100%", maxWidth: "720px",
    maxHeight: "90vh", overflowY: "auto", padding: "24px",
    boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
    display: "flex", flexDirection: "column", gap: "14px",
  },
  header: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    borderBottom: "1px solid #eee", paddingBottom: "12px",
  },
  badge: {
    padding: "3px 10px", borderRadius: "20px", color: "#fff",
    fontSize: "0.75rem", fontWeight: "bold", letterSpacing: "0.05em",
  },
  closeBtn: {
    background: "none", border: "none", fontSize: "1.2rem",
    cursor: "pointer", color: "#888", lineHeight: 1,
  },
  section: { display: "flex", flexDirection: "column", gap: "4px" },
  label: { fontSize: "0.7rem", fontWeight: "700", textTransform: "uppercase", color: "#999", letterSpacing: "0.08em" },
  value: { fontSize: "0.9rem", color: "#333" },
  codeBlock: {
    display: "block", background: "#f4f4f8", borderRadius: "6px",
    padding: "8px 12px", fontSize: "0.78rem", color: "#1a1a2e",
    wordBreak: "break-all", lineHeight: 1.6, whiteSpace: "pre-wrap",
  },
  twoCol: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" },
  pillRow: { display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "4px" },
  pill: {
    padding: "3px 10px", borderRadius: "20px",
    backgroundColor: "#e8f4fd", color: "#0077b6",
    fontSize: "0.78rem", fontWeight: "500",
  },
  analyzeBtn: {
    background: "linear-gradient(135deg, #0077b6, #00b4d8)",
    color: "#fff", border: "none", borderRadius: "8px",
    padding: "10px 20px", cursor: "pointer", fontWeight: "600",
    fontSize: "0.9rem", alignSelf: "flex-start",
  },
  loadingBox: {
    display: "flex", alignItems: "center", gap: "12px",
    padding: "16px", background: "#f0f8ff", borderRadius: "8px",
  },
  spinner: {
    width: "20px", height: "20px", borderRadius: "50%",
    border: "3px solid #b3d9f2", borderTopColor: "#0077b6",
    animation: "spin 0.8s linear infinite",
  },
  errorBox: {
    padding: "12px", background: "#fff0f0", border: "1px solid #f5c2c2",
    borderRadius: "8px", color: "#b00020", fontSize: "0.85rem",
  },
  analysisBox: {
    background: "#f8faff", border: "1px solid #dce8f8",
    borderRadius: "10px", padding: "16px",
    display: "flex", flexDirection: "column", gap: "12px",
  },
  analysisTitle: {
    fontWeight: "700", fontSize: "0.95rem", color: "#0055aa",
    borderBottom: "1px solid #dce8f8", paddingBottom: "8px",
  },
  aiRow: { display: "flex", flexDirection: "column", gap: "3px" },
  aiLabel: { fontSize: "0.7rem", fontWeight: "700", textTransform: "uppercase", color: "#0077b6", letterSpacing: "0.06em" },
  aiValue: { fontSize: "0.88rem", color: "#333", lineHeight: 1.6 },
};

// Inject spinner CSS
const spinCss = `@keyframes spin { to { transform: rotate(360deg); } }`;
const styleEl = document.createElement("style");
styleEl.textContent = spinCss;
document.head.appendChild(styleEl);

export default LogDetailModal;
