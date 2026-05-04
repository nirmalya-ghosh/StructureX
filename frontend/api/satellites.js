const { SATELLITES, json } = require("./_structurex-data");

module.exports = function handler(req, res) {
  if (req.method !== "GET") {
    return json(res, { detail: "Method not allowed" }, 405);
  }

  return json(res, SATELLITES);
};
