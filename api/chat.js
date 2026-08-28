import { PROVIDERS, getApiKey } from "./_providers.js";
import { buildSystemPrompt } from "./_persona.js";

// gemini-3.5-flash has been measured at ~7s, so the platform default of 10s is too tight.
export const config = { maxDuration: 60 };

const MAX_MESSAGES = 80;
const MAX_TOTAL_CHARS = 120_000;
const UPSTREAM_TIMEOUT_MS = 55_000;

const send = (res, status, payload) => {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(payload));
};

const fail = (res, status, message, code) =>
  send(res, status, { error: { message, code } });

/** Vercel pre-parses JSON into req.body; Vite's dev middleware does not. Handle both. */
const readJsonBody = async (req) => {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") return req.body ? JSON.parse(req.body) : {};

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
};

/**
 * Only serve the page this function is deployed alongside.
 *
 * Honest about what this is: it stops casual quota theft by someone who finds the endpoint,
 * not a determined attacker who forges an Origin header. Combined with a free-tier key that
 * has no payment method attached, it is the right trade-off here. Browsers always send
 * Origin on cross-origin POSTs and on same-origin POSTs, so a missing Origin means the
 * request did not come from a page.
 */
const isAllowedOrigin = (req) => {
  const origin = req.headers.origin;
  if (!origin) return false;

  let originHost;
  try {
    originHost = new URL(origin).host;
  } catch {
    return false;
  }

  if (originHost === req.headers.host) return true;

  const allowed = (process.env.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
  return allowed.some((entry) => entry === origin || entry === originHost);
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return fail(res, 405, "Method not allowed.", "method_not_allowed");
  }

  if (!isAllowedOrigin(req)) {
    return fail(res, 403, "Requests are only accepted from the LiquidGPT app.", "bad_origin");
  }

  let body;
  try {
    body = await readJsonBody(req);
  } catch {
    return fail(res, 400, "Request body must be valid JSON.", "bad_json");
  }

  const { provider: providerId, model, messages, language } = body;

  const provider = PROVIDERS[providerId];
  if (!provider) {
    return fail(res, 400, `Unknown provider "${providerId}".`, "unknown_provider");
  }
  if (typeof model !== "string" || !model) {
    return fail(res, 400, "A model id is required.", "missing_model");
  }
  if (!Array.isArray(messages) || messages.length === 0) {
    return fail(res, 400, "A non-empty messages array is required.", "missing_messages");
  }
  if (messages.length > MAX_MESSAGES) {
    return fail(res, 413, `Conversation too long (max ${MAX_MESSAGES} messages).`, "too_many_messages");
  }

  const totalChars = messages.reduce(
    (sum, message) => sum + String(message?.content ?? "").length,
    0,
  );
  if (totalChars > MAX_TOTAL_CHARS) {
    return fail(res, 413, "Conversation is too large.", "payload_too_large");
  }

  const apiKey = getApiKey(providerId);
  if (!apiKey) {
    // 424 deliberately: it is NOT in the client's retryable set, so the client falls
    // straight through to the next provider in the chain instead of retrying.
    return fail(
      res,
      424,
      `${provider.label} is not configured on the server.`,
      "provider_not_configured",
    );
  }

  // Deliberately NOT validated into a 400: an unknown or missing language falls back to
  // English inside buildSystemPrompt, so a stale cached client that sends nothing keeps
  // working. A language is a preference, not a precondition.
  const systemPrompt = buildSystemPrompt(language);

  // Strip any client-supplied system messages, then prepend ours. The persona is decided
  // here, not by whatever the browser happened to send.
  const conversation = messages
    .filter((message) => message?.role === "user" || message?.role === "assistant")
    .map((message) => ({ role: message.role, content: String(message.content ?? "") }));

  let upstream;
  try {
    upstream = await fetch(`${provider.baseUrl}/chat/completions`, {
      method: "POST",
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        ...provider.extraHeaders(req.headers.origin),
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "system", content: systemPrompt }, ...conversation],
        temperature: 0.7,
        // Cyrillic tokenizes roughly twice as coarsely as Latin, so an identical budget cuts
        // a Russian answer off at about half the visible length. Costs nothing on a free tier.
        max_tokens: language === "ru" ? 3000 : 2000,
      }),
    });
  } catch (error) {
    const timedOut = error?.name === "TimeoutError";
    return fail(
      res,
      timedOut ? 504 : 502,
      timedOut
        ? `${provider.label} did not respond in time.`
        : `Could not reach ${provider.label}.`,
      timedOut ? "upstream_timeout" : "upstream_unreachable",
    );
  }

  // Pass the upstream status straight through so the client's existing retry rules still
  // apply: 429/5xx retry with backoff, 404 falls through to the next model.
  const text = await upstream.text();
  res.statusCode = upstream.status;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");
  res.end(text || JSON.stringify({ error: { message: `HTTP ${upstream.status}` } }));
}
