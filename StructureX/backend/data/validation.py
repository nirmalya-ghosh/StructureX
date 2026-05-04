"""
StructureX — Data Validation Module
Validates uploaded CSV files against the required schema.

Input:  Raw CSV file (bytes or path)
Output: Validated, cleaned pandas DataFrame

Handles:
- Missing columns → structured error with list of missing columns
- Missing values → forward fill then mean imputation
- Type enforcement → coerce to correct dtypes
- Invalid ranges → clip to valid bounds
"""

import pandas as pd
import numpy as np
from typing import Tuple, List, Dict, Optional
from io import BytesIO

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))


# ──────────────────────────────────────────────
# REQUIRED SCHEMA DEFINITION
# ──────────────────────────────────────────────

REQUIRED_COLUMNS = {
    "timestamp":        {"dtype": "datetime64[ns]", "nullable": False},
    "location_id":      {"dtype": "object",         "nullable": False},
    "magnitude":        {"dtype": "float64",        "nullable": True, "min": 0.0, "max": 10.0},
    "depth_km":         {"dtype": "float64",        "nullable": True, "min": 0.1, "max": 700.0},
    "temperature_c":    {"dtype": "float64",        "nullable": True, "min": -60.0, "max": 60.0},
    "humidity":         {"dtype": "float64",        "nullable": True, "min": 0.0, "max": 100.0},
    "rainfall_mm":      {"dtype": "float64",        "nullable": True, "min": 0.0, "max": 500.0},
    "soil_moisture":    {"dtype": "float64",        "nullable": True, "min": 0.0, "max": 1.0},
    "soil_density":     {"dtype": "float64",        "nullable": True, "min": 100.0, "max": 5000.0},
    "liquefaction_risk":{"dtype": "float64",        "nullable": True, "min": 0.0, "max": 1.0},
    "vibration":        {"dtype": "float64",        "nullable": True, "min": 0.0, "max": 100.0},
    "strain":           {"dtype": "float64",        "nullable": True, "min": 0.0, "max": 1.0},
    "load":             {"dtype": "float64",        "nullable": True, "min": 0.0, "max": 1e7},
    "fatigue_index":    {"dtype": "float64",        "nullable": True, "min": 0.0, "max": 1.0},
}


class ValidationError(Exception):
    """Structured validation error with details."""
    def __init__(self, message: str, details: Dict):
        super().__init__(message)
        self.details = details


def validate_csv(
    file_content: bytes,
    filename: str = "upload.csv",
) -> Tuple[pd.DataFrame, Dict[str, any]]:
    """
    Validate and clean an uploaded CSV file.

    Input:  raw CSV bytes
    Output: (cleaned DataFrame, validation_report dict)

    Validation steps:
    1. Parse CSV
    2. Check required columns exist
    3. Enforce data types
    4. Handle missing values (forward fill → mean imputation)
    5. Clip values to valid ranges
    6. Generate validation report

    Raises ValidationError if critical issues found.
    """
    report = {
        "filename": filename,
        "original_rows": 0,
        "final_rows": 0,
        "missing_columns": [],
        "imputed_columns": [],
        "type_coerced_columns": [],
        "clipped_columns": [],
        "warnings": [],
    }

    # Step 1: Parse CSV
    try:
        df = pd.read_csv(BytesIO(file_content))
    except Exception as e:
        raise ValidationError(
            f"Failed to parse CSV: {str(e)}",
            {"parse_error": str(e)}
        )

    report["original_rows"] = len(df)

    if len(df) == 0:
        raise ValidationError("CSV file is empty", {"rows": 0})

    # Normalize column names (strip whitespace, lowercase)
    df.columns = df.columns.str.strip().str.lower()

    # Step 2: Check required columns
    missing = [col for col in REQUIRED_COLUMNS if col not in df.columns]
    if missing:
        raise ValidationError(
            f"Missing required columns: {missing}",
            {"missing_columns": missing, "found_columns": list(df.columns)}
        )

    # Keep only required columns + any extras
    required_cols = list(REQUIRED_COLUMNS.keys())

    # Step 3: Enforce data types
    # Timestamp
    try:
        df["timestamp"] = pd.to_datetime(df["timestamp"])
    except Exception:
        report["warnings"].append("Could not parse timestamp; using index as time")
        df["timestamp"] = pd.date_range(start="2024-01-01", periods=len(df), freq="h")
        report["type_coerced_columns"].append("timestamp")

    # Location ID
    df["location_id"] = df["location_id"].astype(str)

    # Numeric columns
    numeric_cols = [c for c in required_cols if c not in ("timestamp", "location_id")]
    for col in numeric_cols:
        if df[col].dtype not in (np.float64, np.float32, np.int64, np.int32):
            try:
                df[col] = pd.to_numeric(df[col], errors="coerce")
                report["type_coerced_columns"].append(col)
            except Exception:
                df[col] = 0.0
                report["warnings"].append(f"Column {col} could not be converted; set to 0")

    # Step 4: Handle missing values
    for col in numeric_cols:
        null_count = df[col].isnull().sum()
        if null_count > 0:
            report["imputed_columns"].append({
                "column": col,
                "null_count": int(null_count),
                "method": "forward_fill + mean"
            })
            # Forward fill within location groups
            df[col] = df.groupby("location_id")[col].transform(
                lambda x: x.ffill().bfill()
            )
            # Remaining NaN → column mean
            col_mean = df[col].mean()
            if pd.isna(col_mean):
                col_mean = 0.0
            df[col] = df[col].fillna(col_mean)

    # Step 5: Clip to valid ranges
    for col in numeric_cols:
        schema = REQUIRED_COLUMNS[col]
        if "min" in schema and "max" in schema:
            original_min = df[col].min()
            original_max = df[col].max()
            df[col] = df[col].clip(lower=schema["min"], upper=schema["max"])
            if original_min < schema["min"] or original_max > schema["max"]:
                report["clipped_columns"].append(col)

    # Sort by location and timestamp
    df = df.sort_values(["location_id", "timestamp"]).reset_index(drop=True)

    report["final_rows"] = len(df)
    report["columns"] = list(df.columns)
    report["locations"] = list(df["location_id"].unique())

    return df, report
