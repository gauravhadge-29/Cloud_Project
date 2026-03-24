import axios from "axios";
import { getStoredApiBase } from "./storage";

export function getApiBase() {
  const stored = getStoredApiBase();
  return stored || process.env.REACT_APP_API_BASE || "http://localhost:8000";
}

export async function uploadLogs({ file, onProgress }) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await axios.post(`${getApiBase()}/upload-logs`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (evt) => {
      if (!onProgress) return;
      const total = evt.total || 0;
      const loaded = evt.loaded || 0;
      const pct = total ? Math.round((loaded / total) * 100) : 0;
      onProgress({ loaded, total, pct });
    },
  });

  return response.data;
}

export async function getAnalyses({ limit = 12, search = "", severity = "ALL" } = {}) {
  const params = new URLSearchParams();
  params.set("limit", String(limit));
  if (search.trim()) params.set("search", search.trim());
  if (severity && severity !== "ALL") params.set("severity", severity);
  const response = await axios.get(`${getApiBase()}/analyses?${params.toString()}`);
  return response.data || [];
}

