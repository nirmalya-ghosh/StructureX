const { buildingAnalysis, enrichBuildingPayload, json, readJson } = require("./_structurex-data");
const { generateBuildingAnalysisWithGemini } = require("./gemini");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return json(res, { detail: "Method not allowed" }, 405);
  }

  const body = await readJson(req);
  const enrichedBody = await enrichBuildingPayload(body);
  const fallback = buildingAnalysis(enrichedBody);
  const geminiAnalysis = await generateBuildingAnalysisWithGemini(enrichedBody, fallback);
  return json(res, geminiAnalysis || { ...fallback, ai_source: "fallback" });
};
