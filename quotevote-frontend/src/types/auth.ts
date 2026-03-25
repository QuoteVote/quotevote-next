export interface AuthUser {
  _id: string
  id?: string
  username: string
  email: string
  name?: string
  avatar?: string
  admin?: boolean
  accountStatus?: string
}

export interface AuthResponse {
  token: string
  user: AuthUser
}
