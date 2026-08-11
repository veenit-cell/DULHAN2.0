import os
import json
import hashlib
from datetime import datetime, timezone

WORM_LOG_FILE = "dulhan_audit_worm.log"

def write_worm_log(event_type: str, payload_data: dict, institution_id: str = "SYSTEM"):
    """
    Simulates a WORM (Write-Once-Read-Many) compliant immutable log append.
    Now requires the acting Institution_ID for DPDP/RBI AML compliance.
    Uses SHA-256 for deterministic, verifiable payload hashing.
    """
    payload_str = json.dumps(payload_data, sort_keys=True, default=str)
    payload_hash = hashlib.sha256(payload_str.encode()).hexdigest()
    
    log_entry = {
        "timestamp_utc": datetime.now(timezone.utc).isoformat(),
        "institution_id": institution_id,
        "event_type": event_type,
        "payload_hash": payload_hash,
        "data": payload_data
    }
    
    with open(WORM_LOG_FILE, "a") as f:
        f.write(json.dumps(log_entry, default=str) + "\n")

