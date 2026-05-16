const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const WINDOW_MS = 60_000;
const buckets = new Map();

function readEnv(...names) {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) {
      return value;
    }
  }
  return "";
}

function getClientIp(req) {
  const forwarded = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim();
  return forwarded || req.socket?.remoteAddress || "unknown";
}

function getTurnstileConfig() {
  const siteKey = readEnv("TURNSTILE_SITE_KEY", "CF_TURNSTILE_SITE_KEY", "CLOUDFLARE_TURNSTILE_SITE_KEY");
  const secretKey = readEnv("TURNSTILE_SECRET_KEY", "CF_TURNSTILE_SECRET_KEY", "CLOUDFLARE_TURNSTILE_SECRET_KEY");
  const enabled = Boolean(siteKey && secretKey);
  return { enabled, siteKey, secretKey };
}

function rateLimit(req, res, key, { limit = 30, windowMs = WINDOW_MS } = {}) {
  const now = Date.now();
  const bucketKey = `${key}:${getClientIp(req)}`;
  const bucket = buckets.get(bucketKey);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(bucketKey, { count: 1, resetAt: now + windowMs });
    return true;
  }

  bucket.count += 1;
  if (bucket.count <= limit) {
    return true;
  }

  const retryAfter = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
  res.statusCode = 429;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Retry-After", String(retryAfter));
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify({
    detail: "Too many requests. Please wait a moment and try again.",
    retryAfter,
  }));
  return false;
}

function readTurnstileToken(req, body = {}) {
  return (
    req.headers["x-turnstile-token"] ||
    req.headers["cf-turnstile-response"] ||
    body.turnstileToken ||
    body["cf-turnstile-response"] ||
    ""
  );
}

async function verifyTurnstileToken(token, req, action = "general") {
  const config = getTurnstileConfig();
  if (!config.enabled) {
    return { ok: true, skipped: true, reason: "turnstile_not_configured" };
  }

  if (!token) {
    return { ok: false, detail: "CAPTCHA verification is required." };
  }

  const form = new URLSearchParams();
  form.set("secret", config.secretKey);
  form.set("response", String(token));
  form.set("remoteip", getClientIp(req));

  const response = await fetch(TURNSTILE_VERIFY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.success) {
    return {
      ok: false,
      detail: "CAPTCHA verification failed. Please retry.",
      errors: result["error-codes"] || [],
    };
  }

  return {
    ok: true,
    action,
    challengeTs: result.challenge_ts || null,
    hostname: result.hostname || null,
  };
}

async function requireTurnstile(req, res, body = {}, action = "general") {
  const result = await verifyTurnstileToken(readTurnstileToken(req, body), req, action);
  if (result.ok) {
    return true;
  }

  res.statusCode = 403;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify({ detail: result.detail, errors: result.errors || [] }));
  return false;
}

module.exports = {
  getClientIp,
  getTurnstileConfig,
  rateLimit,
  requireTurnstile,
  verifyTurnstileToken,
};
