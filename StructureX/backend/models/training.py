"""
StructureX — Module 5d: Model Training Orchestrator
Orchestrates end-to-end: data generation → feature engineering → label creation → training all 3 models.

All steps are deterministic with fixed seeds.
"""

import numpy as np
import pandas as pd
from pathlib import Path

import sys
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from backend.config import RANDOM_SEED, DATA_DIR, MODEL_DIR
from backend.data.ingestion import ingest_all
from backend.data.alignment import align_datasets
from backend.simulation.digital_twin import simulate_structure
from backend.features.engineering import engineer_features, get_feature_columns
from backend.models.autoencoder import AnomalyDetector
from backend.models.lstm_model import TimeSeriesPredictor
from backend.models.xgboost_model import TabularRiskModel


def run_full_pipeline(
    num_timesteps: int = 1000,
    seed: int = RANDOM_SEED,
    save_data: bool = True,
) -> dict:
    """
    Full training pipeline.

    Steps:
    1. Generate environmental data (earthquake, soil, weather)
    2. Align datasets into unified DataFrame
    3. Run digital twin simulation (add structural data)
    4. Engineer features
    5. Train Autoencoder (anomaly detection)
    6. Train LSTM (failure prediction)
    7. Train XGBoost (environmental risk)
    8. Save all models

    Returns: dict of training metrics for each model
    """
    print("=" * 60)
    print("StructureX — Full Training Pipeline")
    print("=" * 60)

    # ── Step 1: Data Ingestion ──
    print("\n[Step 1/7] Generating environmental data...")
    eq_df, soil_df, weather_df = ingest_all(
        num_timesteps=num_timesteps, seed=seed, save_csv=save_data
    )

    # ── Step 2: Data Alignment ──
    print("\n[Step 2/7] Aligning datasets...")
    unified_df = align_datasets(eq_df, soil_df, weather_df)
    if save_data:
        unified_df.to_csv(DATA_DIR / "unified_data.csv", index=False)
    print(f"  Unified: {unified_df.shape}")

    # ── Step 3: Digital Twin Simulation ──
    print("\n[Step 3/7] Running digital twin simulation...")
    simulated_df = simulate_structure(unified_df, seed=seed)
    if save_data:
        simulated_df.to_csv(DATA_DIR / "simulated_data.csv", index=False)
    print(f"  Simulated: {simulated_df.shape}")

    # ── Step 4: Feature Engineering ──
    print("\n[Step 4/7] Engineering features...")
    featured_df = engineer_features(simulated_df)
    if save_data:
        featured_df.to_csv(DATA_DIR / "featured_data.csv", index=False)
    print(f"  Featured: {featured_df.shape}")

    # Prepare feature matrix
    feature_cols = get_feature_columns()
    feature_data = featured_df[feature_cols].values.astype(np.float32)
    feature_data = np.nan_to_num(feature_data, nan=0.0)

    # Normalize for neural networks
    from sklearn.preprocessing import StandardScaler
    nn_scaler = StandardScaler()
    feature_data_scaled = nn_scaler.fit_transform(feature_data)

    # Save scaler
    import joblib
    joblib.dump(nn_scaler, MODEL_DIR / "nn_scaler.pkl")

    metrics = {}

    # ── Step 5: Train Autoencoder ──
    print("\n[Step 5/7] Training Autoencoder (anomaly detection)...")
    ae_input_dim = feature_data_scaled.shape[1] * 20  # window_size * features
    anomaly_detector = AnomalyDetector(input_dim=ae_input_dim)
    ae_metrics = anomaly_detector.train(feature_data_scaled)
    anomaly_detector.save()
    metrics["autoencoder"] = ae_metrics

    # ── Step 6: Train LSTM ──
    print("\n[Step 6/7] Training LSTM (failure prediction)...")
    lstm_predictor = TimeSeriesPredictor(input_features=len(feature_cols))
    lstm_metrics = lstm_predictor.train(
        data=feature_data_scaled,
        fatigue=featured_df["fatigue_index"].values,
        strain=featured_df["strain"].values,
    )
    lstm_predictor.save()
    metrics["lstm"] = lstm_metrics

    # ── Step 7: Train XGBoost ──
    print("\n[Step 7/7] Training XGBoost (environmental risk)...")
    risk_model = TabularRiskModel()
    xgb_metrics = risk_model.train(featured_df)
    risk_model.save()
    metrics["xgboost"] = xgb_metrics

    print("\n" + "=" * 60)
    print("Training Complete!")
    print("=" * 60)
    for model_name, model_metrics in metrics.items():
        print(f"  {model_name}: {model_metrics}")

    return metrics


if __name__ == "__main__":
    run_full_pipeline()
