const { json, readJson, resilienceResponse } = require("./_structurex-data");
const { rateLimit } = require("./security");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return json(res, { detail: "Method not allowed" }, 405);
  }
  if (!rateLimit(req, res, "api-resilience", { limit: 20 })) {
    return;
  }

  const body = await readJson(req);
  return json(res, resilienceResponse(body));
};
