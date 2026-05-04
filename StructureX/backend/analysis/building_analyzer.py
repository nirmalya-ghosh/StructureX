"""
StructureX - AI Building Analysis Engine
Uses Google Gemini to analyze structural properties of buildings
based on MapTiler data and reverse geocoding.
"""

import google.generativeai as genai
import json
import traceback
from typing import Dict, Any, List

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from backend.config import GEMINI_API_KEY, GEMINI_MODEL


def _derive_building_context(lat: float, lng: float, height: float, address: str, area_name: str, properties: Dict) -> Dict[str, Any]:
    asset_type = str(properties.get("type") or "building").lower()
    estimated_floors = max(1, round(height / 3.5))
    is_highrise = height >= 60 or estimated_floors >= 18
    is_midrise = 25 <= height < 60 or 8 <= estimated_floors < 18
    occupancy_profile = (
        "High-density occupancy or commercially intense usage likely"
        if is_highrise
        else "Moderate occupancy / standard urban usage likely"
    )
    likely_structural_system = (
        "Reinforced-concrete or composite moment-resisting frame with a lateral system sized for mid- to high-rise demands"
        if is_highrise
        else "Reinforced-concrete frame, masonry infill, or low-rise urban frame system"
    )
    likely_foundation = (
        "Deep foundation or raft/slab solution likely if local soil variability or settlement risk is significant"
        if is_highrise
        else "Spread footing or shallow foundation system likely unless weak strata or water-table issues govern"
    )
    facade_stressors = (
        "Facade anchorage, thermal movement joints, waterproofing continuity, and roof drainage resilience"
    )
    slenderness_class = "slender / high-rise" if is_highrise else "mid-rise" if is_midrise else "low-rise"
    feature_fingerprint = {
        "address": address,
        "area_name": area_name,
        "coordinates": {"lat": lat, "lng": lng},
        "estimated_height_m": round(height, 2),
        "estimated_floors": estimated_floors,
        "asset_type": asset_type,
        "slenderness_class": slenderness_class,
        "likely_structural_system": likely_structural_system,
        "likely_foundation_system": likely_foundation,
        "occupancy_profile": occupancy_profile,
        "map_properties": properties,
    }

    return {
        "asset_type": asset_type,
        "estimated_floors": estimated_floors,
        "is_highrise": is_highrise,
        "slenderness_class": slenderness_class,
        "occupancy_profile": occupancy_profile,
        "likely_structural_system": likely_structural_system,
        "likely_foundation": likely_foundation,
        "facade_stressors": facade_stressors,
        "feature_fingerprint": feature_fingerprint,
    }


def _get_fallback_analysis(lat: float, lng: float, height: float, address: str, area_name: str, properties: Dict) -> Dict[str, Any]:
    """Fallback structural analysis when Gemini is unavailable."""
    context = _derive_building_context(lat, lng, height, address, area_name, properties)
    risk_score = 35.0 + (15.0 if context["is_highrise"] else 0.0)
    inspection_priority = (
        "Priority structural review advised within the next engineering cycle"
        if context["is_highrise"]
        else "Routine structural review advised with focused checks on envelope and drainage paths"
    )

    return {
        "summary": (
            f"Deep scan fallback for {address}. This {context['asset_type']} is estimated at "
            f"{height:.1f} meters and {context['estimated_floors']} floors, with an indicative risk profile of "
            f"{risk_score:.1f}/100 based on mapped geometry, inferred structural form, and regional exposure."
        ),
        "asset_specific_findings": (
            f"The selected building only was assessed using its mapped footprint, height, coordinates, and localized urban context in {area_name}. "
            f"Primary review attention is on {context['slenderness_class']} behavior, load path continuity, and water ingress / facade durability risk."
        ),
        "structural_integrity": (
            f"Likely structural system: {context['likely_structural_system']}. "
            f"Critical stress concentrations would be expected at transfer zones, irregular floor plates, podium transitions, and roof-level service zones."
        ),
        "load_path_and_lateral_system": (
            "Lateral demand is expected to transfer through frames, cores, and diaphragm action. "
            "Any discontinuity between vertical elements, soft-story behavior, or stiffness irregularity should be treated as a high-value inspection target."
        ),
        "seismic_vulnerability": (
            f"Regional seismic demand around {area_name} suggests the building should be checked for torsional irregularity, drift compatibility, "
            "non-structural anchorage, and post-cracking serviceability, especially if constructed prior to the latest code cycle."
        ),
        "soil_foundation": (
            f"Likely foundation profile: {context['likely_foundation']}. "
            "Settlement, seasonal moisture variation, and buried utility influence remain the main geotechnical uncertainties without survey-grade data."
        ),
        "climate_impact": (
            f"Climate exposure should be reviewed for thermal cycling, moisture intrusion, roof drainage overload, and envelope aging. "
            f"The most likely degradation pathways are waterproofing fatigue, sealant failure, and corrosion initiation in exposed reinforcement or connections."
        ),
        "environmental_hazards": (
            "Localized hazards to review include pluvial flooding, drainage congestion, adjacent excavation effects, heat retention, and long-term atmospheric corrosion exposure."
        ),
        "serviceability_outlook": (
            "Expected serviceability issues include crack propagation at infill interfaces, water ingress around facade penetrations, floor vibration / deflection sensitivity, "
            "and differential movement between primary frame and non-structural elements."
        ),
        "maintenance_hotspots": (
            f"Highest-maintenance hotspots are likely to include roof waterproofing, parapet edges, podium transitions, movement joints, basement moisture protection, "
            f"and facade anchorage / glazing support details."
        ),
        "lifecycle_factors": (
            "The asset should be treated as operating in a normal urban lifecycle regime where inspection quality, moisture control, and deferred maintenance strongly influence long-term resilience."
        ),
        "construction_profile": (
            f"{context['likely_structural_system']}. In the absence of drawings, the building should be assumed to follow common regional urban construction practice with "
            "possible variation in infill quality, reinforcement detailing, and waterproofing execution."
        ),
        "operational_exposure": context["occupancy_profile"],
        "inspection_priority": inspection_priority,
        "confidence_notes": (
            "This deep scan is building-specific but inference-led. It relies on map geometry, coordinates, regional engineering assumptions, and asset heuristics rather than drawings, material tests, or an on-site survey."
        ),
        "data_gaps": (
            "Highest-value missing inputs are structural drawings, construction year, retrofit history, material strengths, foundation details, occupancy load regime, "
            "crack / corrosion observations, and any measured tilt, vibration, or settlement data."
        ),
        "estimated_floors": context["estimated_floors"],
        "recommendations": [
            "Perform a building-specific visual condition survey focused on cracks, water ingress, and facade distress.",
            "Verify the vertical and lateral load path at podium, transfer, and rooftop service zones.",
            "Prioritize waterproofing, drainage, and envelope maintenance before deeper material deterioration develops.",
            "Collect drawings, construction age, and retrofit history to upgrade this inference-led scan into a survey-grade structural review."
        ],
        "risk_score": risk_score,
    }


def _normalize_analysis_response(raw: Dict[str, Any], fallback: Dict[str, Any]) -> Dict[str, Any]:
    merged = dict(fallback)
    for key, value in (raw or {}).items():
        if value in (None, "", []):
            continue
        merged[key] = value

    recommendations: List[str] = []
    for item in merged.get("recommendations", []):
        text = str(item).strip()
        if text:
            recommendations.append(text)
    if not recommendations:
        recommendations = fallback["recommendations"]
    merged["recommendations"] = recommendations[:6]

    try:
        merged["estimated_floors"] = max(1, int(round(float(merged.get("estimated_floors", fallback["estimated_floors"])))))
    except (TypeError, ValueError):
        merged["estimated_floors"] = fallback["estimated_floors"]

    try:
        merged["risk_score"] = max(0.0, min(100.0, float(merged.get("risk_score", fallback["risk_score"]))))
    except (TypeError, ValueError):
        merged["risk_score"] = fallback["risk_score"]

    return merged

async def analyze_building_ai(lat: float, lng: float, height: float, address: str, area_name: str, properties: Dict) -> Dict[str, Any]:
    """
    Analyzes building structural risk using Google Gemini.
    """
    fallback = _get_fallback_analysis(lat, lng, height, address, area_name, properties)
    if not GEMINI_API_KEY:
        print("[AI Analysis] No GEMINI_API_KEY found, using fallback engine.")
        return fallback

    try:
        genai.configure(api_key=GEMINI_API_KEY)
        model = genai.GenerativeModel(GEMINI_MODEL)
        context = _derive_building_context(lat, lng, height, address, area_name, properties)

        prompt = f"""
        You are performing a deep structural scan for ONE specific selected building or monument.
        You are an expert structural engineer, building pathologist, historical architect, and conservation specialist.

        Non-negotiable rules:
        1. Analyze only the single selected asset (building or monument).
        2. Keep all findings asset-specific.
        3. If the asset is a historical monument (e.g., Eiffel Tower, Taj Mahal, Colosseum), acknowledge its unique construction family (e.g., wrought iron, load-bearing marble, unreinforced masonry).
        4. Be technically precise, professional, and decision-ready.
        5. If a fact is inferred (e.g., foundation type for a 500-year-old tower), state it as an engineering inference.

        Selected Asset Context:
        {json.dumps(context["feature_fingerprint"], ensure_ascii=True)}

        Produce a deep-scan engineering dossier that focuses on:
        - the selected asset's likely structural system, material fatigue, and historical durability
        - site-specific seismic / soil / climate implications for this exact geographic coordinate
        - serviceability, maintenance hotspots, and deterioration pathways (e.g., carbonation, oxidation, rising damp)
        - inspection priorities, missing data, and targeted conservation/maintenance actions

        Your response must be a valid JSON object with EXACTLY these keys:
        {{
            "summary": "2-4 sentence executive summary for this exact asset only.",
            "asset_specific_findings": "Short asset-specific deep-scan findings paragraph tied to height, footprint, and historical/architectural context.",
            "structural_integrity": "Assessment of primary structural stresses, vulnerable historical/modern interfaces, and expected integrity concerns.",
            "load_path_and_lateral_system": "Likely vertical and lateral load path behavior (e.g., buttressing, frame action, or mass-stability).",
            "seismic_vulnerability": "Earthquake risk assessment for this exact asset at these coordinates.",
            "soil_foundation": "Geotechnical / foundation concerns affecting this asset, especially considering settlement or historical pile decay.",
            "climate_impact": "How local weather and long-term climate trends degrade this specific material palette.",
            "environmental_hazards": "Localized hazards (e.g., pollution-driven stone decay, urban vibration) that matter directly to this asset.",
            "serviceability_outlook": "Expected serviceability issues such as tilt, stone spalling, metal fatigue, moisture ingress, or settlement symptoms.",
            "maintenance_hotspots": "Most likely asset-specific maintenance hotspots (e.g., high-stress connections, waterproofing joints).",
            "lifecycle_factors": "Lifecycle, durability, and preservation considerations for this selected asset.",
            "construction_profile": "Likely structural system, material family (e.g., Victorian ironwork, Mughal masonry, modern steel), and build-quality assumptions.",
            "operational_exposure": "Occupancy / cultural significance / mission / consequence profile for this asset.",
            "inspection_priority": "A concise, asset-specific inspection priority statement.",
            "confidence_notes": "What is inferred versus confirmed based on known architectural metadata.",
            "data_gaps": "What missing asset-specific data would most improve confidence.",
            "estimated_floors": <Integer estimate or 'N/A' for monuments>,
            "recommendations": ["Asset-specific action 1", "Asset-specific action 2", "Asset-specific action 3", "Optional action 4"],
            "risk_score": <Float between 0 and 100 representing the overall structural risk factor. Take into account age and material condition.>
        }}

        Ensure the output is strictly valid JSON without markdown fences.
        """

        response = model.generate_content(
            prompt,
            generation_config=genai.GenerationConfig(
                temperature=0.2,
                response_mime_type="application/json"
            )
        )

        try:
            return _normalize_analysis_response(json.loads(response.text), fallback)
        except json.JSONDecodeError:
            print("[AI Analysis] JSON parse error from Gemini. Raw text:", response.text)
            text = response.text.replace("```json", "").replace("```", "").strip()
            return _normalize_analysis_response(json.loads(text), fallback)

    except Exception as e:
        print(f"[AI Analysis] Gemini API error: {e}")
        traceback.print_exc()
        return fallback
