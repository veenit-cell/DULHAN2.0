import os
import json
import datetime
import hmac
import hashlib
import time
import random
from database import get_neo4j_session

# Configuration
SECRET_KEY = "SATARK_ENTERPRISE_SECRET_KEY_2026"

def make_token(account, key="MOCK_EPOCH_SECRET"):
    return hmac.new(key.encode(), str(account).encode(), hashlib.sha256).hexdigest()[:32]

def get_hmac(payload):
    data_str = json.dumps(payload, sort_keys=True)
    return hmac.new(SECRET_KEY.encode(), data_str.encode(), hashlib.sha256).hexdigest()

def inject():
    print("--- SATARK MULTI-PATTERN ANOMALY INJECTOR ---")
    neo = get_neo4j_session()
    
    # Clean old flagged demo data to avoid clutter
    print("Purging existing demo anomalies...")
    neo.query("MATCH (a:Account) WHERE a.bank_id STARTS WITH 'BNK-ANOMALY' DETACH DELETE a")

    # --- ANOMALY 1: THE SMURFING HUB (21 Nodes) ---
    # 20 senders funneling to 1 hub
    print("\n[PATTERN 1] Injecting Smurfing Hub (21 nodes)...")
    hub_token = make_token("HUB_RECEIVER_001")
    neo.query("MERGE (a:Account {token: $token}) SET a.bank_id='BNK-ANOMALY-1', a.risk_status='FLAGGED', a.if_score=0.99", {"token": hub_token})
    
    for i in range(20):
        sender_token = make_token(f"SMURF_SENDER_{i}")
        neo.query("MERGE (a:Account {token: $token}) SET a.bank_id='BNK-ANOMALY-1', a.risk_status='FLAGGED', a.if_score=0.85", {"token": sender_token})
        
        payload = {
            "sender_token": sender_token,
            "receiver_token": hub_token,
            "amount_inr": 49000,
            "timestamp": (datetime.datetime.now() - datetime.timedelta(minutes=random.randint(1, 5))).isoformat() + "Z"
        }
        
        neo.query("""
        MATCH (s:Account {token: $sender})
        MATCH (r:Account {token: $receiver})
        CREATE (s)-[:TRANSFERRED_TO {
            amount: 49000,
            timestamp: $ts,
            is_flagged: true,
            fraud_pattern: 'SMURFING_HUB',
            payload_hmac: $hmac
        }]->(r)
        """, {"sender": sender_token, "receiver": hub_token, "ts": payload["timestamp"], "hmac": get_hmac(payload)})

    # --- ANOMALY 2: THE TARJAN CYCLE (10 Nodes) ---
    # A -> B -> C ... -> J -> A
    print("\n[PATTERN 2] Injecting Tarjan Cycle (10 nodes, ₹1M)...")
    cycle_nodes = [make_token(f"CYCLE_NODE_{i}") for i in range(10)]
    for token in cycle_nodes:
        neo.query("MERGE (a:Account {token: $token}) SET a.bank_id='BNK-ANOMALY-2', a.risk_status='FLAGGED', a.if_score=0.97", {"token": token})
    
    for i in range(10):
        sender = cycle_nodes[i]
        receiver = cycle_nodes[(i + 1) % 10]
        payload = {
            "sender_token": sender,
            "receiver_token": receiver,
            "amount_inr": 1000000,
            "timestamp": datetime.datetime.now().isoformat() + "Z"
        }
        neo.query("""
        MATCH (s:Account {token: $sender})
        MATCH (r:Account {token: $receiver})
        CREATE (s)-[:TRANSFERRED_TO {
            amount: 1000000,
            timestamp: $ts,
            is_flagged: true,
            fraud_pattern: 'TARJAN_CYCLE',
            payload_hmac: $hmac
        }]->(r)
        """, {"sender": sender, "receiver": receiver, "ts": payload["timestamp"], "hmac": get_hmac(payload)})

    # --- ANOMALY 3: THE VELOCITY BURST (16 Nodes) ---
    # 1 sender, 15 rapid random recipients
    print("\n[PATTERN 3] Injecting Velocity Burst (1 sender, 15 rapid txns)...")
    burst_sender = make_token("VELOCITY_BURST_SENDER")
    neo.query("MERGE (a:Account {token: $token}) SET a.bank_id='BNK-ANOMALY-3', a.risk_status='FLAGGED', a.if_score=0.95", {"token": burst_sender})
    
    for i in range(15):
        recipient = make_token(f"BURST_RECIPIENT_{i}")
        neo.query("MERGE (a:Account {token: $token}) SET a.bank_id='BNK-ANOMALY-3'", {"token": recipient})
        
        payload = {
            "sender_token": burst_sender,
            "receiver_token": recipient,
            "amount_inr": random.randint(5000, 20000),
            "timestamp": datetime.datetime.now().isoformat() + "Z"
        }
        
        neo.query("""
        MATCH (s:Account {token: $sender})
        MATCH (r:Account {token: $receiver})
        CREATE (s)-[:TRANSFERRED_TO {
            amount: $amt,
            timestamp: $ts,
            is_flagged: (CASE WHEN $i=0 THEN true ELSE false END), 
            fraud_pattern: 'VELOCITY_BURST',
            payload_hmac: $hmac
        }]->(r)
        """, {"sender": burst_sender, "receiver": recipient, "amt": payload["amount_inr"], "ts": payload["timestamp"], "hmac": get_hmac(payload), "i": i})
        # Note: Marking at least one txn as flagged to ensure sender/network shows up in intelligence filter

    print("\nMulti-pattern injection complete.")
    print("1. Smurfing Hub (21 nodes)")
    print("2. Tarjan Cycle (10 nodes)")
    print("3. Velocity Burst (16 nodes)")

if __name__ == "__main__":
    inject()
