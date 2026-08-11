"""
train_xgboost.py — Bootstrap-train the XGBoost fraud scorer.

Pulls account features from Neo4j (uses FLAGGED accounts as fraud labels),
augments with synthetic fraud patterns, and trains the model.

Usage:
    python train_xgboost.py

After training, the model is saved to models/xgb_fraud_model.json
and all subsequent Celery pipeline runs will use XGBoost as the primary scorer.
"""

import numpy as np
import os
import sys
from dotenv import load_dotenv

load_dotenv()

from database import get_neo4j_session
from ml_engine import xgboost_scorer, isolation_forest_model, FEATURE_NAMES

def pull_labeled_data_from_neo4j():
    """Pull accounts and their risk status from Neo4j as training labels."""
    print("[1/4] Connecting to Neo4j...")
    
    try:
        neo = get_neo4j_session()
        # Test connection
        neo.query("RETURN 1 AS health")
        print("      ✅ Neo4j connected")
    except Exception as e:
        print(f"      ⚠️  Neo4j not available: {e}")
        print("      → Using synthetic data only")
        return None, None

    # Pull all accounts with their graph features
    print("[2/4] Extracting features from graph...")
    query = """
    MATCH (s:Account)
    OPTIONAL MATCH (s)-[out:TRANSFERRED_TO]->()
    OPTIONAL MATCH ()-[inc:TRANSFERRED_TO]->(s)
    WITH s,
         count(DISTINCT inc) as in_degree,
         count(DISTINCT out) as out_degree,
         coalesce(sum(inc.amount), 0) as vol_in,
         coalesce(sum(out.amount), 0) as vol_out,
         coalesce(avg(out.amount), 0) as avg_txn,
         coalesce(max(out.amount), 0) as max_txn,
         count(DISTINCT endNode(out)) as unique_counterparties,
         s.risk_status as risk_status
    RETURN in_degree, out_degree, vol_in, vol_out,
           avg_txn, max_txn, unique_counterparties, risk_status
    """
    results = neo.query(query)
    
    if not results or len(results) < 5:
        print(f"      ⚠️  Only {len(results) if results else 0} accounts found")
        print("      → Augmenting with synthetic data")
        return None, None
    
    X = []
    y = []
    flagged_count = 0
    clean_count = 0
    
    for row in results:
        features = [
            row.get('in_degree', 0) or 0,
            row.get('out_degree', 0) or 0,
            row.get('vol_in', 0) or 0,
            row.get('vol_out', 0) or 0,
            row.get('avg_txn', 0) or 0,
            row.get('max_txn', 0) or 0,
            row.get('unique_counterparties', 0) or 0,
            0,    # txn_velocity_10m (not available in batch)
            0,    # txn_velocity_1h
            0.0,  # cross_bank_ratio
            0.0,  # night_txn_ratio
            0.0,  # round_amount_ratio
            0,    # scc_membership
            0.0,  # betweenness_centrality
            0.0,  # pagerank_score
        ]
        
        label = 1 if row.get('risk_status') == 'FLAGGED' else 0
        if label == 1:
            flagged_count += 1
        else:
            clean_count += 1
        
        X.append(features)
        y.append(label)
    
    print(f"      📊 {len(X)} accounts: {flagged_count} FLAGGED, {clean_count} CLEAN")
    return np.array(X), np.array(y)


def generate_synthetic_fraud_data(n_legit=500, n_fraud=100):
    """
    Generate synthetic training data with realistic fraud patterns.
    
    Fraud patterns modeled:
    - Smurfing: many small txns, high velocity, many counterparties
    - Layering: high in/out degree, circular flows, cross-bank
    - Round-tripping: equal in/out volumes, round amounts
    - Mule accounts: high in-degree, low out-degree, night activity
    """
    print(f"[*] Generating synthetic data: {n_legit} legit + {n_fraud} fraud samples...")
    rng = np.random.RandomState(42)
    
    # --- Legitimate accounts ---
    legit = np.column_stack([
        rng.poisson(3, n_legit),            # in_degree: low
        rng.poisson(3, n_legit),            # out_degree: low
        rng.exponential(50000, n_legit),    # vol_in: moderate
        rng.exponential(50000, n_legit),    # vol_out: moderate
        rng.exponential(15000, n_legit),    # avg_txn: moderate
        rng.exponential(50000, n_legit),    # max_txn: moderate
        rng.poisson(4, n_legit),            # unique_counterparties
        rng.poisson(2, n_legit),            # velocity_10m: low
        rng.poisson(8, n_legit),            # velocity_1h: low
        rng.uniform(0.0, 0.3, n_legit),    # cross_bank_ratio: low
        rng.uniform(0.0, 0.15, n_legit),   # night_txn_ratio: low
        rng.uniform(0.0, 0.2, n_legit),    # round_amount_ratio: low
        np.zeros(n_legit),                  # scc_membership: none
        rng.uniform(0.0, 0.1, n_legit),    # betweenness: low
        rng.uniform(0.0, 0.05, n_legit),   # pagerank: low
    ])
    
    # --- Fraud: Smurfing (many small rapid txns) ---
    n_smurf = n_fraud // 4
    smurfing = np.column_stack([
        rng.poisson(2, n_smurf),             # in_degree
        rng.poisson(15, n_smurf),            # out_degree: HIGH
        rng.exponential(10000, n_smurf),     # vol_in: low
        rng.exponential(200000, n_smurf),    # vol_out: HIGH
        rng.uniform(5000, 9500, n_smurf),    # avg_txn: just below ₹10K reporting
        rng.uniform(9000, 9999, n_smurf),    # max_txn: capped below threshold
        rng.poisson(12, n_smurf),            # unique_counterparties: HIGH
        rng.poisson(8, n_smurf),             # velocity_10m: HIGH
        rng.poisson(25, n_smurf),            # velocity_1h: HIGH
        rng.uniform(0.5, 1.0, n_smurf),     # cross_bank: HIGH
        rng.uniform(0.0, 0.3, n_smurf),     # night_txn_ratio
        rng.uniform(0.3, 0.8, n_smurf),     # round_amount: HIGH
        np.ones(n_smurf),                    # scc_membership: YES
        rng.uniform(0.1, 0.4, n_smurf),     # betweenness
        rng.uniform(0.05, 0.2, n_smurf),    # pagerank
    ])
    
    # --- Fraud: Layering (complex chain) ---
    n_layer = n_fraud // 4
    layering = np.column_stack([
        rng.poisson(8, n_layer),             # in_degree: HIGH
        rng.poisson(8, n_layer),             # out_degree: HIGH
        rng.exponential(500000, n_layer),    # vol_in: VERY HIGH
        rng.exponential(500000, n_layer),    # vol_out: VERY HIGH
        rng.exponential(100000, n_layer),    # avg_txn: HIGH
        rng.exponential(500000, n_layer),    # max_txn: VERY HIGH
        rng.poisson(6, n_layer),             # unique_counterparties
        rng.poisson(5, n_layer),             # velocity_10m
        rng.poisson(15, n_layer),            # velocity_1h
        rng.uniform(0.6, 1.0, n_layer),     # cross_bank: VERY HIGH
        rng.uniform(0.3, 0.7, n_layer),     # night_txn: HIGH
        rng.uniform(0.0, 0.3, n_layer),     # round_amount
        np.ones(n_layer),                    # scc_membership: YES
        rng.uniform(0.3, 0.8, n_layer),     # betweenness: HIGH
        rng.uniform(0.1, 0.4, n_layer),     # pagerank: HIGH
    ])
    
    # --- Fraud: Round-tripping ---
    n_round = n_fraud // 4
    roundtrip = np.column_stack([
        rng.poisson(3, n_round),             # in_degree
        rng.poisson(3, n_round),             # out_degree
        rng.exponential(300000, n_round),    # vol_in ~ vol_out
        rng.exponential(300000, n_round),    # vol_out
        rng.exponential(100000, n_round),    # avg_txn: HIGH
        rng.exponential(300000, n_round),    # max_txn
        rng.poisson(2, n_round),             # unique_counterparties: LOW (same people)
        rng.poisson(3, n_round),             # velocity_10m
        rng.poisson(10, n_round),            # velocity_1h
        rng.uniform(0.0, 0.3, n_round),     # cross_bank
        rng.uniform(0.4, 0.9, n_round),     # night_txn: VERY HIGH
        rng.uniform(0.7, 1.0, n_round),     # round_amount: VERY HIGH
        np.ones(n_round),                    # scc_membership: YES
        rng.uniform(0.0, 0.2, n_round),     # betweenness
        rng.uniform(0.0, 0.1, n_round),     # pagerank
    ])
    
    # --- Fraud: Mule accounts ---
    n_mule = n_fraud - n_smurf - n_layer - n_round
    mule = np.column_stack([
        rng.poisson(12, n_mule),             # in_degree: VERY HIGH
        rng.poisson(1, n_mule),              # out_degree: LOW (receives, barely sends)
        rng.exponential(800000, n_mule),     # vol_in: VERY HIGH
        rng.exponential(20000, n_mule),      # vol_out: LOW
        rng.exponential(60000, n_mule),      # avg_txn
        rng.exponential(200000, n_mule),     # max_txn
        rng.poisson(10, n_mule),             # unique_counterparties: HIGH (many senders)
        rng.poisson(1, n_mule),              # velocity_10m: LOW
        rng.poisson(5, n_mule),              # velocity_1h
        rng.uniform(0.4, 0.9, n_mule),      # cross_bank: HIGH
        rng.uniform(0.5, 1.0, n_mule),      # night_txn: VERY HIGH
        rng.uniform(0.0, 0.3, n_mule),      # round_amount
        np.zeros(n_mule),                    # scc_membership
        rng.uniform(0.0, 0.1, n_mule),      # betweenness: LOW
        rng.uniform(0.05, 0.3, n_mule),     # pagerank: MODERATE
    ])
    
    X = np.vstack([legit, smurfing, layering, roundtrip, mule])
    y = np.concatenate([
        np.zeros(n_legit),
        np.ones(n_smurf),
        np.ones(n_layer),
        np.ones(n_round),
        np.ones(n_mule),
    ])
    
    # Shuffle
    idx = rng.permutation(len(X))
    return X[idx], y[idx].astype(int)


def train():
    print("=" * 60)
    print("  DULHAN — XGBoost Fraud Model Training")
    print("=" * 60)
    print()
    
    # Step 1: Try to pull real data from Neo4j
    X_real, y_real = pull_labeled_data_from_neo4j()
    
    # Step 2: Generate synthetic fraud patterns
    X_syn, y_syn = generate_synthetic_fraud_data(n_legit=500, n_fraud=100)
    
    # Step 3: Combine real + synthetic
    if X_real is not None and len(X_real) > 0:
        X = np.vstack([X_real, X_syn])
        y = np.concatenate([y_real, y_syn])
        print(f"\n[3/4] Combined dataset: {len(X_real)} real + {len(X_syn)} synthetic = {len(X)} samples")
    else:
        X = X_syn
        y = y_syn
        print(f"\n[3/4] Using synthetic dataset: {len(X)} samples")
    
    fraud_count = int(y.sum())
    legit_count = len(y) - fraud_count
    print(f"      Distribution: {legit_count} legit ({legit_count/len(y)*100:.1f}%) | {fraud_count} fraud ({fraud_count/len(y)*100:.1f}%)")
    
    # Step 4: Train
    print("\n[4/4] Training XGBoost...")
    
    # Split for evaluation
    split_idx = int(len(X) * 0.8)
    idx = np.random.RandomState(42).permutation(len(X))
    X_train, X_val = X[idx[:split_idx]], X[idx[split_idx:]]
    y_train, y_val = y[idx[:split_idx]], y[idx[split_idx:]]
    
    xgboost_scorer.train(
        X_train, y_train,
        eval_set=[(X_val, y_val)]
    )
    
    # Evaluate
    probs = xgboost_scorer.predict_proba(X_val)
    predictions = [1 if p > 0.5 else 0 for p in probs]
    
    tp = sum(1 for p, a in zip(predictions, y_val) if p == 1 and a == 1)
    fp = sum(1 for p, a in zip(predictions, y_val) if p == 1 and a == 0)
    fn = sum(1 for p, a in zip(predictions, y_val) if p == 0 and a == 1)
    tn = sum(1 for p, a in zip(predictions, y_val) if p == 0 and a == 0)
    
    accuracy = (tp + tn) / len(y_val) if len(y_val) > 0 else 0
    precision = tp / (tp + fp) if (tp + fp) > 0 else 0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0
    f1 = 2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0
    
    print()
    print("  ┌─────────────────────────────────────┐")
    print("  │       Training Results               │")
    print("  ├─────────────────────────────────────┤")
    print(f"  │  Accuracy:   {accuracy:.4f}                │")
    print(f"  │  Precision:  {precision:.4f}                │")
    print(f"  │  Recall:     {recall:.4f}                │")
    print(f"  │  F1 Score:   {f1:.4f}                │")
    print("  ├─────────────────────────────────────┤")
    print(f"  │  TP: {tp:>4}  FP: {fp:>4}                  │")
    print(f"  │  FN: {fn:>4}  TN: {tn:>4}                  │")
    print("  └─────────────────────────────────────┘")
    print()
    
    # Test SHAP explanation
    print("  Testing SHAP explainability...")
    sample = X_val[0:1]
    explanations = xgboost_scorer.explain(sample)
    if explanations:
        print("  Top contributing features for sample #1:")
        for exp in explanations:
            direction = "→ FRAUD" if exp['shap_value'] > 0 else "→ LEGIT"
            print(f"    • {exp['feature']:.<30s} SHAP={exp['shap_value']:+.4f}  {direction}")
    else:
        print("  ⚠️  SHAP not available")
    
    print()
    print(f"  ✅ Model saved to: {os.path.abspath(xgboost_scorer.MODEL_PATH)}")
    print(f"  ✅ XGBoost is now ACTIVE in the Celery pipeline")
    print(f"     All new transactions will be scored with 40% XGBoost weight")
    print()
    
    # Also retrain Isolation Forest with the same data
    print("  Retraining Isolation Forest (unsupervised fallback)...")
    isolation_forest_model.train(X[:, :3])  # Legacy 3-feature
    print("  ✅ Isolation Forest retrained")
    print()
    print("=" * 60)
    print("  DONE — Restart Celery worker to load the new model")
    print("=" * 60)


if __name__ == "__main__":
    train()
