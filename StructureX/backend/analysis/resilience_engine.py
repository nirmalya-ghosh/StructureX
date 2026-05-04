"""
StructureX resilience engine.

Phase 1 functional modules:
    - Multi-hazard scoring
    - Cascading failure simulation
    - Role-based dashboard summaries
    - Scenario stress testing
    - Retrofit prioritization
    - Code-gap analysis
    - Emergency action plan generation
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List

import numpy as np
import pandas as pd

from backend.config import LOCATIONS


COASTAL_LOCATIONS = {"LOC_001", "LOC_003", "LOC_004"}
CRITICAL_FACILITIES = {
    "LOC_001": ["Port trauma center", "Harbor control", "Western grid relay"],
    "LOC_002": ["Metro emergency hub", "North district hospital", "Water board control"],
    "LOC_003": ["City trauma center", "Coastal evacuation shelter", "IT backbone node"],
    "LOC_004": ["River crossing command", "East district shelter", "Bulk water station"],
    "LOC_005": ["Data center cluster", "Urban fire command", "Airport corridor power"],
}


def build_resilience_assessment(
    *,
    request: Any,
    featured_df: pd.DataFrame,
    inference: Dict[str, Any],
    infrastructure: Dict[str, Any],
) -> Dict[str, Any]:
    """Build a full resilience assessment from the current scenario state."""
    location_id = getattr(request, "location_id", "LOC_001")
    location = LOCATIONS.get(location_id, LOCATIONS["LOC_001"])
    latest = featured_df.iloc[-1]
    means = featured_df.mean(numeric_only=True)

    asset_type = _infer_asset_type(location["name"])
    base_risk = float(inference["risk"]["risk_score"])
    hazard_layers = _build_hazard_layers(
        request=request,
        location_id=location_id,
        base_risk=base_risk,
        latest=latest,
        means=means,
        infrastructure=infrastructure,
        asset_type=asset_type,
    )
    cascade = _build_cascading_failures(
        hazard_layers=hazard_layers,
        base_risk=base_risk,
        asset_type=asset_type,
        location_id=location_id,
    )
    dashboards = _build_role_dashboards(
        location_name=location["name"],
        location_id=location_id,
        asset_type=asset_type,
        base_risk=base_risk,
        hazard_layers=hazard_layers,
        cascade=cascade,
    )
    stress_tests = _build_stress_tests(
        request=request,
        base_risk=base_risk,
        hazard_layers=hazard_layers,
        location_name=location["name"],
    )
    retrofit = _build_retrofit_priorities(
        location_name=location["name"],
        asset_type=asset_type,
        base_risk=base_risk,
        cascade=cascade,
        hazard_layers=hazard_layers,
    )
    code_gap = _build_code_gap_analysis(
        asset_type=asset_type,
        base_risk=base_risk,
        hazard_layers=hazard_layers,
        infrastructure=infrastructure,
    )
    action_plan = _build_action_plan(
        location_name=location["name"],
        asset_type=asset_type,
        location_id=location_id,
        base_risk=base_risk,
        hazard_layers=hazard_layers,
        cascade=cascade,
        retrofit=retrofit,
    )

    overview = {
        "location_id": location_id,
        "location_name": location["name"],
        "asset_type": asset_type,
        "coordinates": {"lat": location["lat"], "lng": location["lon"]},
        "risk_score": round(base_risk, 1),
        "risk_category": inference["risk"]["risk_category"],
        "earthquake_magnitude": round(float(getattr(request, "earthquake_magnitude", 0.0)), 1),
        "temperature": round(float(getattr(request, "temperature", 0.0)), 1),
        "soil_moisture": round(float(getattr(request, "soil_moisture", 0.0)), 2),
        "predicted_degradation": round(float(inference["predicted_degradation"]) * 100, 1),
        "top_hazard": max(hazard_layers, key=lambda item: item["score"])["title"],
        "cascade_status": cascade["status"],
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "selected_role": getattr(request, "role", "executive"),
    }

    return {
        "overview": overview,
        "hazard_layers": hazard_layers,
        "cascade": cascade,
        "role_dashboards": dashboards,
        "stress_tests": stress_tests,
        "retrofit_priorities": retrofit,
        "code_gap": code_gap,
        "action_plan": action_plan,
    }


def _infer_asset_type(location_name: str) -> str:
    lowered = location_name.lower()
    if "bridge" in lowered:
        return "bridge corridor"
    if "pipeline" in lowered:
        return "pipeline corridor"
    return "building cluster"


def _build_hazard_layers(
    *,
    request: Any,
    location_id: str,
    base_risk: float,
    latest: pd.Series,
    means: pd.Series,
    infrastructure: Dict[str, Any],
    asset_type: str,
) -> List[Dict[str, Any]]:
    base_ratio = base_risk / 100.0
    eq = float(getattr(request, "earthquake_magnitude", 0.0)) / 10.0
    temp = float(getattr(request, "temperature", 0.0))
    soil_moisture = float(getattr(request, "soil_moisture", 0.0))
    rainfall = float(means.get("rainfall_mm", 0.0))
    wind = float(means.get("wind_speed", 0.0))
    liquefaction = float(means.get("liquefaction_risk", 0.0))
    soil_risk = float(means.get("soil_risk_index", 0.0))
    fatigue = float(means.get("fatigue_index", 0.0))
    foundation = float(infrastructure["buildings"]["foundation_score"])
    load_bearing = float(infrastructure["buildings"]["load_bearing_score"])
    resonance = float(infrastructure["bridges"]["resonance_score"])
    displacement = float(infrastructure["pipelines"]["displacement_score"])
    coastal = 1.0 if location_id in COASTAL_LOCATIONS else 0.0
    heat_delta = min(abs(temp - 24.0) / 26.0, 1.0)

    hazards = [
        {
            "id": "EQ",
            "title": "Earthquake ground motion",
            "score": _score(
                0.48 * eq + 0.18 * base_ratio + 0.18 * resonance + 0.16 * foundation
            ),
            "signal": f"M{float(getattr(request, 'earthquake_magnitude', 0.0)):.1f} event forcing",
            "detail": "Primary shaking demand on the active asset and connected utility lifelines.",
            "action": "Trigger rapid structural screening, bridge approach inspection, and utility shutoff validation.",
        },
        {
            "id": "FL",
            "title": "Flood / storm surge",
            "score": _score(
                0.33 * soil_moisture + 0.22 * _norm(rainfall, 0, 8) + 0.2 * coastal + 0.15 * displacement + 0.1 * base_ratio
            ),
            "signal": f"{rainfall:.1f} mm rainfall equivalent",
            "detail": "Hydraulic loading on drainage, embankments, access roads, and low-lying substations.",
            "action": "Pre-stage pumps, inspect levee and drain choke points, and reroute traffic from low-clearance approaches.",
        },
        {
            "id": "WF",
            "title": "Wildfire / urban fire",
            "score": _score(
                0.36 * heat_delta + 0.2 * _norm(wind, 0, 20) + 0.18 * (1 - soil_moisture) + 0.14 * fatigue + 0.12 * base_ratio
            ),
            "signal": f"{wind:.1f} m/s wind-driven spread",
            "detail": "Heat, wind, and post-shock ignition exposure for dense corridors and utility-fed fire spread.",
            "action": "Verify gas isolation, thermal watch, and fire appliance access to the highest occupancy blocks.",
        },
        {
            "id": "LG",
            "title": "Landslide / liquefaction",
            "score": _score(
                0.3 * soil_risk + 0.28 * liquefaction + 0.18 * soil_moisture + 0.14 * eq + 0.1 * foundation
            ),
            "signal": f"{liquefaction * 100:.0f}% geotechnical susceptibility",
            "detail": "Subgrade instability, embankment slip, and settlement risk under saturated or shaken soils.",
            "action": "Inspect slopes, retaining walls, buried utilities, and foundation settlement indicators immediately.",
        },
        {
            "id": "TS",
            "title": "Tsunami / coastal inundation" if coastal else "Hydraulic access disruption",
            "score": _score(
                0.46 * coastal * eq + 0.22 * coastal * _norm(rainfall, 0, 8) + 0.18 * base_ratio + 0.14 * soil_moisture
            ),
            "signal": "Coastal buoy watch linked" if coastal else "Inland waterway watch posture",
            "detail": "Coastal assets require surge awareness after strong shaking; inland sites monitor hydraulic chokepoints.",
            "action": "Confirm shelter routes, elevate dispatch staging, and hold nonessential traffic away from inundation corridors.",
        },
        {
            "id": "XC",
            "title": "Extreme heat / cold stress",
            "score": _score(
                0.42 * heat_delta + 0.22 * load_bearing + 0.18 * fatigue + 0.18 * base_ratio
            ),
            "signal": f"{temp:.1f} C thermal load",
            "detail": f"Thermal cycling stress on the {asset_type}, bearings, joints, power equipment, and enclosures.",
            "action": "Watch expansion joints, cable temperatures, and cooling resilience at critical facilities.",
        },
    ]

    for item in hazards:
        item["status"] = _status(item["score"])
    return hazards


def _build_cascading_failures(
    *,
    hazard_layers: List[Dict[str, Any]],
    base_risk: float,
    asset_type: str,
    location_id: str,
) -> Dict[str, Any]:
    top_hazard = max(hazard_layers, key=lambda item: item["score"])
    base_ratio = base_risk / 100.0
    hazard_avg = np.mean([item["score"] for item in hazard_layers]) / 100.0
    transport_multiplier = 0.18 if "bridge" in asset_type else 0.12
    utility_multiplier = 0.18 if "pipeline" in asset_type else 0.1

    nodes = [
        _cascade_node("Power substation", 62 + base_ratio * 24 + hazard_avg * 10),
        _cascade_node("Water pumping", 55 + base_ratio * 20 + utility_multiplier * 100),
        _cascade_node("Traffic control", 58 + base_ratio * 22 + transport_multiplier * 100),
        _cascade_node("Hospital backup power", 48 + base_ratio * 18 + top_hazard["score"] * 0.12),
        _cascade_node("Telecom backhaul", 52 + base_ratio * 16 + hazard_avg * 14),
    ]

    chain = [
        {
            "stage": "Stage 1",
            "title": "Primary asset disruption",
            "impact": f"{asset_type.title()} performance drops under {top_hazard['title'].lower()} forcing.",
        },
        {
            "stage": "Stage 2",
            "title": "Utility dependency stress",
            "impact": "Power and water support nodes enter reduced-capacity operation, increasing restoration time.",
        },
        {
            "stage": "Stage 3",
            "title": "Mobility and access degradation",
            "impact": "Signal timing, route continuity, and responder travel windows tighten as dependent corridors degrade.",
        },
        {
            "stage": "Stage 4",
            "title": "Critical service strain",
            "impact": f"{', '.join(CRITICAL_FACILITIES.get(location_id, [])[:2])} shift to contingency posture.",
        },
    ]

    route_integrity = round(max(18.0, 100.0 - (base_risk * 0.42 + top_hazard["score"] * 0.34)), 1)
    isolated_services = [node["name"] for node in nodes if node["score"] >= 72]

    return {
        "status": "Contained" if route_integrity >= 70 else "Stressed" if route_integrity >= 45 else "Compromised",
        "primary_trigger": top_hazard["title"],
        "route_integrity_score": route_integrity,
        "estimated_outage_hours": int(round(6 + base_ratio * 18 + top_hazard["score"] / 9)),
        "isolated_services": isolated_services or ["None"],
        "nodes": nodes,
        "chain": chain,
    }


def _cascade_node(name: str, score: float) -> Dict[str, Any]:
    rounded = round(float(np.clip(score, 0.0, 100.0)), 1)
    return {
        "name": name,
        "score": rounded,
        "status": _status(rounded),
    }


def _build_role_dashboards(
    *,
    location_name: str,
    location_id: str,
    asset_type: str,
    base_risk: float,
    hazard_layers: List[Dict[str, Any]],
    cascade: Dict[str, Any],
) -> Dict[str, Any]:
    top_hazard = max(hazard_layers, key=lambda item: item["score"])
    critical_facilities = CRITICAL_FACILITIES.get(location_id, [])

    return {
        "executive": {
            "headline": f"{location_name} is operating under a {top_hazard['status'].lower()} {top_hazard['title'].lower()} watch.",
            "kpis": [
                {"label": "City risk", "value": f"{base_risk:.1f}/100"},
                {"label": "Top hazard", "value": top_hazard["title"]},
                {"label": "Route integrity", "value": f"{cascade['route_integrity_score']:.1f}%"},
            ],
            "actions": [
                "Approve pre-positioning of inspection and utility crews in the affected district.",
                "Protect budget for the top-ranked retrofit package and restoration inventory.",
                "Escalate standby posture for critical facilities with backup power dependency.",
            ],
        },
        "emergency_manager": {
            "headline": "Response posture prioritizes route continuity, utility redundancy, and district-level life safety.",
            "kpis": [
                {"label": "Outage window", "value": f"{cascade['estimated_outage_hours']} h"},
                {"label": "Isolated services", "value": str(len([item for item in cascade['isolated_services'] if item != 'None']))},
                {"label": "Critical facilities", "value": str(len(critical_facilities))},
            ],
            "actions": [
                "Dispatch field validation to power, water, and access nodes flagged above 70 severity.",
                "Stage alternate routes around the primary asset and protect hospital access corridors.",
                "Prepare shelter and utility handoff procedures if route integrity drops below 45%.",
            ],
        },
        "engineer": {
            "headline": f"Inspection focus is the {asset_type} plus dependent foundation, load, and utility interfaces.",
            "kpis": [
                {"label": "Geotechnical watch", "value": f"{hazard_layers[3]['score']:.1f}/100"},
                {"label": "Thermal stress", "value": f"{hazard_layers[5]['score']:.1f}/100"},
                {"label": "Ground motion", "value": f"{hazard_layers[0]['score']:.1f}/100"},
            ],
            "actions": [
                "Inspect bearings, joints, crack propagation, and settlement markers in the first field sweep.",
                "Validate utility penetrations, retaining systems, and thermal hotspots before reopening.",
                "Feed inspection findings back into the vulnerability baseline after the event window closes.",
            ],
        },
        "public": {
            "headline": "Public guidance stays focused on safe movement, official updates, and known service impacts.",
            "kpis": [
                {"label": "Area", "value": location_name.replace("_", " ")},
                {"label": "Watch level", "value": top_hazard["status"]},
                {"label": "Advisory", "value": cascade["status"]},
            ],
            "actions": [
                "Use signed alternate routes and avoid restricted structures until inspections are complete.",
                "Monitor official alerts for shelter, utility, and traffic updates in the selected district.",
                "Report visible damage, flooding, smoke, or utility smells through emergency channels only.",
            ],
        },
    }


def _build_stress_tests(
    *,
    request: Any,
    base_risk: float,
    hazard_layers: List[Dict[str, Any]],
    location_name: str,
) -> List[Dict[str, Any]]:
    eq = float(getattr(request, "earthquake_magnitude", 0.0))
    temp = float(getattr(request, "temperature", 0.0))
    soil = float(getattr(request, "soil_moisture", 0.0))
    top_hazard = max(hazard_layers, key=lambda item: item["score"])

    scenarios = [
        {
            "name": "Baseline live scenario",
            "trigger": f"M{eq:.1f} event with {soil:.2f} soil moisture and {temp:.1f} C ambient temperature.",
            "risk_score": round(base_risk, 1),
            "loss_estimate_musd": round(4.5 + base_risk * 0.18, 1),
            "outage_hours": int(round(4 + base_risk * 0.12)),
            "summary": f"Current scenario is dominated by {top_hazard['title'].lower()} with contained-to-stressed service posture.",
        },
        {
            "name": "Near-fault escalation",
            "trigger": f"M{min(8.5, eq + 1.6):.1f} rupture 5 km from the asset corridor.",
            "risk_score": round(min(96.0, base_risk + 18 + eq * 2.2), 1),
            "loss_estimate_musd": round(9.0 + base_risk * 0.28, 1),
            "outage_hours": int(round(10 + base_risk * 0.16)),
            "summary": "Sharp uplift in structural demand, route severance, and inspection backlog for emergency services.",
        },
        {
            "name": "Saturated soil cascade",
            "trigger": f"Soil moisture raised to {min(1.0, soil + 0.28):.2f} after heavy rain over {location_name.replace('_', ' ')}.",
            "risk_score": round(min(92.0, base_risk + 12 + soil * 24), 1),
            "loss_estimate_musd": round(7.2 + base_risk * 0.22, 1),
            "outage_hours": int(round(8 + base_risk * 0.14)),
            "summary": "Geotechnical instability becomes the leading driver with higher settlement, slope, and buried utility exposure.",
        },
        {
            "name": "Heatwave + network strain",
            "trigger": f"Ambient temperature elevated to {min(55.0, temp + 11):.1f} C with concurrent demand surge.",
            "risk_score": round(min(90.0, base_risk + 10 + max(temp - 20, 0) * 0.7), 1),
            "loss_estimate_musd": round(6.1 + base_risk * 0.19, 1),
            "outage_hours": int(round(6 + base_risk * 0.13)),
            "summary": "Power and cooling loads drive utility failures and reduce resilience margins at critical facilities.",
        },
    ]
    return scenarios


def _build_retrofit_priorities(
    *,
    location_name: str,
    asset_type: str,
    base_risk: float,
    cascade: Dict[str, Any],
    hazard_layers: List[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    top_hazard = max(hazard_layers, key=lambda item: item["score"])
    assets = [
        (f"{location_name.replace('_', ' ')} primary asset", 1.0, 1.0),
        ("Power and control feeder", 0.82, 0.76),
        ("Water and drainage support node", 0.74, 0.7),
        ("Emergency access corridor", 0.78, 0.88),
    ]

    priorities = []
    for index, (name, consequence_multiplier, cost_multiplier) in enumerate(assets, start=1):
        retrofit_cost = round((1.6 + index * 0.9) * cost_multiplier + base_risk * 0.05, 1)
        replacement_cost = round(retrofit_cost * (3.1 + consequence_multiplier), 1)
        consequence_score = round(min(100.0, base_risk * consequence_multiplier + top_hazard["score"] * 0.32 + index * 4), 1)
        ror = round(consequence_score / max(retrofit_cost, 1.0), 2)
        priorities.append(
            {
                "asset": name,
                "asset_type": asset_type if index == 1 else "supporting lifeline",
                "retrofit_cost_musd": retrofit_cost,
                "replacement_cost_musd": replacement_cost,
                "consequence_score": consequence_score,
                "return_on_resilience": ror,
                "priority": "Immediate" if ror >= 9 else "Planned" if ror >= 6 else "Monitor",
                "recommendation": _retrofit_recommendation(index, top_hazard["title"], cascade["status"]),
            }
        )

    priorities.sort(key=lambda item: item["return_on_resilience"], reverse=True)
    return priorities


def _retrofit_recommendation(index: int, top_hazard: str, cascade_status: str) -> str:
    recommendations = [
        f"Strengthen the primary load path and foundation system against {top_hazard.lower()} demand.",
        "Add redundancy to power, sensing, and controls to prevent secondary service collapse.",
        "Protect drainage, buried utility interfaces, and pump resilience for wet-failure scenarios.",
        f"Reinforce access continuity and emergency routing to reduce {cascade_status.lower()} cascade impacts.",
    ]
    return recommendations[index - 1]


def _build_code_gap_analysis(
    *,
    asset_type: str,
    base_risk: float,
    hazard_layers: List[Dict[str, Any]],
    infrastructure: Dict[str, Any],
) -> Dict[str, Any]:
    top_hazard = max(hazard_layers, key=lambda item: item["score"])
    compliance_score = round(max(28.0, 100.0 - (base_risk * 0.48 + top_hazard["score"] * 0.22)), 1)
    gaps = [
        _gap_row("Lateral system", "Needs validation", f"Drift reserve under {top_hazard['title'].lower()} not fully demonstrated."),
        _gap_row("Foundation / soil interface", "Action required", "Settlement and liquefaction checks should be upgraded for current loading assumptions."),
        _gap_row("Non-structural restraints", "Monitor", "Equipment anchorage and facade retention need rapid field verification."),
        _gap_row("Emergency power continuity", "Action required", "Critical service resilience depends on backup power autonomy and tested transfer procedures."),
        _gap_row("Inspection and permit record", "Needs validation", "Retrofit and inspection documentation is incomplete for post-event code confidence."),
    ]

    if "bridge" in asset_type:
        gaps.insert(1, _gap_row("Bearing and joint compliance", "Action required", "Bridge movement accommodation and seat width reserve should be revalidated."))
    if "pipeline" in asset_type:
        gaps.insert(1, _gap_row("Buried utility restraint", "Action required", "Pipeline supports and settlement joints require updated geotechnical compliance checks."))

    return {
        "compliance_score": compliance_score,
        "governing_hazard": top_hazard["title"],
        "component_scores": {
            "foundation": round(infrastructure["buildings"]["foundation_score"] * 100, 1),
            "load_path": round(infrastructure["buildings"]["load_bearing_score"] * 100, 1),
            "mobility": round(infrastructure["bridges"]["resonance_score"] * 100, 1),
            "utilities": round(infrastructure["pipelines"]["displacement_score"] * 100, 1),
        },
        "gaps": gaps,
    }


def _gap_row(component: str, status: str, finding: str) -> Dict[str, str]:
    return {
        "component": component,
        "status": status,
        "finding": finding,
    }


def _build_action_plan(
    *,
    location_name: str,
    asset_type: str,
    location_id: str,
    base_risk: float,
    hazard_layers: List[Dict[str, Any]],
    cascade: Dict[str, Any],
    retrofit: List[Dict[str, Any]],
) -> Dict[str, Any]:
    top_hazard = max(hazard_layers, key=lambda item: item["score"])
    immediate_actions = [
        f"Dispatch rapid assessment teams to the {location_name.replace('_', ' ')} {asset_type}.",
        f"Inspect {', '.join(cascade['isolated_services'][:2]) if cascade['isolated_services'][0] != 'None' else 'power, water, and mobility support nodes'} for cascading failure onset.",
        f"Pre-stage the top retrofit package: {retrofit[0]['asset']}.",
    ]
    operations = [
        "Maintain alternate route messaging and preserve emergency vehicle access corridors.",
        "Confirm hospital, shelter, and telecom redundancy before reopening normal traffic patterns.",
        "Keep field updates flowing into the engineering feedback loop for model recalibration.",
    ]
    resources = [
        {"resource": "Inspection crews", "status": "Ready", "quantity": 6},
        {"resource": "Portable generators", "status": "Pre-stage", "quantity": 4},
        {"resource": "Water pumps", "status": "Standby", "quantity": 3},
        {"resource": "Traffic control units", "status": "Deploy", "quantity": 8},
    ]
    contacts = [
        {"role": "City command", "contact": "Operations duty officer"},
        {"role": "Utility coordinator", "contact": "Power-water joint desk"},
        {"role": "Engineering lead", "contact": "StructureX field response team"},
    ]

    briefing = (
        f"A magnitude {top_hazard['signal'].split()[0] if top_hazard['id'] == 'EQ' else 'scenario-driven'} risk posture "
        f"has placed {location_name.replace('_', ' ')} under a {top_hazard['status'].lower()} "
        f"{top_hazard['title'].lower()} watch. Current composite risk is {base_risk:.1f}/100. "
        f"Route integrity is assessed at {cascade['route_integrity_score']:.1f}%, and the leading operational concern is "
        f"{cascade['primary_trigger'].lower()} causing {cascade['status'].lower()} dependency stress."
    )

    return {
        "briefing": briefing,
        "immediate_actions": immediate_actions,
        "operations": operations,
        "resources": resources,
        "contacts": contacts,
        "critical_facilities": CRITICAL_FACILITIES.get(location_id, []),
    }


def _score(value: float) -> float:
    return round(float(np.clip(value, 0.0, 1.0) * 100.0), 1)


def _status(score: float) -> str:
    if score >= 70:
        return "Critical"
    if score >= 45:
        return "Watch"
    return "Stable"


def _norm(value: float, low: float, high: float) -> float:
    if high <= low:
        return 0.0
    return float(np.clip((value - low) / (high - low), 0.0, 1.0))
