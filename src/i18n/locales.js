/**
 * Locale registry and detection.
 *
 * Deliberately free of React and of any dictionary import: this is the module the pre-paint
 * script in index.html mirrors, and the two MUST agree. If you add a locale here, add it to
 * the `supported` array in that inline script in the same commit.
 */
export const SUPPORTED_LOCALES = ["en", "ru"];

export const DEFAULT_LOCALE = "en";

/** Prefixed, matching liquidgpt-model / liquidgpt-conversations. The bare "theme" key is a
 *  pre-existing outlier that exists only because the inline script hardcodes that literal. */
export const STORAGE_KEY = "liquidgpt-lang";

/** Endonyms: a language picker that names languages in the reader's own language is useless
 *  to the person who cannot read the current one. */
export const LOCALE_LABELS = {
  en: "English",
  ru: "Русский",
};

export const isSupported = (value) => SUPPORTED_LOCALES.includes(value);

/**
 * "ru-RU", "RU", "ru-KZ" and "ru" all resolve to "ru".
 *
 * Matching on the base subtag rather than a country list is what makes this work for Russian
 * speakers outside Russia, whose browsers report ru-KZ, ru-BY or ru-UA.
 */
export const normaliseLocale = (value) => {
  if (typeof value !== "string") return null;
  const base = value.toLowerCase().split("-")[0];
  return isSupported(base) ? base : null;
};

export const readStoredLocale = () => {
  try {
    return normaliseLocale(localStorage.getItem(STORAGE_KEY));
  } catch {
    /* storage disabled: fall through to detection */
    return null;
  }
};

