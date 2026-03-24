import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:8000";

function Dashboard({ latestAnalysis }) {
  const [history, setHistory] = useState([]);
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("ALL");

  const fetchHistory = async () => {
    try {
      const params = new URLSearchParams();
      params.set("limit", "12");
      if (search.trim()) {
        params.set("search", search.trim());
      }
      if (severityFilter !== "ALL") {
        params.set("severity", severityFilter);
      }

      const response = await axios.get(`${API_BASE}/analyses?${params.toString()}`);
      setHistory(response.data || []);
    } catch {
      setHistory([]);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [severityFilter]);

  const incidents = latestAnalysis?.summary?.prioritized_incidents || [];
  const timeline = latestAnalysis?.summary?.timeline || [];
  const transitions = latestAnalysis?.summary?.sequence_transitions || [];

  const sortedHistory = useMemo(() => history, [history]);

  return (
    <section className="card">
      <div className="section-title">
        <div>
          <h2>Monitoring Dashboard</h2>
          <p>Search, filter, and review incident-focused summaries.</p>
        </div>
      </div>

      <div className="upload-actions" style={{ marginBottom: "12px" }}>
        <input
          className="input"
          type="text"
          placeholder="Search by filename or summary"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <select value={severityFilter} onChange={(event) => setSeverityFilter(event.target.value)}>
          <option value="ALL">All Severities</option>
          <option value="ERROR">Error</option>
          <option value="WARNING">Warning</option>
          <option value="INFO">Info</option>
        </select>
        <button className="primary" type="button" onClick={fetchHistory}>Apply Filters</button>
      </div>

      <div className="two-col">
        <div className="card" style={{ margin: 0 }}>
          <h3 style={{ marginBottom: "10px" }}>Prioritized Incidents</h3>
          <div className="incident-list">
            {incidents.length === 0 && <p className="muted">Run a new analysis to view prioritized incidents.</p>}
            {incidents.map((item, idx) => (
              <article className="incident" key={`${item.timestamp}-${idx}`}>
                <div className="meta">
                  <span className={`sev ${item.severity}`}>{item.severity}</span> | {item.timestamp}
                </div>
                <p>{item.message}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="card" style={{ margin: 0 }}>
          <h3 style={{ marginBottom: "10px" }}>Event Timeline</h3>
          <div className="timeline-list">
            {timeline.length === 0 && <p className="muted">No timeline yet.</p>}
            {timeline.slice(0, 10).map((item, idx) => (
              <article className="timeline-item" key={`${item.timestamp}-${idx}`}>
                <div className="meta">
                  <span className={`sev ${item.severity}`}>{item.severity}</span> | {item.timestamp}
                </div>
                <p>{item.event}</p>
              </article>
            ))}
          </div>
        </div>
      </div>

      <div className="two-col" style={{ marginTop: "12px" }}>
        <div className="card" style={{ margin: 0 }}>
          <h3 style={{ marginBottom: "10px" }}>Top Event Transitions</h3>
          <div className="chip-row">
            {transitions.length === 0 && <p className="muted">No transitions yet.</p>}
            {transitions.map((item, idx) => (
              <span className="chip" key={`${item.transition}-${idx}`}>
                {item.transition} ({item.count})
              </span>
            ))}
          </div>
        </div>

        <div className="card" style={{ margin: 0 }}>
          <h3 style={{ marginBottom: "10px" }}>Recent Analyses</h3>
          <div className="history-list">
            {sortedHistory.length === 0 && <p className="muted">No stored analyses found.</p>}
            {sortedHistory.map((item, idx) => (
              <article className="history-item" key={`${item.file_name || "analysis"}-${idx}`}>
                <div className="meta">{item.file_name || "Unknown file"}</div>
                <p>{item.summary?.executive_summary || item.summary?.summary_text || "Summary unavailable"}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default Dashboard;
