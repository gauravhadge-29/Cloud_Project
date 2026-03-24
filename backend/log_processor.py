import re
from typing import Any, Dict, List, Optional
from drain3 import TemplateMiner
from drain3.template_miner_config import TemplateMinerConfig


TIMESTAMP_PATTERN = re.compile(
    r"\b(?:\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}(?:,\d+|\.\d+)?Z?|"
    r"\d{2}/\d{2}/\d{4}[\sT]\d{2}:\d{2}:\d{2})\b"
)
IP_PATTERN = re.compile(r"\b(?:\d{1,3}\.){3}\d{1,3}\b")
UUID_PATTERN = re.compile(
    r"\b[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\b"
)
HEX_ID_PATTERN = re.compile(r"\b(?:id|request_id|trace_id|session_id)[=:]\s*[A-Za-z0-9\-_]+\b", re.IGNORECASE)
GENERIC_ID_PATTERN = re.compile(r"\b[a-f0-9]{12,}\b", re.IGNORECASE)
NUMBER_PATTERN = re.compile(r"\b\d+\b")
MULTISPACE_PATTERN = re.compile(r"\s+")

# ── NLP Rule-based explainer ──────────────────────────────────────────────────
# Maps (pattern, explanation) — first match wins.
EXPLAIN_RULES: List[tuple] = [
    # Access / permission errors
    (re.compile(r"unauthorizedoperation|not authorized|accessdenied|client\.unauthorized", re.I),
     "Access denied — the user or role does not have permission to perform this action."),
    (re.compile(r"invaliduserid|invalid user", re.I),
     "The user ID provided is malformed or does not exist in the system."),
    # Not found
    (re.compile(r"nosuchentity|not found|notfound|nosuchbucket|nosuchkey", re.I),
     "The requested resource does not exist. It may have been deleted or the name is incorrect."),
    (re.compile(r"notfoundexception|invalidrest\s*api|invalid.*identifier", re.I),
     "An API resource (REST API, method, or stage) referenced in the request could not be found."),
    # Replication / config missing
    (re.compile(r"replicationconfigurationnotfounderror", re.I),
     "S3 bucket replication is not configured. This is informational — no replication rule exists on this bucket."),
    # Lifecycle / website / CORS not configured
    (re.compile(r"nosuchlifecycleconfiguration", re.I),
     "No lifecycle policy is set on this S3 bucket. Objects will not auto-expire unless a rule is added."),
    (re.compile(r"nosuchwebsiteconfiguration", re.I),
     "S3 static website hosting is not enabled on this bucket."),
    (re.compile(r"nosuchcorsconfiguration", re.I),
     "No CORS (Cross-Origin Resource Sharing) policy is configured on this S3 bucket."),
    (re.compile(r"nosuchtagset", re.I),
     "No tags are attached to this S3 bucket."),
    # Password policy
    (re.compile(r"passwordpolicy.*not found|nosuchentity.*password", re.I),
     "No IAM password policy is configured for this AWS account. Setting one is a security best practice."),
    # Lambda errors
    (re.compile(r"invalidparametervalueexception.*lambda|role.*cannot be assumed", re.I),
     "Lambda cannot assume the specified IAM execution role. Check that the trust policy allows lambda.amazonaws.com."),
    (re.compile(r"resourcenotfoundexception.*lambda|resource.*does not exist", re.I),
     "The Lambda function or alias referenced does not exist. It may not have been deployed yet."),
    # API Gateway
    (re.compile(r"badrequestexception.*authorizer.*already exists", re.I),
     "A Lambda authorizer with this name already exists in the API Gateway REST API. Rename or delete the existing one."),
    (re.compile(r"invalid method identifier|invalid response status", re.I),
     "The API Gateway method or response configuration is invalid. Check the HTTP method and status code settings."),
    # Timeout / connection
    (re.compile(r"timeout|timed out", re.I),
     "The operation timed out. The service may be slow or the connection was dropped. Consider increasing retry limits."),
    (re.compile(r"connection refused|connectionrefused", re.I),
     "Connection was refused by the target service. Verify the service is running and the port is open."),
    # Authentication
    (re.compile(r"authfailure|authentication failed|invalid.*credentials", re.I),
     "Authentication failed. The access key, secret, or token is incorrect or has expired."),
    # Throttling
    (re.compile(r"throttl|rate exceeded|requestlimitexceeded", re.I),
     "Request rate limit exceeded. The API is throttling calls — add exponential back-off and retry logic."),
    # Assume role (normal)
    (re.compile(r"assumerole.*success", re.I),
     "A service or user assumed an IAM role successfully, gaining temporary credentials for cross-service access."),
    # CloudTrail / config
    (re.compile(r"describetrails|startlogging", re.I),
     "CloudTrail activity: listing or starting audit logging for this AWS account."),
    # S3 read/write success
    (re.compile(r"getbucket|listbucket|putbucket", re.I),
     "S3 bucket configuration or listing operation completed. Routine bucket management activity."),
    # EC2 describe
    (re.compile(r"describeinstances|describeSnapshots|describeVolumes", re.I),
     "EC2 metadata lookup — fetching information about instances, snapshots, or volumes. Normal monitoring activity."),
    # IAM reads
    (re.compile(r"getpolicy|listpolicies|getaccountsummary", re.I),
     "IAM policy read — the user is inspecting permission policies. Routine administration."),
    # Lambda success
    (re.compile(r"listfunctions|getfunction.*success", re.I),
     "Lambda function listing or metadata fetch completed successfully."),
    # Log stream
    (re.compile(r"createlogstream.*success", re.I),
     "CloudWatch Logs: a new log stream was created. Lambda or another service is writing execution logs."),
    # Generic success
    (re.compile(r"success|completed", re.I),
     "Operation completed successfully. No issues detected."),
    # Generic error fallback
    (re.compile(r"error|fail|exception", re.I),
     "An error occurred during this operation. Review the error code and message for the specific cause."),
]


def explain_log_line(raw_line: str) -> str:
    """Return a short plain-English explanation of a single raw log line."""
    for pattern, explanation in EXPLAIN_RULES:
        if pattern.search(raw_line):
            return explanation
    return "Routine cloud infrastructure API call with no error or anomaly detected."


def parse_log_text(raw_text: str) -> List[str]:
    lines = [line.strip() for line in raw_text.splitlines()]
    return [line for line in lines if line]


def extract_timestamp(line: str) -> Optional[str]:
    match = TIMESTAMP_PATTERN.search(line)
    if not match:
        return None
    return match.group(0)


def preprocess_log_line(line: str) -> str:
    line = TIMESTAMP_PATTERN.sub(" ", line)
    line = IP_PATTERN.sub(" <ip> ", line)
    line = UUID_PATTERN.sub(" <uuid> ", line)
    line = HEX_ID_PATTERN.sub(" <id> ", line)
    line = GENERIC_ID_PATTERN.sub(" <id> ", line)

    line = line.lower()
    line = re.sub(r"[^a-z0-9\s\-_:<>]", " ", line)
    line = MULTISPACE_PATTERN.sub(" ", line).strip()
    return line


def build_drain_parser():
    config = TemplateMinerConfig()
    config.profiling_enabled = False
    return TemplateMiner(persistence_handler=None, config=config)


def tokenize_log_line(clean_line: str) -> List[str]:
    return [token for token in clean_line.split(" ") if token]


def preprocess_logs(lines: List[str]) -> List[str]:
    processed: List[str] = []
    for line in lines:
        clean_line = preprocess_log_line(line)
        if clean_line:
            processed.append(clean_line)
    return processed


def extract_metadata_from_log(raw: str) -> Dict[str, str]:
    metadata = {}
    
    # Extract Service name (e.g. s3.amazonaws.com -> s3)
    service_match = re.search(r'\[([a-zA-Z0-9.\-_]+\.amazonaws\.com)\]', raw)
    if service_match: metadata["Service"] = service_match.group(1).split('.')[0].upper()
    
    # Extract IP
    ip_match = re.search(r'\b(?:\d{1,3}\.){3}\d{1,3}\b', raw)
    if ip_match: metadata["IP"] = ip_match.group(0)
        
    # Extract EC2 Instance
    ec2_match = re.search(r'i-[0-9a-fA-F]{8,17}', raw)
    if ec2_match: metadata["EC2"] = ec2_match.group(0)
        
    # Extract Region
    region_match = re.search(r'(us|eu|ap|sa|ca|me|af)-(east|west|central|north|south)-\d', raw)
    if region_match: metadata["Region"] = region_match.group(0)
        
    # Extract User
    user_match = re.search(r'user[=:\s]+([a-zA-Z0-9.\-_]+)', raw, re.IGNORECASE)
    if user_match: metadata["User"] = user_match.group(1)
        
    return metadata


def preprocess_with_metadata(lines: List[str]) -> List[Dict[str, Any]]:
    records: List[Dict[str, Any]] = []
    miner = build_drain_parser()
    
    for line in lines:
        clean_line = preprocess_log_line(line)
        if not clean_line:
            continue

        result = miner.add_log_message(clean_line)
        template = result.get("template_mined", clean_line)

        records.append(
            {
                "raw": line,
                "timestamp": extract_timestamp(line) or "N/A",
                "clean": clean_line,
                "template": template,
                "explanation": explain_log_line(line),
                "metadata": extract_metadata_from_log(line),
            }
        )

    return records
