/**
 * StructureX - Authentication Controller
 * Handles form switching, local fallback auth, and Supabase Google OAuth.
 */

const AUTH_CONFIG_ENDPOINT = "/api/auth-config";
const AUTH_CALLBACK_PATH = "/auth-callback.html";
const PASSWORD_RESET_PATH = "/forgot-password";
const DASHBOARD_PATH = "/dashboard";
const LEGACY_USER_KEY = "sx_user";
const SECURE_USER_KEY = "sx_user_secure";
const AUTH_STATE_KEY = "sx_auth_state";
const SESSION_SECRET_KEY = "sx_session_secret";
const PBKDF2_ITERATIONS = 210000;
const GOOGLE_ICON =
  '<img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google">';

let supabaseClientPromise = null;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getCrypto() {
  if (!window.crypto?.subtle) {
    throw new Error("AES-256 secure storage needs HTTPS and Web Crypto support.");
  }
  return window.crypto;
}

function randomBytes(length) {
  const bytes = new Uint8Array(length);
  getCrypto().getRandomValues(bytes);
  return bytes;
}

function toBase64(bytes) {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function fromBase64(value) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function randomSecret() {
  return toBase64(randomBytes(32));
}

async function deriveAesKey(secret, salt) {
  const crypto = getCrypto();
  const material = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

async function saveSecureUser(user, secret, meta = {}) {
  const crypto = getCrypto();
  const salt = randomBytes(16);
  const iv = randomBytes(12);
  const key = await deriveAesKey(secret, salt);
  const plaintext = new TextEncoder().encode(JSON.stringify(user));
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plaintext);

  localStorage.setItem(
    SECURE_USER_KEY,
    JSON.stringify({
      v: 1,
      alg: "AES-256-GCM",
      kdf: "PBKDF2-SHA256",
      iterations: PBKDF2_ITERATIONS,
      salt: toBase64(salt),
      iv: toBase64(iv),
      data: toBase64(new Uint8Array(encrypted)),
      provider: meta.provider || user.provider || "local",
      createdAt: new Date().toISOString(),
    })
  );
  localStorage.setItem(
    AUTH_STATE_KEY,
    JSON.stringify({
      encrypted: true,
      provider: meta.provider || user.provider || "local",
      at: Date.now(),
    })
  );
  localStorage.removeItem(LEGACY_USER_KEY);
  sessionStorage.setItem(SESSION_SECRET_KEY, secret);
}

function getSupabaseLibrary() {
  if (window.supabase && typeof window.supabase.createClient === "function") {
    return window.supabase;
  }

  return null;
}

async function loadAuthConfig() {
  const response = await fetch(AUTH_CONFIG_ENDPOINT, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("The Supabase auth config endpoint is not available.");
  }

  const config = await response.json();
  if (!config.configured || !config.supabaseUrl || !config.supabaseAnonKey) {
    throw new Error(
      "Supabase is not configured on Vercel. Add SUPABASE_URL and SUPABASE_ANON_KEY environment variables."
    );
  }

  return config;
}

async function getSupabaseClient() {
  if (!supabaseClientPromise) {
    supabaseClientPromise = (async () => {
      const library = getSupabaseLibrary();
      if (!library) {
        throw new Error("The Supabase browser client did not load. Please refresh and try again.");
      }

      const config = await loadAuthConfig();
      return library.createClient(config.supabaseUrl, config.supabaseAnonKey, {
        auth: {
          flowType: "pkce",
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: false,
        },
      });
    })();
  }

  return supabaseClientPromise;
}

async function tryGetSupabaseClient() {
  try {
    return await getSupabaseClient();
  } catch (error) {
    supabaseClientPromise = null;
    return null;
  }
}

async function saveUserFromSession(session) {
  const user = session && session.user;
  if (!user) {
    throw new Error("Supabase did not return a signed-in user.");
  }

  const metadata = user.user_metadata || {};
  const fallbackName = user.email ? user.email.split("@")[0] : "Google User";
  await saveSecureUser(
    {
      email: user.email || "google-user@structurex.local",
      name: metadata.full_name || metadata.name || fallbackName,
      avatar_url: metadata.avatar_url || metadata.picture || "",
      provider: "google",
    },
    randomSecret(),
    { provider: "google" }
  );
}

function getCallbackUrl() {
  return `${window.location.origin}${AUTH_CALLBACK_PATH}`;
}

function getPasswordResetUrl() {
  return `${window.location.origin}${PASSWORD_RESET_PATH}`;
}

function showAuthSuccess(intent) {
  window.alert(intent === "signup" ? "Sign up successful." : "Login successful.");
}

function setResetStatus(node, message, type = "info") {
  if (!node) {
    return;
  }
  node.textContent = message;
  node.className = `reset-status visible ${type}`;
}

function setInlineButtonLoading(button, text) {
  if (!button) {
    return () => {};
  }
  const original = button.innerHTML;
  button.disabled = true;
  button.innerHTML = `<span>${text}</span><div class="spinner"></div>`;
  return () => {
    button.disabled = false;
    button.innerHTML = original;
  };
}

function setGoogleButtonLoading(button) {
  const original = button.innerHTML;
  button.disabled = true;
  button.innerHTML = `${GOOGLE_ICON}<span>Opening Google...</span>`;
  return () => {
    button.disabled = false;
    button.innerHTML = original;
  };
}

async function startGoogleOAuth(button, requireTerms, termsCheckbox) {
  if (requireTerms && termsCheckbox && !termsCheckbox.checked) {
    window.alert("Please agree to the Terms & Conditions and Privacy Policy before creating an account.");
    return;
  }

  const restoreButton = setGoogleButtonLoading(button);

  try {
    const client = await getSupabaseClient();
    localStorage.setItem("sx_auth_intent", requireTerms ? "signup" : "login");

    const { data, error } = await client.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: getCallbackUrl(),
        queryParams: {
          prompt: "select_account",
          access_type: "offline",
        },
      },
    });

    if (error) {
      throw error;
    }

    if (data && data.url) {
      window.location.assign(data.url);
    }
  } catch (error) {
    console.error("Google auth failed:", error);
    window.alert(error.message || "Google sign-in could not start. Please try again.");
    restoreButton();
  }
}

function hasOAuthCallbackData() {
  const params = new URLSearchParams(window.location.search);
  return params.has("code") || params.has("error") || window.location.hash.includes("access_token");
}

async function finishOAuthCallback() {
  if (!document.body.classList.contains("auth-callback-body") && !hasOAuthCallbackData()) {
    return false;
  }

  const status = document.getElementById("auth-callback-status");
  const setStatus = (message) => {
    if (status) {
      status.textContent = message;
    }
  };

  try {
    const params = new URLSearchParams(window.location.search);
    const providerError = params.get("error_description") || params.get("error");
    if (providerError) {
      throw new Error(providerError);
    }

    setStatus("Completing Google sign-in...");
    const client = await getSupabaseClient();
    const code = params.get("code");

    if (code) {
      const { error } = await client.auth.exchangeCodeForSession(code);
      if (error) {
        throw error;
      }
    }

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const { data, error } = await client.auth.getSession();
      if (error) {
        throw error;
      }

      if (data && data.session) {
        await saveUserFromSession(data.session);
        const intent = localStorage.getItem("sx_auth_intent") || "login";
        localStorage.removeItem("sx_auth_intent");
        setStatus("Opening dashboard...");
        showAuthSuccess(intent);
        window.location.replace(DASHBOARD_PATH);
        return true;
      }

      await delay(250 + attempt * 150);
    }

    throw new Error("Google sign-in finished, but no Supabase session was saved.");
  } catch (error) {
    console.error("Auth callback failed:", error);
    document.body.classList.add("callback-error");
    setStatus(error.message || "Google sign-in could not be completed.");
    const panel = document.querySelector(".legal-panel");
    if (panel && !panel.querySelector(".auth-callback-actions")) {
      const action = document.createElement("p");
      action.className = "auth-callback-actions";
      action.innerHTML = '<a href="/login">Return to login</a>';
      panel.appendChild(action);
    }
    return true;
  }
}

function getUrlHashParams() {
  return new URLSearchParams(window.location.hash.replace(/^#/, ""));
}

function hasRecoveryLinkData() {
  const params = new URLSearchParams(window.location.search);
  const hashParams = getUrlHashParams();
  return (
    params.get("type") === "recovery" ||
    hashParams.get("type") === "recovery" ||
    params.has("code") ||
    hashParams.has("access_token")
  );
}

async function activateRecoverySession(client, statusNode) {
  const params = new URLSearchParams(window.location.search);
  const hashParams = getUrlHashParams();
  const providerError =
    params.get("error_description") ||
    params.get("error") ||
    hashParams.get("error_description") ||
    hashParams.get("error");
  if (providerError) {
    throw new Error(providerError);
  }

  const code = params.get("code");
  if (code) {
    setResetStatus(statusNode, "Verifying secure reset link...", "info");
    const { error } = await client.auth.exchangeCodeForSession(code);
    if (error) {
      throw error;
    }
  }

  const accessToken = hashParams.get("access_token");
  const refreshToken = hashParams.get("refresh_token");
  if (accessToken && refreshToken) {
    setResetStatus(statusNode, "Opening password reset session...", "info");
    const { error } = await client.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (error) {
      throw error;
    }
  }

  const { data, error } = await client.auth.getSession();
  if (error) {
    throw error;
  }
  return Boolean(data?.session);
}

async function initForgotPasswordPage() {
  if (!document.body.classList.contains("forgot-password-body")) {
    return false;
  }

  const requestForm = document.getElementById("forgot-request-form");
  const updateForm = document.getElementById("forgot-update-form");
  const forgotStatus = document.getElementById("forgot-status");
  const resetStatus = document.getElementById("reset-status");
  const emailInput = document.getElementById("forgot-email");
  const params = new URLSearchParams(window.location.search);
  let localResetEmail = "";

  if (!requestForm || !updateForm || !emailInput) {
    return true;
  }

  const showRequestForm = () => {
    requestForm.classList.add("active");
    updateForm.classList.remove("active");
  };
  const showUpdateForm = () => {
    requestForm.classList.remove("active");
    updateForm.classList.add("active");
  };

  if (params.get("email")) {
    emailInput.value = params.get("email");
  }

  if (hasRecoveryLinkData()) {
    try {
      const client = await getSupabaseClient();
      const hasSession = await activateRecoverySession(client, resetStatus);
      if (!hasSession) {
        throw new Error("This reset link is expired or invalid. Request a new password reset email.");
      }
      showUpdateForm();
      setResetStatus(resetStatus, "Reset link verified. Create a new password.", "success");
    } catch (error) {
      console.error("Password recovery link failed:", error);
      showRequestForm();
      setResetStatus(forgotStatus, error.message || "The reset link could not be opened. Request a new one.", "error");
    }
  }

  requestForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = emailInput.value.trim();
    const button = requestForm.querySelector(".btn-primary");
    const restoreButton = setInlineButtonLoading(button, "Sending...");
    localResetEmail = email;

    try {
      const client = await tryGetSupabaseClient();
      if (!client) {
        showUpdateForm();
        setResetStatus(
          resetStatus,
          `Email reset is not configured on this deployment yet. Create a new local password for ${email}.`,
          "info"
        );
        return;
      }
      const { error } = await client.auth.resetPasswordForEmail(email, {
        redirectTo: getPasswordResetUrl(),
      });
      if (error) {
        throw error;
      }
      setResetStatus(
        forgotStatus,
        "If that email is registered, a secure reset link has been sent. Check inbox and spam.",
        "success"
      );
    } catch (error) {
      console.error("Password reset request failed:", error);
      if (/supabase|configured|config/i.test(error.message || "")) {
        showUpdateForm();
        setResetStatus(
          resetStatus,
          `Email reset is not configured on this deployment yet. Create a new local password for ${email}.`,
          "info"
        );
        return;
      }
      setResetStatus(forgotStatus, error.message || "Password reset could not be started. Try again.", "error");
    } finally {
      restoreButton();
    }
  });

  updateForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const password = document.getElementById("new-password").value;
    const confirmPassword = document.getElementById("confirm-password").value;
    const button = updateForm.querySelector(".btn-primary");

    if (password.length < 8) {
      setResetStatus(resetStatus, "Use at least 8 characters for the new password.", "error");
      return;
    }
    if (password !== confirmPassword) {
      setResetStatus(resetStatus, "The two passwords do not match.", "error");
      return;
    }

    const restoreButton = setInlineButtonLoading(button, "Updating...");
    try {
      const client = await tryGetSupabaseClient();
      if (client) {
        if (hasRecoveryLinkData()) {
          await activateRecoverySession(client, resetStatus);
        }
        const { data: sessionData, error: sessionError } = await client.auth.getSession();
        if (sessionError) {
          throw sessionError;
        }
        if (sessionData?.session) {
          const { error } = await client.auth.updateUser({ password });
          if (error) {
            throw error;
          }
          await saveUserFromSession(sessionData.session);
          setResetStatus(resetStatus, "Password updated. Opening dashboard...", "success");
          window.setTimeout(() => window.location.replace(DASHBOARD_PATH), 900);
          return;
        }
      }

      const email = localResetEmail || emailInput.value.trim() || params.get("email") || "local-user@structurex.local";
      await saveSecureUser(
        { email, name: email.split("@")[0] || "User", provider: "local" },
        `${email}:${password}`,
        { provider: "local-reset" }
      );
      setResetStatus(resetStatus, "Local password reset complete. Opening dashboard...", "success");
      window.setTimeout(() => window.location.replace(DASHBOARD_PATH), 900);
    } catch (error) {
      console.error("Password update failed:", error);
      setResetStatus(resetStatus, error.message || "Password could not be updated. Request a new reset link.", "error");
    } finally {
      restoreButton();
    }
  });

  return true;
}

document.addEventListener("DOMContentLoaded", async () => {
  if (await initForgotPasswordPage()) {
    return;
  }

  if (await finishOAuthCallback()) {
    return;
  }

  const tabLogin = document.getElementById("tab-login");
  const tabSignup = document.getElementById("tab-signup");
  const authTabs = document.querySelector(".auth-tabs");
  const loginForm = document.getElementById("login-form");
  const signupForm = document.getElementById("signup-form");
  const termsCheckbox = signupForm ? signupForm.querySelector(".terms input") : null;

  if (!tabLogin || !tabSignup || !authTabs || !loginForm || !signupForm) {
    return;
  }

  tabLogin.addEventListener("click", () => {
    tabLogin.classList.add("active");
    tabSignup.classList.remove("active");
    authTabs.classList.remove("signup-active");
    loginForm.classList.add("active");
    signupForm.classList.remove("active");
  });

  tabSignup.addEventListener("click", () => {
    tabSignup.classList.add("active");
    tabLogin.classList.remove("active");
    authTabs.classList.add("signup-active");
    signupForm.classList.add("active");
    loginForm.classList.remove("active");
  });

  loginForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;
    const button = loginForm.querySelector(".btn-primary");

    button.disabled = true;
    button.innerHTML = "<span>Authenticating...</span><div class=\"spinner\"></div>";

    setTimeout(async () => {
      try {
        await saveSecureUser({ email, name: email.split("@")[0] || "User", provider: "local" }, `${email}:${password}`, { provider: "local" });
        showAuthSuccess("login");
        window.location.href = DASHBOARD_PATH;
      } catch (error) {
        console.error("Secure local login failed:", error);
        window.alert(error.message || "Secure local login failed.");
        button.disabled = false;
        button.innerHTML = '<span>Sign In</span><i class="fas fa-arrow-right"></i>';
      }
    }, 900);
  });

  signupForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = document.getElementById("signup-name").value;
    const email = document.getElementById("signup-email").value;
    const password = document.getElementById("signup-password").value;
    const button = signupForm.querySelector(".btn-primary");

    button.disabled = true;
    button.innerHTML = "<span>Creating Account...</span><div class=\"spinner\"></div>";

    setTimeout(async () => {
      try {
        await saveSecureUser({ email, name, provider: "local" }, `${email}:${password}`, { provider: "local" });
        showAuthSuccess("signup");
        window.location.href = DASHBOARD_PATH;
      } catch (error) {
        console.error("Secure local signup failed:", error);
        window.alert(error.message || "Secure local signup failed.");
        button.disabled = false;
        button.innerHTML = '<span>Create Account</span><i class="fas fa-user-plus"></i>';
      }
    }, 900);
  });

  const googleButtons = [document.getElementById("google-login"), document.getElementById("google-signup")];
  googleButtons.forEach((button) => {
    if (!button) {
      return;
    }

    button.addEventListener("click", () => {
      startGoogleOAuth(button, button.id === "google-signup", termsCheckbox);
    });
  });

  document.addEventListener("mousemove", (event) => {
    const stars = document.querySelector(".stars");
    if (!stars) return;
    const x = event.clientX / window.innerWidth - 0.5;
    const y = event.clientY / window.innerHeight - 0.5;
    stars.style.transform = `translate(${x * 40}px, ${y * 40}px)`;
  });
});
