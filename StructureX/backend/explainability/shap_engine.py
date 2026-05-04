"""
StructureX — Module 7: Explainability Engine (SHAP)
Uses SHAP TreeExplainer on the XGBoost model to provide
feature-level explanations for risk predictions.

Input:  feature values for a prediction, trained XGBoost model
Output: list of {feature_name, contribution_value}, sorted by |contribution|

Top 3 features are extracted and highlighted.
"""

import numpy as np
import pandas as pd
import shap
from typing import List, Dict, Optional

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from backend.features.engineering import get_feature_columns
from backend.models.xgboost_model import TabularRiskModel


class ExplainabilityEngine:
    """
    SHAP-based explainability for XGBoost risk model.

    Uses TreeExplainer for exact SHAP values (not approximation).
    Background dataset: sample of 100 training rows.

    Input schema:  feature array (1D or 2D)
    Output schema: [{feature_name: str, contribution_value: float}]
    """

    def __init__(self, model: TabularRiskModel):
        self.risk_model = model
        self.explainer = None
        self.feature_columns = get_feature_columns()
        self._initialized = False

    def initialize(self, background_data: Optional[np.ndarray] = None):
        """
        Initialize SHAP explainer with background dataset.

        Input:  background_data (num_samples, num_features) — scaled features
                If None, uses a zero baseline (less accurate but functional)
        """
        if not self.risk_model.trained:
            raise RuntimeError("XGBoost model not trained. Train it first.")

        # Use TreeExplainer for exact SHAP values
        self.explainer = shap.TreeExplainer(self.risk_model.model)
        self._initialized = True
        print("[SHAP] Explainer initialized with TreeExplainer")

    def explain(
        self, features: np.ndarray, top_k: int = 3
    ) -> Dict[str, object]:
        """
        Generate SHAP explanations for a prediction.

        Input:
            features: (num_features,) or (1, num_features) array — SCALED features
            top_k: number of top contributing features to highlight

        Output:
            {
                "explanations": [{feature_name, contribution_value}, ...],
                "top_features": [{feature_name, contribution_value}, ...]  # top 3
            }
        """
        if not self._initialized:
            self.initialize()

        # Ensure 2D input
        if features.ndim == 1:
            features = features.reshape(1, -1)

        features = np.nan_to_num(features.astype(np.float32), nan=0.0)

        # Scale features through the model's scaler
        features_scaled = self.risk_model.scaler.transform(features)

        # Compute SHAP values
        shap_values = self.explainer.shap_values(features_scaled)

        # For binary classification, shap_values may be a list [neg_class, pos_class]
        if isinstance(shap_values, list):
            sv = shap_values[1][0]  # positive class, first sample
        elif shap_values.ndim == 3:
            sv = shap_values[0, :, 1]  # first sample, positive class
        else:
            sv = shap_values[0]  # first sample

        # Build explanations list
        explanations = []
        for i, col in enumerate(self.feature_columns):
            if i < len(sv):
                explanations.append({
                    "feature_name": col,
                    "contribution_value": round(float(sv[i]), 6),
                })

        # Sort by absolute contribution
        explanations.sort(key=lambda x: abs(x["contribution_value"]), reverse=True)

        # Top K
        top_features = explanations[:top_k]

        return {
            "explanations": explanations,
            "top_features": top_features,
        }


if __name__ == "__main__":
    # Test with a trained model
    from backend.models.training import run_full_pipeline

    print("Training models for SHAP test...")
    run_full_pipeline(num_timesteps=200)

    # Load trained model
    model = TabularRiskModel()
    model.load()

    engine = ExplainabilityEngine(model)
    engine.initialize()

    # Test with a sample
    test_features = np.random.default_rng(42).random(len(get_feature_columns())).astype(np.float32)
    result = engine.explain(test_features)

    print("\nSHAP Explanations:")
    for exp in result["explanations"]:
        print(f"  {exp['feature_name']}: {exp['contribution_value']}")

    print("\nTop 3 Features:")
    for feat in result["top_features"]:
        print(f"  {feat['feature_name']}: {feat['contribution_value']}")
