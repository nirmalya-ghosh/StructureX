const { buildingAnalysis, enrichBuildingPayload, json, readJson } = require("./_structurex-data");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return json(res, { detail: "Method not allowed" }, 405);
  }

  const body = await readJson(req);
  const enrichedBody = await enrichBuildingPayload(body);
  return json(res, buildingAnalysis(enrichedBody));
};
