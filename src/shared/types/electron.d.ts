import type { AuthActionResult, AuthLoginResult, AuthSessionStatus, LoginCredentials } from './auth'

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
                logout: () => Promise<AuthActionResult>
            }
        }
    }
}
