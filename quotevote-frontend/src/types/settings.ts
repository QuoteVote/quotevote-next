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
}

export interface SettingsUserData {
  id?: string
  _id?: string
  username?: string
  email?: string
  name?: string
  avatar?: UserAvatar | string
  admin?: boolean
  _followingId?: string
  [key: string]: unknown
}
