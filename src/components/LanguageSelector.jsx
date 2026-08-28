import React from "react";
import { LOCALE_LABELS, SUPPORTED_LOCALES } from "../i18n/locales";
import { useTranslation } from "../i18n/useTranslation";

/**
 * A native <select>, matching the ModelSelector idiom.
 *
 * Native is the right call on a phone: it gets the OS picker for free, needs no focus trap,
 * and stays operable with a screen reader without any custom ARIA.
 *
 * Options are labelled with endonyms ("Русский", not "Russian") — a picker that names
 * languages in the language you cannot currently read is useless to the person who needs it.
 * Note an <option> may only contain text, so a responsive <span> inside one does not render
 * as markup, it concatenates.
 *
 * Lives in the sidebar footer rather than the header: at 320px the header could not fit a
 * second <select> without the model picker overlapping it, and the sidebar has room for a
 * full visible label at every breakpoint.
 */
const LanguageSelector = () => {
  const { t, lang, setLang } = useTranslation();

  return (
    <div className="flex items-center justify-between gap-2">
      <label
        htmlFor="language-select"
        className="text-sm font-medium text-gray-700 dark:text-gray-300 shrink-0"
      >
        {t("language.label")}
      </label>
      {/* text-base below sm: anything under 16px makes iOS Safari zoom the page on focus. */}
      <select
        id="language-select"
        value={lang}
        onChange={(event) => setLang(event.target.value)}
        className="min-w-0 flex-1 max-w-[9rem] px-2 py-1.5 min-h-11 cursor-pointer bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-base sm:text-sm focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] text-gray-900 dark:text-gray-100"
      >
        {SUPPORTED_LOCALES.map((locale) => (
          <option key={locale} value={locale}>
            {LOCALE_LABELS[locale]}
          </option>
        ))}
      </select>
    </div>
  );
};

export default LanguageSelector;
