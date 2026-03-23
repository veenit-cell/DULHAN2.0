import os
import json
from datetime import datetime, timezone

WORM_LOG_FILE = "satark_audit_worm.log"

def write_worm_log(event_type: str, payload_data: dict, institution_id: str = "SYSTEM"):
    """
    Simulates a WORM (Write-Once-Read-Many) compliant immutable log append.
    Now requires the acting Institution_ID for DPDP/RBI AML compliance.
    """
    log_entry = {
        "timestamp_utc": datetime.now(timezone.utc).isoformat(),
        "institution_id": institution_id,
        "event_type": event_type,
        "payload_hash": hash(str(payload_data)), # Mock hash of payload
        "data": payload_data
    }
    
    with open(WORM_LOG_FILE, "a") as f:
        f.write(json.dumps(log_entry) + "\n")
