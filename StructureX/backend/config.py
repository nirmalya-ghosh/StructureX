"""
StructureX — Global Configuration
All constants, thresholds, seeds, and paths defined here.
No magic numbers anywhere else in the codebase.
"""

import os
from pathlib import Path

# ──────────────────────────────────────────────
# PATHS
# ──────────────────────────────────────────────
PROJECT_ROOT = Path(__file__).resolve().parent.parent
BACKEND_DIR = Path(__file__).resolve().parent
DATA_DIR = BACKEND_DIR / "data" / "generated"
MODEL_DIR = BACKEND_DIR / "models" / "saved"
FRONTEND_DIR = PROJECT_ROOT / "frontend"

# Create dirs if they don't exist
DATA_DIR.mkdir(parents=True, exist_ok=True)
MODEL_DIR.mkdir(parents=True, exist_ok=True)

# ──────────────────────────────────────────────
# REPRODUCIBILITY
# ──────────────────────────────────────────────
RANDOM_SEED = 42

# ──────────────────────────────────────────────
# DATA GENERATION
# ──────────────────────────────────────────────
NUM_LOCATIONS = 5
NUM_TIMESTEPS = 1000  # per location
TIMESTEP_HOURS = 1  # 1-hour intervals

# Location definitions (synthetic Indian cities)
LOCATIONS = {
    "LOC_001": {"name": "Mumbai_Bridge_A", "lat": 19.0760, "lon": 72.8777},
    "LOC_002": {"name": "Delhi_Pipeline_B", "lat": 28.6139, "lon": 77.2090},
    "LOC_003": {"name": "Chennai_Building_C", "lat": 13.0827, "lon": 80.2707},
    "LOC_004": {"name": "Kolkata_Bridge_D", "lat": 22.5726, "lon": 88.3639},
    "LOC_005": {"name": "Bangalore_Pipeline_E", "lat": 12.9716, "lon": 77.5946},
}

# ──────────────────────────────────────────────
# AI INTEGRATION
# ──────────────────────────────────────────────
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
GEMINI_MODEL = "gemini-2.5-flash"


# ──────────────────────────────────────────────
# EARTHQUAKE PARAMETERS
# ──────────────────────────────────────────────
EQ_MIN_MAGNITUDE = 1.0
EQ_MAX_MAGNITUDE = 8.0
EQ_BETA = 2.0  # Gutenberg-Richter b-value scaled
EQ_OCCURRENCE_RATE = 0.05  # probability of earthquake per timestep
EQ_DEPTH_MIN_KM = 5.0
EQ_DEPTH_MAX_KM = 300.0
EQ_SPIKE_THRESHOLD = 4.0  # magnitude above which seismic spike injected

# ──────────────────────────────────────────────
# SOIL PARAMETERS
# ──────────────────────────────────────────────
SOIL_TYPES = ["clay", "sand", "silt", "gravel", "rock"]
SOIL_TYPE_PROPERTIES = {
    # soil_type: (base_moisture, base_density, base_liquefaction)
    "clay":   (0.45, 1600.0, 0.3),
    "sand":   (0.25, 1500.0, 0.6),
    "silt":   (0.40, 1400.0, 0.5),
    "gravel": (0.15, 1800.0, 0.2),
    "rock":   (0.05, 2500.0, 0.05),
}

# ──────────────────────────────────────────────
# WEATHER PARAMETERS
# ──────────────────────────────────────────────
WEATHER_BASE_TEMP = 25.0  # °C
WEATHER_TEMP_AMPLITUDE = 15.0  # seasonal swing
WEATHER_HUMIDITY_BASE = 60.0
WEATHER_RAINFALL_LAMBDA = 2.0  # Poisson parameter
WEATHER_WIND_SHAPE = 2.0  # Weibull shape
WEATHER_WIND_SCALE = 5.0  # Weibull scale

# ──────────────────────────────────────────────
# DIGITAL TWIN PARAMETERS
# ──────────────────────────────────────────────
DT_BASE_VIBRATION = 0.5  # mm/s
DT_VIBRATION_NOISE_STD = 0.05
DT_DEGRADATION_RATE = 0.001  # per timestep
DT_THERMAL_EXPANSION_COEFF = 12e-6  # per °C
DT_REFERENCE_TEMP = 20.0  # °C
DT_ELASTIC_MODULUS = 200e9  # Pa (steel)
DT_CROSS_SECTION_AREA = 0.01  # m²
DT_BASE_LOAD = 50000.0  # N
DT_LOAD_AMPLITUDE = 20000.0  # N (traffic variation)

# ──────────────────────────────────────────────
# FEATURE ENGINEERING
# ──────────────────────────────────────────────
FE_ROLLING_WINDOW = 10
FE_SEISMIC_DEPTH_CLIP = 1.0  # min depth to avoid division by zero

# ──────────────────────────────────────────────
# ML MODEL PARAMETERS
# ──────────────────────────────────────────────
# Autoencoder
AE_WINDOW_SIZE = 20
AE_HIDDEN_DIMS = [64, 32, 16]  # encoder layers
AE_LEARNING_RATE = 1e-3
AE_EPOCHS = 50
AE_BATCH_SIZE = 32
AE_ANOMALY_PERCENTILE = 95  # threshold calibration

# LSTM
LSTM_WINDOW_SIZE = 30
LSTM_HIDDEN_DIM = 64
LSTM_NUM_LAYERS = 2
LSTM_DROPOUT = 0.2
LSTM_LEARNING_RATE = 1e-3
LSTM_EPOCHS = 50
LSTM_BATCH_SIZE = 32

# XGBoost
XGB_MAX_DEPTH = 6
XGB_N_ESTIMATORS = 100
XGB_LEARNING_RATE = 0.1
XGB_RISK_THRESHOLD = 0.6  # above this = high risk label

# ──────────────────────────────────────────────
# RISK FUSION
# ──────────────────────────────────────────────
RISK_WEIGHT_ANOMALY = 0.30
RISK_WEIGHT_FAILURE = 0.30
RISK_WEIGHT_ENVIRONMENTAL = 0.20
RISK_WEIGHT_DEGRADATION = 0.20

RISK_SAFE_MAX = 40
RISK_WARNING_MAX = 70
# Above 70 = CRITICAL

# ──────────────────────────────────────────────
# API
# ──────────────────────────────────────────────
API_HOST = "0.0.0.0"
API_PORT = 8000
CORS_ORIGINS = ["*"]
