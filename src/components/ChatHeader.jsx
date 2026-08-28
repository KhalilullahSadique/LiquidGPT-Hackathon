import React, { useEffect, useRef, useState } from "react";
import ModelSelector from "./ModelSelector";

const ChatHeader = ({
  selectedModel,
  onModelChange,
  onClearChat,
  onNewChat,
  onToggleSidebar,
  disabled,
  canClear,
  children,
}) => {
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
      <header className="border-b border-gray-200 dark:border-[var(--border-primary)] bg-white dark:bg-[var(--bg-secondary)] px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <button
              onClick={onToggleSidebar}
              aria-label="Toggle sidebar"
              className="p-2 cursor-pointer rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
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

            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 hidden sm:block">
              LiquidGPT
            </h1>

            <ModelSelector
              selectedModel={selectedModel}
              onModelChange={onModelChange}
              disabled={disabled}
            />
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={onNewChat}
              disabled={disabled}
              className="hidden sm:flex items-center px-3 py-1.5 cursor-pointer text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
              New Chat
            </button>

            <button
              onClick={onNewChat}
              disabled={disabled}
              aria-label="New chat"
              className="sm:hidden p-2 cursor-pointer rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
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

            <div className="flex items-center">{children}</div>

            <button
              onClick={() => setShowConfirmDialog(true)}
              disabled={disabled || !canClear}
              className="px-3 py-1.5 cursor-pointer text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Delete Chat
            </button>
          </div>
        </div>
      </header>

      <dialog
        ref={dialogRef}
        onClose={() => setShowConfirmDialog(false)}
        aria-labelledby="clear-chat-title"
        className="m-auto rounded-lg p-6 max-w-sm w-[calc(100%-2rem)] bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 backdrop:bg-black/50"
      >
        <h2 id="clear-chat-title" className="text-lg font-medium mb-2">
          Delete this conversation?
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          This removes the conversation and all of its messages from this browser. It
          cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={() => setShowConfirmDialog(false)}
            className="px-4 py-2 cursor-pointer text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-gray-500"
          >
            Cancel
          </button>
          <button
            onClick={confirmClearChat}
            className="px-4 py-2 cursor-pointer text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-red-500"
          >
            Delete
          </button>
        </div>
      </dialog>
    </>
  );
};

export default ChatHeader;
