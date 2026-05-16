const DEFAULT_MODEL = "gemini-2.5-flash";
const DEFAULT_TIMEOUT_MS = 18000;

function getGeminiConfig() {
  return {
    apiKey: (process.env.GEMINI_API_KEY || "").trim(),
    model: (process.env.GEMINI_MODEL || DEFAULT_MODEL).trim(),
  };
}

function stripJsonFence(text) {
  return String(text || "")
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
}

function parseGeminiJson(text) {
  const cleaned = stripJsonFence(text);
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1));
    }
    throw new Error("Gemini response did not contain valid JSON");
  }
}

async function generateGeminiJson(prompt, { label = "Gemini", temperature = 0.2, timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
  const { apiKey, model } = getGeminiConfig();
  if (!apiKey) {
    return null;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const response = await fetch(url, {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature,
          responseMimeType: "application/json",
        },
      }),
    });

    const payloadText = await response.text();
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${payloadText.slice(0, 500)}`);
    }

    const payload = JSON.parse(payloadText);
    const text = (payload.candidates?.[0]?.content?.parts || [])
      .map((part) => part.text || "")
      .join("")
      .trim();

    if (!text) {
      throw new Error("Gemini returned an empty response");
    }

    return parseGeminiJson(text);
  } catch (error) {
    console.error(`[${label}] Gemini call failed:`, error.message || error);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function normalizeString(value, fallback) {
  const text = String(value || "").trim();
  return text || fallback;
}

function normalizeRecommendations(value, fallback) {
  const source = Array.isArray(value)
    ? value
    : String(value || "")
        .split(/\n+/)
        .map((item) => item.replace(/^\s*\d+[\).:-]?\s*/, ""));

  const recommendations = source.map((item) => String(item || "").trim()).filter(Boolean);
  return recommendations.length ? recommendations.slice(0, 6) : fallback;
}

function normalizeBuildingGemini(raw, fallback) {
  if (!raw) {
    return null;
  }

  const merged = { ...fallback };
  const stringKeys = [
    "summary",
    "asset_specific_findings",
    "structural_integrity",
    "load_path_and_lateral_system",
    "seismic_vulnerability",
    "soil_foundation",
    "climate_impact",
    "environmental_hazards",
    "serviceability_outlook",
    "maintenance_hotspots",
    "lifecycle_factors",
    "construction_profile",
    "operational_exposure",
    "inspection_priority",
    "confidence_notes",
    "data_gaps",
  ];

  for (const key of stringKeys) {
    merged[key] = normalizeString(raw[key], fallback[key]);
  }

  const floors = Number(raw.estimated_floors);
  merged.estimated_floors = Number.isFinite(floors)
    ? Math.max(1, Math.round(floors))
    : fallback.estimated_floors;

  const riskScore = Number(raw.risk_score);
  merged.risk_score = Number.isFinite(riskScore)
    ? Math.max(0, Math.min(100, Math.round(riskScore * 10) / 10))
    : fallback.risk_score;

  merged.risk_category = raw.risk_category || fallback.risk_category;
  merged.recommendations = normalizeRecommendations(raw.recommendations, fallback.recommendations);
  merged.ai_source = "gemini";
  merged.ai_model = getGeminiConfig().model;

  return merged;
}

async function generateBuildingAnalysisWithGemini(input, fallback) {
  const prompt = `
You are StructureX's AI structural-review engine. Produce a professional, careful screening dossier for ONE selected mapped asset.

Rules:
- Analyze only this selected asset.
- Treat map height, footprint properties, weather, and seismic signals as inputs, not certified field measurements.
- Be specific to the address, area, coordinates, height, asset type, climate exposure, and live data provided.
- Do not give emergency instructions or claim engineering certification.
- Return strictly valid JSON with the requested keys and no markdown.

Selected asset input:
${JSON.stringify(input, null, 2)}

Baseline computed risk model output to refine, not blindly repeat:
${JSON.stringify(fallback, null, 2)}

Return exactly this JSON object shape:
{
  "summary": "2-4 sentence executive summary for this exact asset.",
  "asset_specific_findings": "Asset-specific findings tied to mapped height, location, and footprint context.",
  "structural_integrity": "Primary structural stresses and likely integrity concerns.",
  "load_path_and_lateral_system": "Likely vertical and lateral load-path behavior.",
  "seismic_vulnerability": "Seismic risk assessment for this coordinate and asset class.",
  "soil_foundation": "Geotechnical and foundation concerns.",
  "climate_impact": "Weather and climate deterioration pathways.",
  "environmental_hazards": "Localized hazards that matter to this asset.",
  "serviceability_outlook": "Expected serviceability issues and symptoms to monitor.",
  "maintenance_hotspots": "Most likely maintenance hotspots.",
  "lifecycle_factors": "Lifecycle, durability, and resilience considerations.",
  "construction_profile": "Likely structural system and material family.",
  "operational_exposure": "Occupancy, mission, cultural, or consequence profile.",
  "inspection_priority": "Concise inspection priority statement.",
  "confidence_notes": "What is inferred versus confirmed.",
  "data_gaps": "Missing inputs that would improve confidence.",
  "estimated_floors": 1,
  "risk_category": "VERY LOW | LOW RISK | MODERATE RISK | HIGH RISK | CRITICAL",
  "recommendations": ["Action 1", "Action 2", "Action 3"],
  "risk_score": 0
}`;

  return normalizeBuildingGemini(
    await generateGeminiJson(prompt, { label: "Building AI", temperature: 0.18 }),
    fallback
  );
}

function normalizeInsights(raw, fallback) {
  if (!raw) {
    return null;
  }

  return {
    summary: normalizeString(raw.summary, fallback.summary),
    drivers: normalizeString(raw.drivers, fallback.drivers),
    environmental_analysis: normalizeString(raw.environmental_analysis, fallback.environmental_analysis),
    structural_analysis: normalizeString(raw.structural_analysis, fallback.structural_analysis),
    infrastructure_insights: normalizeString(raw.infrastructure_insights, fallback.infrastructure_insights),
    time_estimate: normalizeString(raw.time_estimate, fallback.time_estimate),
    recommendations: Array.isArray(raw.recommendations)
      ? raw.recommendations.map((item, index) => `${index + 1}. ${String(item).trim()}`).join("\n")
      : normalizeString(raw.recommendations, fallback.recommendations),
    ai_source: "gemini",
    ai_model: getGeminiConfig().model,
  };
}

async function generateRiskInsightsWithGemini(input, fallback) {
  const prompt = `
You are StructureX's infrastructure risk analyst. Convert the computed model output into clear, technically grounded AI insight text.

Rules:
- Use the computed scores and SHAP-style drivers provided.
- Be decision-ready but do not claim a certified engineering conclusion.
- Return strictly valid JSON with no markdown fences.

Computed model output:
${JSON.stringify(input, null, 2)}

Return exactly this JSON object shape:
{
  "summary": "2-3 sentence executive risk summary.",
  "drivers": "Top technical drivers of the result.",
  "environmental_analysis": "Environmental and climate interpretation.",
  "structural_analysis": "Structural response and degradation interpretation.",
  "infrastructure_insights": "Asset or infrastructure-system specific implications.",
  "time_estimate": "Indicative timeline/risk horizon.",
  "recommendations": ["Action 1", "Action 2", "Action 3"]
}`;

  return normalizeInsights(
    await generateGeminiJson(prompt, { label: "Risk Insight AI", temperature: 0.22 }),
    fallback
  );
}

module.exports = {
  generateBuildingAnalysisWithGemini,
  generateRiskInsightsWithGemini,
  getGeminiConfig,
};
