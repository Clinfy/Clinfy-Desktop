export type LoginCredentials = {
  email: string
  password: string
}

export type ForgotPasswordRequest = {
  email: string
}

export type ResetPasswordRequest = {
  email: string
  token: string
  password: string
}

export type PasswordRecoveryResult =
  | {
      success: true
      message: string
    }
  | {
      success: false
      message: string
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

export type SessionContext = {
  user_id: string
  person_id: string
  email: string
  endpoint_keys: string[]
}

export type SessionContextResult =
  | {
      success: true
      context: SessionContext
    }
  | {
      success: false
      message: string
      reason?: 'session-expired'
    }

export type AuthActionResult =
  | {
      success: true
    }
  | {
      success: false
      message: string
    }
