/**
 * Server-side provider registry.
 *
 * This file is the reason the API key never reaches the browser: the base URLs, the env
 * var names and the auth header all live here, in code that only ever runs on the server.
 * The client knows nothing except a provider id.
 *
 * `extraHeaders` is per-provider on purpose. OpenRouter uses HTTP-Referer / X-Title for
 * attribution, but Gemini's CORS allow-list is exactly `authorization, content-type` and
 * sending anything else fails the preflight with a 403.
 */
export const PROVIDERS = {
  gemini: {
    label: "Google Gemini",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
    envVar: "GEMINI_API_KEY",
    extraHeaders: () => ({}),
  },

  openrouter: {
    label: "OpenRouter",
    baseUrl: "https://openrouter.ai/api/v1",
    envVar: "OPENROUTER_API_KEY",
    extraHeaders: (origin) => ({
      "HTTP-Referer": origin || "https://liquidgpt.vercel.app",
      "X-Title": "LiquidGPT",
    }),
  },
};

export const getApiKey = (providerId) => {
  const provider = PROVIDERS[providerId];
  if (!provider) return null;
  const key = process.env[provider.envVar];
  return key && key.trim() ? key.trim() : null;
};
