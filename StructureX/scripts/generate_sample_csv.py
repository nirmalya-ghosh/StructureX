"""
StructureX — Sample CSV Generator
Creates a sample CSV file matching the required schema for testing the upload feature.
"""

import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

import numpy as np
import pandas as pd

from backend.config import RANDOM_SEED


def generate_sample_csv(
    output_path: str = "sample_data.csv",
    num_records: int = 500,
    num_locations: int = 3,
    seed: int = RANDOM_SEED,
):
    """Generate a sample CSV matching the required input schema."""
    rng = np.random.default_rng(seed)

    locations = [f"LOC_{str(i+1).zfill(3)}" for i in range(num_locations)]
    records_per_loc = num_records // num_locations

    dfs = []
    for loc in locations:
        timestamps = pd.date_range("2024-01-01", periods=records_per_loc, freq="h")

        # Earthquake data (Gutenberg-Richter-ish)
        magnitudes = rng.exponential(scale=1.5, size=records_per_loc) + 1.0
        magnitudes = np.clip(magnitudes, 0.5, 9.0)
        depths = rng.uniform(5, 200, size=records_per_loc)

        # Weather data (seasonal patterns)
        t = np.arange(records_per_loc) / (24 * 365)  # in years
        temperature = 25 + 10 * np.sin(2 * np.pi * t) + rng.normal(0, 3, records_per_loc)
        humidity = 60 + 15 * np.cos(2 * np.pi * t) + rng.normal(0, 5, records_per_loc)
        rainfall = np.clip(rng.exponential(5, records_per_loc), 0, 100)

        # Soil data
        soil_moisture = np.clip(0.3 + 0.1 * np.sin(np.pi * t) + rng.normal(0, 0.05, records_per_loc), 0, 1)
        soil_density = rng.uniform(1200, 2200, size=records_per_loc)
        liquefaction = np.clip(soil_moisture * 0.5 + rng.normal(0, 0.1, records_per_loc), 0, 1)

        # Structural data (physics-based)
        vibration = np.clip(0.5 + magnitudes * 0.08 + rng.normal(0, 0.15, records_per_loc), 0.01, 10)
        strain = np.clip(vibration * 2e-5 + rng.normal(0, 5e-6, records_per_loc), 0, 1)
        load = np.clip(50000 + magnitudes * 3000 + rng.normal(0, 5000, records_per_loc), 10000, 500000)
        fatigue_idx = np.clip(np.cumsum(strain * 0.01) / records_per_loc + rng.normal(0, 0.01, records_per_loc), 0, 1)

        df = pd.DataFrame({
            "timestamp": timestamps,
            "location_id": loc,
            "magnitude": np.round(magnitudes, 2),
            "depth_km": np.round(depths, 1),
            "temperature_c": np.round(temperature, 1),
            "humidity": np.round(np.clip(humidity, 0, 100), 1),
            "rainfall_mm": np.round(rainfall, 1),
            "soil_moisture": np.round(soil_moisture, 3),
            "soil_density": np.round(soil_density, 1),
            "liquefaction_risk": np.round(liquefaction, 3),
            "vibration": np.round(vibration, 4),
            "strain": np.round(strain, 8),
            "load": np.round(load, 1),
            "fatigue_index": np.round(fatigue_idx, 4),
        })
        dfs.append(df)

    full_df = pd.concat(dfs, ignore_index=True)
    full_df.to_csv(output_path, index=False)
    print(f"Generated {len(full_df)} records across {num_locations} locations → {output_path}")
    return full_df


if __name__ == "__main__":
    generate_sample_csv()
