"""
StructureX — Data Schemas
Pydantic models for all data types with strict validation.
Every field has explicit type, range constraints, and documentation.
"""

from pydantic import BaseModel, Field, field_validator
from typing import List, Optional, Literal
from datetime import datetime


# ──────────────────────────────────────────────
# MODULE 1: DATA INGESTION SCHEMAS
# ──────────────────────────────────────────────

class EarthquakeRecord(BaseModel):
    """Single earthquake event record."""
    timestamp: datetime
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    magnitude: float = Field(..., ge=0.0, le=10.0)
    depth_km: float = Field(..., gt=0.0, le=700.0)


class SoilRecord(BaseModel):
    """Soil properties for a location."""
    location_id: str
    soil_type: Literal["clay", "sand", "silt", "gravel", "rock"]
    soil_moisture: float = Field(..., ge=0.0, le=1.0)
    soil_density: float = Field(..., gt=0.0)  # kg/m³
    liquefaction_risk: float = Field(..., ge=0.0, le=1.0)


class WeatherRecord(BaseModel):
    """Weather observation at a location and time."""
    timestamp: datetime
    location_id: str
    temperature_c: float = Field(..., ge=-60.0, le=60.0)
    humidity: float = Field(..., ge=0.0, le=100.0)
    rainfall_mm: float = Field(..., ge=0.0)
    wind_speed: float = Field(..., ge=0.0)


# ──────────────────────────────────────────────
# MODULE 3: DIGITAL TWIN SCHEMAS
# ──────────────────────────────────────────────

class StructuralRecord(BaseModel):
    """Simulated structural sensor reading."""
    timestamp: datetime
    location_id: str
    vibration: float = Field(..., ge=0.0)        # mm/s
    strain: float = Field(..., ge=0.0)            # dimensionless
    load: float = Field(..., ge=0.0)              # N
    fatigue_index: float = Field(..., ge=0.0, le=1.0)


# ──────────────────────────────────────────────
# MODULE 2: ALIGNED DATA SCHEMA
# ──────────────────────────────────────────────

class UnifiedRecord(BaseModel):
    """Single row of the unified aligned dataset."""
    timestamp: datetime
    location_id: str
    # Earthquake fields
    magnitude: float = Field(default=0.0, ge=0.0)
    depth_km: float = Field(default=100.0, gt=0.0)
    # Soil fields
    soil_type: str = Field(default="rock")
    soil_moisture: float = Field(default=0.1, ge=0.0, le=1.0)
    soil_density: float = Field(default=2000.0, gt=0.0)
    liquefaction_risk: float = Field(default=0.1, ge=0.0, le=1.0)
    # Weather fields
    temperature_c: float = Field(default=25.0)
    humidity: float = Field(default=50.0, ge=0.0, le=100.0)
    rainfall_mm: float = Field(default=0.0, ge=0.0)
    wind_speed: float = Field(default=3.0, ge=0.0)
    # Structural fields
    vibration: float = Field(default=0.5, ge=0.0)
    strain: float = Field(default=0.0, ge=0.0)
    load: float = Field(default=50000.0, ge=0.0)
    fatigue_index: float = Field(default=0.0, ge=0.0, le=1.0)


# ──────────────────────────────────────────────
# MODULE 4: FEATURE SCHEMA
# ──────────────────────────────────────────────

class EngineeredFeatures(BaseModel):
    """Output of feature engineering pipeline."""
    rolling_mean_vibration: float
    rolling_std_vibration: float
    rate_of_change_strain: float
    cumulative_fatigue: float
    seismic_impact: float
    thermal_stress: float
    soil_risk_index: float
    # Pass-through features
    vibration: float
    strain: float
    load: float
    temperature_c: float
    humidity: float
    rainfall_mm: float
    wind_speed: float


# ──────────────────────────────────────────────
# MODULE 5: ML OUTPUT SCHEMAS
# ──────────────────────────────────────────────

class AnomalyOutput(BaseModel):
    """Output from autoencoder anomaly detection."""
    anomaly_score: float = Field(..., ge=0.0, le=1.0)


class LSTMOutput(BaseModel):
    """Output from LSTM time-series model."""
    predicted_failure_probability: float = Field(..., ge=0.0, le=1.0)
    predicted_degradation: float = Field(..., ge=0.0)


class XGBoostOutput(BaseModel):
    """Output from XGBoost tabular model."""
    environmental_risk_score: float = Field(..., ge=0.0, le=1.0)


# ──────────────────────────────────────────────
# MODULE 6: RISK FUSION SCHEMA
# ──────────────────────────────────────────────

class RiskResult(BaseModel):
    """Output from risk fusion engine."""
    risk_score: float = Field(..., ge=0.0, le=100.0)
    risk_category: Literal["SAFE", "WARNING", "CRITICAL"]
    anomaly_score: float
    failure_probability: float
    environmental_risk: float
    normalized_degradation: float


# ──────────────────────────────────────────────
# MODULE 7: EXPLAINABILITY SCHEMA
# ──────────────────────────────────────────────

class FeatureContribution(BaseModel):
    """Single SHAP feature contribution."""
    feature_name: str
    contribution_value: float


class ExplainabilityResult(BaseModel):
    """SHAP explainability output."""
    explanations: List[FeatureContribution]
    top_features: List[FeatureContribution]  # Top 3
