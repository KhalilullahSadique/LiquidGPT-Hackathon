import { createContext } from "react";

/**
 * Split from the provider so neither file exports both a component and a non-component,
 * which is what `react-refresh/only-export-components` forbids.
 */
export const LanguageContext = createContext(null);
