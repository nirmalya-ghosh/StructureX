"""
StructureX — Enhanced Visualization Engine
Generates Plotly chart specifications (JSON) for the frontend.

Charts produced:
1. Time-series: vibration, strain, temperature (with anomaly highlights)
2. Risk trend over time
3. Correlation heatmap
4. Anomaly highlighting plot
5. Failure probability curve

All charts returned as Plotly JSON specs for client-side rendering.
"""

import numpy as np
import pandas as pd
import plotly.graph_objects as go
import json
from typing import Dict, List, Optional

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))


def _base_layout(**overrides):
    """Build a dark-themed layout dict with optional overrides."""
    layout = dict(
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(0,0,0,0)",
        font=dict(family="Inter, sans-serif", color="#8892a8", size=11),
        xaxis=dict(gridcolor="rgba(255,255,255,0.04)", zerolinecolor="rgba(255,255,255,0.06)"),
        yaxis=dict(gridcolor="rgba(255,255,255,0.04)", zerolinecolor="rgba(255,255,255,0.06)"),
        margin=dict(t=10, r=20, b=40, l=50),
    )
    # Merge overrides (deep merge for xaxis/yaxis)
    for key, val in overrides.items():
        if key in ("xaxis", "yaxis") and isinstance(val, dict) and key in layout:
            layout[key] = {**layout[key], **val}
        else:
            layout[key] = val
    return layout


def generate_time_series_charts(df: pd.DataFrame) -> Dict[str, object]:
    """Generate vibration, strain, and temperature time-series charts."""
    charts = {}

    # Vibration
    fig_vib = go.Figure()
    fig_vib.add_trace(go.Scatter(
        y=df["vibration"].values.tolist(),
        mode="lines", name="Vibration",
        line=dict(color="#22d3ee", width=1.5),
        fill="tozeroy", fillcolor="rgba(34,211,238,0.05)",
        hovertemplate="Vibration: %{y:.4f} mm/s<extra></extra>",
    ))
    fig_vib.update_layout(**_base_layout(
        yaxis=dict(title="mm/s"), xaxis=dict(title="Timestep"),
    ))
    charts["vibration"] = json.loads(fig_vib.to_json())

    # Strain
    fig_str = go.Figure()
    fig_str.add_trace(go.Scatter(
        y=df["strain"].values.tolist(),
        mode="lines", name="Strain",
        line=dict(color="#a78bfa", width=1.5),
        fill="tozeroy", fillcolor="rgba(167,139,250,0.05)",
        hovertemplate="Strain: %{y:.6e}<extra></extra>",
    ))
    fig_str.update_layout(**_base_layout(
        yaxis=dict(title="Strain"), xaxis=dict(title="Timestep"),
    ))
    charts["strain"] = json.loads(fig_str.to_json())

    # Temperature
    fig_temp = go.Figure()
    fig_temp.add_trace(go.Scatter(
        y=df["temperature_c"].values.tolist(),
        mode="lines", name="Temperature",
        line=dict(color="#fb923c", width=1.5),
        fill="tozeroy", fillcolor="rgba(251,146,60,0.05)",
        hovertemplate="Temp: %{y:.1f}°C<extra></extra>",
    ))
    fig_temp.update_layout(**_base_layout(
        yaxis=dict(title="°C"), xaxis=dict(title="Timestep"),
    ))
    charts["temperature"] = json.loads(fig_temp.to_json())

    return charts


def generate_correlation_heatmap(df: pd.DataFrame) -> Dict:
    """Generate correlation heatmap for key features."""
    corr_cols = [c for c in [
        "vibration", "strain", "load", "fatigue_index",
        "magnitude", "temperature_c", "humidity", "rainfall_mm",
        "soil_moisture", "liquefaction_risk",
    ] if c in df.columns]

    if len(corr_cols) < 3:
        return {}

    corr_matrix = df[corr_cols].corr()
    labels = [c.replace("_", " ").title() for c in corr_cols]

    fig = go.Figure(data=go.Heatmap(
        z=corr_matrix.values.tolist(),
        x=labels, y=labels,
        colorscale=[
            [0, "#1e1b4b"], [0.25, "#3730a3"],
            [0.5, "#0f172a"], [0.75, "#0e7490"], [1, "#22d3ee"],
        ],
        zmin=-1, zmax=1,
        text=np.round(corr_matrix.values, 2).tolist(),
        texttemplate="%{text}",
        textfont={"size": 9, "color": "#e8ecf4"},
        hovertemplate="%{x} vs %{y}: %{z:.3f}<extra></extra>",
    ))
    fig.update_layout(**_base_layout(
        margin=dict(t=10, r=10, b=80, l=80),
        xaxis=dict(tickangle=45),
    ))
    return json.loads(fig.to_json())


def generate_anomaly_plot(
    df: pd.DataFrame,
    anomaly_scores: Optional[np.ndarray] = None,
    threshold: float = 0.7,
) -> Dict:
    """Generate vibration chart with anomaly regions highlighted."""
    fig = go.Figure()
    vibration = df["vibration"].values
    n = len(vibration)

    fig.add_trace(go.Scatter(
        y=vibration.tolist(), mode="lines", name="Vibration",
        line=dict(color="#22d3ee", width=1.5),
        hovertemplate="Vibration: %{y:.4f}<extra></extra>",
    ))

    if anomaly_scores is not None and len(anomaly_scores) > 0:
        if len(anomaly_scores) < n:
            pad = np.zeros(n - len(anomaly_scores))
            scores = np.concatenate([pad, anomaly_scores])
        else:
            scores = anomaly_scores[:n]

        anomaly_mask = scores > threshold
        anomaly_x = np.where(anomaly_mask)[0].tolist()
        anomaly_y = vibration[anomaly_mask].tolist() if len(anomaly_x) > 0 else []

        fig.add_trace(go.Scatter(
            x=anomaly_x, y=anomaly_y,
            mode="markers", name="Anomaly",
            marker=dict(color="#f43f5e", size=6, symbol="x",
                       line=dict(width=1, color="#f43f5e")),
            hovertemplate="⚠️ Anomaly at step %{x}<br>Vibration: %{y:.4f}<extra></extra>",
        ))

    fig.update_layout(**_base_layout(
        showlegend=True,
        legend=dict(x=0, y=1.12, orientation="h", font=dict(size=10)),
        margin=dict(t=30, r=20, b=40, l=50),
        yaxis=dict(title="mm/s"), xaxis=dict(title="Timestep"),
    ))
    return json.loads(fig.to_json())


def generate_risk_trend(risk_scores: List[float]) -> Dict:
    """Generate risk score trend over time with threshold bands."""
    n = len(risk_scores)
    x = list(range(n))

    fig = go.Figure()

    fig.add_hrect(y0=0, y1=40, fillcolor="rgba(52,211,153,0.05)",
                  line_width=0, annotation_text="SAFE", annotation_position="top left")
    fig.add_hrect(y0=40, y1=70, fillcolor="rgba(251,191,36,0.05)",
                  line_width=0, annotation_text="WARNING", annotation_position="top left")
    fig.add_hrect(y0=70, y1=100, fillcolor="rgba(244,63,94,0.05)",
                  line_width=0, annotation_text="CRITICAL", annotation_position="top left")

    fig.add_hline(y=40, line=dict(color="rgba(251,191,36,0.3)", dash="dash", width=1))
    fig.add_hline(y=70, line=dict(color="rgba(244,63,94,0.3)", dash="dash", width=1))

    colors = ["#34d399" if s <= 40 else "#fbbf24" if s <= 70 else "#f43f5e" for s in risk_scores]

    fig.add_trace(go.Scatter(
        x=x, y=risk_scores, mode="lines+markers",
        line=dict(color="#22d3ee", width=2),
        marker=dict(color=colors, size=4),
        name="Risk Score",
        hovertemplate="Step %{x}: Risk = %{y:.1f}<extra></extra>",
    ))

    fig.update_layout(**_base_layout(
        yaxis=dict(range=[0, 100], title="Risk Score"),
        xaxis=dict(title="Analysis Window"),
    ))
    return json.loads(fig.to_json())


def generate_failure_probability_curve(failure_probs: List[float]) -> Dict:
    """Generate failure probability curve with confidence bands."""
    n = len(failure_probs)
    probs = np.array(failure_probs)

    std = np.clip(probs * 0.15, 0.01, 0.1)
    upper = np.clip(probs + std, 0, 1).tolist()
    lower = np.clip(probs - std, 0, 1).tolist()

    fig = go.Figure()

    fig.add_trace(go.Scatter(
        y=upper + lower[::-1],
        x=list(range(n)) + list(range(n))[::-1],
        fill="toself", fillcolor="rgba(167,139,250,0.1)",
        line=dict(color="rgba(0,0,0,0)"),
        name="Confidence Band", showlegend=False,
    ))

    fig.add_trace(go.Scatter(
        y=probs.tolist(), mode="lines",
        line=dict(color="#a78bfa", width=2),
        name="Failure Probability",
        hovertemplate="P(failure) = %{y:.3f}<extra></extra>",
    ))

    fig.add_hline(y=0.5, line=dict(color="rgba(244,63,94,0.4)", dash="dot", width=1),
                  annotation_text="High Risk", annotation_position="top right")

    fig.update_layout(**_base_layout(
        yaxis=dict(range=[0, 1], title="Probability"),
        xaxis=dict(title="Analysis Window"),
    ))
    return json.loads(fig.to_json())


def generate_all_visualizations(
    df: pd.DataFrame,
    anomaly_scores: Optional[np.ndarray] = None,
    risk_scores: Optional[List[float]] = None,
    failure_probs: Optional[List[float]] = None,
) -> Dict[str, Dict]:
    """Generate all visualization specs."""
    charts = {}

    ts_charts = generate_time_series_charts(df)
    charts.update(ts_charts)

    charts["correlation"] = generate_correlation_heatmap(df)
    charts["anomaly_plot"] = generate_anomaly_plot(df, anomaly_scores)

    if risk_scores and len(risk_scores) > 1:
        charts["risk_trend"] = generate_risk_trend(risk_scores)

    if failure_probs and len(failure_probs) > 1:
        charts["failure_curve"] = generate_failure_probability_curve(failure_probs)

    return charts
