# Dulhan Run Guide

Follow these steps to run the Dulhan B2B Analyst Workspace.

### 1. Start Infrastructure (MANDATORY)
**Neo4j & Redis MUST be running before you proceed.**

- **Neo4j DB**: Required for graph visualization.
  1. Open **Neo4j Desktop**.
  2. Start your database instance.
  3. Ensure it is listening on `bolt://localhost:7687`.
  4. (*Note: If you haven't set a password, the default is usually `neo4j` / `password`*).

- **Redis Server**: Required for background task queuing.
  - **Option A (Docker)**:
    ```bash
    docker run -d -p 6379:6379 redis
    ```
  - **Option B (Manual/Windows Service)**:
    ```bash
    redis-server
    ```

### 2. Initialize Database
Once Neo4j and Redis are running, run this in your root terminal:
```bash
python generate_threat_network.py
```
*Wait for this to complete. It may take a few minutes as it seeds data.*

### 3. Launch Backend API
Open a **new terminal** in the project root and run:
```bash
uvicorn main:app --reload
```
The API will be available at [http://localhost:8000](http://localhost:8000).

### 4. Start Background Workers (Celery)

Open **separate terminals** in the project root for each worker:

**Option A — Single worker (development):**
```bash
celery -A tasks worker --loglevel=info -P gevent -E -Q celery,ingestion,ml_scoring,graph_analysis,critical_alerts,dlq
```

**Option B — Dedicated workers (production):**
```bash
# Terminal 1 — Ingestion queue
celery -A tasks worker -Q ingestion --concurrency=8 -P gevent -E --loglevel=info

# Terminal 2 — ML Scoring queue  
celery -A tasks worker -Q ml_scoring --concurrency=4 -P gevent -E --loglevel=info

# Terminal 3 — Graph Analysis queue
celery -A tasks worker -Q graph_analysis --concurrency=4 -P gevent -E --loglevel=info

# Terminal 4 — Critical Alerts + DLQ
celery -A tasks worker -Q critical_alerts,dlq,celery --concurrency=2 -P gevent -E --loglevel=info
```

**Start Celery Beat (scheduled tasks):**
```bash
celery -A tasks beat --loglevel=info
```

**Start Flower monitoring (optional):**
```bash
celery -A tasks flower --port=5555
```
Then open [http://localhost:5555](http://localhost:5555) to monitor tasks.

### 5. Launch Frontend Dashboard
Open a **new terminal** in the `frontend` directory and run:
```bash
npm run dev
```

### 6. Access the Workspace
Open [http://localhost:5173](http://localhost:5173) in your browser.

**Login Credentials:**
- **Institution ID**: `BNK-HDFC`
- **Password**: `password123`

---
### Troubleshooting

**Error: `No connection could be made... target machine actively refused it (7687)`**
- **Cause**: Neo4j is not running.
- **Fix**: Open Neo4j Desktop and click "Start" on your project database.

**Error: `docker: invalid reference format`**
- **Cause**: You likely typed the "OR" part of the command. 
- **Fix**: Run ONLY `docker run -d -p 6379:6379 redis`.
