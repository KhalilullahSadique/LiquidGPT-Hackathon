import React, { useEffect, useRef, useState } from "react";
import { SUGGESTIONS } from "../constants/suggestions";

const MAX_CHARS = 2000;

// Keys that accept the suggestion. End is what was asked for; Tab and ArrowRight are the
// conventions people already know from shell autosuggest and editor completions.
const ACCEPT_KEYS = new Set(["End", "Tab", "ArrowRight"]);

const ChatInput = ({ onSend, onCancel, disabled, isLoading }) => {
  const [message, setMessage] = useState("");
  const [wasTruncated, setWasTruncated] = useState(false);
  const [suggestionIndex, setSuggestionIndex] = useState(0);
  const textareaRef = useRef(null);

  const charCount = message.length;
  const suggestion = SUGGESTIONS[suggestionIndex % SUGGESTIONS.length];
  // Only offer it while the box is empty, so it can never fight what is being typed.
  const isSuggesting = message.length === 0 && !isLoading && !disabled;

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
  }, [message]);

  // The textarea is disabled while a reply is in flight, which blurs it. Hand focus back
  // so the next message can be typed without reaching for the mouse.
  useEffect(() => {
    if (!isLoading && !disabled) textareaRef.current?.focus();
  }, [isLoading, disabled]);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!message.trim() || disabled || isLoading) return;
    onSend(message.trim());
    setMessage("");
    setWasTruncated(false);
    setSuggestionIndex((index) => index + 1);
  };

  const handleKeyDown = (event) => {
    // Accept the hint. Guarded on an empty box so End still moves the caret normally, and
    // on no modifiers so Shift+End (select to end) keeps working.
    if (
      isSuggesting &&
      ACCEPT_KEYS.has(event.key) &&
      !event.shiftKey &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.altKey
    ) {
      event.preventDefault();
      setMessage(suggestion);
      return;
    }

    // isComposing is true while an IME candidate is open — Urdu, Arabic and CJK input
    // methods use Enter to commit a candidate, which must not send the message.
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
    <div className="border-t border-gray-200 dark:border-[var(--border-primary)] bg-white dark:bg-[var(--bg-secondary)] p-4">
      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
        <div className="relative">
          <label htmlFor="chat-input" className="sr-only">
            Message LiquidGPT
          </label>
          <textarea
            id="chat-input"
            ref={textareaRef}
            value={message}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={isSuggesting ? suggestion : "Message LiquidGPT..."}
            disabled={disabled || isLoading}
            aria-describedby="chat-input-help"
            className="w-full px-4 py-3 pr-12 bg-gray-50 dark:bg-[var(--bg-tertiary)] border border-gray-300 dark:border-[var(--border-primary)] rounded-2xl resize-none focus:outline-hidden focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 dark:text-[var(--text-primary)] placeholder-gray-500 dark:placeholder-[var(--text-tertiary)]"
            rows={1}
            style={{ minHeight: "52px", maxHeight: "200px" }}
          />

          {isLoading ? (
            <button
              type="button"
              onClick={onCancel}
              aria-label="Stop generating"
              className="absolute right-2 bottom-2 p-2 cursor-pointer bg-gray-700 dark:bg-gray-600 text-white rounded-xl hover:bg-gray-800 dark:hover:bg-gray-500 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-gray-500 transition-all duration-200"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
            </button>
          ) : (
            <button
              type="submit"
              disabled={!message.trim() || disabled}
              aria-label="Send message"
              className="absolute right-2 bottom-2 p-2 cursor-pointer bg-[var(--accent-primary)] text-white rounded-xl hover:bg-[var(--accent-hover)] focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
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
          className="flex justify-between items-center mt-2 text-xs text-gray-500 dark:text-gray-400"
        >
          <span>
            {charCount}/{MAX_CHARS} characters
          </span>
          <span className="text-gray-400 hidden sm:inline">
            {isSuggesting
              ? "Press End to use this prompt, then Enter to send"
              : "Press Enter to send, Shift+Enter for new line"}
          </span>
        </div>

        {wasTruncated && (
          <p role="status" className="text-xs text-orange-500 dark:text-orange-400 mt-1">
            Trimmed to the {MAX_CHARS.toLocaleString()} character limit.
          </p>
        )}
        {!wasTruncated && charCount >= MAX_CHARS * 0.9 && (
          <p className="text-xs text-orange-500 dark:text-orange-400 mt-1">
            Approaching character limit
          </p>
        )}
      </form>
    </div>
  );
};

export default ChatInput;
