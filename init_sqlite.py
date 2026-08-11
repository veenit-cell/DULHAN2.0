"""Initialize SQLite tables and seed demo accounts (no Neo4j required)."""
import sqlite3
from passlib.context import CryptContext

DB_NAME = "fintech_threat_db.sqlite"
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def init():
    hashed = pwd_context.hash("password123")
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()

    c.execute("DROP TABLE IF EXISTS institutions")
    c.execute("DROP TABLE IF EXISTS banks")
    c.execute("DROP TABLE IF EXISTS accounts")
    c.execute("DROP TABLE IF EXISTS transactions")

    c.execute("""
        CREATE TABLE institutions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            bank_name TEXT NOT NULL,
            institution_id TEXT UNIQUE NOT NULL,
            compliance_email TEXT NOT NULL,
            hashed_password TEXT NOT NULL,
            role TEXT DEFAULT 'analyst'
        )
    """)

    c.execute("""
        CREATE TABLE banks (
            branch_code TEXT PRIMARY KEY,
            bank_name TEXT NOT NULL,
            hashed_password TEXT NOT NULL
        )
    """)

    c.execute("""
        CREATE TABLE accounts (
            account_id TEXT PRIMARY KEY,
            bank_id TEXT NOT NULL,
            account_type TEXT NOT NULL,
            risk_status TEXT DEFAULT 'CLEAN',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    c.execute("""
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

    roles = {
        "BNK-HDFC": "admin",
        "BNK-SBI": "supervisor",
        "BNK-ICICI": "analyst",
        "BNK-AXIS": "analyst",
        "BNK-KOTAK": "analyst",
    }

    for bank in ["HDFC", "SBI", "ICICI", "AXIS", "KOTAK"]:
        inst_id = f"BNK-{bank}"
        role = roles.get(inst_id, "analyst")
        c.execute(
            "INSERT INTO institutions (bank_name, institution_id, compliance_email, hashed_password, role) VALUES (?, ?, ?, ?, ?)",
            (bank, inst_id, f"compliance@{bank.lower()}.com", hashed, role),
        )
        c.execute(
            "INSERT INTO banks VALUES (?, ?, ?)",
            (inst_id, bank, hashed),
        )

    conn.commit()
    conn.close()
    print("SQLite DB initialized with demo accounts!")
    print("Demo accounts created:")
    for inst_id, role in roles.items():
        print(f"  {inst_id} | Password: password123 | Role: {role}")

if __name__ == "__main__":
    init()
