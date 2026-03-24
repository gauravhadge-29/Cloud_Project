import React, { useState } from "react";
import axios from "axios";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:8000";

function UploadLogs({ onAnalyzed }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!file) {
      setError("Select a .txt or .log file before uploading.");
      return;
    }

    const fileExt = file.name.split(".").pop().toLowerCase();
    if (!["txt", "log"].includes(fileExt)) {
      setError("Unsupported format. Upload .txt or .log files only.");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await axios.post(`${API_BASE}/upload-logs`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      onAnalyzed(response.data);
    } catch (uploadError) {
      setError(uploadError.response?.data?.detail || "Upload failed. Ensure backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="card">
      <div className="card__header">
        <div>
          <h2>Upload & analyze</h2>
          <p>Drop a log file, run the pipeline, then review insights and incidents.</p>
        </div>
        <span className="pill pill--success">Accepted: .txt, .log</span>
      </div>

      <form onSubmit={onSubmit} className="stack">
        <label className="file">
          <input
            className="file__input"
            type="file"
            accept=".txt,.log"
            onChange={(event) => setFile(event.target.files?.[0] || null)}
          />
          <span className="file__surface">
            <span className="file__title">{file ? file.name : "Choose a file"}</span>
            <span className="file__meta">
              {file ? "Ready to upload" : "Tip: upload recent service logs for best clustering"}
            </span>
          </span>
        </label>

        <div className="row row--between row--wrap">
          <div className="muted" role="status" aria-live="polite">
            {loading ? "Running summarization pipeline…" : " "}
          </div>
          <button className="btn btn--primary" type="submit" disabled={loading}>
            {loading ? "Processing…" : "Run analysis"}
          </button>
        </div>

        {error && (
          <div className="alert alert--error" role="alert">
            <div className="alert__title">Upload failed</div>
            <div className="alert__body">{error}</div>
          </div>
        )}
      </form>

      <div className="hint">
        Backend base URL: <code>{API_BASE}</code>
      </div>
    </section>
  );
}

export default UploadLogs;
