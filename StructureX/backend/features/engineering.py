"""
StructureX — Module 4: Feature Engineering Pipeline
Creates derived features from unified + simulated data.

Input:  simulated_df (unified data with structural columns)
Output: DataFrame with all engineered features appended

Features (EXACT spec):
1. rolling_mean_vibration  = vibration.rolling(window=10).mean()
2. rolling_std_vibration   = vibration.rolling(window=10).std()
3. rate_of_change_strain   = strain.diff()
4. cumulative_fatigue      = fatigue_index.cumsum()
5. seismic_impact          = magnitude * (1 / depth_km)  [clipped]
6. thermal_stress          = temperature_c * expansion_coefficient
7. soil_risk_index         = 0.4*soil_moisture + 0.3*(1/soil_density_norm) + 0.3*liquefaction_risk
"""

import numpy as np
import pandas as pd

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from backend.config import (
    FE_ROLLING_WINDOW,
    FE_SEISMIC_DEPTH_CLIP,
    DT_THERMAL_EXPANSION_COEFF,
)


def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Apply feature engineering pipeline to simulated data.

    Input schema: DataFrame with columns:
        [timestamp, location_id, vibration, strain, load, fatigue_index,
         magnitude, depth_km, temperature_c, humidity, rainfall_mm, wind_speed,
         soil_moisture, soil_density, liquefaction_risk, soil_type]

    Output schema: Same DataFrame + engineered feature columns.
        NaN rows from rolling operations are forward-filled then dropped.

    All transformations are deterministic and traceable.
    """
    result = df.copy()
    result = result.sort_values(["location_id", "timestamp"]).reset_index(drop=True)

    # ──────────────────────────────────────────
    # Feature 1: Rolling Mean Vibration (window=10)
    # Captures average vibration trend over recent history
    # ──────────────────────────────────────────
    result["rolling_mean_vibration"] = (
        result.groupby("location_id")["vibration"]
        .transform(lambda x: x.rolling(window=FE_ROLLING_WINDOW, min_periods=1).mean())
    )

    # ──────────────────────────────────────────
    # Feature 2: Rolling Std Vibration (window=10)
    # Captures vibration volatility — spikes = anomalies
    # ──────────────────────────────────────────
    result["rolling_std_vibration"] = (
        result.groupby("location_id")["vibration"]
        .transform(lambda x: x.rolling(window=FE_ROLLING_WINDOW, min_periods=1).std())
    )
    # First few rows have NaN std → fill with 0
    result["rolling_std_vibration"] = result["rolling_std_vibration"].fillna(0.0)

    # ──────────────────────────────────────────
    # Feature 3: Rate of Change of Strain
    # First derivative — sudden changes indicate failure onset
    # ──────────────────────────────────────────
    result["rate_of_change_strain"] = (
        result.groupby("location_id")["strain"]
        .transform(lambda x: x.diff())
    )
    result["rate_of_change_strain"] = result["rate_of_change_strain"].fillna(0.0)

    # ──────────────────────────────────────────
    # Feature 4: Cumulative Fatigue
    # Running sum of fatigue_index — monotonically increasing damage
    # ──────────────────────────────────────────
    result["cumulative_fatigue"] = (
        result.groupby("location_id")["fatigue_index"]
        .transform(lambda x: x.cumsum())
    )

    # ──────────────────────────────────────────
    # Feature 5: Seismic Impact
    # = magnitude × (1 / depth_km)
    # Shallow, strong quakes = high impact
    # depth clipped to avoid division by zero
    # ──────────────────────────────────────────
    clipped_depth = result["depth_km"].clip(lower=FE_SEISMIC_DEPTH_CLIP)
    result["seismic_impact"] = result["magnitude"] * (1.0 / clipped_depth)

    # ──────────────────────────────────────────
    # Feature 6: Thermal Stress
    # = temperature × thermal_expansion_coefficient
    # Higher temp = more expansion = higher stress
    # ──────────────────────────────────────────
    result["thermal_stress"] = result["temperature_c"] * DT_THERMAL_EXPANSION_COEFF

    # ──────────────────────────────────────────
    # Feature 7: Soil Risk Index
    # = 0.4 × soil_moisture + 0.3 × (1/normalized_density) + 0.3 × liquefaction_risk
    # Composite index of soil-related failure risk
    # ──────────────────────────────────────────
    # Normalize density: higher density = safer, so invert
    density_max = result["soil_density"].max()
    density_min = result["soil_density"].min()
    if density_max > density_min:
        normalized_inv_density = 1.0 - (result["soil_density"] - density_min) / (density_max - density_min)
    else:
        normalized_inv_density = 0.5

    result["soil_risk_index"] = (
        0.4 * result["soil_moisture"]
        + 0.3 * normalized_inv_density
        + 0.3 * result["liquefaction_risk"]
    )

    # ──────────────────────────────────────────
    # Feature 8: Fatigue Growth Rate
    # = diff(fatigue_index) — acceleration of structural fatigue
    # Positive values indicate increasing damage rate
    # ──────────────────────────────────────────
    result["fatigue_growth_rate"] = (
        result.groupby("location_id")["fatigue_index"]
        .transform(lambda x: x.diff())
    )
    result["fatigue_growth_rate"] = result["fatigue_growth_rate"].fillna(0.0)

    # ──────────────────────────────────────────
    # Final cleanup: ensure no NaN
    # ──────────────────────────────────────────
    engineered_cols = [
        "rolling_mean_vibration", "rolling_std_vibration",
        "rate_of_change_strain", "cumulative_fatigue",
        "seismic_impact", "thermal_stress", "soil_risk_index",
        "fatigue_growth_rate",
    ]
    for col in engineered_cols:
        result[col] = result[col].fillna(0.0)

    return result


def get_feature_columns() -> list:
    """Return the list of feature column names used for ML models."""
    return [
        "rolling_mean_vibration",
        "rolling_std_vibration",
        "rate_of_change_strain",
        "cumulative_fatigue",
        "seismic_impact",
        "thermal_stress",
        "soil_risk_index",
        "vibration",
        "strain",
        "load",
        "temperature_c",
        "humidity",
        "rainfall_mm",
        "wind_speed",
    ]


if __name__ == "__main__":
    from backend.data.ingestion import ingest_all
    from backend.data.alignment import align_datasets
    from backend.simulation.digital_twin import simulate_structure
    from backend.config import DATA_DIR

    eq_df, soil_df, weather_df = ingest_all(save_csv=False)
    unified = align_datasets(eq_df, soil_df, weather_df)
    simulated = simulate_structure(unified)
    featured = engineer_features(simulated)

    print(f"Featured shape: {featured.shape}")
    print(f"\nEngineered features:")
    for col in get_feature_columns():
        print(f"  {col}: min={featured[col].min():.6f}, "
              f"max={featured[col].max():.6f}, "
              f"mean={featured[col].mean():.6f}")

    featured.to_csv(DATA_DIR / "featured_data.csv", index=False)
    print(f"\nSaved to {DATA_DIR / 'featured_data.csv'}")
