const { json, readJson, resilienceResponse } = require("./_structurex-data");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return json(res, { detail: "Method not allowed" }, 405);
  }

  const body = await readJson(req);
  return json(res, resilienceResponse(body));
};
