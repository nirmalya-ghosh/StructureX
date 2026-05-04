"""
StructureX — FastAPI Routes (Phase 2)
Full API with CSV upload, ML inference, visualization, LLM insights.

Endpoints:
    POST /analyze    → Upload CSV, full pipeline, return everything
    POST /simulate   → Generate simulated dataset
    POST /scenario   → Scenario simulation with parameter overrides
    GET  /explain    → SHAP explanations for latest prediction
    GET  /health     → Health check
"""

import numpy as np
import pandas as pd
from fastapi import APIRouter, HTTPException, UploadFile, File
from fastapi.responses import JSONResponse
from typing import Optional
import joblib
import time
import traceback

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from backend.config import MODEL_DIR, DATA_DIR, RANDOM_SEED
from backend.schemas.api_schemas import (
    SimulationRequest, SimulationResponse,
    PredictionResponse, ScenarioRequest, ScenarioResponse,
    ResilienceRequest, ResilienceResponse,
    ExplainabilityResponse,
)
from backend.schemas.data_schemas import FeatureContribution
from backend.data.ingestion import ingest_all
from backend.data.alignment import align_datasets
from backend.data.validation import validate_csv, ValidationError
from backend.simulation.digital_twin import simulate_structure
from backend.features.engineering import engineer_features, get_feature_columns
from backend.models.autoencoder import AnomalyDetector
from backend.models.lstm_model import TimeSeriesPredictor
from backend.models.xgboost_model import TabularRiskModel
from backend.risk.fusion import compute_risk_score
from backend.explainability.shap_engine import ExplainabilityEngine
from backend.analysis.infrastructure import analyze_infrastructure
from backend.analysis.llm_engine import generate_insights
from backend.analysis.visualization import generate_all_visualizations
from backend.analysis.building_analyzer import analyze_building_ai
from backend.analysis.resilience_engine import build_resilience_assessment
from pydantic import BaseModel
from backend.analysis.visualization import generate_all_visualizations

router = APIRouter()

# ──────────────────────────────────────────────
# Model loading (lazy initialization)
# ──────────────────────────────────────────────
_models = {}


def get_models():
    """Load all models if not already loaded."""
    if "loaded" not in _models:
        feature_cols = get_feature_columns()

        ae_input_dim = len(feature_cols) * 20
        ae = AnomalyDetector(input_dim=ae_input_dim)
        try:
            ae.load()
        except Exception as e:
            print(f"[Warning] Autoencoder not loaded: {e}")
            ae.trained = False
        _models["autoencoder"] = ae

        lstm = TimeSeriesPredictor(input_features=len(feature_cols))
        try:
            lstm.load()
        except Exception as e:
            print(f"[Warning] LSTM not loaded: {e}")
            lstm.trained = False
        _models["lstm"] = lstm

        xgb = TabularRiskModel()
        try:
            xgb.load()
        except Exception as e:
            print(f"[Warning] XGBoost not loaded: {e}")
            xgb.trained = False
        _models["xgboost"] = xgb

        shap_engine = ExplainabilityEngine(xgb)
        if xgb.trained:
            try:
                shap_engine.initialize()
            except Exception as e:
                print(f"[Warning] SHAP not initialized: {e}")
        _models["shap"] = shap_engine

        try:
            _models["nn_scaler"] = joblib.load(MODEL_DIR / "nn_scaler.pkl")
        except Exception:
            from sklearn.preprocessing import StandardScaler
            _models["nn_scaler"] = StandardScaler()

        _models["loaded"] = True
        print("[API] All models loaded.")

    return _models


_latest_results = {}


def _run_inference(featured_df: pd.DataFrame, models: dict) -> dict:
    """
    Run all 3 ML models on featured data.

    Input: featured DataFrame, loaded models dict
    Output: dict with all scores, arrays, and time-series data
    """
    feature_cols = get_feature_columns()

    # Ensure all feature columns exist
    for col in feature_cols:
        if col not in featured_df.columns:
            featured_df[col] = 0.0

    feature_data = featured_df[feature_cols].values.astype(np.float32)
    feature_data = np.nan_to_num(feature_data, nan=0.0)

    nn_scaler = models["nn_scaler"]
    try:
        feature_data_scaled = nn_scaler.transform(feature_data)
    except Exception:
        feature_data_scaled = feature_data

    # 1. Autoencoder → anomaly scores
    ae: AnomalyDetector = models["autoencoder"]
    if ae.trained:
        ae_scores = ae.predict(feature_data_scaled)
        anomaly_score = float(np.mean(ae_scores))
    else:
        ae_scores = np.full(len(feature_data), 0.5)
        anomaly_score = 0.5

    # 2. LSTM → failure probability + degradation
    lstm: TimeSeriesPredictor = models["lstm"]
    if lstm.trained:
        failure_probs_arr, degradation_arr = lstm.predict(feature_data_scaled)
        failure_probability = float(np.mean(failure_probs_arr))
        predicted_degradation = float(np.clip(np.mean(degradation_arr), 0, 1))
    else:
        failure_probs_arr = np.full(max(len(feature_data) - 30, 1), 0.5)
        degradation_arr = np.full(max(len(feature_data) - 30, 1), 0.5)
        failure_probability = 0.5
        predicted_degradation = 0.5

    # 3. XGBoost → environmental risk
    xgb: TabularRiskModel = models["xgboost"]
    if xgb.trained:
        env_risks_arr = xgb.predict(feature_data)
        environmental_risk = float(np.mean(env_risks_arr))
    else:
        env_risks_arr = np.full(len(feature_data), 0.5)
        environmental_risk = 0.5

    # Risk fusion
    risk = compute_risk_score(anomaly_score, failure_probability, environmental_risk, predicted_degradation)

    # SHAP explanation
    _latest_results["features"] = feature_data[-1]
    shap_engine: ExplainabilityEngine = models["shap"]
    if shap_engine._initialized:
        shap_result = shap_engine.explain(feature_data[-1])
    else:
        importance = xgb.get_feature_importance() if xgb.trained else {}
        explanations = [
            {"feature_name": k, "contribution_value": v}
            for k, v in sorted(importance.items(), key=lambda x: abs(x[1]), reverse=True)
        ]
        shap_result = {"explanations": explanations, "top_features": explanations[:3]}

    # Compute windowed risk scores for trend chart
    window_size = max(1, len(feature_data) // 20)
    risk_scores_over_time = []
    for i in range(0, len(ae_scores), window_size):
        chunk_ae = float(np.mean(ae_scores[i:i+window_size]))
        chunk_env = float(np.mean(env_risks_arr[min(i, len(env_risks_arr)-1):min(i+window_size, len(env_risks_arr))]))
        chunk_risk = compute_risk_score(chunk_ae, failure_probability, chunk_env, predicted_degradation)
        risk_scores_over_time.append(chunk_risk["risk_score"])

    return {
        "risk": risk,
        "anomaly_score": anomaly_score,
        "failure_probability": failure_probability,
        "environmental_risk": environmental_risk,
        "predicted_degradation": predicted_degradation,
        "ae_scores": ae_scores,
        "failure_probs_arr": failure_probs_arr,
        "risk_scores_over_time": risk_scores_over_time,
        "shap_result": shap_result,
    }


def _build_scenario_bundle(request: ScenarioRequest, models: dict) -> dict:
    """Prepare all scenario-side artifacts shared by /scenario and /resilience."""
    eq_df, soil_df, weather_df = ingest_all(
        num_timesteps=200,
        seed=RANDOM_SEED,
        magnitude_override=request.earthquake_magnitude,
        temperature_override=request.temperature,
        moisture_override=request.soil_moisture,
        save_csv=False,
    )

    unified = align_datasets(eq_df, soil_df, weather_df)
    if request.location_id in unified["location_id"].values:
        unified = unified[unified["location_id"] == request.location_id].reset_index(drop=True)

    simulated = simulate_structure(unified, seed=RANDOM_SEED)
    featured = engineer_features(simulated)
    inference = _run_inference(featured, models)

    infra_metrics = {
        "vibration_mean": float(featured["vibration"].mean()),
        "vibration_std": float(featured["vibration"].std()),
        "soil_risk": float(featured["soil_risk_index"].mean()) if "soil_risk_index" in featured.columns else 0.3,
        "fatigue": float(featured["fatigue_index"].mean()),
        "load_ratio": float(featured["load"].mean() / max(featured["load"].max(), 1)),
        "liquefaction_risk": float(featured["liquefaction_risk"].mean()),
        "strain_max": float(featured["strain"].max()),
        "strain_rate": float(featured["rate_of_change_strain"].mean()) if "rate_of_change_strain" in featured.columns else 0.0,
        "seismic_impact": float(featured["seismic_impact"].mean()) if "seismic_impact" in featured.columns else 0.0,
        "soil_moisture": float(featured["soil_moisture"].mean()),
        "temperature_range": float(featured["temperature_c"].max() - featured["temperature_c"].min()),
        "load_mean": float(featured["load"].mean()),
    }
    infrastructure = analyze_infrastructure(infra_metrics)

    time_series = {
        "vibration": featured["vibration"].tolist(),
        "strain": featured["strain"].tolist(),
        "temperature": featured["temperature_c"].tolist(),
        "load": featured["load"].tolist(),
        "fatigue": featured["fatigue_index"].tolist(),
    }

    explanation = ExplainabilityResponse(
        explanations=[FeatureContribution(**e) for e in inference["shap_result"]["explanations"]],
        top_features=[FeatureContribution(**e) for e in inference["shap_result"]["top_features"]],
    )

    prediction = PredictionResponse(
        anomaly_score=inference["risk"]["anomaly_score"],
        failure_probability=inference["risk"]["failure_probability"],
        environmental_risk=inference["risk"]["environmental_risk"],
        predicted_degradation=inference["predicted_degradation"],
        risk_score=inference["risk"]["risk_score"],
        risk_category=inference["risk"]["risk_category"],
    )

    return {
        "featured": featured,
        "inference": inference,
        "infrastructure": infrastructure,
        "time_series": time_series,
        "prediction": prediction,
        "explanation": explanation,
    }


# ──────────────────────────────────────────────
# POST /analyze — CSV Upload Full Pipeline
# ──────────────────────────────────────────────
@router.post("/analyze")
async def analyze(file: UploadFile = File(...)):
    """
    POST /analyze
    Upload CSV → validate → feature engineering → ML inference →
    risk fusion → visualization → LLM insights → return everything.

    Input: CSV file upload
    Output: Complete analysis JSON with scores, charts, explanations
    """
    start_time = time.time()
    models = get_models()

    try:
        # Step 1: Read and validate CSV
        content = await file.read()
        try:
            df, validation_report = validate_csv(content, file.filename)
        except ValidationError as ve:
            return JSONResponse(status_code=400, content={
                "error": str(ve),
                "details": ve.details,
            })

        # Step 2: Feature Engineering
        featured_df = engineer_features(df)

        # Step 3: ML Inference
        inference = _run_inference(featured_df, models)

        # Step 4: Infrastructure Analysis
        infra_metrics = {
            "vibration_mean": float(featured_df["vibration"].mean()),
            "vibration_std": float(featured_df["vibration"].std()),
            "soil_risk": float(featured_df["soil_risk_index"].mean()) if "soil_risk_index" in featured_df.columns else 0.3,
            "fatigue": float(featured_df["fatigue_index"].mean()),
            "load_ratio": float(featured_df["load"].mean() / max(featured_df["load"].max(), 1)),
            "liquefaction_risk": float(featured_df["liquefaction_risk"].mean()),
            "strain_max": float(featured_df["strain"].max()),
            "strain_rate": float(featured_df["rate_of_change_strain"].mean()) if "rate_of_change_strain" in featured_df.columns else 0,
            "seismic_impact": float(featured_df["seismic_impact"].mean()) if "seismic_impact" in featured_df.columns else 0,
            "soil_moisture": float(featured_df["soil_moisture"].mean()),
            "temperature_range": float(featured_df["temperature_c"].max() - featured_df["temperature_c"].min()),
            "load_mean": float(featured_df["load"].mean()),
        }
        infrastructure = analyze_infrastructure(infra_metrics)

        # Step 5: Key Metrics for LLM
        key_metrics = {
            "avg_temperature": float(featured_df["temperature_c"].mean()),
            "max_magnitude": float(featured_df["magnitude"].max()),
            "avg_soil_moisture": float(featured_df["soil_moisture"].mean()),
            "avg_vibration": float(featured_df["vibration"].mean()),
            "max_strain": float(featured_df["strain"].max()),
            "avg_fatigue": float(featured_df["fatigue_index"].mean()),
            "total_records": len(featured_df),
            "num_locations": featured_df["location_id"].nunique(),
        }

        # Step 6: LLM Insights
        llm_explanation = await generate_insights(
            risk_score=inference["risk"]["risk_score"],
            failure_probability=inference["failure_probability"],
            anomaly_score=inference["anomaly_score"],
            degradation=inference["predicted_degradation"],
            environmental_risk=inference["environmental_risk"],
            top_features=inference["shap_result"].get("top_features", []),
            infrastructure=infrastructure,
            key_metrics=key_metrics,
        )

        # Step 7: Visualizations
        charts = generate_all_visualizations(
            df=featured_df,
            anomaly_scores=inference["ae_scores"],
            risk_scores=inference["risk_scores_over_time"],
            failure_probs=inference["failure_probs_arr"].tolist() if hasattr(inference["failure_probs_arr"], 'tolist') else list(inference["failure_probs_arr"]),
        )

        # Time-series data for frontend
        max_points = 200
        step = max(1, len(featured_df) // max_points)
        time_series = {
            "vibration": featured_df["vibration"].iloc[::step].tolist(),
            "strain": featured_df["strain"].iloc[::step].tolist(),
            "temperature": featured_df["temperature_c"].iloc[::step].tolist(),
            "load": featured_df["load"].iloc[::step].tolist(),
            "fatigue": featured_df["fatigue_index"].iloc[::step].tolist(),
        }

        elapsed = time.time() - start_time

        return {
            "status": "success",
            "processing_time_sec": round(elapsed, 3),
            "validation": validation_report,
            "risk_score": inference["risk"]["risk_score"],
            "risk_category": inference["risk"]["risk_category"],
            "failure_probability": inference["failure_probability"],
            "anomaly_score": inference["anomaly_score"],
            "environmental_risk": inference["environmental_risk"],
            "predicted_degradation": inference["predicted_degradation"],
            "time_to_failure": (
                "< 6 months" if inference["failure_probability"] > 0.7
                else "6-18 months" if inference["failure_probability"] > 0.4
                else "1-3 years" if inference["failure_probability"] > 0.2
                else "> 3 years"
            ),
            "infrastructure": infrastructure,
            "llm_explanation": llm_explanation,
            "charts": charts,
            "time_series": time_series,
            "shap_features": inference["shap_result"],
        }

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# ──────────────────────────────────────────────
# POST /scenario — Scenario Simulation
# ──────────────────────────────────────────────
@router.post("/scenario", response_model=ScenarioResponse)
async def scenario(request: ScenarioRequest):
    """POST /scenario — Dynamic scenario with parameter overrides."""
    models = get_models()

    try:
        bundle = _build_scenario_bundle(request, models)

        return ScenarioResponse(
            prediction=bundle["prediction"],
            explanation=bundle["explanation"],
            time_series=bundle["time_series"],
        )

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/resilience", response_model=ResilienceResponse)
async def resilience(request: ResilienceRequest):
    """POST /resilience — computed Phase 1 resilience assessment."""
    models = get_models()

    try:
        bundle = _build_scenario_bundle(request, models)
        assessment = build_resilience_assessment(
            request=request,
            featured_df=bundle["featured"],
            inference=bundle["inference"],
            infrastructure=bundle["infrastructure"],
        )
        return ResilienceResponse(**assessment)
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# ──────────────────────────────────────────────
# GET /explain — SHAP explanations
# ──────────────────────────────────────────────
@router.get("/explain", response_model=ExplainabilityResponse)
async def explain():
    """GET /explain — Return SHAP explanations for latest prediction."""
    models = get_models()
    shap_engine: ExplainabilityEngine = models["shap"]

    if "features" not in _latest_results:
        raise HTTPException(status_code=400, detail="No prediction made yet.")

    try:
        features = _latest_results["features"]
        if shap_engine._initialized:
            result = shap_engine.explain(features)
        else:
            xgb: TabularRiskModel = models["xgboost"]
            importance = xgb.get_feature_importance()
            explanations = [
                {"feature_name": k, "contribution_value": v}
                for k, v in sorted(importance.items(), key=lambda x: abs(x[1]), reverse=True)
            ]
            result = {"explanations": explanations, "top_features": explanations[:3]}

        return ExplainabilityResponse(
            explanations=[FeatureContribution(**e) for e in result["explanations"]],
            top_features=[FeatureContribution(**e) for e in result["top_features"]],
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ──────────────────────────────────────────────
# POST /building-analyze — AI Map Building Analysis
# ──────────────────────────────────────────────
class BuildingAnalyzeRequest(BaseModel):
    lat: float
    lng: float
    height: float
    address: str
    area_name: str
    properties: dict

@router.post("/building-analyze")
async def building_analyze(request: BuildingAnalyzeRequest):
    """POST /building-analyze — AI-powered structural analysis of a selected 3D map building."""
    try:
        analysis_result = await analyze_building_ai(
            lat=request.lat,
            lng=request.lng,
            height=request.height,
            address=request.address,
            area_name=request.area_name,
            properties=request.properties
        )
        return analysis_result
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

SATELLITE_BLUEPRINTS = [
    {
        "id": "SAT-B3",
        "name": "GeoShield B3",
        "mission": "Interferometric ground deformation",
        "orbitClass": "LEO repeat-pass radar",
        "beamTarget": "South India deformation net",
        "altitudeKm": 688,
        "velocityKps": 7.49,
        "inclinationDeg": 98.2,
        "latencyMs": 142,
        "downlinkMbps": 498,
        "packetLossPct": 0.24,
        "healthPct": 95.8,
        "thermalC": 21.3,
        "powerPct": 79.8,
        "signalDbm": -63.8,
        "coveragePct": 88.6,
        "anomalyRisk": 0.11,
        "orbitalSlot": { "x": 68, "y": 26 },
        "advisory": "Primary synthetic-aperture radar relay for micro-settlement, uplift, and subsidence watch.",
    },
    {
        "id": "SAT-C7",
        "name": "CivicScan C7",
        "mission": "High-resolution structural imaging",
        "orbitClass": "LEO agile imaging",
        "beamTarget": "Targeted building scan queue",
        "altitudeKm": 531,
        "velocityKps": 7.74,
        "inclinationDeg": 96.9,
        "latencyMs": 118,
        "downlinkMbps": 612,
        "packetLossPct": 0.12,
        "healthPct": 97.1,
        "thermalC": 16.9,
        "powerPct": 85.7,
        "signalDbm": -59.4,
        "coveragePct": 93.1,
        "anomalyRisk": 0.05,
        "orbitalSlot": { "x": 74, "y": 72 },
        "advisory": "Most responsive asset for tasking building-specific scan passes and facade condition imagery.",
    },
    {
        "id": "SAT-D9",
        "name": "StormWatch D9",
        "mission": "Weather and flood exposure monitoring",
        "orbitClass": "MEO environmental relay",
        "beamTarget": "Hydromet watch grid",
        "altitudeKm": 8420,
        "velocityKps": 3.88,
        "inclinationDeg": 56.4,
        "latencyMs": 186,
        "downlinkMbps": 402,
        "packetLossPct": 0.34,
        "healthPct": 92.6,
        "thermalC": 24.6,
        "powerPct": 74.5,
        "signalDbm": -68.1,
        "coveragePct": 96.2,
        "anomalyRisk": 0.18,
        "orbitalSlot": { "x": 31, "y": 76 },
        "advisory": "Best source for rainfall fronts, drainage overload exposure, and flood precursor telemetry.",
    },
]

@router.get("/satellites")
async def get_satellites():
    """Return satellite blueprint data."""
    return SATELLITE_BLUEPRINTS
