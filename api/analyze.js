const { analysisResponse, json } = require("./_structurex-data");
const { generateRiskInsightsWithGemini } = require("./gemini");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return json(res, { detail: "Method not allowed" }, 405);
  }

  const fallback = analysisResponse();
  const geminiInsights = await generateRiskInsightsWithGemini(
    {
      risk_score: fallback.risk_score,
      risk_category: fallback.risk_category,
      anomaly_score: fallback.anomaly_score,
      failure_probability: fallback.failure_probability,
      environmental_risk: fallback.environmental_risk,
      predicted_degradation: fallback.predicted_degradation,
      time_to_failure: fallback.time_to_failure,
      shap_features: fallback.shap_features,
      validation: fallback.validation,
    },
    fallback.llm_explanation
  );

  return json(res, {
    ...fallback,
    llm_explanation: geminiInsights || { ...fallback.llm_explanation, ai_source: "fallback" },
  });
};
