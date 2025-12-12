/**
 * TypeScript type definitions for React Context providers
 */

import type { ReactNode } from 'react'

/**
 * Theme mode type
 */
export type ThemeMode = 'light' | 'dark'

/**
 * Theme palette interface
 */
export interface ThemePalette {
  background: string
  text: string
}

/**
 * Theme object interface
 */
export interface Theme {
  mode: ThemeMode
  palette: ThemePalette
}

/**
 * AuthModal context value interface
 */
export interface AuthModalContextValue {
  isModalOpen: boolean
  openAuthModal: () => void
  closeAuthModal: () => void
}

/**
 * Theme context value interface
 */
export interface ThemeContextValue {
  themeMode: ThemeMode
  theme: Theme
  toggleTheme: () => ThemeMode
  isDarkMode: boolean
}

/**
 * AuthModal provider props interface
 */
export interface AuthModalProviderProps {
  children: ReactNode
}

/**
 * Theme context provider props interface
 */
export interface ThemeContextProviderProps {
  children: ReactNode
}

