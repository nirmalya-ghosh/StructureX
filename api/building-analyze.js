const { buildingAnalysis, enrichBuildingPayload, json, readJson } = require("./_structurex-data");
const { generateBuildingAnalysisWithGemini } = require("./gemini");
const { rateLimit, requireTurnstile } = require("./security");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return json(res, { detail: "Method not allowed" }, 405);
  }
  if (!rateLimit(req, res, "api-building-analyze", { limit: 10 })) {
    return;
  }

  const body = await readJson(req);
  if (!(await requireTurnstile(req, res, body, "building-analysis"))) {
    return;
  }
  const enrichedBody = await enrichBuildingPayload(body);
  const fallback = buildingAnalysis(enrichedBody);
  const geminiAnalysis = await generateBuildingAnalysisWithGemini(enrichedBody, fallback);
  return json(res, geminiAnalysis || { ...fallback, ai_source: "fallback" });
};
