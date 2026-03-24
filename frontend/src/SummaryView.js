import React, { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from "recharts";
import LogDetailModal from "./components/LogDetailModal";

const COLORS = ["#d62828", "#ffb703", "#2a9d8f", "#0077b6", "#6a4c93"];

function SummaryView({ analysis }) {
  const [selectedIncident, setSelectedIncident] = useState(null);
  if (!analysis) {
    return (
      <section className="card">
        <div className="section-title">
          <div>
            <h2>Summarized Insights</h2>
            <p>Run the pipeline to visualize incident context and event patterns.</p>
          </div>
        </div>
        <p className="muted">No analysis yet.</p>
      </section>
    );
  }

  const severity = analysis.summary?.severity || {};
  const severityData = Object.entries(severity).map(([name, value]) => ({ name, value }));
  const keywordData = (analysis.summary?.top_keywords || []).map((item) => ({
    name: item.term,
    count: item.count,
  }));

  const processedPreview = analysis.processed_preview || [];
  const prioritizedIncidents = analysis.summary?.prioritized_incidents || [];
  const incidentNarratives = analysis.summary?.incident_narratives || [];

  return (
    <section className="card">
      <div className="section-title">
        <div>
          <h2>Summarized Insights</h2>
          <p>{analysis.summary?.executive_summary || analysis.summary?.summary_text || "No summary available"}</p>
        </div>
      </div>

      <div className="kpis">
        <div className="kpi">
          <div className="label">Total Logs</div>
          <div className="value">{analysis.total_logs}</div>
        </div>
        <div className="kpi">
          <div className="label">Errors</div>
          <div className="value" style={{ color: "#d62828" }}>{severity.ERROR || 0}</div>
        </div>
        <div className="kpi">
          <div className="label">Warnings</div>
          <div className="value" style={{ color: "#9a6400" }}>{severity.WARNING || 0}</div>
        </div>
        <div className="kpi">
          <div className="label">Info Events</div>
          <div className="value" style={{ color: "#12666f" }}>{severity.INFO || 0}</div>
        </div>
      </div>

      <div className="card" style={{ marginTop: "10px", marginBottom: 0 }}>
        <h3 style={{ marginBottom: "8px" }}>Direct mapping: log → human-readable</h3>
        <p className="muted" style={{ marginBottom: "10px" }}>
          This shows exactly how a raw log line is normalized into an event template, then turned into an incident narrative.
        </p>

        <div className="mapping-list">
          {processedPreview.length === 0 ? (
            <p className="muted">No processed preview available.</p>
          ) : (
            processedPreview.slice(0, 4).map((row, idx) => (
              <div key={`${row.timestamp || "t"}-${idx}`} className="mapping-row">
                <div className="mapping-row__meta">
                  <span className="muted">Timestamp</span>{" "}
                  <strong>{row.timestamp || "N/A"}</strong>
                </div>

                <div className="mapping-grid mapping-grid--three">
                  <div className="mapping-cell">
                    <div className="mapping-label">Raw log line</div>
                    <code className="mapping-code">{row.raw || "—"}</code>
                  </div>
                  <div className="mapping-cell">
                    <div className="mapping-label">Normalized template</div>
                    <code className="mapping-code">{row.template || "—"}</code>
                  </div>
                  <div className="mapping-cell">
                    <div className="mapping-label">Cleaned tokens (TF‑IDF)</div>
                    <code className="mapping-code">{row.clean || "—"}</code>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {prioritizedIncidents.length > 0 && (
          <div style={{ marginTop: "10px" }}>
            <h3 style={{ marginBottom: "8px" }}>Incident narrative mapping (NLG)</h3>
            <div className="mapping-list">
              {prioritizedIncidents.slice(0, 3).map((incident, idx) => (
                <div key={`${incident.timestamp || "time"}-${idx}`} className="mapping-row">
                  <div className="mapping-row__meta">
                    <span className={`sev ${incident.severity}`}>{incident.severity}</span>{" "}
                    <span className="muted">|</span> <span className="muted">{incident.timestamp}</span>
                  </div>

                  <div className="mapping-grid mapping-grid--two">
                    <div className="mapping-cell">
                      <div className="mapping-label">Log line (input)</div>
                      <code className="mapping-code">{incident.message}</code>

                      <div style={{ height: 8 }} />

                      <div className="mapping-label">Template (intermediate)</div>
                      <code className="mapping-code">{incident.template || "—"}</code>
                    </div>

                    <div className="mapping-cell mapping-cell--narrative">
                      <div className="mapping-label">Human-readable narrative (output)</div>
                      <div className="mapping-narrative">
                        <p>{incidentNarratives[idx] || "Narrative unavailable"}</p>
                      </div>
                    </div>
                  </div>

                  {incident.metadata && Object.keys(incident.metadata).length > 0 && (
                    <details style={{ marginTop: "12px", padding: "8px", backgroundColor: "#fbfbfb", borderRadius: "6px", border: "1px solid #eee" }}>
                      <summary style={{ cursor: "pointer", fontWeight: "bold", fontSize: "0.9rem", color: "#0077b6" }}>View Extracted Metadata</summary>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "8px" }}>
                        {Object.entries(incident.metadata).map(([key, val]) => (
                          <span key={key} style={{ fontSize: "0.8rem", padding: "4px 8px", backgroundColor: "#e0fbfc", color: "#0077b6", borderRadius: "4px", fontWeight: "500" }}>
                            {key}: {val}
                          </span>
                        ))}
                      </div>
                    </details>
                  )}

                  <button
                    onClick={() => setSelectedIncident(incident)}
                    style={{ marginTop: "10px", background: "linear-gradient(135deg, #0077b6, #00b4d8)", color: "#fff", border: "none", borderRadius: "6px", padding: "6px 14px", cursor: "pointer", fontSize: "0.82rem", fontWeight: "600" }}
                  >
                    🔍 Run Deep AI Analysis
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="two-col">
        <div className="card" style={{ margin: 0 }}>
          <h3 style={{ marginBottom: "8px" }}>Severity Distribution</h3>
          <div style={{ width: "100%", height: 250 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={severityData} dataKey="value" nameKey="name" outerRadius={88} label>
                  {severityData.map((entry, index) => (
                    <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card" style={{ margin: 0 }}>
          <h3 style={{ marginBottom: "8px" }}>Top Keywords</h3>
          <div style={{ width: "100%", height: 250 }}>
            <ResponsiveContainer>
              <BarChart data={keywordData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-20} textAnchor="end" height={70} interval={0} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#006d77" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: "12px", marginBottom: 0 }}>
        <h3 style={{ marginBottom: "10px" }}>Cluster Highlights</h3>
        <div className="chip-row">
          {Object.entries(analysis.summary?.cluster_distribution || {}).map(([cluster, count]) => (
            <span className="chip" key={cluster}>{cluster}: {count}</span>
          ))}
        </div>
      </div>

      {analysis.summary?.behavior_narrative && (
        <div className="card" style={{ marginTop: "12px", marginBottom: 0 }}>
          <h3 style={{ marginBottom: "8px" }}>System Behavior Patterns</h3>
          <p>{analysis.summary.behavior_narrative}</p>
        </div>
      )}

      {analysis.summary?.incident_narratives && analysis.summary.incident_narratives.length > 0 && (
        <div className="card" style={{ marginTop: "12px", marginBottom: 0 }}>
          <h3 style={{ marginBottom: "8px" }}>Critical Incidents (NLG Summary)</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {analysis.summary.incident_narratives.slice(0, 3).map((narrative, idx) => (
              <div key={idx} style={{ padding: "8px", backgroundColor: "#f5f5f5", borderRadius: "6px", borderLeft: "3px solid #d62828" }}>
                <p style={{ margin: 0, fontSize: "0.9rem" }}>{narrative}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedIncident && (
        <LogDetailModal incident={selectedIncident} onClose={() => setSelectedIncident(null)} />
      )}
    </section>
  );
}

export default SummaryView;
