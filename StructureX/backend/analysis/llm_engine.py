"""
StructureX — LLM Insight Engine
Generates ChatGPT-style natural language explanations from ML outputs.

Architecture:
    1. Template-based engine (no API key needed, always works)
    2. OpenAI integration (optional, if OPENAI_API_KEY env var set)

Input:  risk metrics dict, SHAP explanations, infrastructure analysis
Output: structured natural language report

The template engine uses conditional logic, metric thresholds,
and domain-specific knowledge to produce contextual, detailed insights
that read like expert analysis — NOT generic templates.
"""

import os
import json
from typing import Dict, List, Optional

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))


def _severity_word(score: float) -> str:
    """Map 0-100 score to severity adjective."""
    if score < 20:
        return "minimal"
    elif score < 40:
        return "low"
    elif score < 55:
        return "moderate"
    elif score < 70:
        return "elevated"
    elif score < 85:
        return "high"
    return "critical"


def _trend_word(val: float) -> str:
    """Map degradation rate to trend description."""
    if val < 0.1:
        return "stable"
    elif val < 0.3:
        return "gradually increasing"
    elif val < 0.6:
        return "accelerating"
    return "rapidly escalating"


def _format_feature(name: str) -> str:
    """Human-readable feature name."""
    mapping = {
        "rolling_mean_vibration": "sustained vibration levels",
        "rolling_std_vibration": "vibration variability",
        "rate_of_change_strain": "rate of strain change",
        "cumulative_fatigue": "cumulative structural fatigue",
        "seismic_impact": "seismic impact intensity",
        "thermal_stress": "thermal stress",
        "soil_risk_index": "soil instability index",
        "vibration": "vibration amplitude",
        "strain": "structural strain",
        "load": "applied load",
        "temperature_c": "temperature",
        "humidity": "humidity levels",
        "rainfall_mm": "rainfall intensity",
        "wind_speed": "wind speed",
        "fatigue_growth_rate": "fatigue acceleration",
    }
    return mapping.get(name, name.replace("_", " "))


def generate_insights_template(
    risk_score: float,
    failure_probability: float,
    anomaly_score: float,
    degradation: float,
    environmental_risk: float,
    top_features: List[Dict],
    infrastructure: Dict,
    key_metrics: Optional[Dict] = None,
) -> Dict[str, str]:
    """
    Generate comprehensive natural language insights using template engine.

    Input schema:
        risk_score: float 0-100
        failure_probability: float 0-1
        anomaly_score: float 0-1
        degradation: float 0-1
        environmental_risk: float 0-1
        top_features: [{feature_name, contribution_value}]
        infrastructure: {buildings: {...}, bridges: {...}, pipelines: {...}}
        key_metrics: optional dict of additional metrics

    Output schema:
        {
            summary: str,
            drivers: str,
            environmental_analysis: str,
            structural_analysis: str,
            infrastructure_insights: str,
            recommendations: str,
            time_estimate: str,
        }
    """
    severity = _severity_word(risk_score)
    fp_pct = failure_probability * 100
    anomaly_pct = anomaly_score * 100
    trend = _trend_word(degradation)

    # ── Summary ──
    if risk_score >= 70:
        summary = (
            f"⚠️ **CRITICAL ALERT**: The infrastructure risk analysis indicates a {severity} "
            f"risk level with a composite score of {risk_score:.1f}/100. "
            f"Failure probability stands at {fp_pct:.1f}%, with anomaly detection "
            f"flagging {anomaly_pct:.1f}% deviation from normal operational patterns. "
            f"Immediate engineering assessment and intervention is strongly recommended."
        )
    elif risk_score >= 40:
        summary = (
            f"⚡ **WARNING**: The analysis reveals a {severity} risk level with a composite "
            f"score of {risk_score:.1f}/100. Failure probability is at {fp_pct:.1f}%, "
            f"and degradation trends are {trend}. While not immediately critical, "
            f"proactive monitoring and maintenance scheduling is advised."
        )
    else:
        summary = (
            f"✅ **SAFE**: The infrastructure is operating within acceptable parameters "
            f"with a {severity} risk score of {risk_score:.1f}/100. Failure probability "
            f"is low at {fp_pct:.1f}%, and structural integrity indicators are {trend}. "
            f"Continue standard monitoring protocols."
        )

    # ── Key Risk Drivers ──
    if top_features:
        driver_lines = []
        for i, feat in enumerate(top_features[:3], 1):
            fname = _format_feature(feat.get("feature_name", "unknown"))
            fval = feat.get("contribution_value", 0)
            direction = "increasing" if fval > 0 else "decreasing"
            impact = "elevating" if fval > 0 else "mitigating"
            driver_lines.append(
                f"**{i}. {fname.title()}** — Contributing {abs(fval):.4f} SHAP units, "
                f"{impact} overall risk. This factor is {direction} risk exposure "
                f"and warrants {'close attention' if abs(fval) > 0.1 else 'monitoring'}."
            )
        drivers = "\n".join(driver_lines)
    else:
        drivers = "Feature contribution analysis is pending. Run SHAP explainability for detailed driver breakdown."

    # ── Environmental Impact Analysis ──
    env_severity = _severity_word(environmental_risk * 100)
    env_parts = []
    env_parts.append(
        f"Environmental risk is assessed at **{env_severity}** ({environmental_risk*100:.1f}/100)."
    )

    if key_metrics:
        if key_metrics.get("avg_temperature", 25) > 35:
            env_parts.append(
                "Elevated temperatures are contributing to thermal expansion stress on structural elements, "
                "particularly affecting expansion joints and bearing assemblies."
            )
        elif key_metrics.get("avg_temperature", 25) < 5:
            env_parts.append(
                "Low temperatures pose freeze-thaw cycle risks to concrete structures and may cause "
                "thermal contraction in steel members, increasing brittleness."
            )

        if key_metrics.get("avg_soil_moisture", 0.3) > 0.6:
            env_parts.append(
                "High soil moisture levels indicate potential ground saturation, increasing liquefaction "
                "susceptibility and reducing foundation bearing capacity."
            )

        if key_metrics.get("max_magnitude", 0) > 4.0:
            env_parts.append(
                f"Significant seismic activity detected (M{key_metrics.get('max_magnitude', 0):.1f}). "
                "Resonance effects may amplify structural response, particularly in "
                "mid-rise buildings and long-span bridges."
            )
        elif key_metrics.get("max_magnitude", 0) > 2.0:
            env_parts.append(
                "Moderate seismic activity has been recorded. While below critical thresholds, "
                "cumulative micro-damage effects should be monitored."
            )

    environmental_analysis = " ".join(env_parts)

    # ── Structural Impact Analysis ──
    struct_parts = []
    struct_parts.append(
        f"Structural degradation trend is **{trend}** with a normalized index of {degradation:.3f}."
    )

    if anomaly_score > 0.7:
        struct_parts.append(
            "The anomaly detection system has identified significant deviations from historical "
            "baseline patterns, suggesting potential onset of structural deterioration or "
            "unrecognized loading conditions."
        )
    elif anomaly_score > 0.4:
        struct_parts.append(
            "Moderate anomalous patterns have been detected. These may indicate early-stage "
            "degradation or transient environmental effects that should be differentiated "
            "through additional inspections."
        )
    else:
        struct_parts.append(
            "Structural sensor patterns remain within historical baselines, indicating "
            "normal operational behavior without significant anomalous signatures."
        )

    if failure_probability > 0.5:
        struct_parts.append(
            f"With a {fp_pct:.1f}% failure probability, the time-series model projects "
            "accelerating degradation. Fatigue accumulation patterns suggest inspection "
            "intervals should be shortened."
        )

    structural_analysis = " ".join(struct_parts)

    # ── Infrastructure-Specific Insights ──
    infra_lines = []

    if infrastructure.get("buildings"):
        b = infrastructure["buildings"]
        infra_lines.append(f"### 🏢 Buildings")
        infra_lines.append(
            f"- **Foundation Stability**: {b.get('foundation_risk', 'nominal').title()} — "
            f"Soil-structure interaction analysis indicates "
            f"{'concerning settlement patterns' if b.get('foundation_score', 0) > 0.5 else 'acceptable bearing conditions'}."
        )
        infra_lines.append(
            f"- **Load-Bearing Integrity**: {b.get('load_bearing_risk', 'nominal').title()} — "
            f"{'Column and beam stress ratios approach design limits' if b.get('load_bearing_score', 0) > 0.5 else 'Stress ratios remain within design margins'}."
        )

    if infrastructure.get("bridges"):
        br = infrastructure["bridges"]
        infra_lines.append(f"### 🌉 Bridges")
        infra_lines.append(
            f"- **Resonance Risk**: {br.get('resonance_risk', 'nominal').title()} — "
            f"{'Vibration frequencies approaching natural frequency of span members' if br.get('resonance_score', 0) > 0.5 else 'Vibration frequencies well separated from natural frequencies'}."
        )
        infra_lines.append(
            f"- **Structural Fatigue**: {br.get('fatigue_risk', 'nominal').title()} — "
            f"{'Fatigue cycles indicate accelerated aging in critical joints' if br.get('fatigue_score', 0) > 0.5 else 'Fatigue cycle count within expected service life parameters'}."
        )

    if infrastructure.get("pipelines"):
        p = infrastructure["pipelines"]
        infra_lines.append(f"### 🔧 Pipelines")
        infra_lines.append(
            f"- **Soil Displacement**: {p.get('displacement_risk', 'nominal').title()} — "
            f"{'Ground movement may induce differential strain on buried segments' if p.get('displacement_score', 0) > 0.5 else 'Ground stability adequate for pipeline alignment'}."
        )
        infra_lines.append(
            f"- **Pressure Integrity**: {p.get('pressure_risk', 'nominal').title()} — "
            f"{'Thermal cycling and external loads may compromise joint seals' if p.get('pressure_score', 0) > 0.5 else 'Operating pressures within design specifications'}."
        )

    infrastructure_insights = "\n".join(infra_lines) if infra_lines else "Infrastructure-specific analysis requires additional sensor data."

    # ── Recommendations ──
    recs = []
    if risk_score >= 70:
        recs.extend([
            "1. **Immediate Inspection**: Deploy structural assessment team within 48 hours to evaluate critical load paths and connections.",
            "2. **Load Reduction**: Consider temporary load restrictions on the affected infrastructure until assessment is complete.",
            "3. **Sensor Deployment**: Install additional real-time monitoring sensors at identified high-stress locations.",
            "4. **Emergency Protocol**: Activate contingency response procedures and notify relevant authorities.",
        ])
    elif risk_score >= 40:
        recs.extend([
            "1. **Scheduled Inspection**: Plan detailed structural inspection within 2 weeks.",
            "2. **Monitoring Upgrade**: Increase monitoring frequency to capture developing trends.",
            "3. **Preventive Maintenance**: Address identified degradation hotspots through targeted maintenance.",
            "4. **Risk Re-assessment**: Re-run analysis after maintenance to confirm risk reduction.",
        ])
    else:
        recs.extend([
            "1. **Continue Monitoring**: Maintain current sensor and inspection schedules.",
            "2. **Trend Tracking**: Document baseline metrics for longitudinal comparison.",
            "3. **Preventive Planning**: Schedule routine maintenance per infrastructure lifecycle plan.",
        ])

    recommendations = "\n".join(recs)

    # ── Time Estimate ──
    if failure_probability > 0.7:
        time_estimate = "Estimated time to potential failure: **< 6 months** under current loading conditions. Urgent intervention required."
    elif failure_probability > 0.4:
        time_estimate = "Estimated time to potential failure: **6–18 months** if degradation trends continue unchecked."
    elif failure_probability > 0.2:
        time_estimate = "Estimated time to potential failure: **1–3 years** with standard maintenance. Accelerated maintenance recommended."
    else:
        time_estimate = "No imminent failure risk detected. Standard lifecycle management sufficient for the foreseeable future."

    return {
        "summary": summary,
        "drivers": drivers,
        "environmental_analysis": environmental_analysis,
        "structural_analysis": structural_analysis,
        "infrastructure_insights": infrastructure_insights,
        "recommendations": recommendations,
        "time_estimate": time_estimate,
    }


async def generate_insights_openai(
    risk_score: float,
    failure_probability: float,
    anomaly_score: float,
    top_features: List[Dict],
    key_metrics: Dict,
) -> Optional[Dict[str, str]]:
    """
    Generate insights using OpenAI API (optional).
    Returns None if API key not configured or call fails.
    """
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        return None

    try:
        import openai
        client = openai.AsyncOpenAI(api_key=api_key)

        prompt = f"""You are an expert infrastructure risk analyst. Analyze these results and provide a detailed assessment:

Risk Score: {risk_score:.1f}/100
Failure Probability: {failure_probability*100:.1f}%
Anomaly Score: {anomaly_score*100:.1f}%
Top Risk Drivers: {json.dumps(top_features[:3])}
Key Metrics: {json.dumps(key_metrics)}

Provide your analysis in this exact JSON structure:
{{
    "summary": "2-3 sentence executive summary",
    "drivers": "Analysis of top risk drivers",
    "environmental_analysis": "Environmental impact analysis",
    "structural_analysis": "Structural integrity assessment",
    "infrastructure_insights": "Specific insights for buildings, bridges, and pipelines",
    "recommendations": "Numbered actionable recommendations",
    "time_estimate": "Estimated timeline for potential failure"
}}"""

        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            response_format={"type": "json_object"},
        )

        return json.loads(response.choices[0].message.content)

    except Exception as e:
        print(f"[LLM] OpenAI call failed: {e}, falling back to template engine")
        return None


async def generate_insights(
    risk_score: float,
    failure_probability: float,
    anomaly_score: float,
    degradation: float,
    environmental_risk: float,
    top_features: List[Dict],
    infrastructure: Dict,
    key_metrics: Optional[Dict] = None,
) -> Dict[str, str]:
    """
    Main entry point. Tries OpenAI first, falls back to template engine.

    Input:  all risk metrics + SHAP features + infrastructure analysis
    Output: natural language insights dict
    """
    # Try OpenAI first
    openai_result = await generate_insights_openai(
        risk_score, failure_probability, anomaly_score,
        top_features, key_metrics or {},
    )

    if openai_result:
        return openai_result

    # Fall back to template engine
    return generate_insights_template(
        risk_score=risk_score,
        failure_probability=failure_probability,
        anomaly_score=anomaly_score,
        degradation=degradation,
        environmental_risk=environmental_risk,
        top_features=top_features,
        infrastructure=infrastructure,
        key_metrics=key_metrics,
    )
