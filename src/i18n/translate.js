import { DEFAULT_LOCALE } from "./locales";
import en, { suggestions as enSuggestions } from "./en";
import ru, { suggestions as ruSuggestions } from "./ru";

/**
 * Each locale is layered over English, so a key that has not been translated yet renders the
 * English string rather than a blank element or a raw key.
 */
const DICTIONARIES = {
  en,
  ru: { ...en, ...ru },
};

const SUGGESTIONS = {
  en: enSuggestions,
  ru: ruSuggestions,
};

if (import.meta.env.DEV) {
  // Each locale is layered over English, so a missing translation silently resolves to the
  // English string and is undetectable at runtime. This is the only place it can be caught.
  for (const [code, dictionary] of Object.entries({ ru })) {
    const missing = Object.keys(en).filter((key) => !(key in dictionary));
    if (missing.length) {
      console.warn(`[i18n] ${code} is missing ${missing.length} key(s):`, missing);
    }
  }
}

const INTERPOLATION = /\{(\w+)\}/g;

// Warn once per key, not once per render — a missing key in a message list would otherwise
// produce hundreds of identical lines.
const warned = new Set();

/**
 * Build a `t(key, params)` for one locale.
 *
 * A missing key returns the key itself: a visible identifier is debuggable, an empty string
 * is a silently broken heading. Pass `{ count }` to select a plural form — the `.one` / `.few`
 * / `.many` / `.other` variants are chosen by Intl.PluralRules, which already knows that
 * Russian wants "1 день / 2 дня / 5 дней" and English only wants two forms.
 */
export const createTranslator = (locale) => {
  const dictionary = DICTIONARIES[locale] ?? DICTIONARIES[DEFAULT_LOCALE];
  const pluralRules = new Intl.PluralRules(locale);
  const numberFormat = new Intl.NumberFormat(locale);

  return (key, params) => {
    let template = dictionary[key];

    if (template === undefined && typeof params?.count === "number") {
      const category = pluralRules.select(params.count);
      template = dictionary[`${key}.${category}`] ?? dictionary[`${key}.other`];
    }

    if (template === undefined) {
      if (import.meta.env.DEV && !warned.has(key)) {
        warned.add(key);
        console.warn(`[i18n] missing key: ${key}`);
      }
      return key;
    }

    if (!params) return template;

    return template.replace(INTERPOLATION, (match, name) => {
      if (!Object.hasOwn(params, name)) return match;
      const value = params[name];
      // Group separators are locale-specific ("2,000" vs "2 000"). Formatting here means no
      // call site can forget, and the same number can never be printed two different ways.
      return typeof value === "number" ? numberFormat.format(value) : String(value);
    });
  };
};

export const getSuggestions = (locale) => SUGGESTIONS[locale] ?? SUGGESTIONS[DEFAULT_LOCALE];
