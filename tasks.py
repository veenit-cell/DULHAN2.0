from celery import Celery
import redis
import networkx as nx
import hmac
import hashlib
import json
import datetime
from database import get_neo4j_session
from ml_engine import isolation_forest_model, composite_risk_score
from audit_logger import write_worm_log


SECRET_KEY = "SATARK_ENTERPRISE_SECRET_KEY_2026"
VELOCITY_THRESHOLD = 8
REDIS_HOST = "localhost"
REDIS_PORT = 6379 

app = Celery('satark_worker', broker='redis://localhost:6379/0')
redis_client = redis.StrictRedis(host=REDIS_HOST, port=REDIS_PORT, db=1)

def verify_payload_hmac(payload: dict, secret_key: str):
    """Step 1: HMAC Integrity Validation"""
    provided_hmac = payload.get('payload_hmac')
    data = payload.copy()
    data.pop('payload_hmac', None)
    data_str = json.dumps(data, sort_keys=True)
    calculated_hmac = hmac.new(secret_key.encode(), data_str.encode(), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(calculated_hmac, provided_hmac):
        raise ValueError("IntegrityError: Payload HMAC mismatch - Attack Detected")

def publish_alert(nodes, risk_score, pattern):

    alert_payload = {
        "schema_version": "1.2",
        "alert_id": f"SAT_{int(datetime.datetime.now().timestamp())}",
        "risk_score": float(risk_score),
        "flagged_nodes": nodes,
        "pattern_detected": pattern,
        "timestamp": datetime.datetime.now().isoformat() + "Z",
        "compliance_status": "REPORTED_TO_FIU"
    }
    
    # Write to local JSON for compliance evidence
    with open("satark_alert_v1.2.json", "a") as f:
        f.write(json.dumps(alert_payload) + "\n")
    
    # WORM Audit Log
    write_worm_log("THREAT_ALERT", alert_payload)
    print(f"!!! SATARK ALERT: {pattern} | Risk: {risk_score:.2f} | Nodes: {nodes}")

@app.task(name="tasks.process_edge")
def process_edge(payload: dict):
    """
    """
    # Step 1: HMAC Validation
    verify_payload_hmac(payload, SECRET_KEY)
    
    sender_token = payload['sender_token']
    receiver_token = payload['receiver_token']
    amount = payload['amount_inr']
    
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
    neo.query(upsert_query, {
        "sender_token": sender_token,
        "receiver_token": receiver_token,
        "bank_id": payload.get('bank_id', 'UNKNOWN'),
        "amount": amount,
        "ts": payload['timestamp'],
        "channel": payload['channel'],
        "hints": payload['risk_hints'],
        "epoch": payload['epoch']
    })
    

    features_query = """
    MATCH (s:Account {token: $token})
    OPTIONAL MATCH (s)-[r:TRANSFERRED_TO]->()
    WITH s, count(r) as out_degree, sum(r.amount) as total_volume
    OPTIONAL MATCH ()-[in:TRANSFERRED_TO]->(s)
    RETURN out_degree + count(in) as degree, total_volume
    """
    res = neo.query(features_query, {"token": sender_token})
    if res:
        degree = res[0]['degree']
        volume = res[0]['total_volume'] or 0
        features = [degree, volume, degree] # Mocked placeholder: in_degree, out_degree, volume
        
        if_score = isolation_forest_model.score_samples([features])[0]
        neo.query("MATCH (s:Account {token: $token}) SET s.if_score = $score", {"token": sender_token, "score": if_score})
    else:
        if_score = 0.5


    # Pull the weakly connected component
    wcc_query = """
    MATCH (s:Account {token: $token})
    CALL apoc.path.subgraphAll(s, {maxLevel: 3}) YIELD nodes, relationships
    RETURN [n in nodes | {id: n.token}] as nodes, [r in relationships | {s: startNode(r).token, t: endNode(r).token}] as links
    """
    # Note: Using NetworkX for actual Tarjan logic as requested
    graph_data = neo.query(wcc_query, {"token": sender_token})
    if graph_data:
        G = nx.DiGraph()
        for node in graph_data[0]['nodes']:
            G.add_node(node['id'])
        for link in graph_data[0]['links']:
            G.add_edge(link['s'], link['t'])
            
        sccs = list(nx.strongly_connected_components(G))
        for scc in sccs:
            if len(scc) > 1:
                risk = composite_risk_score(scc, if_score=if_score)
                if risk > 0.75:
                    publish_alert(list(scc), risk, 'TARJAN_SCC')
                    # Update Neo4j risk status
                    neo.query("MATCH (n:Account) WHERE n.token IN $tokens SET n.risk_status = 'FLAGGED'", {"tokens": list(scc)})


    window_key = datetime.datetime.utcnow().strftime('%Y%m%d%H%M')[:-1] + '0'
    redis_key = f"vel:{sender_token}:{window_key}"
    
    count = redis_client.incr(redis_key)
    redis_client.expire(redis_key, 1800)
    
    if count > VELOCITY_THRESHOLD:
        publish_alert([sender_token], 0.75, 'VELOCITY_BURST')

    return {"status": "success", "token": sender_token, "if_score": if_score}

