'use client'

import { createContext, useContext, useState, useEffect, useMemo } from 'react'
import { useAppStore } from '@/store/useAppStore'
import type {
  ThemeContextValue,
  ThemeContextProviderProps,
  ThemeMode,
  Theme,
} from '@/types/context'

const lightTheme: Theme = {
  mode: 'light',
  palette: { background: '#ffffff', text: '#111827' },
}

const darkTheme: Theme = {
  mode: 'dark',
  palette: { background: '#0f172a', text: '#f1f5f9' },
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

export function ThemeContextProvider({
  children,
}: ThemeContextProviderProps) {
  const user = useAppStore((s) => s.user.data)
  const isLoggedIn = Boolean(user?._id)

  // Initialize theme mode from localStorage (fast, before Redux finishes hydrating)
  const getInitialThemeMode = (): ThemeMode => {
    if (typeof window !== 'undefined') {
      try {
        const savedTheme = localStorage.getItem('themeMode')
        if (savedTheme === 'light' || savedTheme === 'dark') {
          return savedTheme
        }
      } catch (error) {
        // ignore localStorage read errors
      }
    }
    return 'light'
  }

  const [themeMode, setThemeMode] = useState<ThemeMode>(() =>
    getInitialThemeMode()
  )

  // Update theme when user logs in/out or user preference changes
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (isLoggedIn && user?.themePreference) {
      const userTheme = user.themePreference as ThemeMode
      if (userTheme === 'light' || userTheme === 'dark') {
        setThemeMode(userTheme)
        try {
          localStorage.setItem('themeMode', userTheme)
        } catch (error) {
          // ignore localStorage write errors
        }
      }
    } else if (!isLoggedIn) {
      let savedTheme: ThemeMode = 'light'
      try {
        const stored = localStorage.getItem('themeMode')
        if (stored === 'light' || stored === 'dark') {
          savedTheme = stored
        }
      } catch (error) {
        // ignore localStorage read errors
      }
      setThemeMode(savedTheme)
    } else if (isLoggedIn && !user?.themePreference) {
      try {
        const currentTheme =
          (localStorage.getItem('themeMode') as ThemeMode) ||
          themeMode ||
          'light'
        if (currentTheme === 'light' || currentTheme === 'dark') {
          localStorage.setItem('themeMode', currentTheme)
          setThemeMode(currentTheme)
        }
      } catch (error) {
        // ignore localStorage sync errors
      }
    }
  }, [isLoggedIn, user, themeMode])
  /* eslint-enable react-hooks/set-state-in-effect */

  const theme = useMemo<Theme>(
    () => (themeMode === 'dark' ? darkTheme : lightTheme),
    [themeMode]
  )

  const toggleTheme = (): ThemeMode => {
    const newMode: ThemeMode = themeMode === 'light' ? 'dark' : 'light'
    setThemeMode(newMode)
    try {
      // Always update localStorage for immediate persistence
      localStorage.setItem('themeMode', newMode)
    } catch (error) {
      // ignore localStorage write errors
    }
    return newMode
  }

  const value = useMemo<ThemeContextValue>(
    () => ({
      themeMode,
      theme,
      toggleTheme,
      isDarkMode: themeMode === 'dark',
    }),
    [themeMode, theme, toggleTheme]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export default ThemeContext

