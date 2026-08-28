import { useContext } from "react";
import { LanguageContext } from "./LanguageContext";

/** `{ t, lang, setLang, suggestions }`. Throws outside the provider rather than silently
 *  rendering raw keys, which is the failure mode that is hard to spot in review. */
export const useTranslation = () => {
  const value = useContext(LanguageContext);
  if (!value) {
    throw new Error("useTranslation must be used inside <LanguageProvider>");
  }
  return value;
};
