import React, { useCallback, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { PrismLight as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import bash from "react-syntax-highlighter/dist/esm/languages/prism/bash";
import css from "react-syntax-highlighter/dist/esm/languages/prism/css";
import java from "react-syntax-highlighter/dist/esm/languages/prism/java";
import javascript from "react-syntax-highlighter/dist/esm/languages/prism/javascript";
import json from "react-syntax-highlighter/dist/esm/languages/prism/json";
import jsx from "react-syntax-highlighter/dist/esm/languages/prism/jsx";
import markdown from "react-syntax-highlighter/dist/esm/languages/prism/markdown";
import python from "react-syntax-highlighter/dist/esm/languages/prism/python";
import sql from "react-syntax-highlighter/dist/esm/languages/prism/sql";
import tsx from "react-syntax-highlighter/dist/esm/languages/prism/tsx";
import typescript from "react-syntax-highlighter/dist/esm/languages/prism/typescript";
import { useTranslation } from "../i18n/useTranslation";

// PrismLight + explicit registration, because the full Prism build pulls in ~290
// refractor languages and was single-handedly responsible for a ~1 MB JS chunk.
const LANGUAGES = {
  bash,
  css,
  java,
  javascript,
  json,
  jsx,
  markdown,
  python,
  sql,
  tsx,
  typescript,
};
Object.entries(LANGUAGES).forEach(([name, definition]) =>
  SyntaxHighlighter.registerLanguage(name, definition),
);
const ALIASES = { js: "javascript", ts: "typescript", sh: "bash", shell: "bash", py: "python" };

const useCopy = () => {
  const { t } = useTranslation();
  const [state, setState] = useState("idle");

  const copy = useCallback(async (text) => {
    try {
      // navigator.clipboard is undefined outside a secure context — including
      // http://<lan-ip>:5173, which is exactly how you demo the app on a phone.
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(text);
      setState("copied");
    } catch {
      setState("failed");
    }
    setTimeout(() => setState("idle"), 2000);
  }, []);

  const label =
    state === "copied"
      ? t("message.copied")
      : state === "failed"
        ? t("message.copyFailed")
        : t("message.copy");
  return { copy, label };
};

const CodeBlock = ({ language, value }) => {
  const { copy, label } = useCopy();
  const resolved = ALIASES[language] ?? language;

  return (
    // max-w-full + overflow-x-auto: PreTag="div" means this wrapper is NOT the `.prose pre`
    // that index.css gives overflow to, so without this a long line widens the whole page.
    <div className="relative group/code max-w-full overflow-x-auto">
      <button
        type="button"
        onClick={() => copy(value)}
        className="absolute top-2 right-2 z-10 cursor-pointer text-xs bg-gray-700 text-white px-3 py-3 min-h-11 rounded hover:bg-gray-600 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-white transition-colors"
      >
        {label}
      </button>
      <SyntaxHighlighter
        style={vscDarkPlus}
        language={resolved in LANGUAGES ? resolved : "text"}
        PreTag="div"
        className="rounded-lg !text-sm"
      >
        {value}
      </SyntaxHighlighter>
    </div>
  );
};

const MARKDOWN_COMPONENTS = {
  // Intercept at `pre` rather than `code`: react-markdown removed the `inline` prop in
  // v9, so a fenced block with no language is indistinguishable from inline code by the
  // time it reaches the `code` component and used to render as a tiny grey pill.
  pre({ children }) {
    const codeElement = React.Children.toArray(children)[0];
    const className = codeElement?.props?.className ?? "";
    const match = /language-(\w+)/.exec(className);
    const value = String(codeElement?.props?.children ?? "").replace(/\n$/, "");
    return <CodeBlock language={match?.[1] ?? "text"} value={value} />;
  },
  code({ children, ...props }) {
    return (
      <code
        className="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded text-sm break-words"
        {...props}
      >
        {children}
      </code>
    );
  },
  a({ children, ...props }) {
    return (
      <a {...props} target="_blank" rel="noopener noreferrer nofollow">
        {children}
      </a>
    );
  },
};

/** Formatted in the app's language, not the browser's: "ru" is a 24-hour locale, so leaving
 *  this at the browser default would put "08:04 PM" inside an otherwise Russian interface. */
const formatTime = (timestamp, locale) => {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
};

const ChatMessage = ({ message, isUser }) => {
  const { t, lang } = useTranslation();
  const { copy, label } = useCopy();

  return (
    <div
      className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4 animate-fade-in`}
    >
      <div className={`max-w-3xl min-w-0 ${isUser ? "order-2" : "order-1"}`}>
        {/* The opposite-side gutter is halved on phones: 48px is 13% of a 360px screen. */}
        <div
          className={`px-4 py-3 rounded-2xl overflow-hidden ${
            isUser
              ? "bg-[var(--accent-primary)] text-white ml-6 sm:ml-12"
              : "bg-gray-100 dark:bg-[var(--bg-tertiary)] text-gray-900 dark:text-[var(--text-primary)] mr-6 sm:mr-12"
          }`}
        >
          {!isUser && (
            <div className="flex items-center justify-between gap-3 mb-2">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 truncate">
                {message.usedFallback && message.model
                  ? t("message.fellBack", { model: message.model })
                  : t("message.assistant")}
              </span>
              <button
                type="button"
                onClick={() => copy(message.content)}
                className="text-xs cursor-pointer shrink-0 rounded px-2.5 py-3 min-h-11 -my-3 -mr-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] transition-colors"
              >
                {label}
              </button>
            </div>
          )}

          {isUser ? (
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none break-words">
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={MARKDOWN_COMPONENTS}>
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>

        <div
          className={`text-xs text-gray-500 dark:text-gray-400 mt-1 ${isUser ? "text-right" : "text-left"}`}
        >
          {formatTime(message.timestamp, lang)}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
