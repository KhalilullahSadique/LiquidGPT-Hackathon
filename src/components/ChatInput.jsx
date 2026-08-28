import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "../i18n/useTranslation";

const MAX_CHARS = 2000;

/**
 * Keys that accept the first suggestion. End is what was originally asked for; ArrowRight is
 * the convention from shell autosuggest.
 *
 * Tab was deliberately REMOVED. The suggestions are now focusable chips, so swallowing Tab in
 * the empty textarea would trap a keyboard user instead of letting them reach the chips. Do
 * not add it back.
 */
const ACCEPT_KEYS = new Set(["End", "ArrowRight"]);

/** Matches the CSS cap of min(200px, 35dvh): on a short phone with the keyboard open, a
 *  flat 200px textarea swallows most of what is left of the viewport. */
const maxTextareaHeight = () => Math.min(200, Math.round(window.innerHeight * 0.35));

const ChatInput = ({ onSend, onCancel, disabled, isLoading }) => {
  const { t, lang, suggestions } = useTranslation();
  const [message, setMessage] = useState("");
  const [wasTruncated, setWasTruncated] = useState(false);
  const [suggestionIndex, setSuggestionIndex] = useState(0);
  const textareaRef = useRef(null);

  const charCount = message.length;
  // Only offer them while the box is empty, so they can never fight what is being typed.
  const isSuggesting = message.length === 0 && !isLoading && !disabled;

  // Rotate the list rather than replacing one hint, so the chip a keyboard user accepts with
  // End still changes after each send, exactly as the single placeholder used to.
  const rotatedSuggestions = useMemo(() => {
    if (!suggestions.length) return [];
    const offset = suggestionIndex % suggestions.length;
    return [...suggestions.slice(offset), ...suggestions.slice(0, offset)];
  }, [suggestions, suggestionIndex]);

  const primarySuggestion = rotatedSuggestions[0] ?? "";

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, maxTextareaHeight())}px`;
  }, [message]);

  // The textarea is disabled while a reply is in flight, which blurs it. Hand focus back so
  // the next message can be typed without reaching for the mouse.
  //
  // Pointer devices only: on a phone, refocusing pops the on-screen keyboard straight back up
  // and covers the answer the user was waiting to read. `(hover: hover)` is the same signal
  // Tailwind itself uses to separate touch from pointer.
  useEffect(() => {
    if (isLoading || disabled) return;
    if (!window.matchMedia("(hover: hover)").matches) return;
    textareaRef.current?.focus();
  }, [isLoading, disabled]);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!message.trim() || disabled || isLoading) return;
    onSend(message.trim());
    setMessage("");
    setWasTruncated(false);
    setSuggestionIndex((index) => index + 1);
  };

  /** Fill the box and focus it, so a tap leaves the caret ready to edit or send. */
  const applySuggestion = (text) => {
    setMessage(text);
    setWasTruncated(false);
    textareaRef.current?.focus();
  };

  const handleKeyDown = (event) => {
    // Accept the hint. Guarded on an empty box so End still moves the caret normally, and
    // on no modifiers so Shift+End (select to end) keeps working.
    if (
      isSuggesting &&
      primarySuggestion &&
      ACCEPT_KEYS.has(event.key) &&
      !event.shiftKey &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.altKey
    ) {
      event.preventDefault();
      setMessage(primarySuggestion);
      return;
    }

    // isComposing is true while an IME candidate is open — Russian, Urdu, Arabic and CJK
    // input methods use Enter to commit a candidate, which must not send the message.
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      handleSubmit(event);
    }
  };

  const handleChange = (event) => {
    const value = event.target.value;
    // Truncate rather than reject: the previous version dropped an over-long paste
    // entirely, so the box silently snapped back with no explanation.
    if (value.length > MAX_CHARS) {
      setMessage(value.slice(0, MAX_CHARS));
      setWasTruncated(true);
      return;
    }
    setMessage(value);
    setWasTruncated(false);
  };

  return (
    <div className="border-t border-gray-200 dark:border-[var(--border-primary)] bg-white dark:bg-[var(--bg-secondary)] p-4 pb-[max(1rem,env(safe-area-inset-bottom))] pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))]">
      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
        {/* The tappable half of the suggestion feature. A phone keyboard has no End key, so
            without these the placeholder hint was an offer the user could not accept. */}
        {isSuggesting && rotatedSuggestions.length > 0 && (
          <div
            role="group"
            aria-label={t("input.suggestionsLabel")}
            className="flex gap-2 overflow-x-auto overscroll-x-contain pb-2 -mx-1 px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {rotatedSuggestions.map((text) => (
              <button
                key={text}
                type="button"
                onClick={() => applySuggestion(text)}
                className="shrink-0 whitespace-nowrap rounded-full border border-gray-300 dark:border-[var(--border-secondary)] bg-gray-50 dark:bg-[var(--bg-tertiary)] px-3.5 py-2.5 min-h-11 text-sm text-gray-700 dark:text-[var(--text-secondary)] hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-[var(--bg-hover)] dark:hover:text-[var(--text-primary)] focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] transition-colors"
              >
                {text}
              </button>
            ))}
          </div>
        )}

        <div className="relative">
          <label htmlFor="chat-input" className="sr-only">
            {t("input.label")}
          </label>
          <textarea
            id="chat-input"
            ref={textareaRef}
            value={message}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={isSuggesting && primarySuggestion ? primarySuggestion : t("input.placeholder")}
            disabled={disabled || isLoading}
            aria-describedby="chat-input-help"
            // lang tells the on-screen keyboard which dictionary, autocorrect and swipe model
            // to load — this is what makes typing Russian on a phone actually pleasant.
            lang={lang}
            enterKeyHint="send"
            autoCapitalize="sentences"
            autoCorrect="on"
            spellCheck="true"
            // text-base is explicit, not incidental: anything under 16px makes iOS Safari
            // zoom the page on focus and never zoom back.
            className="w-full px-4 py-3 pr-12 text-base bg-gray-50 dark:bg-[var(--bg-tertiary)] border border-gray-300 dark:border-[var(--border-primary)] rounded-2xl resize-none focus:outline-hidden focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 dark:text-[var(--text-primary)] placeholder-gray-500 dark:placeholder-[var(--text-tertiary)]"
            rows={1}
            style={{ minHeight: "52px", maxHeight: "min(200px, 35dvh)" }}
          />

          {isLoading ? (
            <button
              type="button"
              onClick={onCancel}
              aria-label={t("input.stop")}
              className="absolute right-2 bottom-2 p-2.5 min-h-11 min-w-11 cursor-pointer bg-gray-700 dark:bg-gray-600 text-white rounded-xl hover:bg-gray-800 dark:hover:bg-gray-500 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-gray-500 transition-all duration-200"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
            </button>
          ) : (
            <button
              type="submit"
              disabled={!message.trim() || disabled}
              aria-label={t("input.send")}
              className="absolute right-2 bottom-2 p-2.5 min-h-11 min-w-11 cursor-pointer bg-[var(--accent-primary)] text-white rounded-xl hover:bg-[var(--accent-hover)] focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            </button>
          )}
        </div>

        <div
          id="chat-input-help"
          className="flex justify-between items-center gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400"
        >
          <span className="shrink-0">
            {t("input.counter", { count: charCount, max: MAX_CHARS })}
          </span>
          {/* Mobile used to get no hint at all, so the chips would have gone unnoticed too. */}
          <span className="text-gray-400 truncate text-right">
            <span className="hidden sm:inline">
              {isSuggesting ? t("input.hintSuggesting") : t("input.hintTyping")}
            </span>
            <span className="sm:hidden">{isSuggesting ? t("input.hintMobile") : ""}</span>
          </span>
        </div>

        {wasTruncated && (
          <p role="status" className="text-xs text-orange-500 dark:text-orange-400 mt-1">
            {t("input.truncated", { max: MAX_CHARS })}
          </p>
        )}
        {!wasTruncated && charCount >= MAX_CHARS * 0.9 && (
          <p className="text-xs text-orange-500 dark:text-orange-400 mt-1">
            {t("input.nearLimit")}
          </p>
        )}
      </form>
    </div>
  );
};

export default ChatInput;
