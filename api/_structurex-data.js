const SATELLITES = [
  {
    id: "SAT-B3",
    name: "GeoShield B3",
    mission: "Interferometric ground deformation",
    orbitClass: "LEO repeat-pass radar",
    beamTarget: "South India deformation net",
    altitudeKm: 688,
    velocityKps: 7.49,
    inclinationDeg: 98.2,
    latencyMs: 142,
    downlinkMbps: 498,
    packetLossPct: 0.24,
    healthPct: 95.8,
    thermalC: 21.3,
    powerPct: 79.8,
    signalDbm: -63.8,
    coveragePct: 88.6,
    anomalyRisk: 0.11,
    orbitalSlot: { x: 68, y: 26 },
    advisory:
      "Primary synthetic-aperture radar relay for micro-settlement, uplift, and subsidence watch.",
  },
  {
    id: "SAT-C7",
    name: "CivicScan C7",
    mission: "High-resolution structural imaging",
    orbitClass: "LEO agile imaging",
    beamTarget: "Targeted building scan queue",
    altitudeKm: 531,
    velocityKps: 7.74,
    inclinationDeg: 96.9,
    latencyMs: 118,
    downlinkMbps: 612,
    packetLossPct: 0.12,
    healthPct: 97.1,
    thermalC: 16.9,
    powerPct: 85.7,
    signalDbm: -59.4,
    coveragePct: 93.1,
    anomalyRisk: 0.05,
    orbitalSlot: { x: 74, y: 72 },
    advisory:
      "Most responsive asset for tasking building-specific scan passes and facade condition imagery.",
  },
  {
    id: "SAT-D9",
    name: "StormWatch D9",
    mission: "Weather and flood exposure monitoring",
    orbitClass: "MEO environmental relay",
    beamTarget: "Hydromet watch grid",
    altitudeKm: 8420,
    velocityKps: 3.88,
    inclinationDeg: 56.4,
    latencyMs: 186,
    downlinkMbps: 402,
    packetLossPct: 0.34,
    healthPct: 92.6,
    thermalC: 24.6,
    powerPct: 74.5,
    signalDbm: -68.1,
    coveragePct: 96.2,
    anomalyRisk: 0.18,
    orbitalSlot: { x: 31, y: 76 },
    advisory:
      "Best source for rainfall fronts, drainage overload exposure, and flood precursor telemetry.",
  },
];

function clamp(value, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return min;
  }
  return Math.max(min, Math.min(max, number));
}

function round(value, digits = 3) {
  const scale = 10 ** digits;
  return Math.round(Number(value) * scale) / scale;
}

function riskCategory(score) {
  if (score >= 75) {
    return "CRITICAL";
  }
  if (score >= 55) {
    return "HIGH RISK";
  }
  if (score >= 30) {
    return "MODERATE RISK";
  }
  if (score >= 10) {
    return "LOW RISK";
  }
  return "VERY LOW";
}

function statusForScore(score) {
  if (score >= 55) {
    return "critical";
  }
  if (score >= 20) {
    return "watch";
  }
  return "stable";
}

function timeToFailure(failureProbability) {
  if (failureProbability >= 0.7) {
    return "0-6 months";
  }
  if (failureProbability >= 0.45) {
    return "6-18 months";
  }
  if (failureProbability >= 0.25) {
    return "18-36 months";
  }
  return "36+ months";
}

function waveSeries(length, base, amplitude, step = 0.35, phase = 0) {
  return Array.from({ length }, (_, index) =>
    round(base + Math.sin(index * step + phase) * amplitude + Math.cos(index * step * 0.43 + phase) * amplitude * 0.35)
  );
}

function predictionFromScenario(body = {}) {
  const magnitude = clamp(body.earthquake_magnitude ?? 3, 0, 9);
  const temperature = clamp(body.temperature ?? 25, -20, 55);
  const soilMoisture = clamp(body.soil_moisture ?? 0.3, 0, 1);

  const seismic = magnitude / 9;
  const thermal = Math.abs(temperature - 24) / 45;
  const moisture = soilMoisture;
  const riskScore = clamp(16 + seismic * 44 + thermal * 13 + moisture * 25, 4, 96);
  const anomalyScore = clamp(0.1 + seismic * 0.42 + thermal * 0.17 + moisture * 0.22, 0.02, 0.96);
  const failureProbability = clamp(0.05 + riskScore / 135 + moisture * 0.08, 0.02, 0.92);
  const environmentalRisk = clamp(0.08 + thermal * 0.32 + moisture * 0.45 + seismic * 0.16, 0.03, 0.95);
  const predictedDegradation = clamp(0.08 + riskScore / 165 + thermal * 0.12 + moisture * 0.09, 0.02, 0.9);

  return {
    anomaly_score: round(anomalyScore),
    failure_probability: round(failureProbability),
    environmental_risk: round(environmentalRisk),
    predicted_degradation: round(predictedDegradation),
    risk_score: round(riskScore, 1),
    risk_category: riskCategory(riskScore),
  };
}

function scenarioResponse(body = {}) {
  const prediction = predictionFromScenario(body);
  const magnitude = clamp(body.earthquake_magnitude ?? 3, 0, 9);
  const temperature = clamp(body.temperature ?? 25, -20, 55);
  const soilMoisture = clamp(body.soil_moisture ?? 0.3, 0, 1);
  const riskFactor = prediction.risk_score / 100;

  return {
    prediction,
    explanation: {
      explanations: [
        { feature_name: "earthquake_magnitude", contribution_value: round(magnitude / 9) },
        { feature_name: "soil_moisture", contribution_value: round(soilMoisture) },
        { feature_name: "temperature_c", contribution_value: round(Math.abs(temperature - 24) / 45) },
        { feature_name: "fatigue_index", contribution_value: round(riskFactor * 0.72) },
        { feature_name: "load_ratio", contribution_value: round(0.34 + riskFactor * 0.26) },
      ],
      top_features: [
        { feature_name: "earthquake_magnitude", contribution_value: round(magnitude / 9) },
        { feature_name: "soil_moisture", contribution_value: round(soilMoisture) },
        { feature_name: "fatigue_index", contribution_value: round(riskFactor * 0.72) },
      ],
    },
    time_series: {
      vibration: waveSeries(36, 0.18 + riskFactor * 0.9, 0.05 + riskFactor * 0.1, 0.42),
      strain: waveSeries(36, 0.0012 + riskFactor * 0.006, 0.0007 + riskFactor * 0.001, 0.38, 1.2),
      temperature: waveSeries(36, temperature, 1.8 + riskFactor * 1.2, 0.24, 0.5),
      load: waveSeries(36, 58 + riskFactor * 28, 5 + riskFactor * 6, 0.31, 0.9),
      fatigue: waveSeries(36, 0.2 + riskFactor * 0.58, 0.03 + riskFactor * 0.04, 0.34, 1.7),
    },
  };
}

function analysisResponse() {
  const scenario = scenarioResponse({
    earthquake_magnitude: 4.2,
    temperature: 31,
    soil_moisture: 0.46,
  });
  const { prediction, explanation, time_series: timeSeries } = scenario;

  return {
    risk_score: prediction.risk_score,
    risk_category: prediction.risk_category,
    anomaly_score: prediction.anomaly_score,
    failure_probability: prediction.failure_probability,
    environmental_risk: prediction.environmental_risk,
    predicted_degradation: prediction.predicted_degradation,
    time_to_failure: timeToFailure(prediction.failure_probability),
    time_series: timeSeries,
    shap_features: explanation,
    validation: {
      status: "valid",
      rows_processed: 200,
      columns_detected: 9,
      imputed_columns: [],
      warnings: [],
      summary: "CSV accepted and normalized for StructureX risk inference.",
    },
    llm_explanation: {
      summary:
        "Dataset analysis indicates a controlled but watch-worthy infrastructure risk profile. The dominant contributors are seismic input, soil moisture, fatigue accumulation, and environmental stress.",
      drivers:
        "Risk is driven by moderate vibration demand, moisture-sensitive foundation exposure, and load-cycle fatigue in the latest telemetry window.",
      recommendations:
        "1. Prioritize field checks for water ingress, settlement, and crack propagation.\n2. Compare uploaded telemetry against recent scenario runs.\n3. Increase inspection frequency if moisture or vibration readings climb together.",
    },
  };
}

function deriveBuildingContext(payload = {}) {
  const lat = clamp(payload.lat ?? 0, -90, 90);
  const lng = clamp(payload.lng ?? 0, -180, 180);
  const height = clamp(payload.height ?? 12, 1, 900);
  const address = String(payload.address || "selected structure");
  const areaName = String(payload.area_name || "mapped zone");
  const properties = payload.properties || {};
  const assetType = String(properties.type || "building").toLowerCase();
  const estimatedFloors = Math.max(1, Math.round(height / 3.5));
  const isHighrise = height >= 60 || estimatedFloors >= 18;
  const isMidrise = (height >= 25 && height < 60) || (estimatedFloors >= 8 && estimatedFloors < 18);

  return {
    lat,
    lng,
    height,
    address,
    areaName,
    assetType,
    estimatedFloors,
    isHighrise,
    slendernessClass: isHighrise ? "slender / high-rise" : isMidrise ? "mid-rise" : "low-rise",
    occupancyProfile: isHighrise
      ? "High-density occupancy or commercially intense usage likely"
      : "Moderate occupancy / standard urban usage likely",
    likelyStructuralSystem: isHighrise
      ? "Reinforced-concrete or composite moment-resisting frame with a lateral system sized for mid- to high-rise demands"
      : "Reinforced-concrete frame, masonry infill, or low-rise urban frame system",
    likelyFoundation: isHighrise
      ? "Deep foundation or raft/slab solution likely if local soil variability or settlement risk is significant"
      : "Spread footing or shallow foundation system likely unless weak strata or water-table issues govern",
  };
}

function stableUnitInterval(value) {
  const text = String(value || "structurex");
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return ((hash >>> 0) % 1000) / 1000;
}

function regionalHazardScore(context) {
  const area = `${context.areaName} ${context.address}`.toLowerCase();
  if (area.includes("guwahati") || area.includes("assam") || area.includes("sikkim") || area.includes("himalaya")) {
    return 18;
  }
  if (area.includes("delhi") || area.includes("gurugram") || area.includes("noida") || area.includes("dehradun")) {
    return 11;
  }
  if (area.includes("gujarat") || area.includes("kutch") || area.includes("ahmedabad")) {
    return 13;
  }
  if (area.includes("mumbai") || area.includes("kolkata") || area.includes("chennai") || area.includes("kochi")) {
    return 6;
  }
  if (area.includes("bengaluru") || area.includes("bangalore") || area.includes("karnataka")) {
    return 2.2;
  }

  const latitudeBand = Math.abs(context.lat);
  const longitudeBand = Math.abs(context.lng);
  return clamp(latitudeBand * 0.055 + longitudeBand * 0.018, 1.2, 9);
}

function assetExposureScore(context) {
  const type = context.assetType;
  if (type.includes("bridge")) return 16;
  if (type.includes("industrial") || type.includes("plant") || type.includes("warehouse")) return 11;
  if (type.includes("hospital") || type.includes("school") || type.includes("public")) return 8;
  if (type.includes("commercial") || type.includes("retail") || type.includes("office")) return 5;
  return 1.5;
}

function heightExposureScore(context) {
  if (context.estimatedFloors <= 1 && context.height <= 6) return 0.4;
  if (context.estimatedFloors <= 3 && context.height <= 12) return 1.4;
  if (context.isHighrise) return 20 + Math.min(10, (context.estimatedFloors - 18) * 0.9);
  if (context.isMidrise) return 7 + Math.min(8, (context.estimatedFloors - 8) * 0.8);
  return Math.min(6, context.estimatedFloors * 0.9);
}

function climateExposureScore(context) {
  const area = `${context.areaName} ${context.address}`.toLowerCase();
  let score = 1.2;
  if (area.includes("mumbai") || area.includes("chennai") || area.includes("kolkata") || area.includes("kochi")) {
    score += 5;
  }
  if (area.includes("basement") || area.includes("lake") || area.includes("drain") || area.includes("river")) {
    score += 3;
  }
  if (context.height > 45) {
    score += 2;
  }
  return score;
}

function buildingAnalysis(payload = {}) {
  const context = deriveBuildingContext(payload);
  const regional = regionalHazardScore(context);
  const asset = assetExposureScore(context);
  const heightExposure = heightExposureScore(context);
  const climate = climateExposureScore(context);
  const uncertainty = stableUnitInterval(`${context.address}|${context.lat.toFixed(5)}|${context.lng.toFixed(5)}|${context.height}`) * 2.2;
  const riskScore = clamp(0.5 + regional + asset + heightExposure + climate + uncertainty, 0.5, 96);
  const category = riskCategory(riskScore);
  const inspectionPriority = riskScore >= 55
    ? "High-priority engineering review recommended before relying on this asset for critical occupancy or operations"
    : riskScore >= 30
      ? "Targeted structural review advised with checks for visible distress, load path irregularity, and water ingress"
      : riskScore >= 10
        ? "Low-risk asset posture; keep routine inspection active and verify basic drainage, facade, and crack observations"
        : "Very low indicative risk; routine observation is sufficient unless field distress is visible";
  const smartReason = `score drivers: regional ${regional.toFixed(1)}, height ${heightExposure.toFixed(1)}, asset ${asset.toFixed(1)}, climate ${climate.toFixed(1)}, uncertainty ${uncertainty.toFixed(1)}`;
  const shortLabel = category.toLowerCase();

  const occupancyProfile = riskScore >= 55
    ? "High consequence occupancy / operations should be verified"
    : context.occupancyProfile;
  const maintenanceFocus = riskScore >= 30
    ? "Highest-maintenance hotspots include lateral load path discontinuities, facade anchorage, water ingress paths, roof drainage, corrosion exposure, and foundation settlement indicators."
    : "Primary maintenance focus should remain on normal envelope care, drainage checks, minor crack logging, waterproofing, and routine serviceability observations.";

  return {
    summary: `Deep structural scan for ${context.address}. This ${context.assetType} is estimated at ${context.height.toFixed(1)} meters and ${context.estimatedFloors} floors. The calibrated indicative risk is ${riskScore.toFixed(1)}/100 (${shortLabel}) using mapped height, inferred asset type, regional hazard, climate exposure, and location-specific uncertainty.`,
    asset_specific_findings: `The selected building only was assessed using its mapped footprint, height, coordinates, and localized urban context in ${context.areaName}. The current posture is ${shortLabel}; ${smartReason}. Primary review attention is on ${context.slendernessClass} behavior, load path continuity, and water ingress / facade durability risk.`,
    structural_integrity: `Likely structural system: ${context.likelyStructuralSystem}. Critical stress concentrations would be expected at transfer zones, irregular floor plates, podium transitions, and roof-level service zones. For low scores, this remains a routine verification item rather than an immediate hazard signal.`,
    load_path_and_lateral_system:
      riskScore >= 30
        ? "Lateral demand should be traced through frames, cores, and diaphragm action. Any discontinuity between vertical elements, soft-story behavior, or stiffness irregularity should be treated as a priority inspection target."
        : "No high-risk lateral-system trigger is inferred from the available map data. Keep routine checks focused on visible cracking, additions, soft-story openings, and undocumented alterations.",
    seismic_vulnerability: `Regional seismic demand around ${context.areaName} contributes ${regional.toFixed(1)} points to the score. The building should be checked for torsional irregularity, drift compatibility, non-structural anchorage, and post-cracking serviceability if field conditions suggest distress or if the building predates current code practice.`,
    soil_foundation: `Likely foundation profile: ${context.likelyFoundation}. Settlement, seasonal moisture variation, and buried utility influence remain the main geotechnical uncertainties without survey-grade data.`,
    climate_impact:
      riskScore >= 30
        ? "Climate exposure should be reviewed for thermal cycling, moisture intrusion, roof drainage overload, and envelope aging. Waterproofing fatigue, sealant failure, and corrosion initiation can materially raise risk if field evidence is present."
        : "Climate exposure is currently treated as a low-to-routine contributor. Continue drainage, roof, and envelope maintenance so moisture does not become the main degradation path.",
    environmental_hazards:
      "Localized hazards to review include pluvial flooding, drainage congestion, adjacent excavation effects, heat retention, and long-term atmospheric corrosion exposure.",
    serviceability_outlook:
      riskScore >= 30
        ? "Expected serviceability issues may include crack propagation at infill interfaces, water ingress around facade penetrations, floor vibration / deflection sensitivity, and differential movement between primary frame and non-structural elements."
        : "Expected serviceability issues are low-order unless visible distress is present. Routine crack logs, waterproofing checks, and minor vibration observations should be sufficient for this indicative posture.",
    maintenance_hotspots: maintenanceFocus,
    lifecycle_factors:
      "The asset should be treated as operating in a normal urban lifecycle regime where inspection quality, moisture control, and deferred maintenance strongly influence long-term resilience.",
    construction_profile: `${context.likelyStructuralSystem}. In the absence of drawings, the building should be assumed to follow common regional urban construction practice with possible variation in infill quality, reinforcement detailing, and waterproofing execution.`,
    operational_exposure: occupancyProfile,
    inspection_priority: inspectionPriority,
    confidence_notes:
      "This calibrated scan is building-specific but inference-led. It uses map height, asset heuristics, regional hazard, climate exposure, and deterministic location variation; it is not a substitute for drawings, material tests, or on-site structural inspection.",
    data_gaps:
      "Highest-value missing inputs are structural drawings, construction year, retrofit history, material strengths, foundation details, occupancy load regime, crack / corrosion observations, and measured tilt, vibration, or settlement data.",
    estimated_floors: context.estimatedFloors,
    risk_category: category,
    score_drivers: {
      regional_hazard: round(regional, 1),
      height_exposure: round(heightExposure, 1),
      asset_exposure: round(asset, 1),
      climate_exposure: round(climate, 1),
      uncertainty: round(uncertainty, 1),
    },
    recommendations: [
      riskScore >= 30
        ? "Perform a targeted visual condition survey focused on cracks, water ingress, facade distress, and irregular load paths."
        : "Keep a routine visual condition survey focused on cracks, water ingress, and facade distress.",
      "Verify the vertical and lateral load path at podium, transfer, and rooftop service zones when drawings or site access are available.",
      riskScore >= 30
        ? "Prioritize waterproofing, drainage, envelope maintenance, and any visible corrosion before deeper material deterioration develops."
        : "Maintain basic waterproofing, drainage, and envelope care as preventive controls.",
      "Collect drawings, construction age, and retrofit history to upgrade this inference-led scan into a survey-grade structural review.",
    ],
    risk_score: round(riskScore, 1),
  };
}

function resilienceResponse(body = {}) {
  const scenario = scenarioResponse(body);
  const score = scenario.prediction.risk_score;
  const category = scenario.prediction.risk_category;
  const locationId = String(body.location_id || "LOC_001");
  const locationName = locationId.replaceAll("_", " ");
  const topHazard = score >= 70 ? "seismic cascade" : score >= 40 ? "hydromet and fatigue" : "routine monitoring";
  const cascadeStatus = score >= 70 ? "elevated" : score >= 40 ? "watch" : "stable";
  const seismicScore = clamp(score + clamp(body.earthquake_magnitude ?? 3, 0, 9) * 2.5, 0, 100);
  const floodScore = clamp(22 + clamp(body.soil_moisture ?? 0.3, 0, 1) * 58, 0, 100);
  const heatScore = clamp(18 + Math.abs(clamp(body.temperature ?? 25, -20, 55) - 24) * 1.8, 0, 100);
  const routeIntegrity = clamp(100 - score * 0.58, 32, 96);

  return {
    overview: {
      location_id: locationId,
      location_name: locationName,
      asset_type: "Urban infrastructure cluster",
      risk_score: score,
      risk_category: category,
      top_hazard: topHazard,
      cascade_status: cascadeStatus,
    },
    hazard_layers: [
      {
        id: "HZ-SEIS",
        title: "Seismic demand",
        score: round(seismicScore, 1),
        status: statusForScore(seismicScore),
        signal: "Earthquake magnitude and mapped structural response",
        detail: "Lateral drift, torsional response, and non-structural anchorage are the primary inspection concerns.",
        action: "Check frame continuity, soft-story indicators, and emergency access routes.",
      },
      {
        id: "HZ-FLD",
        title: "Drainage and soil moisture",
        score: round(floodScore, 1),
        status: statusForScore(floodScore),
        signal: "Soil moisture, drainage exposure, and pluvial flooding sensitivity",
        detail: "Water ingress and settlement risk rise when moisture and envelope deterioration combine.",
        action: "Inspect basement protection, roof drainage, podium joints, and runoff paths.",
      },
      {
        id: "HZ-HT",
        title: "Thermal stress",
        score: round(heatScore, 1),
        status: statusForScore(heatScore),
        signal: "Temperature deviation and envelope fatigue",
        detail: "Thermal cycling can accelerate sealant fatigue, movement joint distress, and facade leakage.",
        action: "Review expansion joints, facade anchorage, waterproofing continuity, and roof membranes.",
      },
    ],
    cascade: {
      primary_trigger: topHazard,
      route_integrity_score: round(routeIntegrity, 1),
      status: cascadeStatus === "stable" ? "Dependency chain remains serviceable" : "Dependency chain requires watch",
      estimated_outage_hours: Math.round(4 + score * 0.38),
      nodes: [
        { name: "Road access", status: routeIntegrity > 70 ? "stable" : "constrained", score: round(routeIntegrity, 1) },
        { name: "Power continuity", status: score > 60 ? "watch" : "stable", score: round(100 - score * 0.45, 1) },
        { name: "Drainage network", status: floodScore > 55 ? "watch" : "stable", score: round(100 - floodScore * 0.42, 1) },
      ],
      chain: [
        { stage: "1", title: "Hazard trigger", impact: `${topHazard} raises demand on structural and service systems.` },
        { stage: "2", title: "Service dependency", impact: "Road, drainage, and power nodes are checked for coupled disruption risk." },
        { stage: "3", title: "Response posture", impact: "Inspection and response actions are prioritized by consequence and access integrity." },
      ],
    },
    role_dashboards: {
      executive: {
        headline: "Executive view of continuity, consequence, and inspection priority.",
        kpis: [
          { label: "Risk", value: `${score.toFixed(1)}/100` },
          { label: "Cascade", value: cascadeStatus },
          { label: "Outage", value: `${Math.round(4 + score * 0.38)} h` },
        ],
        actions: [
          "Approve targeted engineering inspection for high-consequence assets.",
          "Keep public messaging tied to verified field observations.",
          "Prioritize quick-return drainage and envelope controls.",
        ],
      },
      emergency_manager: {
        headline: "Emergency view focused on response readiness and route continuity.",
        kpis: [
          { label: "Routes", value: `${routeIntegrity.toFixed(1)}%` },
          { label: "Shelter", value: score > 65 ? "prepare" : "standby" },
          { label: "Ops", value: cascadeStatus },
        ],
        actions: [
          "Pre-check access routes and emergency staging points.",
          "Prepare escalation triggers for weather, vibration, or public safety alerts.",
          "Coordinate with utilities if route integrity falls below watch threshold.",
        ],
      },
      engineer: {
        headline: "Engineering view of load path, serviceability, and retrofit priorities.",
        kpis: [
          { label: "Seismic", value: `${seismicScore.toFixed(1)}` },
          { label: "Moisture", value: `${floodScore.toFixed(1)}` },
          { label: "Inspection", value: score > 55 ? "priority" : "routine" },
        ],
        actions: [
          "Inspect load path discontinuities, transfer zones, and lateral-force elements.",
          "Check crack, settlement, moisture, and corrosion indicators.",
          "Use measured drawings and telemetry to upgrade inferred assumptions.",
        ],
      },
      public: {
        headline: "Public-facing summary of safety posture and service continuity.",
        kpis: [
          { label: "Status", value: category },
          { label: "Access", value: routeIntegrity > 65 ? "open" : "watch" },
          { label: "Updates", value: "live" },
        ],
        actions: [
          "Follow official route and safety guidance.",
          "Report visible distress, flooding, or blocked drainage.",
          "Avoid restricted inspection areas until cleared.",
        ],
      },
    },
    stress_tests: [
      {
        name: "Night rainfall plus drainage congestion",
        trigger: "Moisture spike and local runoff delay",
        risk_score: round(clamp(score + 9, 0, 100), 1),
        summary: "Tests basement, podium, and access-route sensitivity to short-duration water loading.",
        loss_estimate_musd: round(0.7 + score * 0.045, 1),
        outage_hours: Math.round(6 + score * 0.32),
      },
      {
        name: "Moderate seismic pulse during peak occupancy",
        trigger: "Elevated vibration and lateral demand",
        risk_score: round(clamp(score + 14, 0, 100), 1),
        summary: "Checks serviceability and evacuation consequences under simultaneous structural and operational demand.",
        loss_estimate_musd: round(1.2 + score * 0.062, 1),
        outage_hours: Math.round(8 + score * 0.45),
      },
      {
        name: "Heat cycle with deferred envelope maintenance",
        trigger: "Thermal movement and waterproofing fatigue",
        risk_score: round(clamp(score + 6, 0, 100), 1),
        summary: "Evaluates facade, roof, and joint aging where thermal cycling compounds moisture ingress.",
        loss_estimate_musd: round(0.4 + score * 0.028, 1),
        outage_hours: Math.round(2 + score * 0.22),
      },
    ],
    retrofit_priorities: [
      {
        priority: "P1",
        asset: "Drainage and waterproofing controls",
        return_on_resilience: round(1.85 + floodScore / 100, 2),
        retrofit_cost_musd: 0.8,
        replacement_cost_musd: 4.6,
        consequence_score: round(floodScore, 1),
        recommendation: "Clear drainage paths, renew waterproofing joints, and inspect basement moisture protection first.",
      },
      {
        priority: "P2",
        asset: "Lateral load path verification",
        return_on_resilience: round(1.45 + seismicScore / 120, 2),
        retrofit_cost_musd: 1.4,
        replacement_cost_musd: 8.2,
        consequence_score: round(seismicScore, 1),
        recommendation: "Verify frame continuity, diaphragm action, anchors, and transfer-zone detailing before costly strengthening.",
      },
      {
        priority: "P3",
        asset: "Facade and serviceability monitoring",
        return_on_resilience: round(1.2 + heatScore / 130, 2),
        retrofit_cost_musd: 0.5,
        replacement_cost_musd: 2.9,
        consequence_score: round(heatScore, 1),
        recommendation: "Track facade movement, sealant fatigue, corrosion, and vibration-sensitive serviceability indicators.",
      },
    ],
    code_gap: {
      compliance_score: round(clamp(92 - score * 0.36, 48, 96), 1),
      component_scores: {
        structural_drawings: round(clamp(82 - score * 0.25, 45, 92), 1),
        seismic_detailing: round(clamp(86 - seismicScore * 0.28, 42, 94), 1),
        drainage: round(clamp(88 - floodScore * 0.3, 40, 96), 1),
        emergency_access: round(routeIntegrity, 1),
      },
      gaps: [
        {
          component: "Structural drawings",
          status: "incomplete",
          finding: "Survey-grade drawings and retrofit history should be collected before final engineering decisions.",
        },
        {
          component: "Drainage",
          status: floodScore > 55 ? "watch" : "acceptable",
          finding: "Drainage and waterproofing records should be checked against current site observations.",
        },
        {
          component: "Emergency access",
          status: routeIntegrity < 65 ? "watch" : "acceptable",
          finding: "Access continuity should be verified for inspection and emergency response routes.",
        },
      ],
    },
    action_plan: {
      briefing: `Current ${locationName} posture is ${category} with ${cascadeStatus} cascade status. Use field inspection to confirm inferred signals.`,
      immediate_actions: [
        "Run a focused visual inspection for cracks, settlement, corrosion, and water ingress.",
        "Confirm access routes and drainage paths before severe weather or high-occupancy periods.",
        "Escalate to engineering review if vibration, moisture, or visible distress rises together.",
      ],
      operations: [
        "Maintain live scenario tracking from the left-panel sliders.",
        "Coordinate satellite telemetry with building-specific scan targets.",
        "Log inspection findings against the selected building history.",
      ],
      resources: [
        { resource: "Structural inspection crew", status: score > 55 ? "priority" : "standby", quantity: 1 },
        { resource: "Drainage response unit", status: floodScore > 55 ? "priority" : "standby", quantity: 1 },
        { resource: "Public information lead", status: score > 70 ? "activate" : "monitor", quantity: 1 },
      ],
      contacts: [
        { role: "Emergency operations", contact: "StructureX EOC" },
        { role: "Engineering lead", contact: "Structural review desk" },
        { role: "Utilities liaison", contact: "Service continuity desk" },
      ],
      critical_facilities: ["Primary access corridor", "Drainage outfall", "Power continuity node"],
    },
  };
}

function json(res, data, status = 200) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(data));
}

function readJson(req) {
  return new Promise((resolve) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        resolve({});
      }
    });
    req.on("error", () => resolve({}));
  });
}

module.exports = {
  SATELLITES,
  analysisResponse,
  buildingAnalysis,
  json,
  readJson,
  resilienceResponse,
  scenarioResponse,
};
