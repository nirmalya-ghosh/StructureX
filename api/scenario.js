const { json, readJson, scenarioResponse } = require("./_structurex-data");
const { generateRiskInsightsWithGemini } = require("./gemini");
const { rateLimit, requireTurnstile } = require("./security");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return json(res, { detail: "Method not allowed" }, 405);
  }
  if (!rateLimit(req, res, "api-scenario", { limit: 12 })) {
    return;
  }

  const body = await readJson(req);
  if (!(await requireTurnstile(req, res, body, "scenario-analysis"))) {
    return;
  }
  const fallback = scenarioResponse(body);
  const prediction = fallback.prediction || {};
  const fallbackInsights = {
    summary: `Scenario simulation produced a ${prediction.risk_category || "SAFE"} risk profile with a risk score of ${Number(prediction.risk_score || 0).toFixed(1)}.`,
    drivers: "Scenario mode focuses on earthquake magnitude, soil moisture, thermal stress, fatigue index, and load ratio.",
    environmental_analysis: "Environmental risk is estimated from the selected temperature and soil moisture inputs.",
    structural_analysis: "Structural response is inferred from the scenario's vibration, strain, load, and fatigue traces.",
    infrastructure_insights: "Use the selected map location or uploaded telemetry to make this scenario more asset-specific.",
    time_estimate: "Timeline is indicative and should be confirmed with field measurements.",
    recommendations: [
      "1. Compare the scenario output with recent inspection and telemetry data.",
      "2. Stress-test more severe earthquake, moisture, and temperature combinations.",
      "3. Escalate inspection priority if scenario risk remains high across multiple runs.",
    ].join("\n"),
  };
  const geminiInsights = await generateRiskInsightsWithGemini(
    { scenario_inputs: body, ...fallback },
    fallbackInsights
  );

  return json(res, {
    ...fallback,
    llm_explanation: geminiInsights || { ...fallbackInsights, ai_source: "fallback" },
  });
};
