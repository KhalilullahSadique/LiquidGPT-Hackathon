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
  { id: "gemini-3.5-flash-lite", name: "Gemini 3.5 Flash-Lite (fast)", provider: "gemini" },
  { id: "gemini-3.1-flash-lite", name: "Gemini 3.1 Flash-Lite", provider: "gemini" },
  { id: "gemini-3.6-flash", name: "Gemini 3.6 Flash", provider: "gemini" },
  { id: "gemini-3.5-flash", name: "Gemini 3.5 Flash", provider: "gemini" },
  // Newest flagship, but free-tier capacity has been returning 503 consistently.
  // Kept selectable; the fallback chain covers it when it is unavailable.
  { id: "gemini-3.7-flash", name: "Gemini 3.7 Flash", provider: "gemini" },
  { id: "openrouter/free", name: "OpenRouter (Free Router)", provider: "openrouter" },
];

/**
 * Flash-Lite by default, chosen on measurements rather than model size.
 *
 * gemini-3.6-flash answers the same question in ~13s because it does extended thinking,
 * and its free-tier quota is 20 requests ("limit: 20" straight from Google's own 429).
 * Flash-Lite returns in ~1s and draws on a separate pool. For a live demo, responsive and
 * available beats marginally smarter.
 *
 * Do not "restore" a 2.x id here: gemini-2.5-flash, -flash-lite and -pro all still appear
 * in GET /v1beta/openai/models and are still priced "Free of charge" on the pricing page,
 * but calling them from a new API key returns 404 "no longer available to new users". A
 * model listing is not proof of usability; only a real request is.
 */
export const DEFAULT_MODEL = "gemini-3.5-flash-lite";

/**
 * Tried in order when the selected model fails.
 *
 * Free-tier quota is metered PER MODEL, so each hop is a fresh allowance, and the last hop
 * is a different company on different infrastructure. Four independent pools is what makes
 * "it stopped working" unlikely rather than merely unlucky.
 */
export const FALLBACK_CHAIN = [
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
  "gemini-3.6-flash",
  "openrouter/free",
];

export const getModel = (modelId) =>
  AVAILABLE_MODELS.find((model) => model.id === modelId) ?? null;
