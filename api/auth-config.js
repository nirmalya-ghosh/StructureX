const { json } = require("./_structurex-data");

function readEnv(...names) {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) {
      return value;
    }
  }

  return "";
}

module.exports = function handler(req, res) {
  if (req.method !== "GET") {
    return json(res, { detail: "Method not allowed" }, 405);
  }

  const supabaseUrl = readEnv(
    "SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_URL",
    "VITE_SUPABASE_URL"
  );
  const supabaseAnonKey = readEnv(
    "SUPABASE_ANON_KEY",
    "SUPABASE_PUBLISHABLE_KEY",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    "VITE_SUPABASE_ANON_KEY"
  );
  const origin =
    req.headers["x-forwarded-host"]
      ? `${req.headers["x-forwarded-proto"] || "https"}://${req.headers["x-forwarded-host"]}`
      : req.headers.host
        ? `http://${req.headers.host}`
        : "";
  const callbackPath = "/auth-callback";
  const callbackUrl = origin ? `${origin}${callbackPath}` : callbackPath;
  const configured = Boolean(supabaseUrl && supabaseAnonKey);

  return json(res, {
    configured,
    supabaseUrl,
    supabaseAnonKey,
    callbackPath,
    callbackUrl,
    provider: "google",
    message: configured
      ? "Supabase Google auth is configured."
      : "Supabase Google auth is not configured. Add SUPABASE_URL and SUPABASE_ANON_KEY to .env.local or your deployment environment, then allow this callback URL in Supabase Auth.",
    setup: {
      requiredEnv: ["SUPABASE_URL", "SUPABASE_ANON_KEY"],
      supabaseRedirectUrl: callbackUrl,
      supabaseSiteUrl: origin || "http://127.0.0.1:8000",
    },
  });
};
