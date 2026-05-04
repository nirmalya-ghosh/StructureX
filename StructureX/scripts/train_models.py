"""
StructureX — Model Training CLI Script
Trains all 3 ML models: Autoencoder, LSTM, XGBoost.
"""

import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from backend.models.training import run_full_pipeline


def main():
    print("Starting StructureX model training...")
    metrics = run_full_pipeline()

    print("\n\n" + "=" * 60)
    print("TRAINING SUMMARY")
    print("=" * 60)
    for model_name, model_metrics in metrics.items():
        print(f"\n{model_name.upper()}:")
        for key, value in model_metrics.items():
            print(f"  {key}: {value}")
    print("=" * 60)


if __name__ == "__main__":
    main()
