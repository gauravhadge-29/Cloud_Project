from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from clustering import LogClusterer
from database import get_recent_analyses, save_analysis
from log_processor import parse_log_text, preprocess_with_metadata
from summarizer import InsightSummarizer
from gemini_service import analyze_security_incidents


ROOT_DIR = Path(__file__).resolve().parents[1]
MODELS_DIR = ROOT_DIR / "models"

app = FastAPI(title="Cloud Log Summarization System", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

clusterer = LogClusterer(models_dir=MODELS_DIR)
summarizer = InsightSummarizer()


def _filter_analyses(items: List[Dict[str, Any]], search: Optional[str], severity: Optional[str]) -> List[Dict[str, Any]]:
    filtered = items

    if search:
        token = search.strip().lower()
        filtered = [
            item
            for item in filtered
            if token in (item.get("file_name", "").lower())
            or token in (item.get("summary", {}).get("summary_text", "").lower())
        ]

    if severity:
        sev = severity.upper()
        filtered = [
            item
            for item in filtered
            if item.get("summary", {}).get("severity", {}).get(sev, 0) > 0
        ]

    return filtered


@app.get("/")
def root() -> Dict[str, str]:
    return {"message": "Cloud Log Summarization API is running"}


@app.get("/health")
def health() -> Dict[str, str]:
    return {"status": "ok"}


@app.get("/analyses")
def analyses(limit: int = 10, search: Optional[str] = None, severity: Optional[str] = None) -> List[Dict[str, Any]]:
    records = get_recent_analyses(limit=50)
    records = _filter_analyses(records, search=search, severity=severity)
    return records[:limit]


@app.post("/upload-logs")
async def upload_logs(file: UploadFile = File(...)) -> Dict[str, Any]:
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file selected")

    suffix = Path(file.filename).suffix.lower()
    if suffix not in {".txt", ".log"}:
        raise HTTPException(status_code=400, detail="Only .txt and .log files are accepted")

    raw_bytes = await file.read()
    if not raw_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    raw_text = raw_bytes.decode("utf-8", errors="ignore")
    raw_logs = parse_log_text(raw_text)
    if not raw_logs:
        raise HTTPException(status_code=400, detail="No valid log lines found in file")

    processed_records = preprocess_with_metadata(raw_logs)
    if not processed_records:
        raise HTTPException(status_code=400, detail="No valid logs after preprocessing")

    processed_logs = [record["clean"] for record in processed_records]
    templates = [record["template"] for record in processed_records]

    labels, x_matrix = clusterer.fit_predict(processed_logs)
    cluster_distribution = clusterer.cluster_distribution(labels)
    top_terms_cluster = clusterer.top_terms_per_cluster(x_matrix, labels)

    summary = summarizer.generate_summary(
        raw_logs=raw_logs,
        processed_logs=processed_logs,
        templates=templates,
        records=processed_records,
        cluster_distribution=cluster_distribution,
        top_terms_per_cluster=top_terms_cluster,
    )

    response_payload: Dict[str, Any] = {
        "file_name": file.filename,
        "total_logs": len(raw_logs),
        "pipeline": {
            "log_collection": "uploaded_file",
            "preprocessing": "completed",
            "feature_extraction": "tfidf",
            "clustering": "kmeans",
            "summarization": "nlp_heuristic",
            "visualization": "frontend_dashboard",
        },
        "processed_preview": processed_records,
        "summary": summary,
    }

    save_result = save_analysis(response_payload)
    response_payload["storage"] = save_result
    return response_payload


class AnomaliesPayload(BaseModel):
    anomalies: List[Dict[str, Any]]

@app.post("/api/analyze-security")
async def analyze_security(payload: AnomaliesPayload) -> Dict[str, str]:
    analysis = analyze_security_incidents(payload.anomalies)
    return {"analysis": analysis}
