"""
StructureX — Data Generation CLI Script
Generates all datasets: earthquake, soil, weather → unified → simulated → featured.
"""

import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from backend.data.ingestion import ingest_all
from backend.data.alignment import align_datasets
from backend.simulation.digital_twin import simulate_structure
from backend.features.engineering import engineer_features
from backend.config import DATA_DIR


def main():
    print("=" * 60)
    print("StructureX — Data Generation Pipeline")
    print("=" * 60)

    # Step 1: Ingest
    print("\n[1/4] Generating environmental data...")
    eq_df, soil_df, weather_df = ingest_all(save_csv=True)

    # Step 2: Align
    print("\n[2/4] Aligning datasets...")
    unified = align_datasets(eq_df, soil_df, weather_df)
    unified.to_csv(DATA_DIR / "unified_data.csv", index=False)
    print(f"  Unified: {unified.shape}")

    # Step 3: Simulate
    print("\n[3/4] Running digital twin simulation...")
    simulated = simulate_structure(unified)
    simulated.to_csv(DATA_DIR / "simulated_data.csv", index=False)
    print(f"  Simulated: {simulated.shape}")

    # Step 4: Features
    print("\n[4/4] Engineering features...")
    featured = engineer_features(simulated)
    featured.to_csv(DATA_DIR / "featured_data.csv", index=False)
    print(f"  Featured: {featured.shape}")

    print("\n" + "=" * 60)
    print(f"All data saved to {DATA_DIR}")
    print("=" * 60)


if __name__ == "__main__":
    main()
