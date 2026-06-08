import type {
    AuthActionResult,
    AuthLoginResult,
    AuthSessionStatus,
    ForgotPasswordRequest,
    LoginCredentials,
    PasswordRecoveryResult,
    ResetPasswordRequest,
    SessionContextResult,
} from './auth'

export {}

declare global {
    interface Window {
        clinfy: {
            app: {
                ping: () => Promise<{
                    success: boolean
                    message: string
                }>
            }
            auth: {
                login: (credentials: LoginCredentials) => Promise<AuthLoginResult>
                forgotPassword: (request: ForgotPasswordRequest) => Promise<PasswordRecoveryResult>
                resetPassword: (request: ResetPasswordRequest) => Promise<PasswordRecoveryResult>
                getSessionStatus: () => Promise<AuthSessionStatus>
                getSessionContext: () => Promise<SessionContextResult>
                logout: () => Promise<AuthActionResult>
            }
        }
    }
}
