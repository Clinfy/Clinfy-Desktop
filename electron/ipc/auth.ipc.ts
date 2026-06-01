import { ipcMain, session } from 'electron'
import type { Cookie } from 'electron'
import { urls } from '../../src/configs/urls'
import type {
    AuthActionResult,
    AuthCookies,
    AuthLoginResult,
    SessionContextResult,
    AuthSessionStatus,
    LoginCredentials,
} from '../../src/shared/types/auth'

const ACCESS_COOKIE_NAME = 'auth_token'
const REFRESH_COOKIE_NAME = 'refresh_token'
const AUTH_COOKIE_EXPIRED_INVALID = 'AUTH_COOKIE_EXPIRED_INVALID'
const LOGIN_ERROR_FALLBACK = 'Unable to log in. Please try again.'
const LOGOUT_ERROR_FALLBACK = 'Unable to log out. Please try again.'
const SESSION_CONTEXT_ERROR_FALLBACK = 'Unable to load your session context. Please sign in again.'
const SESSION_EXPIRED_MESSAGE = 'Your session expired. Please sign in again.'
const MISSING_COOKIE_MESSAGE = 'Login response did not include the required auth cookies.'

type AuthErrorResponse = {
    statusCode?: number
    timestamp?: string
    path?: string
    errorCode?: string
    message?: string
}

type ParsedAuthError = {
    message: string
    shouldRefreshAuth: boolean
}

type ParsedCookie = {
    name: string
    value: string
    domain?: string
    path?: string
    secure?: boolean
    httpOnly?: boolean
    expirationDate?: number
}

type StoredAuthCookieOptions = {
    refreshOnly?: boolean
}

type HeadersWithSetCookie = Headers & {
    getSetCookie?: () => string[]
}

export function registerAuthIpc() {
    ipcMain.handle('auth:login', async (_event, credentials: LoginCredentials): Promise<AuthLoginResult> => {
        return login(credentials)
    })

    ipcMain.handle('auth:session-status', async (): Promise<AuthSessionStatus> => {
        const refreshCookies = await session.defaultSession.cookies.get({ name: REFRESH_COOKIE_NAME })

        return {
            hasRefreshToken: refreshCookies.length > 0,
        }
    })

    ipcMain.handle('auth:session-context', async (): Promise<SessionContextResult> => {
        return getSessionContext()
    })

    ipcMain.handle('auth:logout', async (): Promise<AuthActionResult> => {
        return logout()
    })
}

async function login(credentials: LoginCredentials): Promise<AuthLoginResult> {
    if (!isLoginUrlConfigured()) {
        return {
            success: false,
            message: 'Login URL is not configured.',
        }
    }

    try {
        const response = await fetch(urls.auth.login, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(credentials),
        })

        if (!response.ok) {
            return {
                success: false,
                message: await readErrorMessage(response),
            }
        }

        const cookies = extractAuthCookies(response.headers)

        if (!cookies) {
            return {
                success: false,
                message: MISSING_COOKIE_MESSAGE,
            }
        }

        await persistAuthCookies(response.headers)

        return {
            success: true,
            cookies,
        }
    } catch {
        return {
            success: false,
            message: LOGIN_ERROR_FALLBACK,
        }
    }
}

async function logout(): Promise<AuthActionResult> {
    await postLogout()

    try {
        await clearAuthCookies()

        return {
            success: true,
        }
    } catch {
        return {
            success: false,
            message: LOGOUT_ERROR_FALLBACK,
        }
    }
}

async function getSessionContext(): Promise<SessionContextResult> {
    if (!isUrlConfigured(urls.auth.sessionContext)) {
        return {
            success: false,
            message: 'Session context URL is not configured.',
        }
    }

    try {
        const response = await fetchSessionContext()

        if (response.ok) {
            return {
                success: true,
                context: await response.json(),
            }
        }

        const error = await readAuthError(response, SESSION_CONTEXT_ERROR_FALLBACK)

        if (!error.shouldRefreshAuth) {
            return {
                success: false,
                message: error.message,
            }
        }

        const refreshed = await refreshAuthCookies()

        if (!refreshed) {
            return expireSession()
        }

        const retryResponse = await fetchSessionContext()

        if (retryResponse.ok) {
            return {
                success: true,
                context: await retryResponse.json(),
            }
        }

        const retryError = await readAuthError(retryResponse, SESSION_CONTEXT_ERROR_FALLBACK)

        if (retryError.shouldRefreshAuth) {
            return expireSession()
        }

        return {
            success: false,
            message: retryError.message,
        }
    } catch {
        return {
            success: false,
            message: SESSION_CONTEXT_ERROR_FALLBACK,
        }
    }
}

async function fetchSessionContext() {
    const headers = await getStoredAuthCookieHeaders()

    if (!headers.Cookie) {
        throw new Error('Missing auth cookies')
    }

    return fetch(urls.auth.sessionContext, {
        method: 'GET',
        headers,
    })
}

async function refreshAuthCookies() {
    if (!isUrlConfigured(urls.auth.refreshToken)) {
        return false
    }

    const headers = await getStoredAuthCookieHeaders({ refreshOnly: true })

    if (!headers.Cookie) {
        return false
    }

    try {
        const response = await fetch(urls.auth.refreshToken, {
            method: 'GET',
            headers,
        })

        if (!response.ok || !extractAuthCookies(response.headers)) {
            return false
        }

        await persistAuthCookies(response.headers)
        return true
    } catch {
        return false
    }
}

async function expireSession(): Promise<SessionContextResult> {
    await clearAuthCookies()

    return {
        success: false,
        message: SESSION_EXPIRED_MESSAGE,
        reason: 'session-expired',
    }
}

async function postLogout() {
    if (!isUrlConfigured(urls.auth.logout)) {
        return
    }

    try {
        await fetch(urls.auth.logout, {
            method: 'POST',
            headers: await getStoredAuthCookieHeaders(),
        })
    } catch {
        // Logout must still clear local cookies so users are not stuck in an authenticated view.
    }
}

function isLoginUrlConfigured() {
    return isUrlConfigured(urls.auth.login)
}

function isUrlConfigured(url: string) {
    try {
        const parsedUrl = new URL(url)
        return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:'
    } catch {
        return false
    }
}

async function readErrorMessage(response: Response, fallback = LOGIN_ERROR_FALLBACK) {
    const error = await readAuthError(response, fallback)
    return error.message
}

async function readAuthError(response: Response, fallback: string): Promise<ParsedAuthError> {
    try {
        const error = (await response.json()) as AuthErrorResponse

        return {
            message: error.message?.trim() || fallback,
            shouldRefreshAuth: response.status === 401 && error.errorCode === AUTH_COOKIE_EXPIRED_INVALID,
        }
    } catch {
        return {
            message: fallback,
            shouldRefreshAuth: false,
        }
    }
}

function extractAuthCookies(headers: Headers): AuthCookies | null {
    const parsedCookies = getSetCookieHeaders(headers).map(parseSetCookieHeader).filter(isParsedCookie)
    const access = parsedCookies.find((cookie) => cookie.name === ACCESS_COOKIE_NAME)?.value
    const refresh = parsedCookies.find((cookie) => cookie.name === REFRESH_COOKIE_NAME)?.value

    if (!access || !refresh) {
        return null
    }

    return {
        access,
        refresh,
    }
}

async function persistAuthCookies(headers: Headers) {
    const parsedCookies = getSetCookieHeaders(headers).map(parseSetCookieHeader).filter(isParsedCookie)

    await Promise.all(parsedCookies.map((cookie) => session.defaultSession.cookies.set(toElectronCookie(cookie))))
}

async function getStoredAuthCookieHeaders(options: StoredAuthCookieOptions = {}): Promise<Record<string, string>> {
    const cookies = await session.defaultSession.cookies.get({})
    const allowedNames = options.refreshOnly ? [REFRESH_COOKIE_NAME] : [ACCESS_COOKIE_NAME, REFRESH_COOKIE_NAME]
    const authCookies = cookies.filter((cookie) => allowedNames.includes(cookie.name))

    if (authCookies.length === 0) {
        return {}
    }

    return {
        Cookie: authCookies.map((cookie) => `${cookie.name}=${cookie.value}`).join('; '),
    }
}

async function clearAuthCookies() {
    const cookies = await session.defaultSession.cookies.get({})
    const authCookies = cookies.filter((cookie) => {
        return cookie.name === ACCESS_COOKIE_NAME || cookie.name === REFRESH_COOKIE_NAME
    })

    await Promise.all(
        authCookies.map((cookie) => {
            return session.defaultSession.cookies.remove(getCookieRemovalUrl(cookie), cookie.name)
        }),
    )
}

function getSetCookieHeaders(headers: Headers) {
    const headersWithSetCookie = headers as HeadersWithSetCookie
    const setCookieHeaders = headersWithSetCookie.getSetCookie?.()

    if (setCookieHeaders && setCookieHeaders.length > 0) {
        return setCookieHeaders
    }

    const combinedHeader = headers.get('set-cookie')

    if (!combinedHeader) {
        return []
    }

    return combinedHeader.split(/,(?=\s*[^;,\s]+=)/).map((header) => header.trim())
}

function parseSetCookieHeader(header: string): ParsedCookie | null {
    const [nameValuePair, ...attributes] = header.split(';').map((part) => part.trim())
    const separatorIndex = nameValuePair.indexOf('=')

    if (separatorIndex <= 0) {
        return null
    }

    const cookie: ParsedCookie = {
        name: nameValuePair.slice(0, separatorIndex),
        value: nameValuePair.slice(separatorIndex + 1),
    }

    for (const attribute of attributes) {
        const [rawName, ...rawValueParts] = attribute.split('=')
        const name = rawName.trim().toLowerCase()
        const value = rawValueParts.join('=').trim()

        if (name === 'domain' && value) {
            cookie.domain = value
        }

        if (name === 'path' && value) {
            cookie.path = value
        }

        if (name === 'secure') {
            cookie.secure = true
        }

        if (name === 'httponly') {
            cookie.httpOnly = true
        }

        if (name === 'expires' && value) {
            const expires = Date.parse(value)

            if (!Number.isNaN(expires)) {
                cookie.expirationDate = Math.floor(expires / 1000)
            }
        }
    }

    return cookie
}

function isParsedCookie(cookie: ParsedCookie | null): cookie is ParsedCookie {
    return cookie !== null
}

function toElectronCookie(cookie: ParsedCookie) {
    const loginUrl = new URL(urls.auth.login)
    const electronCookie = {
        url: loginUrl.origin,
        name: cookie.name,
        value: cookie.value,
        path: cookie.path ?? '/',
    }

    return {
        ...electronCookie,
        ...(cookie.domain ? { domain: cookie.domain } : {}),
        ...(cookie.secure === undefined ? {} : { secure: cookie.secure }),
        ...(cookie.httpOnly === undefined ? {} : { httpOnly: cookie.httpOnly }),
        ...(cookie.expirationDate === undefined ? {} : { expirationDate: cookie.expirationDate }),
    }
}

function getCookieRemovalUrl(cookie: Cookie) {
    const loginUrl = new URL(urls.auth.login)
    const domain = cookie.domain?.replace(/^\./, '') || loginUrl.hostname
    const path = cookie.path || '/'

    return `${loginUrl.protocol}//${domain}${path}`
}
