"""
convert_to_log.py
=================
Converts AWS CloudTrail CSV files (cloud/nineteenFeaturesDf.csv or
cloud/dec12_18features.csv) into plain .log files that the
Cloud Log Summarization backend can process.

Usage:
    python convert_to_log.py                    # default: 2000 rows
    python convert_to_log.py --rows 5000        # custom row count
    python convert_to_log.py --file dec12_18features.csv --rows 1000

Output:
    cloud/aws_cloudtrail_sample.log   (ready to upload via the dashboard)
"""

import csv
import os
import argparse
import random
from datetime import datetime

# ── Severity mapping ──────────────────────────────────────────────
def determine_severity(row: dict) -> str:
    error_code = (row.get("errorCode") or "").strip().lower()
    error_msg  = (row.get("errorMessage") or "").strip().lower()

    if not error_code or error_code in ("none", "noerror", ""):
        return "INFO"

    critical_keywords = ["denied", "unauthorized", "forbidden", "invalid", "failed",
                         "exception", "error", "throttl", "limit", "quota"]
    warn_keywords     = ["warn", "timeout", "retry", "deprecated", "notfound"]

    combined = error_code + " " + error_msg
    if any(kw in combined for kw in critical_keywords):
        return "ERROR"
    if any(kw in combined for kw in warn_keywords):
        return "WARNING"
    return "INFO"


# ── Format one CSV row as a log line ─────────────────────────────
def format_log_line(row: dict) -> str:
    timestamp   = (row.get("eventTime") or "1970-01-01T00:00:00Z").strip()
    severity    = determine_severity(row)
    event_name  = (row.get("eventName")  or "UnknownEvent").strip()
    event_src   = (row.get("eventSource") or "unknown.amazonaws.com").strip()
    region      = (row.get("awsRegion")  or "us-east-1").strip()
    source_ip   = (row.get("sourceIPAddress") or "0.0.0.0").strip()
    user_agent  = (row.get("userAgent")  or "-").strip()
    identity    = (row.get("userIdentitytype") or "Unknown").strip()
    username    = (row.get("userIdentityuserName") or
                   row.get("userIdentityprincipalId") or "unknown").strip()
    error_code  = (row.get("errorCode")  or "None").strip()
    error_msg   = (row.get("errorMessage") or "").strip()
    request_id  = (row.get("requestID")  or row.get("eventID") or "-").strip()[:16]

    # Build the message part
    msg_parts = [f"{event_src} {event_name}"]
    if error_code and error_code.lower() not in ("none", "noerror", ""):
        msg_parts.append(f"- {error_code}")
        if error_msg:
            msg_parts.append(f": {error_msg[:120]}")
    else:
        msg_parts.append("- Success")

    message = " ".join(msg_parts)

    # Final log line format that the backend regex can parse
    return (
        f"{timestamp} {severity} [{event_src}] [{region}] "
        f"user={username} ({identity}) ip={source_ip} "
        f"req={request_id} ua=\"{user_agent[:60]}\" "
        f"{message}"
    )


# ── Main ──────────────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(description="AWS CloudTrail CSV → .log converter")
    parser.add_argument("--file",  default="nineteenFeaturesDf.csv",
                        help="CSV filename inside the cloud/ folder")
    parser.add_argument("--rows",  type=int, default=2000,
                        help="Number of rows to convert (default: 2000)")
    parser.add_argument("--shuffle", action="store_true",
                        help="Shuffle rows before selecting (gives varied sample)")
    args = parser.parse_args()

    script_dir = os.path.dirname(os.path.abspath(__file__))
    csv_path   = os.path.join(script_dir, args.file)
    out_path   = os.path.join(script_dir, "aws_cloudtrail_sample.log")

    if not os.path.exists(csv_path):
        print(f"ERROR: File not found: {csv_path}")
        print("Available files:", [f for f in os.listdir(script_dir) if f.endswith(".csv")])
        return

    print(f"Reading: {args.file}  (size: {os.path.getsize(csv_path) / 1024**2:.0f} MB)")
    print(f"Extracting {args.rows} rows → {out_path}")

    rows_read = 0
    row_buffer = []

    with open(csv_path, encoding="utf-8", errors="replace") as fh:
        reader = csv.DictReader(fh)
        for row in reader:
            row_buffer.append(row)
            rows_read += 1
            # For large files, stop reading early unless shuffling
            if not args.shuffle and rows_read >= args.rows:
                break
            # Cap buffer to avoid loading the whole file into RAM
            if args.shuffle and rows_read >= min(args.rows * 10, 100_000):
                break

    if args.shuffle:
        random.shuffle(row_buffer)

    selected = row_buffer[: args.rows]

    # Sort by timestamp so the timeline chart makes sense
    def sort_key(r):
        try:
            return datetime.fromisoformat(
                (r.get("eventTime") or "1970-01-01T00:00:00Z")
                .replace("Z", "+00:00")
            )
        except Exception:
            return datetime.min

    selected.sort(key=sort_key)

    # Write output
    written = 0
    severity_counts = {"ERROR": 0, "WARNING": 0, "INFO": 0}

    with open(out_path, "w", encoding="utf-8") as out:
        for row in selected:
            line = format_log_line(row)
            out.write(line + "\n")
            sev = determine_severity(row)
            severity_counts[sev] += 1
            written += 1

    print(f"\n✅ Done! Written {written} log lines to:")
    print(f"   {out_path}")
    print(f"\nSeverity breakdown:")
    for sev, count in severity_counts.items():
        bar = "█" * (count * 30 // max(written, 1))
        print(f"   {sev:<8} {count:>5}  {bar}")
    print(f"\nUpload  aws_cloudtrail_sample.log  via the dashboard to test the pipeline.")


if __name__ == "__main__":
    main()
