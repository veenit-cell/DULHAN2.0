"""
DULHAN — Celery task pipeline for transaction threat analysis.

Architecture:
    ingest_edge  →  chain(
        validate_payload  →  upsert_graph  →  score_ml  →  detect_scc  →  check_velocity
    )

Each task is independently retryable, routed to dedicated queues,
and logs to the WORM audit trail on failure.
"""

from celery import Celery, chain
from celery.schedules import crontab
import redis
import networkx as nx
import hmac
import hashlib
import json
import os
import logging
from datetime import datetime, timezone
from dotenv import load_dotenv
from database import get_neo4j_session
from ml_engine import (
    isolation_forest_model,
    xgboost_scorer,
    composite_risk_score,
    extract_rich_features,
)
from audit_logger import write_worm_log

load_dotenv()
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
#  Configuration
# ---------------------------------------------------------------------------
HMAC_SECRET = os.environ.get("HMAC_SECRET", "CHANGE_ME_IN_DOTENV")
VELOCITY_THRESHOLD = 8
REDIS_HOST = os.environ.get("REDIS_HOST", "localhost")
REDIS_PORT = int(os.environ.get("REDIS_PORT", "6379"))

# ---------------------------------------------------------------------------
#  Celery App
# ---------------------------------------------------------------------------
app = Celery(
    "dulhan_worker",
    broker=f"redis://{REDIS_HOST}:{REDIS_PORT}/0",
    backend=f"redis://{REDIS_HOST}:{REDIS_PORT}/2",   # Result backend enabled
)

# Global task defaults
app.conf.update(
    task_acks_late=True,                    # Don't ACK until task succeeds
    worker_prefetch_multiplier=1,           # Fair scheduling
    task_reject_on_worker_lost=True,        # Re-queue if worker dies
    task_track_started=True,                # Track STARTED state
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    result_expires=3600,                    # Results expire after 1 hour
    worker_send_task_events=True,           # Enable events for Flower
)

# ---------------------------------------------------------------------------
#  Queue Routing
# ---------------------------------------------------------------------------
app.conf.task_routes = {
    "tasks.validate_payload":       {"queue": "ingestion"},
    "tasks.upsert_graph":           {"queue": "ingestion"},
    "tasks.score_ml":               {"queue": "ml_scoring"},
    "tasks.detect_scc":             {"queue": "graph_analysis"},
    "tasks.check_velocity":         {"queue": "ingestion"},
    "tasks.publish_alert":          {"queue": "critical_alerts"},
    "tasks.dead_letter":            {"queue": "dlq"},
    "tasks.retrain_model":          {"queue": "ml_scoring"},
    "tasks.fiu_compliance_report":  {"queue": "critical_alerts"},
    "tasks.cleanup_redis_velocity": {"queue": "ingestion"},
    "tasks.neo4j_health_audit":     {"queue": "ingestion"},
    # Legacy compat
    "tasks.process_edge":           {"queue": "celery"},
}

# ---------------------------------------------------------------------------
#  Celery Beat — Scheduled Tasks
# ---------------------------------------------------------------------------
app.conf.beat_schedule = {
    "retrain-isolation-forest-daily": {
        "task": "tasks.retrain_model",
        "schedule": crontab(hour=2, minute=0),            # Daily at 2 AM
    },
    "fiu-compliance-report-daily": {
        "task": "tasks.fiu_compliance_report",
        "schedule": crontab(hour=6, minute=0),            # Daily at 6 AM
    },
    "prune-velocity-keys": {
        "task": "tasks.cleanup_redis_velocity",
        "schedule": crontab(minute="*/30"),                # Every 30 min
    },
    "neo4j-health-check": {
        "task": "tasks.neo4j_health_audit",
        "schedule": crontab(minute="*/15"),                # Every 15 min
    },
}

# ---------------------------------------------------------------------------
#  Redis client (for velocity tracking)
# ---------------------------------------------------------------------------
redis_client = redis.StrictRedis(host=REDIS_HOST, port=REDIS_PORT, db=1)


# ===========================================================================
#  HMAC helpers
# ===========================================================================
def _compute_hmac(payload: dict) -> str:
    data = payload.copy()
    data.pop("payload_hmac", None)
    data_str = json.dumps(data, sort_keys=True)
    return hmac.new(HMAC_SECRET.encode(), data_str.encode(), hashlib.sha256).hexdigest()


# ===========================================================================
#  1. Validate Payload (HMAC integrity)
# ===========================================================================
@app.task(
    bind=True,
    name="tasks.validate_payload",
    max_retries=2,
    default_retry_delay=5,
)
def validate_payload(self, payload: dict):
    """Step 1: HMAC Integrity Validation — rejects tampered payloads."""
    provided_hmac = payload.get("payload_hmac")
    calculated_hmac = _compute_hmac(payload)

    if not hmac.compare_digest(calculated_hmac, provided_hmac):
        write_worm_log(
            "INTEGRITY_VIOLATION",
            {"sender_token": payload.get("sender_token"), "reason": "HMAC_MISMATCH"},
        )
        raise ValueError("IntegrityError: Payload HMAC mismatch — Attack Detected")

    logger.info("HMAC OK for sender=%s", payload.get("sender_token"))
    return payload  # Pass downstream


# ===========================================================================
#  2. Upsert to Neo4j
# ===========================================================================
@app.task(
    bind=True,
    name="tasks.upsert_graph",
    max_retries=5,
    default_retry_delay=10,
    autoretry_for=(ConnectionError, RuntimeError, OSError),
)
def upsert_graph(self, payload: dict):
    """Step 2: Create/merge Account nodes and TRANSFERRED_TO edge in Neo4j."""
    sender_token = payload["sender_token"]
    receiver_token = payload["receiver_token"]
    amount = payload["amount_inr"]

    neo = get_neo4j_session()

    upsert_query = """
    MERGE (s:Account {token: $sender_token})
    ON CREATE SET s.bank_id = $bank_id, s.risk_status = 'CLEAN'
    MERGE (r:Account {token: $receiver_token})
    ON CREATE SET r.risk_status = 'CLEAN'
    CREATE (s)-[t:TRANSFERRED_TO {
        amount: $amount, 
        timestamp: $ts, 
        channel: $channel, 
        risk_hints: $hints, 
        epoch: $epoch
    }]->(r)
    """
    try:
        neo.query(upsert_query, {
            "sender_token": sender_token,
            "receiver_token": receiver_token,
            "bank_id": payload.get("bank_id", "UNKNOWN"),
            "amount": amount,
            "ts": payload["timestamp"],
            "channel": payload["channel"],
            "hints": payload["risk_hints"],
            "epoch": payload["epoch"],
        })
    except Exception as exc:
        logger.error("Neo4j upsert failed: %s", exc)
        raise self.retry(exc=exc)

    logger.info("Graph upserted: %s → %s (₹%s)", sender_token, receiver_token, amount)
    return payload  # Pass downstream


# ===========================================================================
#  3. ML Scoring  (Isolation Forest + XGBoost)
# ===========================================================================
@app.task(
    bind=True,
    name="tasks.score_ml",
    max_retries=3,
    default_retry_delay=5,
)
def score_ml(self, payload: dict):
    """
    Step 3: Score the sender account with both Isolation Forest (unsupervised)
    and XGBoost (supervised, when trained).
    """
    sender_token = payload["sender_token"]
    neo = get_neo4j_session()

    # --- Extract rich features (15-dim) ---
    features = extract_rich_features(neo, sender_token, redis_client=redis_client)

    if features is not None:
        # Isolation Forest (legacy 3-feature compat)
        legacy_features = [features[0], features[1], features[3]]  # in_deg, out_deg, vol_out
        if_score = isolation_forest_model.score_samples([legacy_features])[0]

        # XGBoost (15-feature)
        xgb_probs = xgboost_scorer.predict_proba([features])
        xgb_prob = xgb_probs[0] if xgb_probs else 0.5

        # Persist scores to Neo4j
        neo.query(
            "MATCH (s:Account {token: $token}) SET s.if_score = $if_score, s.xgb_score = $xgb_score",
            {"token": sender_token, "if_score": if_score, "xgb_score": xgb_prob},
        )
    else:
        if_score = 0.5
        xgb_prob = 0.5

    payload["_if_score"] = if_score
    payload["_xgb_prob"] = xgb_prob
    payload["_features"] = features

    logger.info("ML scored sender=%s  IF=%.3f  XGB=%.3f", sender_token, if_score, xgb_prob)
    return payload


# ===========================================================================
#  4. Tarjan SCC Detection
# ===========================================================================
@app.task(
    bind=True,
    name="tasks.detect_scc",
    max_retries=3,
    default_retry_delay=10,
)
def detect_scc(self, payload: dict):
    """Step 4: Pull 3-hop subgraph and find strongly connected components."""
    sender_token = payload["sender_token"]
    if_score = payload.get("_if_score", 0.5)
    xgb_prob = payload.get("_xgb_prob", None)

    neo = get_neo4j_session()

    wcc_query = """
    MATCH (s:Account {token: $token})
    CALL apoc.path.subgraphAll(s, {maxLevel: 3}) YIELD nodes, relationships
    RETURN [n in nodes | {id: n.token}] as nodes,
           [r in relationships | {s: startNode(r).token, t: endNode(r).token}] as links
    """
    try:
        graph_data = neo.query(wcc_query, {"token": sender_token})
    except Exception as exc:
        logger.error("SCC query failed: %s", exc)
        raise self.retry(exc=exc)

    alerts = []
    if graph_data:
        G = nx.DiGraph()
        for node in graph_data[0]["nodes"]:
            G.add_node(node["id"])
        for link in graph_data[0]["links"]:
            G.add_edge(link["s"], link["t"])

        sccs = list(nx.strongly_connected_components(G))
        for scc in sccs:
            if len(scc) > 1:
                # Use XGBoost-aware composite score when available
                risk = composite_risk_score(
                    scc, if_score=if_score,
                    xgb_prob=xgb_prob if xgb_prob != 0.5 else None,
                )
                if risk > 0.75:
                    _publish_alert_sync(list(scc), risk, "TARJAN_SCC")
                    neo.query(
                        "MATCH (n:Account) WHERE n.token IN $tokens SET n.risk_status = 'FLAGGED'",
                        {"tokens": list(scc)},
                    )
                    alerts.append({"nodes": list(scc), "risk": risk, "pattern": "TARJAN_SCC"})

    payload["_alerts"] = alerts
    logger.info("SCC check done for sender=%s  alerts=%d", sender_token, len(alerts))
    return payload


# ===========================================================================
#  5. Velocity Burst Check
# ===========================================================================
@app.task(
    bind=True,
    name="tasks.check_velocity",
    max_retries=2,
    default_retry_delay=5,
)
def check_velocity(self, payload: dict):
    """Step 5: Sliding-window velocity burst detection via Redis."""
    sender_token = payload["sender_token"]

    now = datetime.now(timezone.utc)
    window_key = now.strftime("%Y%m%d%H%M")[:-1] + "0"
    redis_key = f"vel:{sender_token}:{window_key}"

    count = redis_client.incr(redis_key)
    redis_client.expire(redis_key, 1800)

    # Also track 1-hour window for XGBoost feature
    hour_key = f"vel_1h:{sender_token}:{now.strftime('%Y%m%d%H')}"
    redis_client.incr(hour_key)
    redis_client.expire(hour_key, 7200)

    if count > VELOCITY_THRESHOLD:
        _publish_alert_sync([sender_token], 0.75, "VELOCITY_BURST")

    logger.info("Velocity check: sender=%s  count=%d  threshold=%d", sender_token, count, VELOCITY_THRESHOLD)
    return {
        "status": "success",
        "token": sender_token,
        "if_score": payload.get("_if_score", 0.5),
        "xgb_score": payload.get("_xgb_prob", 0.5),
        "velocity_count": count,
    }


# ===========================================================================
#  Alert publisher (sync helper)
# ===========================================================================
def _publish_alert_sync(nodes, risk_score, pattern):
    """Publish an alert to the compliance log and WORM trail."""
    alert_payload = {
        "schema_version": "1.2",
        "alert_id": f"SAT_{int(datetime.now(timezone.utc).timestamp())}",
        "risk_score": float(risk_score),
        "flagged_nodes": nodes,
        "pattern_detected": pattern,
        "timestamp": datetime.now(timezone.utc).isoformat() + "Z",
        "compliance_status": "REPORTED_TO_FIU",
    }

    # Write to local JSON for compliance evidence
    with open("dulhan_alert_v1.2.json", "a") as f:
        f.write(json.dumps(alert_payload) + "\n")

    # WORM Audit Log
    write_worm_log("THREAT_ALERT", alert_payload)
    logger.warning("!!! DULHAN ALERT: %s | Risk: %.2f | Nodes: %s", pattern, risk_score, nodes)


# ===========================================================================
#  Dead Letter Queue — captures permanently failed payloads
# ===========================================================================
@app.task(name="tasks.dead_letter")
def dead_letter(payload: dict, error_msg: str):
    """Store permanently failed payloads for manual review."""
    write_worm_log("DEAD_LETTER", {
        "payload": payload,
        "error": error_msg,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })
    logger.error("DEAD LETTER: %s — %s", payload.get("sender_token", "?"), error_msg)


# ===========================================================================
#  Pipeline entry point — replaces monolithic process_edge
# ===========================================================================
@app.task(name="tasks.ingest_edge")
def ingest_edge(payload: dict):
    """
    Main entry point: kicks off the processing chain.
    
    Pipeline:  validate → upsert → score_ml → detect_scc → check_velocity
    """
    pipeline = chain(
        validate_payload.s(payload),
        upsert_graph.s(),
        score_ml.s(),
        detect_scc.s(),
        check_velocity.s(),
    )
    return pipeline.apply_async()


# ===========================================================================
#  Legacy compat — process_edge still works but delegates to chain
# ===========================================================================
@app.task(name="tasks.process_edge")
def process_edge(payload: dict):
    """
    Legacy entry point — delegates to the new chain pipeline.
    Kept for backward compatibility with existing API callers.
    """
    return ingest_edge.delay(payload)


# ===========================================================================
#  Celery Beat — Scheduled Tasks
# ===========================================================================
@app.task(
    bind=True,
    name="tasks.retrain_model",
    max_retries=2,
    default_retry_delay=60,
)
def retrain_model(self):
    """
    Periodic task: retrain Isolation Forest (and XGBoost when labels exist)
    on the latest graph features.
    """
    import numpy as np

    neo = get_neo4j_session()
    query = """
    MATCH (s:Account)-[r:TRANSFERRED_TO]->()
    WITH s, count(r) as out_degree, sum(r.amount) as total_volume
    OPTIONAL MATCH ()-[in_r:TRANSFERRED_TO]->(s)
    RETURN s.token as token, out_degree, count(in_r) as in_degree, total_volume
    LIMIT 5000
    """
    try:
        results = neo.query(query)
    except Exception as exc:
        logger.error("Retrain query failed: %s", exc)
        raise self.retry(exc=exc)

    if results:
        features = [
            [r.get("in_degree", 0) or 0, r.get("out_degree", 0) or 0, r.get("total_volume", 0) or 0]
            for r in results
        ]
        isolation_forest_model.train(features)
        write_worm_log("MODEL_RETRAINED", {
            "model": "isolation_forest",
            "sample_count": len(features),
        })
        logger.info("Isolation Forest retrained with %d samples", len(features))


@app.task(name="tasks.fiu_compliance_report")
def fiu_compliance_report():
    """Generate daily FIU compliance report from alert logs."""
    try:
        with open("dulhan_alert_v1.2.json", "r") as f:
            alerts = [json.loads(line) for line in f if line.strip()]

        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        today_alerts = [a for a in alerts if a.get("timestamp", "").startswith(today)]

        report = {
            "report_date": today,
            "total_alerts": len(today_alerts),
            "patterns": {},
        }
        for a in today_alerts:
            p = a.get("pattern_detected", "UNKNOWN")
            report["patterns"][p] = report["patterns"].get(p, 0) + 1

        write_worm_log("FIU_DAILY_REPORT", report)
        logger.info("FIU report generated: %d alerts", len(today_alerts))
    except FileNotFoundError:
        logger.info("No alerts file found — skipping FIU report")


@app.task(name="tasks.cleanup_redis_velocity")
def cleanup_redis_velocity():
    """Prune expired velocity keys from Redis."""
    # Redis TTL handles this automatically, but we log for audit
    write_worm_log("VELOCITY_CLEANUP", {"status": "TTL-based, automatic"})
    logger.info("Velocity key cleanup executed (TTL-managed)")


@app.task(
    bind=True,
    name="tasks.neo4j_health_audit",
    max_retries=1,
    default_retry_delay=30,
)
def neo4j_health_audit(self):
    """Periodic health check on Neo4j connectivity."""
    neo = get_neo4j_session()
    try:
        result = neo.query("RETURN 1 AS health")
        if result and result[0]["health"] == 1:
            logger.info("Neo4j health: OK")
            return {"status": "healthy"}
    except Exception as exc:
        write_worm_log("NEO4J_HEALTH_FAIL", {"error": str(exc)})
        logger.error("Neo4j health check FAILED: %s", exc)
        raise self.retry(exc=exc)
