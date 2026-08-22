import sqlite3
import hmac
import hashlib
import os
import random
import time
from datetime import datetime, timedelta

DB_NAME = "fintech_threat_db.sqlite"
EPOCH_KEY = os.urandom(32)

from audit_logger import write_worm_log
from database import get_neo4j_session
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
def get_password_hash(password):
    return pwd_context.hash(password)

write_worm_log("EPOCH_ROTATION", {"status": "New epoch key generated for zero-knowledge masking"})

def make_token(account_number):
    """Zero-PII Token Generation using HMAC-SHA256"""
    return hmac.new(EPOCH_KEY, str(account_number).encode(), hashlib.sha256).hexdigest()[:32]

def init_db():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()


    cursor.execute("DROP TABLE IF EXISTS accounts")
    cursor.execute("DROP TABLE IF EXISTS transactions")
    cursor.execute("DROP TABLE IF EXISTS banks")
    cursor.execute("DROP TABLE IF EXISTS institutions")

    cursor.execute("""
        CREATE TABLE institutions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            bank_name TEXT NOT NULL,
            institution_id TEXT UNIQUE NOT NULL,
            compliance_email TEXT NOT NULL,
            hashed_password TEXT NOT NULL,
            role TEXT DEFAULT 'analyst'
        )
    """)

    cursor.execute("""
        CREATE TABLE banks (
            branch_code TEXT PRIMARY KEY,
            bank_name TEXT NOT NULL,
            hashed_password TEXT NOT NULL
        )
    """)

    cursor.execute("""
        CREATE TABLE accounts (
            account_id TEXT PRIMARY KEY,
            bank_id TEXT NOT NULL,
            account_type TEXT NOT NULL,
            risk_status TEXT DEFAULT 'CLEAN',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    cursor.execute("""
        CREATE TABLE transactions (
            txn_id TEXT PRIMARY KEY,
            sender_account_id TEXT NOT NULL,
            receiver_account_id TEXT NOT NULL,
            amount REAL NOT NULL,
            timestamp TIMESTAMP NOT NULL,
            is_flagged BOOLEAN DEFAULT 0,
            fraud_pattern TEXT
        )
    """)

    conn.commit()
    
    neo = get_neo4j_session()
    neo.query("MATCH (n) DETACH DELETE n") # Reset Graph
    
    return conn

def seed_data(conn):
    cursor = conn.cursor()
    banks = ["HDFC", "SBI", "ICICI", "AXIS", "KOTAK"]
    

    hashed_pwd = get_password_hash("password123")
    

    inst_roles = {
        "BNK-HDFC": "admin",
        "BNK-SBI": "supervisor",
        "BNK-ICICI": "analyst",
        "BNK-AXIS": "analyst"
    }
    
    for bank in banks:
        cursor.execute("INSERT INTO banks VALUES (?, ?, ?)", (f"BNK-{bank}", bank, hashed_pwd))
        role = inst_roles.get(f"BNK-{bank}", "analyst")
        cursor.execute(
            "INSERT INTO institutions (bank_name, institution_id, compliance_email, hashed_password, role) VALUES (?, ?, ?, ?, ?)",
            (bank, f"BNK-{bank}", f"compliance@{bank.lower()}.com", hashed_pwd, role)
        )

    neo = get_neo4j_session()


    account_ids = []
    print("Seeding 5,000 accounts...")
    

    neo = get_neo4j_session()
    for b in range(0, 5000, 100):
        batch = []
        for i in range(b, b + 100):
            acc_id = make_token(f"ACC_{i}")
            account_ids.append(acc_id)
            # Team Requirement: Exactly 42% anomaly ratio (58/42 split)
            is_flagged = random.random() < 0.42
            batch.append({
                "token": acc_id, 
                "bank": random.choice(banks), 
                "type": random.choice(["Savings", "Current"]),
                "is_flagged": is_flagged
            })
        
        neo.query("""
            UNWIND $batch AS row
            CREATE (a:Account {
                token: row.token, 
                bank_id: row.bank, 
                account_type: row.type, 
                risk_status: CASE WHEN row.is_flagged THEN 'SUSPICIOUS' ELSE 'CLEAN' END,
                is_flagged: row.is_flagged
            })
        """, {"batch": batch})

    # Add SQLite Indexes for 5K scale
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_txn_sender ON transactions(sender_account_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_txn_ts ON transactions(timestamp)")


    print("Seeding 15,000 normal transactions...")
    now = datetime.now()
    batch_size = 500
    for b in range(0, 15000, batch_size):
        txn_batch = []
        for i in range(b, b + batch_size):
            sender = random.choice(account_ids)
            receiver = random.choice(account_ids)
            while receiver == sender: receiver = random.choice(account_ids)
            
            amount = round(random.uniform(500, 75000), 2)
            ts = now - timedelta(hours=random.randint(1, 48))
            txn_batch.append({
                "sender": sender, "receiver": receiver, 
                "txn_id": f"TXN_{b+i}", "amount": amount, "ts": ts.isoformat()
            })
        
        neo.query("""
            UNWIND $batch AS row
            MATCH (s:Account {token: row.sender}), (r:Account {token: row.receiver})
            CREATE (s)-[:TRANSFERRED_TO {txn_id: row.txn_id, amount: row.amount, timestamp: row.ts, is_flagged: 0}]->(r)
        """, {"batch": txn_batch})


    print("Injecting Anomaly: 50-to-1 Smurfing Hub...")
    hub_receiver = account_ids[0]
    smurfers = account_ids[1:51]
    for i, sender in enumerate(smurfers):
        ts = now - timedelta(minutes=random.randint(5, 60))
        neo.query("""
            MATCH (s:Account {token: $sender}), (r:Account {token: $receiver})
            CREATE (s)-[:TRANSFERRED_TO {txn_id: $txn_id, amount: 49000, timestamp: $ts, is_flagged: 1, fraud_pattern: 'SMURFING_HUB'}]->(r)
            SET r.risk_status = 'FLAGGED', s.risk_status = 'FLAGGED'
        """, {"sender": sender, "receiver": hub_receiver, "txn_id": f"SMURF_{i}", "ts": ts.isoformat()})


    print("Injecting Anomaly: 15-node Tarjan Cycle...")
    cycle_nodes = account_ids[100:115]
    for i in range(len(cycle_nodes)):
        sender = cycle_nodes[i]
        receiver = cycle_nodes[(i + 1) % len(cycle_nodes)]
        ts = now - timedelta(hours=2)
        neo.query("""
            MATCH (s:Account {token: $sender}), (r:Account {token: $receiver})
            CREATE (s)-[:TRANSFERRED_TO {txn_id: $txn_id, amount: 85000, timestamp: $ts, is_flagged: 1, fraud_pattern: 'TARJAN_CYCLE'}]->(r)
            SET s.risk_status = 'FLAGGED', r.risk_status = 'FLAGGED'
        """, {"sender": sender, "receiver": receiver, "txn_id": f"CYCLE_{i}", "ts": ts.isoformat()})


    print("Injecting Anomaly: Velocity Burst...")
    burst_sender = account_ids[200]
    burst_receiver = account_ids[201]
    start_burst = now - timedelta(minutes=10)
    for i in range(30):
        ts = start_burst + timedelta(seconds=i * 4)
        neo.query("""
            MATCH (s:Account {token: $sender}), (r:Account {token: $receiver})
            CREATE (s)-[:TRANSFERRED_TO {txn_id: $txn_id, amount: 12000, timestamp: $ts, is_flagged: 1, fraud_pattern: 'VELOCITY_BURST'}]->(r)
            SET s.risk_status = 'FLAGGED'
        """, {"sender": burst_sender, "receiver": burst_receiver, "txn_id": f"BURST_{i}", "ts": ts.isoformat()})

    conn.commit()
    print(f"Successfully initialized graph topology in Neo4j.")

if __name__ == "__main__":
    connection = init_db()
    seed_data(connection)
    connection.close()
