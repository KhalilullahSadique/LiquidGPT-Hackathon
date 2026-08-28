# LiquidGPT

A ChatGPT-style AI chat app built for the SMIT Hackathon by **QuettaCoders**.

React 19 · Vite 7 · Tailwind CSS v4 · Serverless API proxy · Markdown rendering with
syntax highlighting · Multi-conversation history · Dark mode · Automatic model fallback
across two providers.

## Quick start

```bash
git clone <this-repo>
cd LiquidGPT-Hackathon
npm install
cp .env.example .env      # then paste a key into .env (see below)
npm run dev
```

Open the URL Vite prints (usually <http://localhost:5173>).

To try it on a phone on the same Wi-Fi, run `npm run dev:host` instead and open the
Network URL. Note that the browser blocks clipboard access on non-HTTPS origins, so the
Copy buttons will report "Failed" there — everything else works.

## Getting an API key

You need **at least one** of these. Both are free and neither requires a credit card.

| Variable | Where to get it | Role |
| --- | --- | --- |
| `GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com/apikey) | Primary |
| `OPENROUTER_API_KEY` | [OpenRouter](https://openrouter.ai/keys) | Fallback |

Note the absence of a `VITE_` prefix. That is deliberate and load-bearing — see below.

Set both if you can. When a request fails, the app walks a fallback chain across *both*
providers before giving up, so a single provider outage doesn't take the demo down.

## Why the models don't break any more

An earlier version of this app hardcoded 16 OpenRouter model IDs with the `:free` suffix.
Every one of them eventually went dead, including the default, and the app had no way to
notice — it just sent a dead ID and printed the raw HTTP error as if it were a reply.

`:free` on OpenRouter is a *billing state with no availability contract*, not a version
alias, and OpenRouter says so themselves: *"we can't guarantee what the future holds."*
Three changes fix that permanently:

1. **Stable model IDs only, verified with a real request.** No `:free` suffixes, no
   `-preview` IDs (two weeks' notice before removal), no `-latest` aliases (swapped
   underneath you). The default is `gemini-3.6-flash`.

   Worth knowing: `gemini-2.5-flash`, `-flash-lite` and `-pro` still appear in Google's
   `GET /v1beta/openai/models` listing and are still priced "Free of charge" on the
   pricing page, but calling any of them from a **new** API key returns
   `404 - no longer available to new users`. A model listing is not proof of usability;
   only a real request is. Every ID in `src/constants/models.js` was confirmed by an
   actual call.
2. **A fallback chain across two providers** (`src/constants/models.js`). If the selected
   model fails, `src/utils/api.js` walks the rest of the chain and the reply is labelled
   with whichever model actually answered.
3. **Retries with backoff** on rate limits and server errors, a 60-second timeout, and a
   Stop button — instead of hanging on "Thinking…" forever.

## How the API key stays secret

The browser never sees it. Requests go to a same-origin serverless function, which adds
the key and forwards to the provider:

```
browser  ──POST /api/chat──▶  api/chat.js  ──▶  Gemini / OpenRouter
         ◀──── reply ───────  (adds the key here, server-side)
```

This matters because of a trap that is easy to walk into: **Vite inlines every
`VITE_`-prefixed variable into the JavaScript bundle at build time.** An earlier version of
this app read `import.meta.env.VITE_OPENROUTER_API_KEY` in the browser, and the README
claimed that "securing" the key with an environment variable was enough. It is not. An
env var keeps a key out of *git*; it does nothing to keep it out of the *bundle*, where
anyone can read it with View Source.

The variables here have no `VITE_` prefix, so Vite cannot expose them. You can verify it:

```bash
npm run build && grep -rc "AIzaSy" dist/    # 0
```

The proxy also rejects requests whose `Origin` is not this app, and caps conversation size.
Be clear about what that buys: it stops someone who finds the endpoint from casually
burning your quota. It does not stop a determined attacker who forges headers. Combined
with a free-tier key that has no payment method attached, that is the right trade-off for
a hackathon project.

## The built-in persona

Ask "who is Khalil?", "who is Khalilullah Sadique / Sediq / Durrani?", or "who built you?"
and the assistant answers with real information about the developer.

This is a **system prompt** (`api/_persona.js`), not a fine-tuned model — an instruction
prepended to every conversation server-side. Two honest caveats:

- A determined user can prompt-inject their way around it. That is inherent to system
  prompts, and there is no fix at this layer.
- It costs a small number of tokens on every request.

It lives in the proxy rather than the client, so it is always applied, cannot be stripped
by editing browser state, and never gets written into your saved conversations.

## Project structure

```
api/                          ← server-only, never bundled
├─ chat.js                    the proxy: origin check, key injection, forwarding
├─ _providers.js              base URLs, env var names, per-provider headers
└─ _persona.js                the system prompt

src/                          ← browser
├─ components/                ChatContainer (state) + presentational children
├─ hooks/                     useChat (send/cancel/loading/error), useDarkMode
├─ utils/                     api.js (retry, backoff, fallback chain), conversationStorage.js
└─ constants/                 models.js, providers.js (labels only), suggestions.js
```

`ChatContainer` owns all conversation state. Adding a provider means one entry in
`api/_providers.js` and its models in `src/constants/models.js` — no component changes.

`vite.config.js` mounts `api/chat.js` on the dev server, so `npm run dev` runs the exact
same handler that Vercel runs in production.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run dev:host` | Dev server reachable from other devices on the network |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | ESLint |

## Credits

Built by **QuettaCoders**. AI assistance was used in parts of this project.
