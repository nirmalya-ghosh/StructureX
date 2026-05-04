"""
StructureX — Infrastructure Analysis Module
Maps ML outputs to infrastructure-specific risk assessments.

Covers:
    - Buildings: foundation instability, load-bearing degradation
    - Bridges: resonance risk, structural fatigue
    - Pipelines: soil displacement, pressure imbalance

Input:  risk metrics, feature values, environmental data
Output: infrastructure-specific risk dict for each infrastructure type
"""

import numpy as np
from typing import Dict

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))


def _risk_label(score: float) -> str:
    """Convert 0-1 score to risk label."""
    if score < 0.3:
        return "low"
    elif score < 0.6:
        return "moderate"
    elif score < 0.8:
        return "elevated"
    return "critical"


def analyze_buildings(
    vibration_mean: float,
    soil_risk: float,
    fatigue: float,
    load_ratio: float,
    liquefaction_risk: float,
    strain_max: float,
) -> Dict:
    """
    Assess building-specific risks.

    Foundation instability risk:
        = 0.35 × soil_risk + 0.35 × liquefaction_risk + 0.15 × vibration_norm + 0.15 × strain_norm

    Load-bearing degradation risk:
        = 0.30 × fatigue + 0.30 × load_ratio + 0.20 × strain_norm + 0.20 × vibration_norm

    Input:  individual metric values (all floats)
    Output: {foundation_risk, foundation_score, load_bearing_risk, load_bearing_score}
    """
    vib_norm = min(vibration_mean / 2.0, 1.0)  # normalize: 2 mm/s = max concern
    strain_norm = min(strain_max / 0.001, 1.0)  # normalize: 0.001 = yield concern

    foundation_score = np.clip(
        0.35 * soil_risk + 0.35 * liquefaction_risk + 0.15 * vib_norm + 0.15 * strain_norm,
        0, 1
    )

    load_bearing_score = np.clip(
        0.30 * fatigue + 0.30 * load_ratio + 0.20 * strain_norm + 0.20 * vib_norm,
        0, 1
    )

    return {
        "foundation_risk": _risk_label(foundation_score),
        "foundation_score": round(float(foundation_score), 4),
        "load_bearing_risk": _risk_label(load_bearing_score),
        "load_bearing_score": round(float(load_bearing_score), 4),
    }


def analyze_bridges(
    vibration_std: float,
    vibration_mean: float,
    fatigue: float,
    strain_rate: float,
    seismic_impact: float,
) -> Dict:
    """
    Assess bridge-specific risks.

    Resonance risk:
        = 0.40 × vibration_std_norm + 0.30 × seismic_norm + 0.30 × vibration_mean_norm
        High vibration variability + seismic activity = resonance danger

    Structural fatigue:
        = 0.40 × fatigue + 0.30 × strain_rate_norm + 0.30 × vibration_mean_norm
    """
    vib_mean_norm = min(vibration_mean / 2.0, 1.0)
    vib_std_norm = min(vibration_std / 0.5, 1.0)  # 0.5 mm/s std = high variability
    strain_rate_norm = min(abs(strain_rate) / 0.0001, 1.0)
    seismic_norm = min(seismic_impact / 5.0, 1.0)  # 5.0 = high seismic impact

    resonance_score = np.clip(
        0.40 * vib_std_norm + 0.30 * seismic_norm + 0.30 * vib_mean_norm,
        0, 1
    )

    fatigue_score = np.clip(
        0.40 * fatigue + 0.30 * strain_rate_norm + 0.30 * vib_mean_norm,
        0, 1
    )

    return {
        "resonance_risk": _risk_label(resonance_score),
        "resonance_score": round(float(resonance_score), 4),
        "fatigue_risk": _risk_label(fatigue_score),
        "fatigue_score": round(float(fatigue_score), 4),
    }


def analyze_pipelines(
    soil_risk: float,
    soil_moisture: float,
    temperature_range: float,
    strain_max: float,
    vibration_mean: float,
    load_mean: float,
) -> Dict:
    """
    Assess pipeline-specific risks.

    Soil displacement risk:
        = 0.35 × soil_risk + 0.30 × soil_moisture + 0.20 × vibration_norm + 0.15 × strain_norm
        Wet, unstable soil + vibrations = pipe displacement danger

    Pressure imbalance risk:
        = 0.30 × thermal_range_norm + 0.30 × strain_norm + 0.20 × load_norm + 0.20 × vibration_norm
    """
    vib_norm = min(vibration_mean / 2.0, 1.0)
    strain_norm = min(strain_max / 0.001, 1.0)
    thermal_norm = min(temperature_range / 50.0, 1.0)  # 50°C range = max concern
    load_norm = min(load_mean / 100000.0, 1.0)  # 100kN = reference

    displacement_score = np.clip(
        0.35 * soil_risk + 0.30 * soil_moisture + 0.20 * vib_norm + 0.15 * strain_norm,
        0, 1
    )

    pressure_score = np.clip(
        0.30 * thermal_norm + 0.30 * strain_norm + 0.20 * load_norm + 0.20 * vib_norm,
        0, 1
    )

    return {
        "displacement_risk": _risk_label(displacement_score),
        "displacement_score": round(float(displacement_score), 4),
        "pressure_risk": _risk_label(pressure_score),
        "pressure_score": round(float(pressure_score), 4),
    }


def analyze_infrastructure(
    metrics: Dict,
) -> Dict:
    """
    Full infrastructure analysis from aggregated metrics.

    Input schema:
        metrics: {
            vibration_mean, vibration_std, soil_risk, fatigue,
            load_ratio, liquefaction_risk, strain_max, strain_rate,
            seismic_impact, soil_moisture, temperature_range, load_mean
        }

    Output schema:
        {
            buildings: {foundation_risk, foundation_score, load_bearing_risk, load_bearing_score},
            bridges: {resonance_risk, resonance_score, fatigue_risk, fatigue_score},
            pipelines: {displacement_risk, displacement_score, pressure_risk, pressure_score},
        }
    """
    buildings = analyze_buildings(
        vibration_mean=metrics.get("vibration_mean", 0.5),
        soil_risk=metrics.get("soil_risk", 0.3),
        fatigue=metrics.get("fatigue", 0.2),
        load_ratio=metrics.get("load_ratio", 0.3),
        liquefaction_risk=metrics.get("liquefaction_risk", 0.2),
        strain_max=metrics.get("strain_max", 0.00003),
    )

    bridges = analyze_bridges(
        vibration_std=metrics.get("vibration_std", 0.1),
        vibration_mean=metrics.get("vibration_mean", 0.5),
        fatigue=metrics.get("fatigue", 0.2),
        strain_rate=metrics.get("strain_rate", 0.0),
        seismic_impact=metrics.get("seismic_impact", 0.5),
    )

    pipelines = analyze_pipelines(
        soil_risk=metrics.get("soil_risk", 0.3),
        soil_moisture=metrics.get("soil_moisture", 0.3),
        temperature_range=metrics.get("temperature_range", 20.0),
        strain_max=metrics.get("strain_max", 0.00003),
        vibration_mean=metrics.get("vibration_mean", 0.5),
        load_mean=metrics.get("load_mean", 50000.0),
    )

    return {
        "buildings": buildings,
        "bridges": bridges,
        "pipelines": pipelines,
    }
