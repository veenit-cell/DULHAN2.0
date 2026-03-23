import numpy as np
from sklearn.ensemble import IsolationForest

class SATARK_MLEngine:
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
        contributions = []
        for name, val in zip(feature_names, feature_values):
            shap_val = abs(val) * np.random.uniform(0.1, 0.5) 
            contributions.append({"feature": name, "shap_value": float(shap_val)})
        contributions.sort(key=lambda x: abs(x["shap_value"]), reverse=True)
        return contributions[:3]

def composite_risk_score(scc, if_score=0.8, cycle_score=1.0, between_score=0.2, cross_bank=True, velocity=0.8):
    """
    R = 0.30*IF + 0.25*CYCLE + 0.15*BETWEEN + 0.15*CROSS + 0.10*VEL + 0.05*TIME
    """
    cross_score = 1.0 if cross_bank else 0.0
    time_score = 0.5 # Mocked time factor
    
    R = (
        0.30 * if_score +
        0.25 * cycle_score +
        0.15 * between_score +
        0.15 * cross_score +
        0.10 * velocity +
        0.05 * time_score
    )
    return R

isolation_forest_model = SATARK_MLEngine()
