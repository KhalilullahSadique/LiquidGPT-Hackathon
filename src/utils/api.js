import { FALLBACK_CHAIN, getModel } from "../constants/models";
import { getProviderLabel } from "../constants/providers";

// Same-origin. The serverless function at api/chat.js holds the API keys and the system
// prompt; the browser never sees either, and never talks to a provider directly.
const CHAT_ENDPOINT = "/api/chat";

const REQUEST_TIMEOUT_MS = 60_000;
const MAX_ATTEMPTS_PER_MODEL = 3;
const BASE_BACKOFF_MS = 600;

/**
 * Transient server-side conditions worth retrying the SAME model.
 *
 * 429 is deliberately absent. Free-tier quota is metered per model, so when one is
 * exhausted, waiting on it is pointless — falling straight through to the next model in
 * the chain reaches a fresh allowance immediately instead of burning seconds on backoff.
 */
const RETRYABLE_STATUSES = new Set([408, 409, 425, 500, 502, 503, 504]);

export class ChatError extends Error {
  /**
   * `message` stays English: it is what lands in the console and in a bug report.
   *
   * `messageKey` / `messageParams` are what the UI renders, translated at render time rather
   * than at throw time — so switching language retranslates an error already on screen, and
   * this module stays pure and stateless. A null key means "show `message` verbatim", which
   * is correct for text a provider sent us: translating that would misreport what it said.
   */
  constructor(
    message,
    {
      status = null,
      kind = "unknown",
      code = null,
      cause = null,
      messageKey = null,
      messageParams = null,
      lastError = null,
    } = {},
  ) {
    super(message);
    this.name = "ChatError";
    this.status = status;
    this.kind = kind;
    this.code = code;
    this.cause = cause;
    this.messageKey = messageKey;
    this.messageParams = messageParams;
    this.lastError = lastError;
  }
}

const sleep = (ms, signal) =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        reject(
          new ChatError("Request cancelled.", {
            kind: "aborted",
            messageKey: "error.cancelled",
          }),
        );
      },
      { once: true },
    );
  });

/** Caller's abort signal + our own timeout, whichever fires first. */
const withTimeout = (signal) => {
  const timeout = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
  if (!signal) return timeout;
  if (typeof AbortSignal.any === "function") {
    return AbortSignal.any([signal, timeout]);
  }
  const controller = new AbortController();
  const forward = (reason) => controller.abort(reason);
  signal.addEventListener("abort", () => forward(signal.reason), { once: true });
  timeout.addEventListener("abort", () => forward(timeout.reason), { once: true });
  return controller.signal;
};

/** Providers report errors in a few shapes; dig out something a human can act on. */
const extractError = async (response) => {
  const fallback = `HTTP ${response.status}: ${response.statusText}`;
  const raw = await response.text().catch(() => "");
  if (!raw) return { message: fallback, code: null };
  try {
    const body = JSON.parse(raw);
    return {
      message:
        body?.error?.message ||
        body?.error?.metadata?.raw ||
        body?.message ||
        fallback,
      code: body?.error?.code ?? null,
    };
  } catch {
    return { message: raw.slice(0, 300), code: null };
  }
};

/**
 * Pull the assistant text out of an OpenAI-shaped response.
 *
 * Every hop is guarded: providers return HTTP 200 with an `error` body, empty `choices`,
 * and — on reasoning models — a message whose `content` is empty because the text landed
 * in a reasoning field instead.
 */
const readCompletion = (data) => {
  if (data?.error) {
    const providerMessage = data.error.message;
    throw new ChatError(providerMessage || "The provider returned an error.", {
      kind: "provider",
      // Only our own fallback wording is translatable; the provider's own text passes through.
      messageKey: providerMessage ? null : "error.provider",
    });
  }

  const choice = Array.isArray(data?.choices) ? data.choices[0] : null;
  if (!choice) {
    throw new ChatError("The provider returned no completions.", {
      kind: "malformed",
      messageKey: "error.noCompletions",
    });
  }

  const content = choice.message?.content;
  if (typeof content === "string" && content.trim()) return content;

  const reasoning = choice.message?.reasoning ?? choice.message?.reasoning_content;
  if (typeof reasoning === "string" && reasoning.trim()) return reasoning;

  if (choice.finish_reason === "length") {
    throw new ChatError("The reply hit the token limit before producing any text.", {
      kind: "truncated",
      messageKey: "error.truncated",
    });
  }

  throw new ChatError("The provider returned an empty reply.", {
    kind: "empty",
    messageKey: "error.empty",
  });
};

/** One model, up to MAX_ATTEMPTS_PER_MODEL times, retrying only transient failures. */
const requestModel = async (model, messages, { signal, language } = {}) => {
  const label = getProviderLabel(model.provider);

  for (let attempt = 1; attempt <= MAX_ATTEMPTS_PER_MODEL; attempt += 1) {
    let response;
    try {
      response = await fetch(CHAT_ENDPOINT, {
        method: "POST",
        signal: withTimeout(signal),
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: model.provider,
          model: model.id,
          messages,
          language,
        }),
      });
    } catch (error) {
      // The caller cancelled: give up immediately, never fall through to another model.
      if (signal?.aborted) {
        throw new ChatError("Request cancelled.", {
          kind: "aborted",
          cause: error,
          messageKey: "error.cancelled",
        });
      }
      if (error?.name === "TimeoutError") {
        throw new ChatError(
          `The server did not respond within ${REQUEST_TIMEOUT_MS / 1000}s while calling ${label}.`,
          {
            kind: "timeout",
            cause: error,
            messageKey: "error.timeout",
            messageParams: { seconds: REQUEST_TIMEOUT_MS / 1000, provider: label },
          },
        );
      }
      throw new ChatError(
        "Could not reach the LiquidGPT server. Check your connection and try again.",
        { kind: "network", cause: error, messageKey: "error.network" },
      );
    }

    if (response.ok) return readCompletion(await response.json());

    const { message, code } = await extractError(response);

    if (RETRYABLE_STATUSES.has(response.status) && attempt < MAX_ATTEMPTS_PER_MODEL) {
      const retryAfter = Number(response.headers.get("retry-after"));
      const backoff = Number.isFinite(retryAfter) && retryAfter > 0
        ? retryAfter * 1000
        : BASE_BACKOFF_MS * 2 ** (attempt - 1) + Math.random() * 250;
      await sleep(Math.min(backoff, 8000), signal);
      continue;
    }

    throw new ChatError(message, { status: response.status, kind: "http", code });
  }

  throw new ChatError("Exhausted retries.", {
    kind: "http",
    messageKey: "error.exhaustedRetries",
  });
};

/**
 * Send a conversation and return the first reply we can get.
 *
 * Walks the selected model, then FALLBACK_CHAIN, stopping at the first success. This is a
 * client-side loop rather than OpenRouter's server-side `models[]` array on purpose: that
 * array is documented to fall through on rate-limits and downtime, but a model id that no
 * longer EXISTS is rejected at request validation before routing ever begins — which is
 * precisely the failure this app kept hitting.
 *
 * @returns {Promise<{content: string, model: string, provider: string, usedFallback: boolean}>}
 */
export const sendMessage = async (messages, modelId, { signal, language } = {}) => {
  const candidates = [modelId, ...FALLBACK_CHAIN.filter((id) => id !== modelId)]
    .map(getModel)
    .filter(Boolean);

  if (candidates.length === 0) {
    throw new ChatError("No usable model is configured.", {
      kind: "config",
      messageKey: "error.noModel",
    });
  }

  const failures = [];

  for (const [index, model] of candidates.entries()) {
    try {
      const content = await requestModel(model, messages, { signal, language });
      return {
        content,
        model: model.id,
        provider: model.provider,
        usedFallback: index > 0,
      };
    } catch (error) {
      // Cancellation is the user's decision, not a provider fault.
      if (error.kind === "aborted") throw error;
      failures.push(error);
    }
  }

  // Every provider reported a missing server-side key. That is a setup problem, not an
  // outage, and it deserves an error message that says what to actually do about it.
  if (failures.every((error) => error.code === "provider_not_configured")) {
    throw new ChatError(
      "No API key is configured on the server. Add GEMINI_API_KEY to your .env file (or to your Vercel environment variables) and restart.",
      { kind: "config", messageKey: "error.notConfigured" },
    );
  }

  const last = failures[failures.length - 1];
  throw new ChatError(
    `All ${candidates.length} model${candidates.length === 1 ? "" : "s"} failed. Last error: ${last?.message ?? "unknown"}`,
    {
      status: last?.status ?? null,
      kind: "exhausted",
      cause: last,
      messageKey: "error.allFailed",
      messageParams: { count: candidates.length, message: last?.message ?? "unknown" },
      // Carried so the renderer can translate the nested cause too, rather than splicing an
      // English sentence into the middle of a Russian one.
      lastError: last,
    },
  );
};
