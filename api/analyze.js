const { analysisResponse, json } = require("./_structurex-data");

module.exports = function handler(req, res) {
  if (req.method !== "POST") {
    return json(res, { detail: "Method not allowed" }, 405);
  }

  return json(res, analysisResponse());
};
