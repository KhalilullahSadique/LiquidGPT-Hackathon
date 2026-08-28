import React from "react";
import { DEFAULT_LOCALE, isSupported } from "../i18n/locales";
import { createTranslator } from "../i18n/translate";

/**
 * Without this, one malformed markdown or highlight render takes the whole app to a
 * blank white page with no way back except a manual reload.
 *
 * This is a class component, so it cannot use the useTranslation hook — and it deliberately
 * sits OUTSIDE LanguageProvider, so that a crash inside the provider still renders. It reads
 * the language straight off <html lang>, which the pre-paint script set before React ever
 * mounted, and falls back to English if that is somehow not a language we speak.
 */
class ErrorBoundary extends React.Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("LiquidGPT crashed:", error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;

    const documentLang = document.documentElement.lang;
    const t = createTranslator(isSupported(documentLang) ? documentLang : DEFAULT_LOCALE);

    return (
      <div className="min-h-dvh flex items-center justify-center p-6 bg-gray-50 dark:bg-[var(--bg-primary)]">
        <div className="max-w-md w-full rounded-2xl border border-gray-200 dark:border-[var(--border-primary)] bg-white dark:bg-[var(--bg-secondary)] p-6 text-center">
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            {t("crash.title")}
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{t("crash.body")}</p>
          <pre className="text-left text-xs overflow-x-auto rounded-lg bg-gray-100 dark:bg-[var(--bg-tertiary)] p-3 mb-4 text-gray-700 dark:text-gray-300">
            {String(this.state.error?.message ?? this.state.error)}
          </pre>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-4 py-2.5 min-h-11 cursor-pointer text-sm bg-[var(--accent-primary)] text-white rounded-lg hover:bg-[var(--accent-hover)] focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
          >
            {t("crash.reload")}
          </button>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
