"""
StructureX — Module 5c: XGBoost Tabular Risk Model
XGBoost classifier for environmental risk scoring from engineered features.

Architecture:
    XGBClassifier(max_depth=6, n_estimators=100, learning_rate=0.1)

Input:  single row of engineered features (tabular)
Output: environmental_risk_score ∈ [0, 1] (probability from predict_proba)

Labels: derived from composite environmental risk threshold
"""

import numpy as np
import pandas as pd
import xgboost as xgb
from sklearn.preprocessing import StandardScaler
from typing import Optional, Dict, Tuple
import joblib

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from backend.config import (
    XGB_MAX_DEPTH, XGB_N_ESTIMATORS, XGB_LEARNING_RATE,
    XGB_RISK_THRESHOLD, MODEL_DIR, RANDOM_SEED,
)
from backend.features.engineering import get_feature_columns


class TabularRiskModel:
    """
    XGBoost-based environmental risk scorer.

    Input schema:  DataFrame or array with engineered feature columns
    Output schema: environmental_risk_score ∈ [0, 1] per sample

    Labels are derived from a composite risk formula,
    NOT random assignment.
    """

    def __init__(self):
        self.model = xgb.XGBClassifier(
            max_depth=XGB_MAX_DEPTH,
            n_estimators=XGB_N_ESTIMATORS,
            learning_rate=XGB_LEARNING_RATE,
            random_state=RANDOM_SEED,
            use_label_encoder=False,
            eval_metric="logloss",
            objective="binary:logistic",
        )
        self.scaler = StandardScaler()
        self.feature_columns = get_feature_columns()
        self.trained = False

    def create_labels(self, df: pd.DataFrame) -> np.ndarray:
        """
        Create binary risk labels from environmental data.

        Formula:
            composite_risk = 0.25 * seismic_impact_norm
                           + 0.25 * soil_risk_index
                           + 0.20 * thermal_stress_norm
                           + 0.15 * cumulative_fatigue_norm
                           + 0.15 * rolling_std_vibration_norm

        Label = 1 if composite_risk > XGB_RISK_THRESHOLD (0.6)
        Label = 0 otherwise

        Input:  DataFrame with engineered features
        Output: (num_samples,) binary array
        """
        # Normalize each component to [0, 1] for fair weighting
        def safe_normalize(arr):
            mn, mx = arr.min(), arr.max()
            if mx > mn:
                return (arr - mn) / (mx - mn)
            return np.zeros_like(arr)

        seismic_norm = safe_normalize(df["seismic_impact"].values)
        soil_norm = df["soil_risk_index"].values  # already [0, 1]
        thermal_norm = safe_normalize(df["thermal_stress"].values)
        fatigue_norm = safe_normalize(df["cumulative_fatigue"].values)
        vibration_std_norm = safe_normalize(df["rolling_std_vibration"].values)

        composite = (
            0.25 * seismic_norm
            + 0.25 * soil_norm
            + 0.20 * thermal_norm
            + 0.15 * fatigue_norm
            + 0.15 * vibration_std_norm
        )

        labels = (composite > XGB_RISK_THRESHOLD).astype(int)
        return labels

    def train(self, df: pd.DataFrame) -> Dict[str, float]:
        """
        Train XGBoost on engineered features.

        Input:  DataFrame with all feature columns + data for label derivation
        Output: training metrics dict
        """
        labels = self.create_labels(df)

        # Extract features
        X = df[self.feature_columns].values.astype(np.float32)
        X = np.nan_to_num(X, nan=0.0)

        # Scale features
        X_scaled = self.scaler.fit_transform(X)

        # Train
        self.model.fit(X_scaled, labels)
        self.trained = True

        # Training accuracy
        predictions = self.model.predict(X_scaled)
        accuracy = (predictions == labels).mean()
        risk_rate = labels.mean()

        print(f"  [XGBoost] Training accuracy: {accuracy:.4f}")
        print(f"  [XGBoost] Risk rate in labels: {risk_rate:.4f}")

        return {
            "accuracy": float(accuracy),
            "risk_rate": float(risk_rate),
            "num_samples": len(X),
        }

    def predict(self, features: np.ndarray) -> np.ndarray:
        """
        Predict environmental risk score.

        Input:  (num_samples, num_features) array
        Output: (num_samples,) array of risk_score ∈ [0, 1]
                Uses predict_proba for probability output
        """
        if not self.trained:
            raise RuntimeError("Model not trained. Call train() first.")

        features = np.nan_to_num(features.astype(np.float32), nan=0.0)
        features_scaled = self.scaler.transform(features)
        probs = self.model.predict_proba(features_scaled)[:, 1]
        return probs.astype(np.float32)

    def predict_from_df(self, df: pd.DataFrame) -> np.ndarray:
        """Predict from DataFrame with named columns."""
        X = df[self.feature_columns].values
        return self.predict(X)

    def get_feature_importance(self) -> Dict[str, float]:
        """Return feature importance from trained model."""
        if not self.trained:
            return {}
        importance = self.model.feature_importances_
        return dict(zip(self.feature_columns, importance.tolist()))

    def save(self, path: Optional[Path] = None):
        """Save model and scaler."""
        path = path or MODEL_DIR / "xgboost_model.json"
        scaler_path = path.parent / "xgboost_scaler.pkl"
        self.model.save_model(str(path))
        joblib.dump(self.scaler, scaler_path)
        print(f"  [XGBoost] Saved to {path}")

    def load(self, path: Optional[Path] = None):
        """Load model and scaler."""
        path = path or MODEL_DIR / "xgboost_model.json"
        scaler_path = path.parent / "xgboost_scaler.pkl"
        self.model.load_model(str(path))
        self.scaler = joblib.load(scaler_path)
        self.trained = True
        print(f"  [XGBoost] Loaded from {path}")
