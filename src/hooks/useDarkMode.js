import { useCallback, useEffect, useState } from "react";

const THEME_KEY = "theme";

export const useDarkMode = () => {
  // The inline script in index.html has already applied the class before first paint;
  // read back from the DOM rather than recomputing and risking a mismatch.
  const [isDark, setIsDark] = useState(() =>
    document.documentElement.classList.contains("dark"),
  );
  const [hasExplicitChoice, setHasExplicitChoice] = useState(() => {
    try {
      return Boolean(localStorage.getItem(THEME_KEY));
    } catch {
      return false;
    }
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    // Only persist a choice the user actually made. Writing the OS preference on first
    // render used to pin the theme forever, so later OS changes were ignored.
    if (!hasExplicitChoice) return;
    try {
      localStorage.setItem(THEME_KEY, isDark ? "dark" : "light");
    } catch {
      /* storage disabled: the theme still applies for this session */
    }
  }, [isDark, hasExplicitChoice]);

  // Follow the OS for as long as the user has not overridden it.
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (event) => {
      if (hasExplicitChoice) return;
      setIsDark(event.matches);
    };
    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, [hasExplicitChoice]);

  const toggleDarkMode = useCallback(() => {
    setHasExplicitChoice(true);
    setIsDark((previous) => !previous);
  }, []);

  return { isDark, toggleDarkMode };
};
