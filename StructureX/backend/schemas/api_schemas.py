"""
StructureX — API Request/Response Schemas
Pydantic models for FastAPI endpoints.
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from backend.schemas.data_schemas import (
    RiskResult,
    FeatureContribution,
)


# ──────────────────────────────────────────────
# REQUEST SCHEMAS
# ──────────────────────────────────────────────

class SimulationRequest(BaseModel):
    """POST /simulate request body."""
    num_locations: int = Field(default=5, ge=1, le=20)
    num_timesteps: int = Field(default=1000, ge=100, le=10000)
    earthquake_magnitude_override: Optional[float] = Field(
        default=None, ge=0.0, le=10.0,
        description="Override earthquake magnitude for all events"
    )
    temperature_override: Optional[float] = Field(
        default=None, ge=-60.0, le=60.0,
        description="Override temperature for all timesteps"
    )
    soil_moisture_override: Optional[float] = Field(
        default=None, ge=0.0, le=1.0,
        description="Override soil moisture for all locations"
    )


class PredictionRequest(BaseModel):
    """POST /predict request body."""
    data_window: List[Dict[str, Any]] = Field(
        ...,
        min_length=1,
        description="List of unified data records for prediction"
    )
    location_id: Optional[str] = Field(
        default=None,
        description="Filter predictions to specific location"
    )


class ScenarioRequest(BaseModel):
    """POST /scenario request body."""
    earthquake_magnitude: float = Field(default=3.0, ge=0.0, le=10.0)
    temperature: float = Field(default=25.0, ge=-60.0, le=60.0)
    soil_moisture: float = Field(default=0.3, ge=0.0, le=1.0)
    location_id: str = Field(default="LOC_001")


class ResilienceRequest(ScenarioRequest):
    """POST /resilience request body."""
    role: str = Field(default="executive")


# ──────────────────────────────────────────────
# RESPONSE SCHEMAS
# ──────────────────────────────────────────────

class SimulationResponse(BaseModel):
    """POST /simulate response."""
    status: str = "success"
    num_records: int
    locations: List[str]
    data: List[Dict[str, Any]]


class PredictionResponse(BaseModel):
    """POST /predict response."""
    anomaly_score: float
    failure_probability: float
    environmental_risk: float
    predicted_degradation: float
    risk_score: float
    risk_category: str


class ExplainabilityResponse(BaseModel):
    """GET /explain response."""
    explanations: List[FeatureContribution]
    top_features: List[FeatureContribution]


class ScenarioResponse(BaseModel):
    """POST /scenario response."""
    prediction: PredictionResponse
    explanation: ExplainabilityResponse
    time_series: Dict[str, List[float]]  # vibration, strain, temperature arrays


class ResilienceResponse(BaseModel):
    """POST /resilience response."""
    overview: Dict[str, Any]
    hazard_layers: List[Dict[str, Any]]
    cascade: Dict[str, Any]
    role_dashboards: Dict[str, Any]
    stress_tests: List[Dict[str, Any]]
    retrofit_priorities: List[Dict[str, Any]]
    code_gap: Dict[str, Any]
    action_plan: Dict[str, Any]
