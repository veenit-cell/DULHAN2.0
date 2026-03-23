# Satark: Collaborative Fintech Security Platform (Phase 1)

Satark (Hindi for "Alert/Cautious") is a deterministic Fintech and Graph-Networking engine designed to identify anomalous clusters, multi-hop financial fraud, and money laundering (like Smurfing rings) without sharing raw customer data.

Instead of dealing with computationally heavy and error-prone ML heuristics like OCR, Satark operates directly on the financial schema level, catching coordinated fraud networks before capital is fully siphoned.

## The Architecture & Workflow
SATARK operates on a Federated Intelligence Model. Instead of sharing raw customer data, banks connect their localized nodes to a central Neural Kernel that analyzes cryptographic identifiers.

### Step-by-Step System Flow:
1. **Interactive Entry**: Institutional portals featuring cursor-tracking spotlight heuristics for forensic focus.
2. **Institutional Ingestion**: High-throughput transactions (5,000+ nodes) are ingested via a FastAPI gateway.
3. **Distributed Analysis**: Celery workers execute Tarjan's SCC and Isolation Forest algorithms in parallel.
4. **Cinematic Visualization**: Live transaction topology is rendered in a 3D interactive galaxy for analysts, utilizing a nested spherical physics lock.
5. **Cross-Bank Verification**: Interactive simulation allowing analysts to verify anomalous nodes with external institutions in real-time.

## The Stack

*   **Frontend**: React 18 (TypeScript), Vite, Tailwind CSS, Framer Motion, react-force-graph-3d, Three.js.
*   **Backend**: FastAPI, SQLite (Relational), Neo4j (Graph), networkx, scikit-learn.
*   **Distributed Queue**: Celery (gevent pool for Windows), Redis.
*   **Data Integrity**: HMAC-SHA256 Payload Validation, Zero-PII Cryptographic Masking.

## How to run this locally 

Since we are running an asynchronous queue, getting this running requires a couple of specific terminal windows. 

**Terminal 1: The Backend (FastAPI)**
```bash
python -m venv venv
.\venv\Scripts\activate  # Windows
source venv/bin/activate # Mac/Linux

pip install -r requirements.txt
python generate_threat_network.py # Seeds the Neo4j and SQLite DB with 5,000+ nodes and fraud patterns
uvicorn main:app --reload
```
*The server will boot on http://localhost:8000*

**Terminal 2: The Task Queue (Celery)**
```bash
.\venv\Scripts\activate
# For Windows, use solo pool or gevent
celery -A tasks worker --loglevel=info --pool=solo
```

**Terminal 3: The Frontend (Vite/React)**
```bash
cd frontend
npm install
npm run dev
```
*The React portal will boot on http://localhost:5173*

## Upcoming: Phase 2
In the Phase 2 update, we will incorporate federated learning across multiple banks to preserve total graph anonymity and implement Private Set Intersection (PSI) for secure cross-bank matching.

## Live Data Generator
The `generate_threat_network.py` script automatically builds the threat databases. It intentionally injects complex fraud patterns (Smurfing, Cycles, Velocity Bursts) so the Admin Dashboard and 3D Visualizer populate beautifully on boot.
