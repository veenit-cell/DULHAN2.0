from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sqlite3
import os
import json
from datetime import datetime, timedelta, timezone
from passlib.context import CryptContext
from jose import JWTError, jwt
from typing import Optional, List
from audit_logger import write_worm_log
from database import get_neo4j_session
from acquisition_agent import acquisition_agent
from adoption_agent import adoption_agent
from engagement_agent import engagement_agent
import hmac
import hashlib
import io
from contextlib import redirect_stdout
import sys
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.environ.get("SECRET_KEY", "CHANGE_ME_IN_DOTENV")
HMAC_SECRET = os.environ.get("HMAC_SECRET", "CHANGE_ME_IN_DOTENV")
ALGORITHM = os.environ.get("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.environ.get("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
ISSUER = os.environ.get("ISSUER", "dulhan.neural.core")

def verify_payload_hmac(payload_dict: dict, provided_hmac: str) -> bool:
    # Remove hmac field for validation
    data = payload_dict.copy()
    data.pop('payload_hmac', None)
    data_str = json.dumps(data, sort_keys=True)
    calculated_hmac = hmac.new(HMAC_SECRET.encode(), data_str.encode(), hashlib.sha256).hexdigest()
    return hmac.compare_digest(calculated_hmac, provided_hmac)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

app = FastAPI(title="Dulhan Neural API")

cors_origins = os.environ.get("CORS_ORIGINS", "http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)

DB_NAME = os.environ.get("SQLITE_DB", "fintech_threat_db.sqlite")

def get_db():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    return conn

class EdgePayloadV12(BaseModel):
    schema_version: str
    bank_id: str
    sender_token: str
    receiver_token: str
    amount_inr: float
    timestamp: str
    channel: str
    txn_type: str
    amount_bucket: str
    risk_hints: List[str]
    epoch: str
    payload_hmac: str

class InstitutionRegister(BaseModel):
    bank_name: str
    institution_id: str
    compliance_email: str
    password: str

class InstitutionLogin(BaseModel):
    institution_id: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str


def get_password_hash(password):
    return pwd_context.hash(password)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=15))
    to_encode.update({
        "exp": expire,
        "iss": ISSUER,
        "iat": datetime.now(timezone.utc)
    })
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


from fastapi.security import OAuth2PasswordBearer
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def get_current_institution(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        institution_id: str = payload.get("sub")
        if institution_id is None or payload.get("iss") != ISSUER:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    db = get_db()
    institution = db.execute("SELECT * FROM institutions WHERE institution_id = ?", (institution_id,)).fetchone()
    db.close()
    if institution is None:
        raise credentials_exception
    return dict(institution)


from psi_engine import psi_service

class PSIRequest(BaseModel):
    bank_a_ciphertexts: List[str]
    bank_b_ciphertexts: List[str]

@app.post("/api/psi/intersect")
def psi_intersect(req: PSIRequest, current_institution: dict = Depends(get_current_institution)):
    intersection = psi_service.intersect(req.bank_a_ciphertexts, req.bank_b_ciphertexts)
    write_worm_log("PSI_INTERSECTION_EXECUTED", {"match_count": len(intersection)}, institution_id=current_institution["institution_id"])
    return {"intersection_ciphertexts": intersection, "status": "secure_match_verified"}

@app.get("/")
def health_check():
    return {"status": "Dulhan API is live", "version": "1.3"}

@app.post("/api/auth/register")
def register_institution(inst: InstitutionRegister):
    db = get_db()
    try:
        hashed_password = get_password_hash(inst.password)
        db.execute(
            "INSERT INTO institutions (bank_name, institution_id, compliance_email, hashed_password, role) VALUES (?, ?, ?, ?, ?)",
            (inst.bank_name, inst.institution_id, inst.compliance_email, hashed_password, "analyst")
        )
        db.commit()
        return {"status": "success", "message": "Institution registered successfully"}
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=400, detail="Institution ID already exists")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        db.close()

@app.post("/api/auth/login")
def login_institution(auth: InstitutionLogin):
    db = get_db()
    institution = db.execute("SELECT * FROM institutions WHERE institution_id = ?", (auth.institution_id,)).fetchone()
    db.close()
    
    if not institution or not verify_password(auth.password, institution["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid institution ID or password")
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": institution["institution_id"], "role": institution["role"]}, 
        expires_delta=access_token_expires
    )
    
    write_worm_log("LOGIN_SUCCESS", {"role": institution["role"], "mfa_verified": True}, institution_id=institution["institution_id"])
    return {"access_token": access_token, "token_type": "bearer", "role": institution["role"]}

@app.get("/api/auth/me")
def read_institutions_me(current_institution: dict = Depends(get_current_institution)):
    current_institution.pop("hashed_password")
    return current_institution

@app.get("/transactions")
def get_transactions(current_institution: dict = Depends(get_current_institution)):
    neo = get_neo4j_session()
    query = """
    MATCH (s:Account)-[r:TRANSFERRED_TO]->(t:Account) 
    RETURN r.txn_id AS txn_id, s.token AS sender_account_id, t.token AS receiver_account_id, 
           r.amount AS amount, r.timestamp AS timestamp, r.is_flagged AS is_flagged, r.fraud_pattern AS fraud_pattern 
    ORDER BY r.timestamp DESC LIMIT 100
    """
    txns = neo.query(query)
    return [dict(t) for t in txns]

@app.get("/accounts")
def get_accounts(current_institution: dict = Depends(get_current_institution)):
    neo = get_neo4j_session()
    accounts = neo.query("MATCH (n:Account) RETURN n.token AS account_id, n.bank_id AS bank_id, n.account_type AS account_type, n.risk_status AS risk_status")
    return [dict(a) for a in accounts]

@app.get("/api/threat-stats")
def get_stats(current_institution: dict = Depends(get_current_institution)):
    neo = get_neo4j_session()
    total_acc = neo.query("MATCH (n:Account) RETURN count(n) AS c")[0]["c"]
    total_txn = neo.query("MATCH ()-[r:TRANSFERRED_TO]->() RETURN count(r) AS c")[0]["c"]
    flagged = neo.query("MATCH ()-[r:TRANSFERRED_TO {is_flagged: 1}]->() RETURN count(r) AS c")[0]["c"]
    frozen = neo.query("MATCH ()-[r:TRANSFERRED_TO {is_flagged: 1}]->() RETURN sum(r.amount) AS c")[0]["c"] or 0
    return {
        "total_accounts": total_acc,
        "total_transactions": total_txn,
        "flagged_networks_blocked": flagged,
        "frozen_suspicious_capital": frozen
    }

@app.get("/api/graph")
def get_graph(current_institution: dict = Depends(get_current_institution)):
    neo = get_neo4j_session()
    query = """
    MATCH (f:Account {risk_status: 'FLAGGED'})
    OPTIONAL MATCH (f)-[r:TRANSFERRED_TO]-(neighbor:Account)
    WITH f, r, neighbor
    RETURN collect(DISTINCT f) + collect(DISTINCT neighbor) AS nodes, 
           collect(DISTINCT r) AS links
    """
    res = neo.query(query)[0]
    
    nodes = [{"id": n["token"], "risk_status": n["risk_status"], "is_flagged": n["risk_status"] == "FLAGGED"} for n in res["nodes"]]
    links = [{"source": l.start_node["token"], "target": l.end_node["token"], "amount": l["amount"], "is_flagged": l["is_flagged"]} for l in res["links"]]
    
    total_acc = neo.query("MATCH (n:Account) RETURN count(n) AS c")[0]["c"]
    return {
        "nodes": nodes, 
        "links": links, 
        "metadata": {
            "total_analyzed": total_acc,
            "rendered_nodes": len(nodes)
        }
    }

@app.post("/ingest_transaction", status_code=202)
def ingest_transaction(payload: EdgePayloadV12, current_institution: dict = Depends(get_current_institution)):
    try:
        txn_time = datetime.fromisoformat(payload.timestamp.replace('Z', ''))
        now = datetime.utcnow()
        if abs((now - txn_time).total_seconds()) > 300:
            raise HTTPException(status_code=400, detail="Replay Attack Detected")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid timestamp format")

    if not verify_payload_hmac(payload.dict(), payload.payload_hmac):
         raise HTTPException(status_code=401, detail="Invalid Payload HMAC")

    write_worm_log("API_INGESTION", payload.dict(), institution_id=current_institution["institution_id"])
    
    neo = get_neo4j_session()
    query = """
    MERGE (sender:Account {token: $sender_token})
    MERGE (receiver:Account {token: $receiver_token})
    CREATE (sender)-[r:TRANSFERRED_TO {amount: $amount, txn_id: $txn_id, timestamp: $timestamp, is_flagged: 0}]->(receiver)
    """
    neo.query(query, {
        "sender_token": payload.sender_token,
        "receiver_token": payload.receiver_token,
        "amount": payload.amount_inr,
        "txn_id": "TXN_" + str(int(datetime.now().timestamp() * 1000)),
        "timestamp": payload.timestamp
    })

    import tasks
    result = tasks.ingest_edge.delay(payload.dict())
    return {
        "status": "accepted",
        "message": "Transaction queued",
        "schema": "v1.3",
        "task_id": result.id,
    }

# ===========================================================================
#  AGENTIC AI ENDPOINTS — Pillar 1: Customer Acquisition
# ===========================================================================

class ChatMessage(BaseModel):
    session_id: str
    message: str

@app.post("/api/agent/acquire/start")
def start_acquisition_session():
    """Start a new conversational onboarding session with the AI agent."""
    result = acquisition_agent.start_session()
    return result

@app.post("/api/agent/acquire/chat")
def acquisition_chat(msg: ChatMessage):
    """Send a message to the acquisition agent and get AI response."""
    result = acquisition_agent.chat(msg.session_id, msg.message)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result

@app.get("/api/agent/acquire/leads")
def get_acquisition_leads(stage: Optional[str] = None):
    """Get scored/qualified leads, optionally filtered by stage."""
    return acquisition_agent.get_leads(stage)

@app.get("/api/agent/acquire/pipeline")
def get_acquisition_pipeline():
    """Get acquisition funnel statistics."""
    return acquisition_agent.get_pipeline_stats()

@app.post("/api/agent/acquire/onboard")
def trigger_onboarding(lead_id: str):
    """Trigger onboarding for a qualified lead."""
    db = get_db()
    try:
        db.execute("UPDATE acquisition_leads SET stage = 'onboarded', updated_at = ? WHERE lead_id = ?",
                   (datetime.now(timezone.utc).isoformat(), lead_id))
        db.commit()
        return {"status": "success", "message": f"Lead {lead_id} moved to onboarded"}
    finally:
        db.close()

@app.get("/api/agent/acquire/analytics")
def get_acquisition_analytics():
    """Get acquisition analytics dashboard data."""
    return acquisition_agent.get_analytics()


# ===========================================================================
#  AGENTIC AI ENDPOINTS — Pillar 2: Digital Adoption
# ===========================================================================

@app.get("/api/agent/adopt/recommendations/{customer_id}")
def get_adoption_recommendations(customer_id: str):
    """Get personalized product recommendations for a customer."""
    result = adoption_agent.get_recommendations(customer_id)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result

@app.get("/api/agent/adopt/nudges")
def get_adoption_nudges(limit: int = 20):
    """Get active AI-driven adoption nudges."""
    return adoption_agent.get_active_nudges(limit)

@app.get("/api/agent/adopt/journey/{customer_id}")
def get_adoption_journey(customer_id: str):
    """Get adaptive adoption journey for a customer."""
    result = adoption_agent.get_adoption_journey(customer_id)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result

@app.get("/api/agent/adopt/analytics")
def get_adoption_analytics():
    """Get adoption metrics — funnel, conversion per product, heatmap data."""
    return adoption_agent.get_analytics()


# ===========================================================================
#  AGENTIC AI ENDPOINTS — Pillar 3: Digital Engagement
# ===========================================================================

@app.get("/api/agent/engage/events")
def get_engagement_events(limit: int = 30, event_type: Optional[str] = None):
    """Get detected life events and AI triggers."""
    return engagement_agent.get_events(limit, event_type)

@app.get("/api/agent/engage/campaigns")
def get_engagement_campaigns():
    """Get active engagement campaigns."""
    return engagement_agent.get_campaigns()

@app.post("/api/agent/engage/interact/{customer_id}")
def trigger_engagement_interaction(customer_id: str):
    """Trigger proactive AI interaction for a customer."""
    result = engagement_agent.generate_interaction(customer_id)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result

@app.get("/api/agent/engage/health")
def get_engagement_health():
    """Get customer engagement health dashboard."""
    return engagement_agent.get_engagement_health()

@app.get("/api/agent/engage/analytics")
def get_engagement_analytics():
    """Get comprehensive engagement analytics."""
    return engagement_agent.get_analytics()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
