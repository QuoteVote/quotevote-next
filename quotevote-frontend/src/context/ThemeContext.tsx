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

function readStoredThemeMode(): ThemeMode {
  if (typeof window === 'undefined') return 'light'
  try {
    const savedTheme = localStorage.getItem('themeMode')
    if (savedTheme === 'light' || savedTheme === 'dark') {
      return savedTheme
    }
  } catch {
    // ignore localStorage read errors
  }
  return 'light'
}

function writeStoredThemeMode(mode: ThemeMode): void {
  try {
    localStorage.setItem('themeMode', mode)
  } catch {
    // ignore localStorage write errors
  }
}

export function ThemeContextProvider({ children }: ThemeContextProviderProps) {
  const isLoggedIn = useAppStore((s) => Boolean(s.user.data?._id))
  const themePreference = useAppStore((s) => {
    const pref = s.user.data?.themePreference
    return pref === 'light' || pref === 'dark' ? pref : undefined
  })

  const [themeMode, setThemeMode] = useState<ThemeMode>(readStoredThemeMode)
  const [neoBrutalism, setNeoBrutalism] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    try {
      return localStorage.getItem('neoBrutalism') === 'on'
    } catch {
      return false
    }
  })

  useEffect(() => {
    if (themeMode === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [themeMode])

  useEffect(() => {
    if (neoBrutalism) {
      document.documentElement.classList.add('neo-brutalism')
    } else {
      document.documentElement.classList.remove('neo-brutalism')
    }
  }, [neoBrutalism])

  // Apply saved preference when login state / server preference changes.
  // Do NOT depend on themeMode — that caused toggles to snap back to the
  // last saved preference before Save.
  /* eslint-disable react-hooks/set-state-in-effect -- sync theme from auth/store preference */
  useEffect(() => {
    if (!isLoggedIn) {
      setThemeMode(readStoredThemeMode())
      return
    }
    if (themePreference === 'light' || themePreference === 'dark') {
      setThemeMode(themePreference)
      writeStoredThemeMode(themePreference)
    }
  }, [isLoggedIn, themePreference])
  /* eslint-enable react-hooks/set-state-in-effect */
  const theme = useMemo<Theme>(
    () => (themeMode === 'dark' ? darkTheme : lightTheme),
    [themeMode]
  )

  const setTheme = useCallback((mode: ThemeMode): void => {
    setThemeMode(mode)
    writeStoredThemeMode(mode)
  }, [])

  const toggleTheme = useCallback((): ThemeMode => {
    const newMode: ThemeMode = themeMode === 'light' ? 'dark' : 'light'
    setTheme(newMode)
    return newMode
  }, [themeMode, setTheme])

  const toggleNeoBrutalism = useCallback((): boolean => {
    const next = !neoBrutalism
    setNeoBrutalism(next)
    try {
      localStorage.setItem('neoBrutalism', next ? 'on' : 'off')
    } catch {
      // ignore localStorage write errors
    }
    return next
  }, [neoBrutalism])

  const value = useMemo<ThemeContextValue>(
    () => ({
      themeMode,
      theme,
      setTheme,
      toggleTheme,
      isDarkMode: themeMode === 'dark',
      neoBrutalism,
      toggleNeoBrutalism,
    }),
    [themeMode, theme, setTheme, toggleTheme, neoBrutalism, toggleNeoBrutalism]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export default ThemeContext
