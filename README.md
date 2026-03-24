# Cloud Log Summarization System Using Natural Language Processing

This project implements the architecture from your paper as a complete end-to-end system:

1. Log Collection
2. Log Preprocessing
3. Feature Extraction (TF-IDF)
4. Log Clustering (K-Means)
5. NLP-Based Summarization
6. Visualization and Monitoring Dashboard

## Tech Stack

- Backend: FastAPI (Python)
- ML/NLP: Scikit-learn, NLTK-ready preprocessing pipeline
- Log Processing: Custom regex normalization + template extraction
- Frontend: React.js
- Visualization: Recharts
- Database: MongoDB (with in-memory fallback)
- Deployment: Docker

## Project Structure

```text
cloud-log-summarizer/
  backend/
    main.py
    log_processor.py
    summarizer.py
    clustering.py
    database.py
    requirements.txt
  frontend/
    public/
      index.html
    src/
      App.js
      App.css
      Dashboard.js
      UploadLogs.js
      SummaryView.js
      index.js
    package.json
  data/
    sample_logs.txt
  models/
    vectorizer.pkl
    clustering_model.pkl
  docker/
    Dockerfile
  README.md
```

## Architecture Mapping (Paper -> Implementation)

- Log Collection Layer:
  - File upload API receives `.txt` and `.log` logs.
- Centralized Storage:
  - Analysis records are persisted in MongoDB (`analyses` collection).
- Preprocessing Module:
  - Timestamp/IP/ID stripping
  - Lowercasing + token cleanup
  - Template normalization with placeholders (`<num>`, `<ip>`, `<id>`, `<uuid>`)
- Feature Extraction Layer:
  - TF-IDF vectorization over cleaned log text
- Log Clustering Module:
  - K-Means clustering and cluster distribution
- NLP-Based Summarization Engine:
  - Severity statistics
  - Top keywords
  - Frequent event templates
  - Sequence transitions (`event A -> event B`)
  - Prioritized incidents (error-first ranking)
  - Timeline events
- Natural Language Generation (NLG) Layer:
  - Converts structured analysis into human-readable narratives
  - Executive summary with error/warning/info breakdown
  - System behavior descriptions
  - Per-incident human-readable explanations
  - Cluster behavior interpretations
  - Event sequence pattern narratives
- Visualization Dashboard:
  - KPI tiles, severity pie chart, keywords bar chart
  - Executive summary display
  - System behavior narratives
  - Critical incident descriptions
  - Incident timeline
  - Transition chips
  - Search and severity filtering for previous analyses

## API Endpoints

Base URL: `http://localhost:8000`

- `GET /health`
- `GET /analyses?limit=12&search=...&severity=ERROR|WARNING|INFO`
- `POST /upload-logs` (multipart form-data with file)

### Upload Constraints

- Supported file types: `.txt`, `.log`
- UTF-8 text is expected

## Natural Language Generation (NLG) Features

The system converts structured log analysis into human-readable narratives that system administrators can easily understand:

### NLG Output Examples

1. **Executive Summary**: "Log analysis processed 1250 entries and identified 87 critical errors, 156 warnings, 1007 info events. The system exhibited behavior patterns involving database, connection, timeout. Immediate attention recommended for error resolution."

2. **Incident Narratives**: "**ERROR** at 2024-01-15 14:32:45: The system experienced connection timeouts, indicating potential network issues or overloaded services."

3. **Behavior Patterns**: "The system displayed behavior involving database, connection, timeout, error. Primary transition pattern: Event sequence auth_check -> request_processing -> response_sent."

4. **Cluster Descriptions**: "Cluster_0 contains 89 related log entries primarily involving: connect, error, database."

### NLG Implementation Details

- **NaturalLanguageGenerator Class**: Located in `summarizer.py`, generates narratives from analysis data
- **Semantic Interpretation**: Maps technical keywords to human-readable explanations (e.g., "timeout" → "potential network issues or overloaded services")
- **Contextual Descriptions**: Includes severity levels, execution counts, and system behavior patterns
- **Template-Based**: Uses predefined narrative templates that adapt to data

### Test NLG Functionality

```bash
cd backend
python test_nlg.py
```

This demonstrates narrative generation with sample data.

```bash
cd cloud-log-summarizer/backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

## Frontend Setup

```bash
cd cloud-log-summarizer/frontend
npm install
npm start
```

Optional API base override:

```bash
set REACT_APP_API_BASE=http://localhost:8000
```

## Docker (Backend)

```bash
cd cloud-log-summarizer
docker build -f docker/Dockerfile -t cloud-log-summarizer-api .
docker run -p 8000:8000 -e MONGO_URI=mongodb://host.docker.internal:27017 cloud-log-summarizer-api
```

## Verification Performed

- Backend syntax compile check (`python -m compileall`): passed
- Frontend production build (`npm run build`): passed

## Notes

- `models/vectorizer.pkl` and `models/clustering_model.pkl` are updated automatically as analyses run.
- If MongoDB is unavailable, the system still works using memory-backed storage for recent analyses.
