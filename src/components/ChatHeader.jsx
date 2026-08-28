import React, { useEffect, useRef, useState } from "react";
import ModelSelector from "./ModelSelector";
import { useTranslation } from "../i18n/useTranslation";

const ChatHeader = ({
  selectedModel,
  onModelChange,
  onClearChat,
  onNewChat,
  onToggleSidebar,
  disabled,
  canClear,
}) => {
  const { t } = useTranslation();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const dialogRef = useRef(null);

  // A native <dialog> in modal mode gives us the four things the old div overlay lacked:
  // a focus trap, Escape to close, an inert background, and focus returned to the trigger.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (showConfirmDialog && !dialog.open) dialog.showModal();
    if (!showConfirmDialog && dialog.open) dialog.close();
  }, [showConfirmDialog]);

  const confirmClearChat = () => {
    onClearChat();
    setShowConfirmDialog(false);
  };

  return (
    <>
      <header className="border-b border-gray-200 dark:border-[var(--border-primary)] bg-white dark:bg-[var(--bg-secondary)] px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))]">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <button
              onClick={onToggleSidebar}
              aria-label={t("header.toggleSidebar")}
              className="p-2 min-h-11 min-w-11 cursor-pointer rounded-lg shrink-0 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>

            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 sr-only lg:not-sr-only lg:block">
              LiquidGPT
            </h1>

            <ModelSelector
              selectedModel={selectedModel}
              onModelChange={onModelChange}
              disabled={disabled}
            />
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <button
              onClick={onNewChat}
              disabled={disabled}
              className="hidden sm:flex items-center px-3 py-1.5 min-h-11 cursor-pointer text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg
                className="w-4 h-4 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              {t("header.newChat")}
            </button>

            <button
              onClick={onNewChat}
              disabled={disabled}
              aria-label={t("header.newChatAria")}
              className="sm:hidden p-2 min-h-11 min-w-11 cursor-pointer rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </button>

            <button
              onClick={() => setShowConfirmDialog(true)}
              disabled={disabled || !canClear}
              className="hidden sm:block px-3 py-1.5 min-h-11 cursor-pointer text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {t("header.deleteChat")}
            </button>

            {/* Icon-only below sm:, mirroring New Chat — the text label plus a language
                picker does not fit a 320px header. */}
            <button
              onClick={() => setShowConfirmDialog(true)}
              disabled={disabled || !canClear}
              aria-label={t("header.deleteChatAria")}
              className="sm:hidden p-2 min-h-11 min-w-11 cursor-pointer rounded-lg text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-hidden focus-visible:ring-2 focus-visible:ring-red-500"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <dialog
        ref={dialogRef}
        onClose={() => setShowConfirmDialog(false)}
        aria-labelledby="clear-chat-title"
        className="m-auto rounded-lg p-6 max-w-sm w-[calc(100%-2rem)] max-h-[85dvh] overflow-y-auto bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 backdrop:bg-black/50"
      >
        <h2 id="clear-chat-title" className="text-lg font-medium mb-2">
          {t("header.confirmTitle")}
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          {t("header.confirmBody")}
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={() => setShowConfirmDialog(false)}
            className="px-4 py-2.5 min-h-11 cursor-pointer text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-gray-500"
          >
            {t("header.cancel")}
          </button>
          <button
            onClick={confirmClearChat}
            className="px-4 py-2.5 min-h-11 cursor-pointer text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-red-500"
          >
            {t("header.delete")}
          </button>
        </div>
      </dialog>
    </>
  );
};

export default ChatHeader;
