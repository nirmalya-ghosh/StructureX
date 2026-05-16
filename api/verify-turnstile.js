const { json, readJson } = require("./_structurex-data");
const { rateLimit, verifyTurnstileToken } = require("./security");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return json(res, { detail: "Method not allowed" }, 405);
  }

  if (!rateLimit(req, res, "turnstile-verify", { limit: 20 })) {
    return;
  }

  const body = await readJson(req);
  const token = body.turnstileToken || body["cf-turnstile-response"] || "";
  const result = await verifyTurnstileToken(token, req, body.action || "auth");
  if (!result.ok) {
    return json(res, { detail: result.detail, errors: result.errors || [] }, 403);
  }

  return json(res, {
    verified: true,
    skipped: Boolean(result.skipped),
    action: result.action || body.action || "auth",
  });
};
