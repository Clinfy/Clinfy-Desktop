export type LoginCredentials = {
  email: string
  password: string
}

export type AuthCookies = {
  access: string
  refresh: string
}

export type AuthLoginResult =
  | {
      success: true
      cookies: AuthCookies
    }
  | {
      success: false
      message: string
    }

export type AuthSessionStatus = {
  hasRefreshToken: boolean
}

export type AuthActionResult =
  | {
      success: true
    }
  | {
      success: false
      message: string
    }
