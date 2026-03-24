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
