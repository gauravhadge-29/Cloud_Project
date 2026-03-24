from collections import Counter
from typing import Dict, List, Tuple
import networkx as nx
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.feature_extraction.text import TfidfVectorizer
from transformers import AutoModelForSeq2SeqLM, AutoTokenizer
import re

_t5_tokenizer = None
_t5_model = None

def get_t5_model_tokenizer():
    global _t5_model, _t5_tokenizer
    if _t5_model is None:
        _t5_tokenizer = AutoTokenizer.from_pretrained("t5-small")
        _t5_model = AutoModelForSeq2SeqLM.from_pretrained("t5-small")
    return _t5_model, _t5_tokenizer

SEVERITY_KEYWORDS = {
    "ERROR": ["error", "failed", "exception", "timeout", "unavailable", "critical", "denied"],
    "WARNING": ["warn", "warning", "slow", "degraded", "high", "retry"],
    "INFO": ["info", "started", "completed", "healthy", "success"],
}

SEVERITY_PRIORITY = {"ERROR": 3, "WARNING": 2, "INFO": 1}

# Natural language templates for narrative generation
ERROR_NARRATIVES = {
    "timeout": "The system experienced connection timeouts, indicating potential network issues or overloaded services.",
    "failed": "Multiple failed operations were detected, suggesting service unavailability or resource exhaustion.",
    "exception": "The system encountered unexpected exceptions, indicating runtime errors in application logic.",
    "unavailable": "Critical services became unavailable during the analysis period, impacting system reliability.",
    "denied": "Authentication or authorization failures were detected, suggesting permission or credential issues.",
    "critical": "Critical errors occurred that require immediate attention to prevent system failure.",
    "database": "Database operations encountered issues, potentially affecting data consistency and application performance.",
    "connection": "Connection establishment failed, indicating network connectivity or service availability problems.",
    "memory": "Memory-related errors were detected, suggesting potential memory leaks or resource constraints.",
    "cpu": "CPU usage exceeded normal thresholds, indicating potential performance bottlenecks or inefficient processing.",
}

WARNING_NARRATIVES = {
    "slow": "System response times were slower than normal, affecting user experience.",
    "high": "Resource utilization reached elevated levels, approaching capacity limits.",
    "retry": "Failed operations required retry attempts, indicating transient issues.",
    "degraded": "System functionality was degraded, with reduced performance or availability.",
}

INFO_NARRATIVES = {
    "started": "Services and processes started successfully.",
    "completed": "Operations completed without errors.",
    "healthy": "System health check passed, confirming normal operation.",
    "success": "Actions executed successfully.",
}


class NaturalLanguageGenerator:
    """Generates human-readable narratives from log analysis."""

    @staticmethod
    def generate_incident_narrative(incident: Dict[str, str], context: str = "") -> str:
        """Return a clean, human-readable NLP explanation for a single incident."""
        severity  = incident.get("severity", "UNKNOWN")
        timestamp = incident.get("timestamp", "Unknown time")
        message   = incident.get("message", "")

        msg_lower = message.lower()

        # Try to match a domain-specific narrative from ERROR_NARRATIVES
        if severity == "ERROR":
            for term, narrative in ERROR_NARRATIVES.items():
                if term in msg_lower:
                    return narrative

        # Try WARNING_NARRATIVES
        if severity == "WARNING":
            for term, narrative in WARNING_NARRATIVES.items():
                if term in msg_lower:
                    return narrative

        # INFO narratives
        if severity == "INFO":
            for term, narrative in INFO_NARRATIVES.items():
                if term in msg_lower:
                    return narrative

        # Generic fallback
        if severity == "ERROR":
            return "An error occurred during this cloud operation. Review the API error code and check IAM permissions, resource availability, and service health."
        if severity == "WARNING":
            return "A warning was detected. Monitor this pattern — repeated occurrences may indicate a configuration issue or capacity constraint."
        return "Routine cloud infrastructure API call logged for audit and compliance purposes."

    @staticmethod
    def generate_cluster_narrative(cluster_id: str, count: int, top_terms: List[str]) -> str:
        """Create a readable description of a log cluster."""
        term_str = ", ".join(top_terms[:3]) if top_terms else "N/A"
        return f"{cluster_id} contains {count} related log entries primarily involving: {term_str}."

    @staticmethod
    def generate_transition_narrative(transition: str) -> str:
        """Create a readable description of an event sequence."""
        parts = transition.split(" -> ")
        if len(parts) == 2:
            from_state = parts[0].replace(" ", " ").strip()
            to_state = parts[1].replace(" ", " ").strip()
            return f"System transitioned from '{from_state}' to '{to_state}'."
        return f"Event sequence: {transition}."

    @staticmethod
    def generate_executive_summary(
        total_logs: int,
        severity: Dict[str, int],
        top_keywords: List[Dict[str, int]],
        cluster_count: int,
        extractive_text: str = ""
    ) -> str:
        """Generate a high-level executive summary using abstractive T5 summarization."""
        error_count = severity.get("ERROR", 0)
        
        prompt = f"summarize: The system processed {total_logs} logs with {error_count} errors across {cluster_count} clusters. {extractive_text}"
        try:
            model, tokenizer = get_t5_model_tokenizer()
            # T5 requires appropriate max length
            input_len = len(prompt.split())
            max_len = max(35, min(100, input_len + 30))
            
            inputs = tokenizer(prompt, return_tensors="pt")
            outputs = model.generate(**inputs, max_length=max_len, min_length=15, do_sample=False)
            narrative = tokenizer.decode(outputs[0], skip_special_tokens=True)
            
            # Capitalize first letter cleanly
            if narrative:
                narrative = narrative[0].upper() + narrative[1:]
        except Exception as e:
            narrative = f"Analysis of {total_logs} logs (T5 abstractive generation failed: {str(e)}). Fallback: {extractive_text[:100]}..."

        return narrative.strip()

    @staticmethod
    def generate_behavior_narrative(
        top_keywords: List[Dict[str, int]], transitions: List[Dict[str, int]]
    ) -> str:
        """Generate a narrative about system behavior patterns."""
        if not top_keywords:
            return "No significant behavior patterns detected."

        key_behaviors = [item["term"] for item in top_keywords[:4]]
        behavior_str = ", ".join(key_behaviors)

        narrative = f"The system displayed behavior involving {behavior_str}. "

        if transitions:
            top_transition = transitions[0]
            transition_desc = NaturalLanguageGenerator.generate_transition_narrative(
                top_transition.get("transition", "")
            )
            narrative += f"Primary transition pattern: {transition_desc}"

        return narrative.strip()


class InsightSummarizer:
    def detect_severity(self, line: str) -> str:
        lower = line.lower()
        for severity, keywords in SEVERITY_KEYWORDS.items():
            if any(keyword in lower for keyword in keywords):
                return severity
        return "INFO"

    def severity_breakdown(self, raw_logs: List[str]) -> Dict[str, int]:
        counts = {"ERROR": 0, "WARNING": 0, "INFO": 0}
        for line in raw_logs:
            counts[self.detect_severity(line)] += 1
        return counts

    def top_keywords(self, processed_logs: List[str], top_n: int = 12) -> List[Dict[str, int]]:
        if not processed_logs:
            return []

        # Domain-specific and system stop words
        stop_words = {
            'amazonaws', 'com', 'net', 'org', 'info', 'warn', 'error', 'debug', 
            'success', 'failed', 'user', 'req', 'root', 'admin', 'http', 'https',
            '<id>', '<ip>', '<num>', '<timestamp>', '<hex>', 'date', 'time', 'ec2'
        }

        filtered_logs = []
        for line in processed_logs:
            tokens = [t.lower() for t in line.split() if len(t) > 2 and not t.isdigit() and t.lower() not in stop_words]
            filtered_logs.append(" ".join(tokens))
            
        if not any(filtered_logs):
            return []

        try:
            vectorizer = TfidfVectorizer(max_df=0.85)
            tfidf_matrix = vectorizer.fit_transform(filtered_logs)
            feature_names = vectorizer.get_feature_names_out()
            sum_tfidf = tfidf_matrix.sum(axis=0).A1
            
            term_scores = [(feature_names[i], sum_tfidf[i]) for i in range(len(feature_names))]
            term_scores.sort(key=lambda x: x[1], reverse=True)
            
            # Scale scores to make them nice integers for the frontend bar chart
            return [{"term": term, "count": int(score * 20)} for term, score in term_scores[:top_n] if score > 0]
        except Exception:
            # Fallback
            tokens = []
            for line in filtered_logs:
                tokens.extend(line.split())
            counts = Counter(tokens)
            return [{"term": term, "count": count} for term, count in counts.most_common(top_n)]

    def event_templates(self, templates: List[str], top_n: int = 8) -> List[Dict[str, int | str]]:
        template_counts = Counter(templates)
        return [{"template": temp, "count": count} for temp, count in template_counts.most_common(top_n)]

    def sequence_transitions(self, templates: List[str], top_n: int = 8) -> List[Dict[str, int | str]]:
        if len(templates) < 2:
            return []

        pairs = [f"{templates[i]} -> {templates[i + 1]}" for i in range(len(templates) - 1)]
        pair_counts = Counter(pairs)
        return [{"transition": pair, "count": count} for pair, count in pair_counts.most_common(top_n)]

    def prioritize_incidents(self, records: List[Dict[str, str]]) -> List[Dict[str, object]]:
        """Return ALL incidents sorted by severity score (ERROR first, then WARNING, INFO)."""
        ranked: List[Tuple[int, Dict[str, object]]] = []
        for item in records:
            raw = item["raw"]
            severity = self.detect_severity(raw)
            score = SEVERITY_PRIORITY[severity]
            
            # --- Extract Metadata ---
            metadata = {}
            
            # Extract IP
            ip_match = re.search(r'\b(?:\d{1,3}\.){3}\d{1,3}\b', raw)
            if ip_match: metadata["IP Address"] = ip_match.group(0)
                
            # Extract EC2 Instance
            ec2_match = re.search(r'i-[0-9a-fA-F]{8,17}', raw)
            if ec2_match: metadata["EC2 Instance"] = ec2_match.group(0)
                
            # Extract Region
            region_match = re.search(r'(us|eu|ap|sa|ca|me|af)-(east|west|central|north|south)-\d', raw)
            if region_match: metadata["Region"] = region_match.group(0)
                
            # Extract User
            user_match = re.search(r'user[=:\s]+([a-zA-Z0-9.\-_]+)', raw, re.IGNORECASE)
            if user_match: metadata["User"] = user_match.group(1)
                
            # Extract Request ID
            req_match = re.search(r'[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}', raw)
            if req_match: metadata["Request ID"] = req_match.group(0)
            
            ranked.append(
                (
                    score,
                    {
                        "severity": severity,
                        "timestamp": item["timestamp"],
                        "message": raw,
                        "template": item["template"],
                        "priority_score": score,
                        "metadata": metadata
                    },
                )
            )
        ranked.sort(key=lambda x: x[0], reverse=True)
        return [payload for _, payload in ranked]

    def timeline(self, records: List[Dict[str, str]], max_items: int = 25) -> List[Dict[str, str]]:
        return [
            {
                "timestamp": item["timestamp"],
                "severity": self.detect_severity(item["raw"]),
                "event": item["template"],
            }
            for item in records[:max_items]
        ]

    def generate_summary(
        self,
        raw_logs: List[str],
        processed_logs: List[str],
        templates: List[str],
        records: List[Dict[str, str]],
        cluster_distribution: Dict[str, int],
        top_terms_per_cluster: Dict[str, List[str]],
    ) -> Dict[str, object]:
        total_logs = len(raw_logs)
        severity = self.severity_breakdown(raw_logs)
        top_terms = self.top_keywords(processed_logs)
        event_templates = self.event_templates(templates)
        transitions = self.sequence_transitions(templates)
        prioritized_incidents = self.prioritize_incidents(records)

        # Extractive Summarization (Centrality Ranking)
        unique_templates = list(set(templates))
        extractive_summary = "No significant patterns."
        if len(unique_templates) > 1:
            try:
                tfidf = TfidfVectorizer().fit_transform(unique_templates)
                sim_matrix = cosine_similarity(tfidf)
                nx_graph = nx.from_numpy_array(sim_matrix)
                scores = nx.pagerank(nx_graph)
                ranked = sorted(((scores[i], s) for i, s in enumerate(unique_templates)), reverse=True)
                extractive_summary = " ".join([s for score, s in ranked[:5]])
            except Exception:
                extractive_summary = " ".join(unique_templates[:5])
        elif len(unique_templates) == 1:
            extractive_summary = unique_templates[0]

        # Generate natural language narratives
        nlg = NaturalLanguageGenerator()
        behavior_narrative = nlg.generate_behavior_narrative(top_terms, transitions)

        executive_summary = nlg.generate_executive_summary(
            total_logs=total_logs,
            severity=severity,
            top_keywords=top_terms,
            cluster_count=len(cluster_distribution),
            extractive_text=behavior_narrative
        )

        # Generate human-readable incident descriptions
        incident_narratives = [
            nlg.generate_incident_narrative(incident) for incident in prioritized_incidents
        ]

        # Generate cluster descriptions
        cluster_narratives = []
        for cluster_id, count in sorted(cluster_distribution.items(), key=lambda x: x[1], reverse=True)[:5]:
            top_terms_for_cluster = top_terms_per_cluster.get(cluster_id, [])
            narrative = nlg.generate_cluster_narrative(cluster_id, count, top_terms_for_cluster)
            cluster_narratives.append(narrative)

        # Generate transition narratives
        transition_narratives = [
            {"transition": t["transition"], "narrative": nlg.generate_transition_narrative(t["transition"]), "count": t["count"]}
            for t in transitions[:4]
        ]

        return {
            "executive_summary": executive_summary,
            "behavior_narrative": behavior_narrative,
            "incident_narratives": incident_narratives,
            "cluster_narratives": cluster_narratives,
            "transition_narratives": transition_narratives,
            "severity": severity,
            "top_keywords": top_terms,
            "event_templates": event_templates,
            "sequence_transitions": transitions,
            "cluster_distribution": cluster_distribution,
            "top_terms_per_cluster": top_terms_per_cluster,
            "prioritized_incidents": prioritized_incidents,
            "timeline": self.timeline(records),
        }
