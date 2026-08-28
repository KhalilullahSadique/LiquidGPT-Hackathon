import React, { useState } from "react";
import logo from "../assets/logo.jfif";

/**
 * Calendar-day difference, not a rolling 24h window. The previous version used
 * Math.ceil over an absolute millisecond diff, which labelled a chat from two minutes
 * ago as "-1 days ago" and a chat from 25 hours ago as "Today".
 */
const formatDate = (timestamp) => {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "";

  const startOfDay = (value) =>
    new Date(value.getFullYear(), value.getMonth(), value.getDate());
  const days = Math.round((startOfDay(new Date()) - startOfDay(date)) / 86_400_000);

  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
};

const Sidebar = ({
  isOpen,
  onToggle,
  conversations,
  currentConversationId,
  onConversationSelect,
  onConversationDelete,
  onNewChat,
  disabled,
}) => {
  const [pendingDeleteId, setPendingDeleteId] = useState(null);

  // Only collapse on mobile, where the sidebar is a full-screen overlay. On desktop it is
  // a docked column and closing it on every new chat is just an annoyance.
  const closeIfOverlay = () => {
    if (!window.matchMedia("(min-width: 1024px)").matches) onToggle();
  };

  const handleNewChat = () => {
    onNewChat();
    closeIfOverlay();
  };

  const handleSelect = (conversationId) => {
    setPendingDeleteId(null);
    onConversationSelect(conversationId);
    closeIfOverlay();
  };

  const confirmDelete = (conversationId) => {
    setPendingDeleteId(null);
    onConversationDelete(conversationId);
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggle}
          aria-hidden="true"
        />
      )}

      <aside
        aria-label="Conversation history"
        aria-hidden={!isOpen}
        inert={!isOpen ? "" : undefined}
        className={`
        fixed inset-y-0 left-0 z-50 bg-white dark:bg-[var(--bg-secondary)] border-r border-gray-200 dark:border-[var(--border-primary)]
        transition-all duration-300 ease-in-out flex flex-col
        lg:static lg:z-0
        ${isOpen ? "translate-x-0 lg:w-64 lg:translate-x-0" : "-translate-x-full lg:w-0 lg:translate-x-0 lg:overflow-hidden"}
        w-64
      `}
      >
        <div className="p-4 border-b border-gray-200 dark:border-[var(--border-primary)]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <img src={logo} alt="" className="w-8 h-8 rounded-full object-cover" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                LiquidGPT
              </h2>
            </div>
            <button
              onClick={onToggle}
              aria-label="Close sidebar"
              className="lg:hidden p-2 cursor-pointer text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] rounded-lg"
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <button
            onClick={handleNewChat}
            className="w-full px-4 py-2 cursor-pointer bg-[image:var(--accent-gradient)] text-white rounded-lg hover:opacity-90 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] transition-all flex items-center justify-center space-x-2 shadow-lg"
          >
            <svg
              className="w-4 h-4"
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
            <span>New Chat</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {conversations.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No conversations yet
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Start a new chat to see it here
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {conversations.map((conversation) => {
                const isCurrent = currentConversationId === conversation.id;
                const isPendingDelete = pendingDeleteId === conversation.id;

                return (
                  <li
                    key={conversation.id}
                    className={`
                      group relative rounded-lg transition-colors
                      ${
                        isCurrent
                          ? "bg-gray-50 dark:bg-[var(--bg-hover)] border border-[var(--accent-primary)]/30 dark:border-[var(--accent-primary)]/50"
                          : "hover:bg-gray-50 dark:hover:bg-[var(--bg-hover)] border border-transparent"
                      }
                    `}
                  >
                    <button
                      type="button"
                      onClick={() => handleSelect(conversation.id)}
                      disabled={disabled}
                      aria-current={isCurrent ? "true" : undefined}
                      className="w-full text-left p-3 pr-16 cursor-pointer rounded-lg disabled:cursor-not-allowed disabled:opacity-60 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
                    >
                      <span className="block text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {conversation.title}
                      </span>
                      <span className="block text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {formatDate(conversation.updatedAt)}
                      </span>
                    </button>

                    <div className="absolute top-2.5 right-2 flex items-center gap-1">
                      {isPendingDelete ? (
                        <>
                          <button
                            type="button"
                            onClick={() => confirmDelete(conversation.id)}
                            aria-label={`Confirm deleting "${conversation.title}"`}
                            className="p-1 cursor-pointer rounded text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/50 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-red-500"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              aria-hidden="true"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => setPendingDeleteId(null)}
                            aria-label="Cancel delete"
                            className="p-1 cursor-pointer rounded text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-gray-500"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              aria-hidden="true"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setPendingDeleteId(conversation.id)}
                          disabled={disabled}
                          aria-label={`Delete "${conversation.title}"`}
                          className="p-1 cursor-pointer rounded text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity disabled:cursor-not-allowed focus:outline-hidden focus-visible:ring-2 focus-visible:ring-red-500"
                        >
                          <svg
                            className="w-4 h-4"
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
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
