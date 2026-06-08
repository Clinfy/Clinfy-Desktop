const AUTH_URL = 'https://clinfy-auth.aliendo.qzz.io'

export const urls = {
    auth: {
        login: `${AUTH_URL}/users/login`,
        logout: `${AUTH_URL}/users/logout`,
        refreshToken: `${AUTH_URL}/users/refresh-token`,
        sessionContext: `${AUTH_URL}/users/me/session-context`,
        forgotPassword: `${AUTH_URL}/users/forgot-password`,
        resetPassword: `${AUTH_URL}/users/reset-password`,
    }
}