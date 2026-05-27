import type {
    AuthActionResult,
    AuthLoginResult,
    AuthSessionStatus,
    LoginCredentials,
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
                getSessionStatus: () => Promise<AuthSessionStatus>
                getSessionContext: () => Promise<SessionContextResult>
                logout: () => Promise<AuthActionResult>
            }
        }
    }
}
