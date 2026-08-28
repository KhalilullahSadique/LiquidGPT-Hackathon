import React, { useCallback, useEffect, useMemo, useState } from "react";
import { LanguageContext } from "./LanguageContext";
import { DEFAULT_LOCALE, isSupported, readStoredLocale, STORAGE_KEY } from "./locales";
import { createTranslator, getSuggestions } from "./translate";

/**
 * Language state, modelled on useDarkMode.
 *
 * The inline script in index.html has already resolved the language and written it to
 * <html lang> before first paint, so this reads the answer back off the DOM instead of
 * recomputing it and risking a mismatch.
 *
 * Note there is no equivalent of the theme's matchMedia listener: unlike
 * prefers-color-scheme, `navigator.language` has no dependable change event, and browsers
 * generally require a reload before navigator.languages reflects a new OS setting. Detection
 * therefore runs once per load, on purpose.
 */
export const LanguageProvider = ({ children }) => {
  const [lang, setLangState] = useState(() => {
    const fromDocument = document.documentElement.lang;
    return isSupported(fromDocument) ? fromDocument : DEFAULT_LOCALE;
  });

  // Validated, not just present: a stale or corrupt stored value must not count as a
  // choice, or we would write our English fallback back to storage and permanently disable
  // device detection for that user.
  const [hasExplicitChoice, setHasExplicitChoice] = useState(
    () => readStoredLocale() !== null,
  );

  useEffect(() => {
    document.documentElement.lang = lang;
    // Only persist a choice the user actually made. Writing the detected device language on
    // first render would pin it forever, so a later OS change could never take effect.
    if (!hasExplicitChoice) return;
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      /* storage disabled: the language still applies for this session */
    }
  }, [lang, hasExplicitChoice]);

  const setLang = useCallback((next) => {
    if (!isSupported(next)) return;
    setHasExplicitChoice(true);
    setLangState(next);
  }, []);

  const value = useMemo(
    () => ({
      lang,
      setLang,
      t: createTranslator(lang),
      suggestions: getSuggestions(lang),
    }),
    [lang, setLang],
  );

  return <LanguageContext value={value}>{children}</LanguageContext>;
};
