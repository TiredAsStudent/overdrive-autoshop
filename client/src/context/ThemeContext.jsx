import React, {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useState,
  useCallback,
} from "react";

const ThemeContext = createContext(null);

const THEME_STORAGE_KEY = "theme";
const VALID_THEMES = ["dark", "light"];

const getInitialTheme = () => {
  if (typeof window === "undefined") return "dark";
  try {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    if (savedTheme && VALID_THEMES.includes(savedTheme)) {
      return savedTheme;
    }
  } catch (error) {
    console.warn("Unable to read theme preference from localStorage:", error);
  }
  return "dark";
};

const applyThemeToDOM = (activeTheme) => {
  if (typeof window === "undefined") return;
  const root = window.document.documentElement;
  const normalizedTheme = VALID_THEMES.includes(activeTheme)
    ? activeTheme
    : "dark";

  root.classList.remove("light", "dark");
  root.classList.add(normalizedTheme);
  root.setAttribute("data-theme", normalizedTheme);
  root.style.colorScheme = normalizedTheme;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(() => {
    const initialTheme = getInitialTheme();
    applyThemeToDOM(initialTheme);
    return initialTheme;
  });

  // Synchronously update DOM classes & native color-scheme before browser paint
  useLayoutEffect(() => {
    applyThemeToDOM(theme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (error) {
      console.warn("Unable to save theme preference to localStorage:", error);
    }
  }, [theme]);

  // Keep theme synchronized across multiple open browser tabs
  useEffect(() => {
    const handleStorageChange = (event) => {
      if (
        event.key === THEME_STORAGE_KEY &&
        event.newValue &&
        VALID_THEMES.includes(event.newValue)
      ) {
        setThemeState(event.newValue);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const setTheme = useCallback((newTheme) => {
    if (VALID_THEMES.includes(newTheme)) {
      setThemeState(newTheme);
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prevTheme) => (prevTheme === "dark" ? "light" : "dark"));
  }, []);

  const isDark = theme === "dark";

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDark,
        setTheme,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
