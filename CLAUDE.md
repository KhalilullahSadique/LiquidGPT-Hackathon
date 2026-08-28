# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # dev server + /api/chat middleware, http://localhost:5173
npm run dev:host   # same, reachable from other devices on the LAN (phone testing)
npm run build      # production build to dist/
npm run lint       # eslint . — must exit 0
npm run preview    # serve the production build
```

There are **no tests and no test runner**. Verification is done by running the app and by
`curl`ing `/api/chat` directly (see *Verifying a change* below).

Deploying (`vercel` CLI, project `liquid-gpt-hackathon`):

```bash
vercel deploy --prod --yes
vercel env ls
vercel env add GEMINI_API_KEY production   # prompts for the value on stdin
```

Environment variable changes do **not** affect existing deployments — you must redeploy.

## The one rule that matters

**API keys must never carry a `VITE_` prefix.** Vite inlines every `VITE_`-prefixed
variable into the browser bundle at build time. An earlier version of this app read
`import.meta.env.VITE_OPENROUTER_API_KEY` in the browser and shipped the key to every
visitor. An env var keeps a key out of git; it does nothing to keep it out of the bundle.

The regression test is one line, and it should stay green:

```bash
npm run build && grep -rc "AIzaSy" dist/    # must be 0
```

## Architecture

Two halves that never share a module:

- **`api/`** runs on the server (Vercel serverless). Holds `GEMINI_API_KEY` /
  `OPENROUTER_API_KEY`, the provider base URLs, and the system prompt.
- **`src/`** runs in the browser. Knows only provider *ids* and *labels*. It cannot leak a
  credential because it never has one.

The browser posts `{provider, model, messages, language}` to same-origin `/api/chat`;
`api/chat.js` validates, injects the key, prepends the system prompt, and forwards.

`language` is deliberately **not** validated into a 400. An unknown or absent value falls back
to English inside `buildSystemPrompt()`, because a stale cached client that sends nothing must
keep working. A language is a preference, not a precondition.

`vite.config.js` mounts `api/chat.js` on the dev server via `server.middlewares`, so local
dev runs the *same handler* Vercel runs. Vercel pre-parses JSON into `req.body` but Vite's
connect middleware does not — `readJsonBody()` in `api/chat.js` handles both. Keep it that
way when editing the handler.

### Model IDs — hard-won constraints

Do not add a model ID without confirming it with a **real authenticated request**.

- **Never** use an OpenRouter `:free` suffix. It is a billing state with no availability
  contract. All 16 originally-hardcoded `:free` IDs went dead simultaneously, including the
  default, which is the failure this architecture exists to prevent.
- **Never** use a `-preview` ID (two weeks' deprecation notice) or a `-latest` alias
  (swapped underneath you). `openrouter/free` is the one exception — it is a router that
  resolves to whatever is alive, so it cannot rot.
- **A model listing is not proof of usability.** `gemini-2.5-flash`, `-flash-lite` and
  `-pro` still appear in `GET /v1beta/openai/models` and are still priced "Free of charge"
  on Google's pricing page, but return `404 no longer available to new users` for a new API
  key. Only a real call tells the truth.

### Fallback chain and retry semantics

`FALLBACK_CHAIN` in `src/constants/models.js` is walked by `sendMessage()` in
`src/utils/api.js`. The reply carries `usedFallback` and the model that actually answered,
which `ChatMessage` surfaces in the UI.

Gemini meters free-tier quota **per model** (Google's own 429 says `limit: 20, model:
gemini-3.6-flash`), so each hop is an independent allowance and the last hop is a different
company. That is why the chain is four hops rather than a nicety.

Consequently **429 is deliberately absent from `RETRYABLE_STATUSES`** — a spent per-model
quota does not refill during a backoff, so it falls straight through to the next model.
5xx and timeouts *are* retried with exponential backoff plus jitter. `404`/`400` fall
through immediately. `424 provider_not_configured` (from the proxy, when a key is missing)
also falls through; if *every* candidate returns it, the client raises a setup-flavoured
error instead of an outage-flavoured one.

The client loop is deliberate rather than using OpenRouter's server-side `models[]` array:
that array falls through on rate limits and downtime, but a model ID that no longer
*exists* is rejected at request validation before routing begins.

`gemini-3.6-flash` takes ~13s on a persona question (extended thinking) and has timed out;
Flash-Lite answers in ~1s. The default is chosen on measured latency, not model size.

### Interface language

English and Russian, with no i18n dependency — `src/i18n/` is ~150 lines against the ~45 KB
that react-i18next would have added to an already 460 KB single chunk.

Adding a locale touches **four** places, and the fourth is the one that gets missed because it
is invisible from the JS:

1. `src/i18n/xx.js` — the dictionary, plus its `suggestions` array.
2. `src/i18n/translate.js` — add it to `DICTIONARIES` and `SUGGESTIONS`.
3. `src/i18n/locales.js` — `SUPPORTED_LOCALES` and `LOCALE_LABELS`.
4. **The inline `supported` array in the pre-paint script in `index.html`.** Miss this and the
   language cannot be auto-detected and flashes English on every load.

Add a matching entry to `LANGUAGE_DIRECTIVES` in `api/_persona.js` too, or that locale silently
gets English replies.

Each dictionary is layered as `{...en, ...xx}`, so an untranslated key renders English rather
than blank. That also makes a missing translation invisible at runtime, which is why
`translate.js` has a DEV-only module-scope parity check — it is the only place the omission can
be caught. Keep it at module scope: a `console.warn` inside `t()` would violate
`react-hooks/purity`.

Numbers interpolate through `Intl.NumberFormat` inside `t()`, and `{count}` selects a plural
form through `Intl.PluralRules` — Russian needs three forms where English needs two. Do not
call `toLocaleString` at a call site; that is how the same 2000 limit ended up printed as both
`2000` and `2 000` in the same panel.

`hasExplicitChoice` is seeded from `readStoredLocale()`, **not** `Boolean(getItem(...))`. A
stale stored value would otherwise count as a deliberate choice, and the effect would write our
English fallback back to storage — permanently disabling device detection for that user.
`useDarkMode` gets away with `Boolean()` only because its key holds nothing but `dark`/`light`.

There is no listener for OS language changes: unlike `prefers-color-scheme`, `navigator.language`
has no dependable change event. Detection runs once per load, on purpose.

### State and storage

`ChatContainer` owns **all** conversation state. `Sidebar`, `ChatHeader`, `ChatInput` and
`ChatMessage` are presentational. Do not reintroduce a second copy of the conversation list
inside `Sidebar` — it previously went stale for an entire desktop session because it only
refreshed on an open/close transition.

Persistence is `src/utils/conversationStorage.js`, keyed `liquidgpt-*`. Ordering is by
`updatedAt` with move-to-front before the 50-record cap, so eviction is LRU rather than by
creation date. `saveConversation` returns `{ok}` / `{ok:false, reason}` — quota failures are
surfaced to the user, not swallowed.

Two invariants worth preserving:

- **Failures never enter the transcript.** They render in a dismissible banner. Storing
  them made a failure indistinguishable from a real reply, persisted it, and replayed
  `Error: ...` to the model as conversation history on the next turn.
- **A current-conversation pointer with no matching record means "new empty chat"**, not
  "migrate legacy data". The old legacy-migration branch read the live storage key, loaded
  the conversation index into the message pane, and 400'd every subsequent send.

### Persona

`api/_persona.js` is a **system prompt**, not a fine-tuned model. It lives server-side so it
is always applied, cannot be stripped by editing client state, and is never persisted into
`localStorage`. `api/chat.js` strips any client-supplied `system` messages before
prepending it.

Facts about the engineer who built this must be **sourced, not inferred**. This rule exists
because it was broken: "based in Quetta, Balochistan, Pakistan" was inferred from an old
team name and was simply wrong. The prompt now forbids the model from guessing a location
or any detail it does not list, and forbids crediting the app to a team. If you add a fact,
it must come from him or from his portfolio — never from a plausible-looking signal in the
repo.

## Conventions

- **`setState` inside an effect is a lint error** (`react-hooks/set-state-in-effect`). Use a
  lazy `useState` initialiser for mount-time reads, and explicit commit helpers called from
  event handlers for writes. `commitMessages` in `ChatContainer` is the pattern.
- ESLint config is split: `src/**` gets browser globals and the React rules; `api/**`,
  `vite.config.js` and `eslint.config.js` get Node globals and no React rules.
- Tailwind v4. `bg-opacity-*` and `focus:outline-none` changed meaning from v3 — use
  `bg-black/50` and `focus:outline-hidden` + `focus-visible:ring-*`.
- The inline script in `index.html` resolves **both** the theme and the language before first
  paint, and writes the language to `<html lang>`. `LanguageProvider` reads it back off the DOM
  in a lazy initialiser rather than recomputing it, exactly as `useDarkMode` does.
- The dark theme is applied by that same inline script **before first paint**;
  `useDarkMode` reads the class back off `documentElement` rather than recomputing. Keep the
  two in sync, and only persist `theme` on an explicit user toggle so the OS preference
  still wins by default.
- Code blocks are intercepted at the `pre` component in `ChatMessage`, not `code` —
  react-markdown v9+ removed the `inline` prop, so an unlabelled fence is otherwise
  indistinguishable from inline code. Syntax highlighting uses `PrismLight` with explicitly
  registered languages; importing full `Prism` pulls ~290 languages and roughly doubles the
  bundle.

## Deploying — traps that are invisible from the code

The repo is git-connected to the Vercel project, so **a push to `main` auto-deploys**. Use
`vercel deploy --prod --yes` when you need a deploy without a commit (e.g. after changing
an environment variable, which never affects an existing deployment).

**`vercel link` silently breaks `.gitignore`.** It appends a broad `.env*` rule to the end
of the file. That lands *after* `!.env.example`, and the last matching pattern wins, so the
committed template gets re-ignored. After running any `vercel link` / `vercel env pull`,
re-check:

```bash
git check-ignore -v .env .env.local .env.example   # .env.example must NOT be ignored
```

**Do not put an Application/HTTP-referrer restriction on the Gemini key.** This reverses
the usual advice and the usual advice is wrong here: referrer restrictions only work for
calls made from a browser, and this key is used by a serverless function, which sends no
referrer. A website restriction blocks 100% of production traffic. Restrict the key by
**API** (Generative Language API only) and let the proxy handle origin control.

**`git push` fails with `could not read Username for 'https://github.com'`.** The remote is
HTTPS but `gh` is configured with `git_protocol = ssh`, and no credential helper is set.
Push with gh's token without permanently changing git config:

```bash
git -c credential.helper='!gh auth git-credential' push origin main
```

## Verifying a change

The proxy rejects requests whose `Origin` does not match the host, so `curl` needs one:

```bash
curl -s -X POST http://localhost:5173/api/chat \
  -H "Origin: http://localhost:5173" -H "Content-Type: application/json" \
  -d '{"provider":"gemini","model":"gemini-3.5-flash-lite",
       "messages":[{"role":"user","content":"say OK"}]}'
```

After a change that touches keys, providers, or the build, confirm: `npm run lint` exits 0,
`grep -rc "AIzaSy" dist/` is 0, and the browser's network tab shows calls to `/api/chat`
only — never `googleapis.com` or `openrouter.ai`.

## Mobile invariants

The app is used on phones from a QR code, so these are load-bearing rather than polish:

- **`h-dvh`, never `h-screen`.** `100vh` includes the iOS URL bar and pushes the input bar below
  the fold. Do not write `h-screen h-dvh` as a "fallback pair" — Tailwind sorts its own output,
  so the class-attribute order does not decide which wins.
- **`env(safe-area-inset-*)` does nothing without `viewport-fit=cover`** in the viewport meta.
  Both are in place; removing either silently reverts the notch and home-indicator padding.
- **Every interactive control is `min-h-11` / `min-w-11` (44px).** Padding alone does not get
  there for `text-xs` controls; the message Copy button uses negative margin to grow its hit
  area without growing the layout.
- **iOS zooms the page on focus for any control under 16px and never zooms back.** Both
  `<select>`s and the textarea are `text-base sm:text-sm`. Never "fix" this with
  `maximum-scale=1` — that breaks pinch-zoom for everyone.
- **Tailwind emits hover variants inside `@media (hover: hover)`.** On a touch device a
  `group-hover:` rule is not merely unfired, it is never generated. The sidebar delete button
  was `opacity-0 group-hover:opacity-100`, which meant there was no way at all to delete a
  conversation on a phone. Anything hover-revealed must have a touch-visible fallback.
- **The header does not fit a second `<select>`.** Language and theme live in the sidebar
  footer because at 320px the model picker overlapped the language picker by 140px. The
  document did not overflow, so this is invisible to a scrollWidth check — measure element
  rectangles, not just page width.
- `Tab` was deliberately removed from `ACCEPT_KEYS` in `ChatInput`. The suggestions are
  focusable chips now, so swallowing Tab in the empty textarea would trap a keyboard user.
  Do not add it back.
