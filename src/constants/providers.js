/**
 * Client-side provider list.
 *
 * Labels only. The base URLs, auth headers and API keys deliberately live server-side in
 * `api/_providers.js` — nothing here can leak a credential because nothing here has one.
 * The browser only ever sends a provider id to /api/chat.
 */
export const PROVIDERS = {
  gemini: { label: "Google Gemini" },
  openrouter: { label: "OpenRouter" },
};

export const getProviderLabel = (providerId) =>
  PROVIDERS[providerId]?.label ?? providerId;
