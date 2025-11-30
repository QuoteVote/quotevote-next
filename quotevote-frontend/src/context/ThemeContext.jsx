import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import PropTypes from "prop-types";
import { useAppStore } from "@/store/useAppStore";

const lightTheme = {
  mode: "light",
  palette: { background: "#ffffff", text: "#111827" },
};
const darkTheme = {
  mode: "dark",
  palette: { background: "#0f172a", text: "#f1f5f9" },
};

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

export function ThemeContextProvider({ children }) {
  const user = useAppStore((s) => s.user.data);
  const isLoggedIn = Boolean(user?._id);

  // Initialize theme mode from localStorage (fast, before Redux finishes hydrating)
  const getInitialThemeMode = () => {
    if (typeof window !== "undefined") {
      try {
        const savedTheme = localStorage.getItem("themeMode");
        if (savedTheme) {
          return savedTheme;
        }
      } catch (error) {
        // ignore localStorage read errors
      }
    }
    return "light";
  };

  const [themeMode, setThemeMode] = useState(() => getInitialThemeMode());

  // Update theme when user logs in/out or user preference changes
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (isLoggedIn && user?.themePreference) {
      setThemeMode(user.themePreference);
      try {
        localStorage.setItem("themeMode", user.themePreference);
      } catch (error) {
        // ignore localStorage write errors
      }
    } else if (!isLoggedIn) {
      let savedTheme = "light";
      try {
        savedTheme = localStorage.getItem("themeMode") || "light";
      } catch (error) {
        // ignore localStorage read errors
      }
      setThemeMode(savedTheme);
    } else if (isLoggedIn && !user?.themePreference) {
      try {
        const currentTheme = localStorage.getItem("themeMode") || themeMode || "light";
        localStorage.setItem("themeMode", currentTheme);
        setThemeMode(currentTheme);
      } catch (error) {
        // ignore localStorage sync errors
      }
    }
  }, [isLoggedIn, user, themeMode]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const theme = useMemo(() => (themeMode === "dark" ? darkTheme : lightTheme), [themeMode]);

  const toggleTheme = () => {
    const newMode = themeMode === "light" ? "dark" : "light";
    setThemeMode(newMode);
    try {
      // Always update localStorage for immediate persistence
      localStorage.setItem("themeMode", newMode);
    } catch (error) {
      // ignore localStorage write errors
    }
    return newMode;
  };

  const value = useMemo(
    () => ({
      themeMode,
      theme,
      toggleTheme,
      isDarkMode: themeMode === "dark",
    }),
    [themeMode, theme, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

ThemeContextProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default ThemeContext;
