"""
StructureX — Module 2: Data Alignment Layer
Aligns earthquake, soil, and weather data into a unified DataFrame.

Input:  earthquake_df, soil_df, weather_df (from ingestion)
Output: unified_df aligned by (timestamp, location_id)

Alignment Strategy:
1. Weather data is the time-series backbone (one row per timestamp per location)
2. Earthquake data merged: nearest event magnitude/depth per (timestamp, location)
3. Soil data merged: static per location (broadcast across all timestamps)
4. Missing values: forward-fill then backward-fill
"""

import pandas as pd
import numpy as np
from typing import Optional

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from backend.config import DATA_DIR


def align_datasets(
    earthquake_df: pd.DataFrame,
    soil_df: pd.DataFrame,
    weather_df: pd.DataFrame,
) -> pd.DataFrame:
    """
    Align all environmental datasets into a unified time-series DataFrame.

    Input schemas:
    - earthquake_df: [timestamp, location_id, latitude, longitude, magnitude, depth_km]
    - soil_df: [location_id, soil_type, soil_moisture, soil_density, liquefaction_risk]
    - weather_df: [timestamp, location_id, temperature_c, humidity, rainfall_mm, wind_speed]

    Output schema: unified_df with ALL columns merged on (timestamp, location_id)

    Process:
    1. Use weather_df as backbone (has every timestamp × location)
    2. Merge earthquake data by (timestamp, location_id)
    3. Merge soil data by location_id (static, broadcast)
    4. Forward-fill / backward-fill NaN values
    """
    # Ensure datetime types
    weather_df = weather_df.copy()
    earthquake_df = earthquake_df.copy()
    weather_df["timestamp"] = pd.to_datetime(weather_df["timestamp"])
    earthquake_df["timestamp"] = pd.to_datetime(earthquake_df["timestamp"])

    # Step 1: Merge earthquake data onto weather backbone
    # Select relevant earthquake columns
    eq_merge = earthquake_df[["timestamp", "location_id", "magnitude", "depth_km"]].copy()

    # Merge on exact timestamp + location_id
    unified = weather_df.merge(
        eq_merge,
        on=["timestamp", "location_id"],
        how="left",
    )

    # Fill missing earthquake data (no event = 0 magnitude, max depth)
    unified["magnitude"] = unified["magnitude"].fillna(0.0)
    unified["depth_km"] = unified["depth_km"].fillna(300.0)

    # Step 2: Merge soil data (static per location)
    unified = unified.merge(
        soil_df,
        on="location_id",
        how="left",
    )

    # Step 3: Handle any remaining NaN
    # Forward-fill within each location group, then backward-fill
    unified = unified.sort_values(["location_id", "timestamp"]).reset_index(drop=True)

    numeric_cols = unified.select_dtypes(include=[np.number]).columns
    for col in numeric_cols:
        unified[col] = unified.groupby("location_id")[col].ffill().bfill()

    # Categorical fill
    if "soil_type" in unified.columns:
        unified["soil_type"] = unified.groupby("location_id")["soil_type"].ffill().bfill()
        unified["soil_type"] = unified["soil_type"].fillna("rock")

    # Ensure no NaN remain
    assert unified.isnull().sum().sum() == 0, (
        f"Alignment failed: NaN values remain:\n{unified.isnull().sum()[unified.isnull().sum() > 0]}"
    )

    return unified


def load_and_align(save_csv: bool = True) -> pd.DataFrame:
    """
    Load CSVs from data/generated/ and produce unified dataset.

    Returns: unified DataFrame
    """
    eq_df = pd.read_csv(DATA_DIR / "earthquake_data.csv")
    soil_df = pd.read_csv(DATA_DIR / "soil_data.csv")
    weather_df = pd.read_csv(DATA_DIR / "weather_data.csv")

    unified = align_datasets(eq_df, soil_df, weather_df)

    if save_csv:
        unified.to_csv(DATA_DIR / "unified_data.csv", index=False)
        print(f"[Alignment] Unified dataset: {len(unified)} rows, "
              f"{len(unified.columns)} columns → {DATA_DIR / 'unified_data.csv'}")

    return unified


if __name__ == "__main__":
    unified = load_and_align()
    print(f"\nColumns: {list(unified.columns)}")
    print(f"Shape: {unified.shape}")
    print(f"\nSample:\n{unified.head(10)}")
    print(f"\nData types:\n{unified.dtypes}")
