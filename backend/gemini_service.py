import os
import google.generativeai as genai
from typing import List, Dict, Any
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

def analyze_security_incidents(anomalies: List[Dict[str, Any]]) -> str:
    if not GEMINI_API_KEY:
        return "AI Analysis Engine is not authorized. Please check your backend/.env configuration and restart the server."
    
    if not anomalies:
        return "No anomalies detected to analyze."

    prompt = (
        "You are an expert Cloud Security Architect. Analyze the following security anomalies detected in our cloud logs. "
        "Provide a concise, professional assessment containing:\n"
        "1. **Overall Impact**: Severity and potential system impact.\n"
        "2. **Root Cause Analysis**: What likely caused these anomalies based on the evidence.\n"
        "3. **Recommended Mitigations**: Concrete steps to resolve or mitigate these threats.\n\n"
        f"Anomalies Data:\n{anomalies}\n\n"
        "Format your response using Markdown. Keep it strictly brief and actionable.\n"
        "CRITICAL: Do NOT output ANY conversational introductory sentences (like 'Here is the assessment'). "
        "Start your output immediately with the '### 1. Overall Impact' header."
    )
    
    try:
        model = genai.GenerativeModel('gemini-2.5-flash')
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        return f"Error during AI Analysis: {str(e)}"

def analyze_single_log(
    log_line: str,
    template: str = "",
    severity: str = "",
    metadata: Dict[str, str] = {}
) -> Dict[str, Any]:
    """Use Gemini to produce a full structured breakdown of a single cloud log line."""
    if not GEMINI_API_KEY:
        return {"error": "AI Analysis Engine is not authorized. Configure GEMINI_API_KEY in backend/.env."}

    if not log_line:
        return {"error": "No log line provided for analysis."}

    meta_str = "\n".join([f"  - {k}: {v}" for k, v in metadata.items()]) if metadata else "  - None detected"

    prompt = (
        "You are an expert Cloud Infrastructure Engineer and Security Analyst. "
        "Analyze the following cloud log entry and provide a structured breakdown.\n\n"
        f"**Raw Log Line:**\n```\n{log_line}\n```\n\n"
        f"**Detected Severity:** {severity or 'Unknown'}\n"
        f"**Drain3 Parsed Template:** {template or 'N/A'}\n"
        f"**Extracted Metadata:**\n{meta_str}\n\n"
        "Respond ONLY with a valid JSON object (no markdown, no code fences) with these exact keys:\n"
        "- summary: one-sentence plain-English explanation of what happened\n"
        "- severity_reasoning: why this log is at this severity level\n"
        "- cloud_resources: list all cloud resources involved (EC2, S3, IAM, Lambda, region, IP, user)\n"
        "- root_cause: most likely root cause\n"
        "- impact: potential impact on the system\n"
        "- recommended_action: concrete next step for an engineer\n"
        "- related_aws_services: list of AWS services relevant to this log\n"
    )

    try:
        model = genai.GenerativeModel('gemini-2.5-flash')
        response = model.generate_content(prompt)
        import json
        text = response.text.strip()
        if text.startswith("```"):
            text = "\n".join(text.split("\n")[1:])
            if text.endswith("```"):
                text = text[:-3]
        return json.loads(text.strip())
    except Exception as e:
        return {
            "summary": f"AI analysis failed: {str(e)}. Review log manually.",
            "severity_reasoning": severity,
            "cloud_resources": list(metadata.values()),
            "root_cause": "Could not determine automatically.",
            "impact": "Unknown — review manually.",
            "recommended_action": "Inspect the raw log line and correlate with CloudWatch or CloudTrail.",
            "related_aws_services": []
        }
