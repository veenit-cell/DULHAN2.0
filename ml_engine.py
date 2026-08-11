import numpy as np
import os
import logging
from sklearn.ensemble import IsolationForest

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Feature schema used across XGBoost and feature extraction
# ---------------------------------------------------------------------------
FEATURE_NAMES = [
    'in_degree', 'out_degree', 'total_volume_in', 'total_volume_out',
    'avg_txn_amount', 'max_txn_amount', 'unique_counterparties',
    'txn_velocity_10m', 'txn_velocity_1h', 'cross_bank_ratio',
    'night_txn_ratio', 'round_amount_ratio', 'scc_membership',
    'betweenness_centrality', 'pagerank_score'
]


# ===========================================================================
#  Isolation Forest  (legacy / unsupervised fallback)
# ===========================================================================
class DULHAN_MLEngine:
    def __init__(self):
        # Initialize Isolation Forest
        self.model = IsolationForest(contamination=0.05, random_state=42)
        self.is_trained = False

    def train(self, features):
        if len(features) > 0:
            self.model.fit(features)
            self.is_trained = True

    def score_samples(self, features):
        if not self.is_trained:
            return [0.5] * len(features)
        
        scores = self.model.decision_function(features)
        normalized_scores = 0.5 - scores
        return np.clip(normalized_scores, 0, 1).tolist()

    def explain_anomaly(self, feature_names, feature_values):
        """Legacy stub – prefer XGBoostFraudScorer.explain() for real SHAP."""
        contributions = []
        for name, val in zip(feature_names, feature_values):
            shap_val = abs(val) * np.random.uniform(0.1, 0.5) 
            contributions.append({"feature": name, "shap_value": float(shap_val)})
        contributions.sort(key=lambda x: abs(x["shap_value"]), reverse=True)
        return contributions[:3]


# ===========================================================================
#  XGBoost Fraud Scorer  (supervised, primary signal)
# ===========================================================================
class XGBoostFraudScorer:
    """
    XGBoost-based fraud classifier with real SHAP explainability.
    
    Falls back to Isolation Forest scores when untrained (cold-start).
    Persists trained models to disk for fast worker restarts.
    """

    MODEL_DIR = "models"
    MODEL_PATH = os.path.join(MODEL_DIR, "xgb_fraud_model.json")

    def __init__(self):
        self.model = None
        self.explainer = None
        self.is_trained = False
        self._load_or_init()

    def _load_or_init(self):
        """Load a persisted model if available, otherwise init fresh."""
        try:
            import xgboost as xgb
        except ImportError:
            logger.warning(
                "xgboost not installed – XGBoostFraudScorer disabled. "
                "Install with: pip install xgboost>=2.0.0"
            )
            return

        os.makedirs(self.MODEL_DIR, exist_ok=True)

        if os.path.exists(self.MODEL_PATH):
            try:
                self.model = xgb.XGBClassifier()
                self.model.load_model(self.MODEL_PATH)
                self.is_trained = True
                self._init_explainer()
                logger.info("XGBoost model loaded from %s", self.MODEL_PATH)
            except Exception as exc:
                logger.error("Failed to load XGBoost model: %s", exc)
                self._init_fresh(xgb)
        else:
            self._init_fresh(xgb)

    def _init_fresh(self, xgb):
        """Initialize a fresh XGBoost model with fraud-tuned hyperparams."""
        self.model = xgb.XGBClassifier(
            n_estimators=200,
            max_depth=6,
            learning_rate=0.05,
            scale_pos_weight=20,      # Handle class imbalance (fraud is rare)
            subsample=0.8,
            colsample_bytree=0.8,
            eval_metric='aucpr',      # Area under PR curve (better for imbalanced)
            use_label_encoder=False,
            random_state=42,
        )
        self.is_trained = False
        logger.info("XGBoost scorer initialised (untrained)")

    def _init_explainer(self):
        """Create SHAP TreeExplainer if shap is available."""
        try:
            import shap
            self.explainer = shap.TreeExplainer(self.model)
        except ImportError:
            logger.warning("shap not installed – explainability disabled")
            self.explainer = None
        except Exception as exc:
            logger.warning("SHAP init failed: %s", exc)
            self.explainer = None

    # ---- Training -----------------------------------------------------------

    def train(self, X, y, eval_set=None):
        """
        Train on labeled fraud data.
        
        Args:
            X: Feature matrix (n_samples, 15).
            y: Binary labels – 1 = fraud, 0 = legit.
            eval_set: Optional list of (X, y) tuples for early stopping.
        """
        if self.model is None:
            logger.error("XGBoost not available – skipping train")
            return

        fit_params = {"verbose": False}
        if eval_set:
            fit_params["eval_set"] = eval_set

        self.model.fit(X, y, **fit_params)
        self.model.save_model(self.MODEL_PATH)
        self.is_trained = True
        self._init_explainer()
        logger.info("XGBoost model trained and saved (%d samples)", len(X))

    # ---- Inference ----------------------------------------------------------

    def predict_proba(self, features):
        """
        Returns fraud probability [0, 1] for each sample.
        
        Falls back to 0.5 when the model hasn't been trained yet.
        """
        if not self.is_trained or self.model is None:
            return [0.5] * len(features)

        try:
            probs = self.model.predict_proba(np.array(features))[:, 1]
            return probs.tolist()
        except Exception as exc:
            logger.error("XGBoost predict_proba failed: %s", exc)
            return [0.5] * len(features)

    # ---- Explainability -----------------------------------------------------

    def explain(self, features):
        """
        Real SHAP explanations using TreeExplainer.
        
        Returns top-5 features sorted by absolute SHAP contribution.
        """
        if self.explainer is None or not self.is_trained:
            return []

        try:
            shap_values = self.explainer.shap_values(np.array(features))
            explanations = []
            for name, sv in zip(FEATURE_NAMES, shap_values[0]):
                explanations.append({"feature": name, "shap_value": float(sv)})
            explanations.sort(key=lambda x: abs(x["shap_value"]), reverse=True)
            return explanations[:5]
        except Exception as exc:
            logger.error("SHAP explanation failed: %s", exc)
            return []


# ===========================================================================
#  Composite Risk Score
# ===========================================================================
def composite_risk_score(scc, if_score=0.8, xgb_prob=None,
                         cycle_score=1.0, between_score=0.2,
                         cross_bank=True, velocity=0.8):
    """
    Weighted composite risk score.

    When XGBoost probability is available (supervised mode):
        R = 0.40*XGB + 0.15*IF + 0.20*CYCLE + 0.10*BETWEEN + 0.10*CROSS + 0.05*VEL

    When XGBoost is unavailable (unsupervised fallback):
        R = 0.30*IF + 0.25*CYCLE + 0.15*BETWEEN + 0.15*CROSS + 0.10*VEL + 0.05*TIME
    """
    cross_score = 1.0 if cross_bank else 0.0

    if xgb_prob is not None:
        # ---- Supervised mode (XGBoost available) ----
        R = (
            0.40 * xgb_prob +
            0.15 * if_score +
            0.20 * cycle_score +
            0.10 * between_score +
            0.10 * cross_score +
            0.05 * velocity
        )
    else:
        # ---- Unsupervised fallback (legacy formula) ----
        time_score = 0.5  # Mocked time factor
        R = (
            0.30 * if_score +
            0.25 * cycle_score +
            0.15 * between_score +
            0.15 * cross_score +
            0.10 * velocity +
            0.05 * time_score
        )
    return R


# ===========================================================================
#  Enhanced Feature Extraction (called from Celery tasks)
# ===========================================================================
def extract_rich_features(neo, sender_token, redis_client=None):
    """
    Extract 15 graph + temporal features for a given account token.
    
    Returns a list of floats matching FEATURE_NAMES order, or None on failure.
    """
    query = """
    MATCH (s:Account {token: $token})
    OPTIONAL MATCH (s)-[out:TRANSFERRED_TO]->()
    OPTIONAL MATCH ()-[inc:TRANSFERRED_TO]->(s)
    WITH s,
         count(DISTINCT out) as out_degree,
         count(DISTINCT inc) as in_degree,
         coalesce(sum(out.amount), 0) as vol_out,
         coalesce(sum(inc.amount), 0) as vol_in,
         coalesce(avg(out.amount), 0) as avg_txn,
         coalesce(max(out.amount), 0) as max_txn,
         count(DISTINCT endNode(out)) as unique_counterparties
    RETURN in_degree, out_degree, vol_in, vol_out,
           avg_txn, max_txn, unique_counterparties
    """
    try:
        res = neo.query(query, {"token": sender_token})
    except Exception as exc:
        logger.error("Feature extraction query failed: %s", exc)
        return None

    if not res:
        return None

    row = res[0]
    in_deg = row.get('in_degree', 0) or 0
    out_deg = row.get('out_degree', 0) or 0
    vol_in = row.get('vol_in', 0) or 0
    vol_out = row.get('vol_out', 0) or 0
    avg_txn = row.get('avg_txn', 0) or 0
    max_txn = row.get('max_txn', 0) or 0
    unique_cp = row.get('unique_counterparties', 0) or 0

    # --- Redis-based velocity features ---
    vel_10m = 0
    vel_1h = 0
    if redis_client:
        try:
            import datetime
            now = datetime.datetime.now(datetime.timezone.utc)
            window_10m = now.strftime('%Y%m%d%H%M')[:-1] + '0'
            window_1h = now.strftime('%Y%m%d%H')
            vel_10m = int(redis_client.get(f"vel:{sender_token}:{window_10m}") or 0)
            vel_1h = int(redis_client.get(f"vel_1h:{sender_token}:{window_1h}") or 0)
        except Exception:
            pass

    # --- Derived ratios (defaults until more data is available) ---
    total_volume = vol_in + vol_out
    cross_bank_ratio = 0.0   # TODO: compute from bank_id diversity
    night_txn_ratio = 0.0    # TODO: compute from timestamp hours
    round_amount_ratio = 0.0 # TODO: compute from amount % 1000 == 0
    scc_membership = 0       # Set by Tarjan SCC check later
    betweenness = 0.0        # TODO: compute from NetworkX
    pagerank = 0.0           # TODO: compute from NetworkX

    return [
        in_deg, out_deg, vol_in, vol_out,
        avg_txn, max_txn, unique_cp,
        vel_10m, vel_1h, cross_bank_ratio,
        night_txn_ratio, round_amount_ratio, scc_membership,
        betweenness, pagerank,
    ]


# ===========================================================================
#  Module-level singletons
# ===========================================================================
isolation_forest_model = DULHAN_MLEngine()
xgboost_scorer = XGBoostFraudScorer()
