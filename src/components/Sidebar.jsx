import React, { useState } from "react";
import logo from "../assets/logo.jfif";
import { useTranslation } from "../i18n/useTranslation";
import LanguageSelector from "./LanguageSelector";
import DarkModeToggle from "./DarkModeToggle";

/**
 * Calendar-day difference, not a rolling 24h window. The previous version used
 * Math.ceil over an absolute millisecond diff, which labelled a chat from two minutes
 * ago as "-1 days ago" and a chat from 25 hours ago as "Today".
 *
 * `t` selects the plural form via Intl.PluralRules, which matters here: Russian needs three
 * ("1 день / 2 дня / 5 дней") where English needs two. The absolute date is formatted in the
 * app's locale so a Russian UI does not show English month abbreviations.
 */
const formatDate = (timestamp, t, locale) => {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "";

  const startOfDay = (value) =>
    new Date(value.getFullYear(), value.getMonth(), value.getDate());
  const days = Math.round((startOfDay(new Date()) - startOfDay(date)) / 86_400_000);

  if (days <= 0) return t("date.today");
  if (days === 1) return t("date.yesterday");
  if (days < 7) return t("date.daysAgo", { count: days });
  return date.toLocaleDateString(locale, { month: "short", day: "numeric" });
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
  isDark,
  onToggleDarkMode,
}) => {
  const { t, lang } = useTranslation();
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

      {/* w-[min(16rem,85vw)] below lg: a hard 256px panel leaves only a 64px backdrop
          sliver on a 320px phone, which is not enough to tap to dismiss. */}
      <aside
        aria-label={t("sidebar.history")}
        aria-hidden={!isOpen}
        // React 19 treats an empty string as false, so the old `inert={!isOpen ? "" : undefined}`
        // silently applied nothing: the closed overlay stayed focusable behind the backdrop.
        inert={!isOpen}
        className={`
        fixed inset-y-0 left-0 z-50 bg-white dark:bg-[var(--bg-secondary)] border-r border-gray-200 dark:border-[var(--border-primary)]
        transition-all duration-300 ease-in-out flex flex-col
        pl-[env(safe-area-inset-left)]
        lg:static lg:z-0
        ${isOpen ? "translate-x-0 lg:w-64 lg:translate-x-0" : "-translate-x-full lg:w-0 lg:translate-x-0 lg:overflow-hidden"}
        w-[min(16rem,85vw)] lg:w-64
      `}
      >
        <div className="p-4 border-b border-gray-200 dark:border-[var(--border-primary)] pt-[max(1rem,env(safe-area-inset-top))]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <img src={logo} alt="" className="w-8 h-8 rounded-full object-cover" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                LiquidGPT
              </h2>
            </div>
            <button
              onClick={onToggle}
              aria-label={t("sidebar.close")}
              className="lg:hidden p-2.5 min-h-11 min-w-11 cursor-pointer text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] rounded-lg"
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
            className="w-full px-4 py-2.5 min-h-11 cursor-pointer bg-[image:var(--accent-gradient)] text-white rounded-lg hover:opacity-90 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] transition-all flex items-center justify-center space-x-2 shadow-lg"
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
            <span>{t("sidebar.newChat")}</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain p-4">
          {conversations.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t("sidebar.emptyTitle")}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                {t("sidebar.emptyBody")}
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
                      className="w-full text-left p-3 pr-20 cursor-pointer rounded-lg disabled:cursor-not-allowed disabled:opacity-60 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
                    >
                      <span className="block text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {conversation.title}
                      </span>
                      <span className="block text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {formatDate(conversation.updatedAt, t, lang)}
                      </span>
                    </button>

                    <div className="absolute top-1.5 right-1 flex items-center gap-1">
                      {isPendingDelete ? (
                        <>
                          <button
                            type="button"
                            onClick={() => confirmDelete(conversation.id)}
                            aria-label={t("sidebar.confirmDelete", {
                              title: conversation.title,
                            })}
                            className="p-2.5 min-h-11 min-w-11 cursor-pointer rounded text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/50 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-red-500"
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
                            aria-label={t("sidebar.cancelDelete")}
                            className="p-2.5 min-h-11 min-w-11 cursor-pointer rounded text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-gray-500"
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
                        // Visible by default, hover-revealed only from lg: up. Tailwind emits
                        // group-hover inside @media (hover: hover), so on a touch device the
                        // old opacity-0 + group-hover rule did not merely fail to fire — it
                        // was never generated, leaving no way to delete a chat on a phone.
                        <button
                          type="button"
                          onClick={() => setPendingDeleteId(conversation.id)}
                          disabled={disabled}
                          aria-label={t("sidebar.delete", { title: conversation.title })}
                          className="p-2.5 min-h-11 min-w-11 cursor-pointer rounded text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 focus-visible:opacity-100 transition-opacity disabled:cursor-not-allowed focus:outline-hidden focus-visible:ring-2 focus-visible:ring-red-500"
                        >
                          <svg
                            className="w-5 h-5 lg:w-4 lg:h-4"
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

        {/* Settings live here rather than in the header: at 320px the header could not hold a
            second <select> without the model picker overlapping it, and these two are changed
            rarely. A visible label beats a cramped icon. */}
        <div className="border-t border-gray-200 dark:border-[var(--border-primary)] p-3 space-y-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <LanguageSelector />
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t("theme.label")}
            </span>
            <DarkModeToggle isDark={isDark} onToggle={onToggleDarkMode} />
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
