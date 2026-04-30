'use client'

import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react'
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
      } catch (_error) {
        // ignore localStorage read errors
      }
    }
    return 'light'
  }

  const getInitialNeoBrutalism = (): boolean => {
    if (typeof window !== 'undefined') {
      try {
        return localStorage.getItem('neoBrutalism') === 'on'
      } catch (_error) {
        // ignore localStorage read errors
      }
    }
    return false
  }

  const [themeMode, setThemeMode] = useState<ThemeMode>(getInitialThemeMode)
  const [neoBrutalism, setNeoBrutalism] = useState<boolean>(getInitialNeoBrutalism)

  // Apply dark class to <html> whenever themeMode changes
  useEffect(() => {
    if (themeMode === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [themeMode])

  // Apply neo-brutalism class to <html> whenever flag changes
  useEffect(() => {
    if (neoBrutalism) {
      document.documentElement.classList.add('neo-brutalism')
    } else {
      document.documentElement.classList.remove('neo-brutalism')
    }
  }, [neoBrutalism])

  // Update theme when user logs in/out or user preference changes
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (isLoggedIn && user?.themePreference) {
      const userTheme = user.themePreference as ThemeMode
      if (userTheme === 'light' || userTheme === 'dark') {
        setThemeMode(userTheme)
        try {
          localStorage.setItem('themeMode', userTheme)
        } catch (_error) {
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
      } catch (_error) {
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
      } catch (_error) {
        // ignore localStorage sync errors
      }
    }
  }, [isLoggedIn, user, themeMode])
  /* eslint-enable react-hooks/set-state-in-effect */

  const theme = useMemo<Theme>(
    () => (themeMode === 'dark' ? darkTheme : lightTheme),
    [themeMode]
  )

  const toggleTheme = useCallback((): ThemeMode => {
    const newMode: ThemeMode = themeMode === 'light' ? 'dark' : 'light'
    setThemeMode(newMode)
    try {
      // Always update localStorage for immediate persistence
      localStorage.setItem('themeMode', newMode)
    } catch (_error) {
      // ignore localStorage write errors
    }
    return newMode
  }, [themeMode])

  const toggleNeoBrutalism = useCallback((): boolean => {
    const next = !neoBrutalism
    setNeoBrutalism(next)
    try {
      localStorage.setItem('neoBrutalism', next ? 'on' : 'off')
    } catch (_error) {
      // ignore localStorage write errors
    }
    return next
  }, [neoBrutalism])

  const value = useMemo<ThemeContextValue>(
    () => ({
      themeMode,
      theme,
      toggleTheme,
      isDarkMode: themeMode === 'dark',
      neoBrutalism,
      toggleNeoBrutalism,
    }),
    [themeMode, theme, toggleTheme, neoBrutalism, toggleNeoBrutalism]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export default ThemeContext

