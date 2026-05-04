"""
StructureX — Module 1: Data Ingestion
Generates structured, physics-based environmental datasets.
All generators use seeded RNG for full reproducibility.

Input:  config parameters (seed, num_timesteps, locations)
Output: pandas DataFrames + CSV files for earthquake, soil, weather data
"""

import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Tuple, Optional

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from backend.config import (
    RANDOM_SEED, NUM_LOCATIONS, NUM_TIMESTEPS, TIMESTEP_HOURS,
    LOCATIONS,
    EQ_MIN_MAGNITUDE, EQ_MAX_MAGNITUDE, EQ_BETA, EQ_OCCURRENCE_RATE,
    EQ_DEPTH_MIN_KM, EQ_DEPTH_MAX_KM,
    SOIL_TYPES, SOIL_TYPE_PROPERTIES,
    WEATHER_BASE_TEMP, WEATHER_TEMP_AMPLITUDE, WEATHER_HUMIDITY_BASE,
    WEATHER_RAINFALL_LAMBDA, WEATHER_WIND_SHAPE, WEATHER_WIND_SCALE,
    DATA_DIR,
)


def generate_timestamps(
    num_timesteps: int = NUM_TIMESTEPS,
    start: datetime = datetime(2024, 1, 1),
    step_hours: int = TIMESTEP_HOURS,
) -> pd.DatetimeIndex:
    """Generate evenly-spaced hourly timestamps."""
    return pd.date_range(start=start, periods=num_timesteps, freq=f"{step_hours}h")


def generate_earthquake_data(
    timestamps: pd.DatetimeIndex,
    locations: dict = LOCATIONS,
    seed: int = RANDOM_SEED,
    magnitude_override: Optional[float] = None,
) -> pd.DataFrame:
    """
    Generate earthquake event data using Gutenberg-Richter distribution.

    Physics:
    - Magnitude follows truncated exponential (Gutenberg-Richter: log10(N) = a - b*M)
    - Depth correlates inversely with magnitude (shallow = stronger surface effect)
    - Events are stochastic with configurable occurrence rate

    Input schema:  timestamps, location configs
    Output schema: DataFrame[timestamp, latitude, longitude, magnitude, depth_km, location_id]
    """
    rng = np.random.default_rng(seed)
    records = []

    for loc_id, loc_info in locations.items():
        for ts in timestamps:
            # Determine if earthquake occurs at this timestep
            if rng.random() < EQ_OCCURRENCE_RATE:
                if magnitude_override is not None:
                    mag = float(magnitude_override)
                else:
                    # Gutenberg-Richter: sample from truncated exponential
                    # P(M) ∝ 10^(-b*M) => use inverse CDF
                    u = rng.random()
                    mag = EQ_MIN_MAGNITUDE - (1.0 / EQ_BETA) * np.log10(1 - u * (1 - 10 ** (-EQ_BETA * (EQ_MAX_MAGNITUDE - EQ_MIN_MAGNITUDE))))
                    mag = np.clip(mag, EQ_MIN_MAGNITUDE, EQ_MAX_MAGNITUDE)

                # Depth: inversely correlated with magnitude (shallow quakes = more damaging)
                depth_base = EQ_DEPTH_MAX_KM * (1 - (mag - EQ_MIN_MAGNITUDE) / (EQ_MAX_MAGNITUDE - EQ_MIN_MAGNITUDE))
                depth = np.clip(
                    depth_base + rng.normal(0, 20),
                    EQ_DEPTH_MIN_KM, EQ_DEPTH_MAX_KM
                )

                # Small perturbation in location (±0.5 degrees)
                lat = loc_info["lat"] + rng.normal(0, 0.2)
                lon = loc_info["lon"] + rng.normal(0, 0.2)

                records.append({
                    "timestamp": ts,
                    "location_id": loc_id,
                    "latitude": np.clip(lat, -90, 90),
                    "longitude": np.clip(lon, -180, 180),
                    "magnitude": round(float(mag), 2),
                    "depth_km": round(float(depth), 2),
                })
            else:
                # No earthquake: record zero magnitude
                records.append({
                    "timestamp": ts,
                    "location_id": loc_id,
                    "latitude": loc_info["lat"],
                    "longitude": loc_info["lon"],
                    "magnitude": 0.0,
                    "depth_km": EQ_DEPTH_MAX_KM,  # max depth = no effect
                })

    df = pd.DataFrame(records)
    df["timestamp"] = pd.to_datetime(df["timestamp"])
    return df


def generate_soil_data(
    locations: dict = LOCATIONS,
    seed: int = RANDOM_SEED,
    moisture_override: Optional[float] = None,
) -> pd.DataFrame:
    """
    Generate soil properties per location.

    Physics:
    - Each location assigned a soil type with base properties
    - Moisture, density vary with noise around base values
    - Liquefaction risk = f(moisture, density, soil_type)
      Higher moisture + lower density = higher liquefaction risk

    Input schema:  location configs
    Output schema: DataFrame[location_id, soil_type, soil_moisture, soil_density, liquefaction_risk]
    """
    rng = np.random.default_rng(seed + 1)  # Different seed for independence
    records = []

    loc_ids = list(locations.keys())
    for i, loc_id in enumerate(loc_ids):
        # Assign soil type deterministically per location
        soil_type = SOIL_TYPES[i % len(SOIL_TYPES)]
        base_moisture, base_density, base_liq = SOIL_TYPE_PROPERTIES[soil_type]

        if moisture_override is not None:
            moisture = float(moisture_override)
        else:
            moisture = np.clip(base_moisture + rng.normal(0, 0.05), 0.0, 1.0)

        density = max(100.0, base_density + rng.normal(0, 50))

        # Liquefaction risk formula: f(moisture, inverse density, base risk)
        # Higher moisture increases risk, higher density decreases risk
        density_factor = 1.0 - (density - 1000) / 2000  # normalized: 0 at 3000, 1 at 1000
        density_factor = np.clip(density_factor, 0, 1)
        liquefaction = np.clip(
            0.3 * moisture + 0.3 * density_factor + 0.4 * base_liq,
            0.0, 1.0
        )

        records.append({
            "location_id": loc_id,
            "soil_type": soil_type,
            "soil_moisture": round(float(moisture), 4),
            "soil_density": round(float(density), 2),
            "liquefaction_risk": round(float(liquefaction), 4),
        })

    return pd.DataFrame(records)


def generate_weather_data(
    timestamps: pd.DatetimeIndex,
    locations: dict = LOCATIONS,
    seed: int = RANDOM_SEED,
    temperature_override: Optional[float] = None,
) -> pd.DataFrame:
    """
    Generate weather time series per location.

    Physics:
    - Temperature: sinusoidal seasonal cycle + daily variation + noise
      T(t) = T_base + A_seasonal * sin(2π*t/8760) + A_daily * sin(2π*t/24) + noise
    - Humidity: inversely correlated with temperature + random component
    - Rainfall: Poisson-distributed events (mm), correlated with humidity
    - Wind speed: Weibull distribution (standard for wind modeling)

    Input schema:  timestamps, location configs
    Output schema: DataFrame[timestamp, location_id, temperature_c, humidity, rainfall_mm, wind_speed]
    """
    rng = np.random.default_rng(seed + 2)
    records = []

    for loc_id, loc_info in locations.items():
        # Location-specific base temp offset (latitude effect)
        lat_factor = (30 - abs(loc_info["lat"])) / 30  # warmer near equator
        temp_offset = lat_factor * 5

        for i, ts in enumerate(timestamps):
            if temperature_override is not None:
                temp = float(temperature_override)
            else:
                # Seasonal component (period = 8760 hours = 1 year)
                seasonal = WEATHER_TEMP_AMPLITUDE * np.sin(2 * np.pi * i / 8760)
                # Daily component (period = 24 hours)
                daily = 5.0 * np.sin(2 * np.pi * i / 24 - np.pi / 2)
                # Noise
                noise = rng.normal(0, 2.0)
                temp = WEATHER_BASE_TEMP + temp_offset + seasonal + daily + noise
                temp = np.clip(temp, -50, 55)

            # Humidity: inversely related to temperature
            humidity_base = WEATHER_HUMIDITY_BASE - 0.5 * (temp - WEATHER_BASE_TEMP)
            humidity = np.clip(humidity_base + rng.normal(0, 5), 0, 100)

            # Rainfall: Poisson events, higher probability when humidity > 70%
            rain_prob = 0.1 if humidity > 70 else 0.02
            if rng.random() < rain_prob:
                rainfall = rng.exponential(WEATHER_RAINFALL_LAMBDA)
            else:
                rainfall = 0.0

            # Wind: Weibull distribution
            wind = float(rng.weibull(WEATHER_WIND_SHAPE) * WEATHER_WIND_SCALE)

            records.append({
                "timestamp": ts,
                "location_id": loc_id,
                "temperature_c": round(float(temp), 2),
                "humidity": round(float(humidity), 2),
                "rainfall_mm": round(float(rainfall), 2),
                "wind_speed": round(float(wind), 2),
            })

    df = pd.DataFrame(records)
    df["timestamp"] = pd.to_datetime(df["timestamp"])
    return df


def ingest_all(
    num_timesteps: int = NUM_TIMESTEPS,
    locations: dict = LOCATIONS,
    seed: int = RANDOM_SEED,
    magnitude_override: Optional[float] = None,
    temperature_override: Optional[float] = None,
    moisture_override: Optional[float] = None,
    save_csv: bool = True,
) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """
    Run full data ingestion pipeline.

    Returns: (earthquake_df, soil_df, weather_df)
    """
    timestamps = generate_timestamps(num_timesteps)

    eq_df = generate_earthquake_data(timestamps, locations, seed, magnitude_override)
    soil_df = generate_soil_data(locations, seed, moisture_override)
    weather_df = generate_weather_data(timestamps, locations, seed, temperature_override)

    if save_csv:
        eq_df.to_csv(DATA_DIR / "earthquake_data.csv", index=False)
        soil_df.to_csv(DATA_DIR / "soil_data.csv", index=False)
        weather_df.to_csv(DATA_DIR / "weather_data.csv", index=False)
        print(f"[Ingestion] Saved earthquake ({len(eq_df)} rows), "
              f"soil ({len(soil_df)} rows), weather ({len(weather_df)} rows) to {DATA_DIR}")

    return eq_df, soil_df, weather_df


if __name__ == "__main__":
    eq, soil, weather = ingest_all()
    print(f"\nEarthquake columns: {list(eq.columns)}")
    print(f"Soil columns: {list(soil.columns)}")
    print(f"Weather columns: {list(weather.columns)}")
    print(f"\nEarthquake sample:\n{eq.head()}")
    print(f"\nSoil:\n{soil}")
    print(f"\nWeather sample:\n{weather.head()}")
