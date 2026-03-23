import json
from datetime import datetime

WORM_LOG_FILE = "satark_audit_worm.log"

def write_worm_log(event_type: str, details: dict):
    """
    Simulates a Write-Once-Read-Many (WORM) compliant audit log entry.
    All entries are append-only.
    Valid event_types: API_INGESTION, EPOCH_ROTATION, THREAT_ALERT
    """
    entry = {
        "timestamp": datetime.now().isoformat() + "Z",
        "event": event_type,
        "payload": details
    }
    with open(WORM_LOG_FILE, "a") as f:
        f.write(json.dumps(entry) + "\n")
