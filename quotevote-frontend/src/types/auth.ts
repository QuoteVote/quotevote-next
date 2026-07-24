export interface AuthUser {
  _id: string
  id?: string
  username: string
  email: string
  name?: string
  /** URL string or avataaars qualities object from the login/profile payload. */
  avatar?: string | Record<string, unknown> | null
  bio?: string
  admin?: boolean
  accountStatus?: string
}

export interface AuthResponse {
  token: string
  user: AuthUser
}
