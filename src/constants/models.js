/**
 * Model catalog.
 *
 * Every id here is a STABLE slug. Two rules learned the hard way, when all 16 of this
 * app's previous OpenRouter ids went dead at once:
 *
 *   1. Never use an OpenRouter ":free" suffix. It is a billing state with no availability
 *      contract, not a version alias, and it gets revoked without notice.
 *   2. Never use a "-preview" id (2 weeks' deprecation notice) or a "-latest" alias
 *      (hot-swapped underneath you). Pin a specific stable model.
 *
 * `openrouter/free` is the exception that proves the rule: it is a router that resolves to
 * whatever free models are alive today, so unlike a specific ":free" slug it cannot rot.
 */
export const AVAILABLE_MODELS = [
  { id: "gemini-3.6-flash", name: "Gemini 3.6 Flash", provider: "gemini" },
  { id: "gemini-3.5-flash", name: "Gemini 3.5 Flash", provider: "gemini" },
  { id: "gemini-3.5-flash-lite", name: "Gemini 3.5 Flash-Lite", provider: "gemini" },
  { id: "gemini-3.1-flash-lite", name: "Gemini 3.1 Flash-Lite", provider: "gemini" },
  // Newest flagship, but free-tier capacity has been returning 503 consistently.
  // Kept selectable; the fallback chain covers it when it is unavailable.
  { id: "gemini-3.7-flash", name: "Gemini 3.7 Flash", provider: "gemini" },
  { id: "openrouter/free", name: "OpenRouter (Free Router)", provider: "openrouter" },
];

/**
 * Google's own stated replacement for gemini-2.5-flash.
 *
 * Note for anyone tempted to "restore" a 2.x id here: gemini-2.5-flash, -flash-lite and
 * -pro all still appear in GET /v1beta/openai/models, but calling them from a new API key
 * returns 404 "no longer available to new users". The model listing is not proof of
 * usability - the only reliable test is a real request.
 */
export const DEFAULT_MODEL = "gemini-3.6-flash";

/**
 * Tried in order when the selected model fails. Deliberately spans two providers on
 * different infrastructure so one outage cannot take the app down.
 */
export const FALLBACK_CHAIN = [
  "gemini-3.6-flash",
  "gemini-3.5-flash-lite",
  "openrouter/free",
];

export const getModel = (modelId) =>
  AVAILABLE_MODELS.find((model) => model.id === modelId) ?? null;
