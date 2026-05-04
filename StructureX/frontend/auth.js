/**
 * StructureX - Authentication Controller
 * Handles form switching, local fallback auth, and Supabase Google OAuth.
 */

const AUTH_CONFIG_ENDPOINT = "/api/auth-config";
const AUTH_CALLBACK_PATH = "/auth-callback.html";
const DASHBOARD_PATH = "/dashboard";
const GOOGLE_ICON =
  '<img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google">';

let supabaseClientPromise = null;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

function saveUserFromSession(session) {
  const user = session && session.user;
  if (!user) {
    throw new Error("Supabase did not return a signed-in user.");
  }

  const metadata = user.user_metadata || {};
  const fallbackName = user.email ? user.email.split("@")[0] : "Google User";
  localStorage.setItem(
    "sx_user",
    JSON.stringify({
      email: user.email || "google-user@structurex.local",
      name: metadata.full_name || metadata.name || fallbackName,
      avatar_url: metadata.avatar_url || metadata.picture || "",
      provider: "google",
    })
  );
}

function getCallbackUrl() {
  return `${window.location.origin}${AUTH_CALLBACK_PATH}`;
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
        saveUserFromSession(data.session);
        localStorage.removeItem("sx_auth_intent");
        setStatus("Signed in. Opening dashboard...");
        window.location.replace(DASHBOARD_PATH);
        return true;
      }

      await delay(250 + attempt * 150);
    }

    throw new Error("Google sign-in finished, but no Supabase session was saved.");
  } catch (error) {
    console.error("Auth callback failed:", error);
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

document.addEventListener("DOMContentLoaded", async () => {
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
    const button = loginForm.querySelector(".btn-primary");

    button.disabled = true;
    button.innerHTML = "<span>Authenticating...</span><div class=\"spinner\"></div>";

    setTimeout(() => {
      localStorage.setItem("sx_user", JSON.stringify({ email, name: "User" }));
      window.location.href = DASHBOARD_PATH;
    }, 900);
  });

  signupForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = document.getElementById("signup-name").value;
    const email = document.getElementById("signup-email").value;
    const button = signupForm.querySelector(".btn-primary");

    button.disabled = true;
    button.innerHTML = "<span>Creating Account...</span><div class=\"spinner\"></div>";

    setTimeout(() => {
      localStorage.setItem("sx_user", JSON.stringify({ email, name }));
      window.location.href = DASHBOARD_PATH;
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
