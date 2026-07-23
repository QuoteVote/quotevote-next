/**
 * TypeScript interfaces for Settings component
 */
/**
 * TypeScript interfaces for Settings component
 */
/**
 * TypeScript interfaces for Settings component
 */

export interface SettingsFormValues {
  name: string
  username: string
  email: string
  bio: string
  password?: string
}

export interface SettingsContentProps {
  setOpen?: (open: boolean) => void
}

export interface SettingsMenuProps {
  fontSize?: 'small' | 'medium' | 'large' | 'inherit'
}

export interface UserAvatar {
  url?: string
  src?: string
  [key: string]: unknown
}

export interface SettingsUserData {
  id?: string
  _id?: string
  username?: string
  email?: string
  name?: string
  bio?: string
  avatar?: UserAvatar | string | Record<string, unknown>
  admin?: boolean
  _followingId?: string[]
  themePreference?: 'light' | 'dark'
  [key: string]: unknown
}
