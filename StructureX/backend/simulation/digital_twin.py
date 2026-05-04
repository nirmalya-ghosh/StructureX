"""
StructureX — Module 3: Digital Twin Simulation Engine
Generates structural sensor data (vibration, strain, load, fatigue) from environmental inputs.

Input:  unified_df (aligned environmental data)
Output: DataFrame with structural columns added

Physics Models:
1. Vibration = base + noise + degradation_trend + seismic_effect
2. Strain = function(load, soil_stability, temperature)
3. Load = base + traffic_pattern(time_of_day)
4. Fatigue = cumulative(load × dt), normalized to [0, 1]
"""

import numpy as np
import pandas as pd
from typing import Optional

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from backend.config import (
    RANDOM_SEED,
    DT_BASE_VIBRATION, DT_VIBRATION_NOISE_STD, DT_DEGRADATION_RATE,
    DT_THERMAL_EXPANSION_COEFF, DT_REFERENCE_TEMP,
    DT_ELASTIC_MODULUS, DT_CROSS_SECTION_AREA,
    DT_BASE_LOAD, DT_LOAD_AMPLITUDE,
    EQ_SPIKE_THRESHOLD,
)


def compute_load(timestep_index: int, rng: np.random.Generator) -> float:
    """
    Compute structural load at a given timestep.

    Model: L(t) = L_base + L_amplitude * sin(2π * t / 24) + noise
    Represents traffic/usage patterns with daily cyclical variation.

    Input:  timestep_index (int), rng
    Output: load in Newtons (float, >= 0)
    """
    # Daily traffic cycle: peak at hour 12, trough at hour 0
    daily_pattern = DT_LOAD_AMPLITUDE * np.sin(2 * np.pi * timestep_index / 24)
    noise = rng.normal(0, DT_LOAD_AMPLITUDE * 0.1)
    load = DT_BASE_LOAD + daily_pattern + noise
    return max(0.0, float(load))


def compute_vibration(
    timestep_index: int,
    magnitude: float,
    depth_km: float,
    rng: np.random.Generator,
) -> float:
    """
    Compute vibration reading.

    Formula: V(t) = V_base + noise(σ) + degradation(t) + seismic_spike(M, D)

    - degradation_trend = rate * t  (linear aging)
    - seismic_spike: IF magnitude > threshold → spike = M² / D
    - noise: Gaussian with std = DT_VIBRATION_NOISE_STD

    Input:  timestep_index, earthquake magnitude, depth
    Output: vibration in mm/s (float, >= 0)
    """
    base = DT_BASE_VIBRATION
    noise = rng.normal(0, DT_VIBRATION_NOISE_STD)
    degradation = DT_DEGRADATION_RATE * timestep_index

    # Seismic effect
    seismic_spike = 0.0
    if magnitude > EQ_SPIKE_THRESHOLD:
        # Spike proportional to magnitude², inversely proportional to depth
        seismic_spike = (magnitude ** 2) / max(depth_km, 1.0)

    vibration = base + noise + degradation + seismic_spike
    return max(0.0, float(vibration))


def compute_strain(
    load: float,
    liquefaction_risk: float,
    temperature_c: float,
) -> float:
    """
    Compute structural strain.

    Formula: ε = (F / (E × A)) × soil_instability_factor × thermal_expansion

    - soil_instability_factor = 1 + liquefaction_risk × 0.5
    - thermal_expansion = 1 + α × (T - T_ref)

    Input:  load (N), liquefaction_risk (0-1), temperature (°C)
    Output: strain (dimensionless, float >= 0)
    """
    # Basic strain: F / (E * A)
    basic_strain = load / (DT_ELASTIC_MODULUS * DT_CROSS_SECTION_AREA)

    # Soil instability amplification
    soil_factor = 1.0 + liquefaction_risk * 0.5

    # Thermal expansion effect
    thermal_factor = 1.0 + DT_THERMAL_EXPANSION_COEFF * (temperature_c - DT_REFERENCE_TEMP)

    strain = basic_strain * soil_factor * thermal_factor
    return max(0.0, float(strain))


def compute_fatigue(loads: np.ndarray) -> np.ndarray:
    """
    Compute cumulative fatigue index.

    Formula: F(t) = cumsum(L(i) * dt) / max_cumsum, normalized to [0, 1]

    This represents material fatigue accumulation over time.
    Miner's rule approximation: damage = Σ(load_i / capacity)

    Input:  array of load values over time
    Output: array of fatigue indices, each in [0, 1]
    """
    # Cumulative load-time product (dt = 1 timestep)
    cumulative = np.cumsum(loads)
    # Normalize to [0, 1]
    max_val = cumulative[-1] if cumulative[-1] > 0 else 1.0
    fatigue = cumulative / max_val
    return fatigue


def simulate_structure(
    unified_df: pd.DataFrame,
    seed: int = RANDOM_SEED,
) -> pd.DataFrame:
    """
    Run digital twin simulation on unified environmental data.

    Input schema: DataFrame with [timestamp, location_id, magnitude, depth_km,
                                   liquefaction_risk, temperature_c, ...]
    Output schema: same DataFrame + [vibration, strain, load, fatigue_index]

    Process per location:
    1. Iterate through timesteps
    2. Compute load (traffic pattern)
    3. Compute vibration (base + noise + degradation + seismic)
    4. Compute strain (load, soil, temperature)
    5. Compute fatigue (cumulative load)
    """
    rng = np.random.default_rng(seed + 10)
    result_df = unified_df.copy()

    # Initialize structural columns
    result_df["vibration"] = 0.0
    result_df["strain"] = 0.0
    result_df["load"] = 0.0
    result_df["fatigue_index"] = 0.0

    for loc_id in result_df["location_id"].unique():
        loc_mask = result_df["location_id"] == loc_id
        loc_data = result_df.loc[loc_mask].reset_index(drop=True)
        n = len(loc_data)

        # Per-location RNG for independence
        loc_rng = np.random.default_rng(seed + hash(loc_id) % 10000)

        loads = np.zeros(n)
        vibrations = np.zeros(n)
        strains = np.zeros(n)

        for i in range(n):
            row = loc_data.iloc[i]

            # 1. Load
            loads[i] = compute_load(i, loc_rng)

            # 2. Vibration
            vibrations[i] = compute_vibration(
                timestep_index=i,
                magnitude=row["magnitude"],
                depth_km=row["depth_km"],
                rng=loc_rng,
            )

            # 3. Strain
            strains[i] = compute_strain(
                load=loads[i],
                liquefaction_risk=row["liquefaction_risk"],
                temperature_c=row["temperature_c"],
            )

        # 4. Fatigue (vectorized)
        fatigues = compute_fatigue(loads)

        # Write back
        result_df.loc[loc_mask, "vibration"] = vibrations
        result_df.loc[loc_mask, "strain"] = strains
        result_df.loc[loc_mask, "load"] = loads
        result_df.loc[loc_mask, "fatigue_index"] = fatigues

    return result_df


if __name__ == "__main__":
    from backend.data.ingestion import ingest_all
    from backend.data.alignment import align_datasets

    eq_df, soil_df, weather_df = ingest_all(save_csv=False)
    unified = align_datasets(eq_df, soil_df, weather_df)
    simulated = simulate_structure(unified)

    print(f"Simulated shape: {simulated.shape}")
    print(f"Columns: {list(simulated.columns)}")
    print(f"\nVibration stats:\n{simulated['vibration'].describe()}")
    print(f"\nStrain stats:\n{simulated['strain'].describe()}")
    print(f"\nFatigue stats:\n{simulated['fatigue_index'].describe()}")

    simulated.to_csv(DATA_DIR / "simulated_data.csv", index=False)
    print(f"\nSaved to {DATA_DIR / 'simulated_data.csv'}")
