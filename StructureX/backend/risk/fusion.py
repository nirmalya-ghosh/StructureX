"""
StructureX — Module 6: Risk Fusion Engine
Combines outputs from all 3 ML models into a unified risk score.

Risk Score Formula (EXACT):
    risk_score = (0.30 × anomaly_score × 100) +
                 (0.30 × failure_probability × 100) +
                 (0.20 × environmental_risk × 100) +
                 (0.20 × normalized_degradation × 100)

Categories:
    0–40  → SAFE
    40–70 → WARNING
    70–100 → CRITICAL

Input:  anomaly_score, failure_probability, environmental_risk, normalized_degradation (all ∈ [0,1])
Output: RiskResult with risk_score, risk_category, and component values
"""

import numpy as np
from typing import Dict

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from backend.config import (
    RISK_WEIGHT_ANOMALY, RISK_WEIGHT_FAILURE,
    RISK_WEIGHT_ENVIRONMENTAL, RISK_WEIGHT_DEGRADATION,
    RISK_SAFE_MAX, RISK_WARNING_MAX,
)


def compute_risk_score(
    anomaly_score: float,
    failure_probability: float,
    environmental_risk: float,
    normalized_degradation: float,
) -> Dict[str, object]:
    """
    Compute unified risk score from ML model outputs.

    Input schema:
        anomaly_score:          float ∈ [0, 1]  (from Autoencoder)
        failure_probability:    float ∈ [0, 1]  (from LSTM)
        environmental_risk:     float ∈ [0, 1]  (from XGBoost)
        normalized_degradation: float ∈ [0, 1]  (from LSTM)

    Output schema:
        {
            risk_score: float ∈ [0, 100],
            risk_category: "SAFE" | "WARNING" | "CRITICAL",
            anomaly_score: float,
            failure_probability: float,
            environmental_risk: float,
            normalized_degradation: float,
        }

    Formula:
        risk_score = (0.30 × anomaly_score × 100) +
                     (0.30 × failure_probability × 100) +
                     (0.20 × environmental_risk × 100) +
                     (0.20 × normalized_degradation × 100)
    """
    # Validate and clip inputs to [0, 1]
    anomaly_score = float(np.clip(anomaly_score, 0.0, 1.0))
    failure_probability = float(np.clip(failure_probability, 0.0, 1.0))
    environmental_risk = float(np.clip(environmental_risk, 0.0, 1.0))
    normalized_degradation = float(np.clip(normalized_degradation, 0.0, 1.0))

    # Apply risk fusion formula
    risk_score = (
        RISK_WEIGHT_ANOMALY * anomaly_score * 100
        + RISK_WEIGHT_FAILURE * failure_probability * 100
        + RISK_WEIGHT_ENVIRONMENTAL * environmental_risk * 100
        + RISK_WEIGHT_DEGRADATION * normalized_degradation * 100
    )

    # Clip to [0, 100]
    risk_score = float(np.clip(risk_score, 0.0, 100.0))

    # Categorize
    if risk_score <= RISK_SAFE_MAX:
        risk_category = "SAFE"
    elif risk_score <= RISK_WARNING_MAX:
        risk_category = "WARNING"
    else:
        risk_category = "CRITICAL"

    return {
        "risk_score": round(risk_score, 2),
        "risk_category": risk_category,
        "anomaly_score": round(anomaly_score, 4),
        "failure_probability": round(failure_probability, 4),
        "environmental_risk": round(environmental_risk, 4),
        "normalized_degradation": round(normalized_degradation, 4),
    }


def categorize_risk(score: float) -> str:
    """
    Categorize a risk score.

    Input:  score ∈ [0, 100]
    Output: "SAFE" | "WARNING" | "CRITICAL"
    """
    if score <= RISK_SAFE_MAX:
        return "SAFE"
    elif score <= RISK_WARNING_MAX:
        return "WARNING"
    return "CRITICAL"


if __name__ == "__main__":
    # Test with various scenarios
    test_cases = [
        (0.1, 0.1, 0.1, 0.1),     # Low risk → SAFE
        (0.5, 0.5, 0.5, 0.5),     # Medium risk → WARNING
        (0.9, 0.9, 0.9, 0.9),     # High risk → CRITICAL
        (0.8, 0.2, 0.3, 0.1),     # High anomaly, low others
        (0.1, 0.1, 0.9, 0.8),     # High environmental + degradation
    ]

    for anomaly, failure, env, deg in test_cases:
        result = compute_risk_score(anomaly, failure, env, deg)
        print(f"Inputs: a={anomaly}, f={failure}, e={env}, d={deg}")
        print(f"  → Score: {result['risk_score']}, Category: {result['risk_category']}")
        print()
