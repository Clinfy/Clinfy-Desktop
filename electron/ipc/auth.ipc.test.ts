import { beforeEach, describe, expect, it, vi } from 'vitest'

const { cookies, handlers, events } = vi.hoisted(() => {
    return {
        handlers: new Map<string, (...args: unknown[]) => Promise<unknown>>(),
        events: [] as string[],
        cookies: {
            get: vi.fn(),
            set: vi.fn(),
            remove: vi.fn(),
        },
    }
})

vi.mock('electron', () => ({
    ipcMain: {
        handle: vi.fn((channel: string, handler: (...args: unknown[]) => Promise<unknown>) => {
            handlers.set(channel, handler)
        }),
    },
    session: {
        defaultSession: {
            cookies,
        },
    },
}))

const { registerAuthIpc } = await import('./auth.ipc')

function response(body: unknown, init: ResponseInit & { setCookie?: string[] }) {
    const response = new Response(JSON.stringify(body), init)

    if (init.setCookie) {
        Object.assign(response.headers, {
            getSetCookie: () => init.setCookie,
        })
    }

    return response
}

function storedCookies(includeRefresh = true) {
    return [
        {
            name: 'auth_token',
            value: 'old-access',
            domain: 'clinfy-auth.aliendo.qzz.io',
            path: '/',
        },
        ...(includeRefresh
            ? [
                  {
                      name: 'refresh_token',
                      value: 'old-refresh',
                      domain: 'clinfy-auth.aliendo.qzz.io',
                      path: '/',
                  },
              ]
            : []),
    ]
}

describe('auth IPC session refresh', () => {
    beforeEach(() => {
        vi.resetAllMocks()
        handlers.clear()
        events.length = 0
        cookies.get.mockResolvedValue(storedCookies())
        cookies.set.mockImplementation(async (cookie: { name: string }) => {
            events.push(`set:${cookie.name}`)
        })
        cookies.remove.mockResolvedValue(undefined)
        registerAuthIpc()
    })

    it('refreshes exact expired auth-cookie responses, persists both cookies, and retries once', async () => {
        const fetchMock = vi.fn(async (url: string) => {
            events.push(`fetch:${url}`)

            if (fetchMock.mock.calls.length === 1) {
                return response(
                    {
                        errorCode: 'AUTH_COOKIE_EXPIRED_INVALID',
                        message: 'Auth cookie expired',
                    },
                    { status: 401 },
                )
            }

            if (fetchMock.mock.calls.length === 2) {
                return response(
                    {},
                    {
                        status: 200,
                        setCookie: [
                            'auth_token=new-access; Path=/; HttpOnly; Secure',
                            'refresh_token=new-refresh; Path=/; HttpOnly; Secure',
                        ],
                    },
                )
            }

            return response(
                {
                    user_id: 'user-1',
                    person_id: 'person-1',
                    email: 'user@example.com',
                    endpoint_keys: ['home'],
                },
                { status: 200 },
            )
        })
        vi.stubGlobal('fetch', fetchMock)

        const result = await handlers.get('auth:session-context')?.()

        expect(result).toEqual({
            success: true,
            context: {
                user_id: 'user-1',
                person_id: 'person-1',
                email: 'user@example.com',
                endpoint_keys: ['home'],
            },
        })
        expect(fetchMock).toHaveBeenCalledTimes(3)
        expect(fetchMock.mock.calls[1][1]).toMatchObject({
            method: 'GET',
            headers: {
                Cookie: 'refresh_token=old-refresh',
            },
        })
        expect(cookies.set).toHaveBeenCalledTimes(2)
        expect(events).toEqual([
            'fetch:https://clinfy-auth.aliendo.qzz.io/users/me/session-context',
            'fetch:https://clinfy-auth.aliendo.qzz.io/users/refresh-token',
            'set:auth_token',
            'set:refresh_token',
            'fetch:https://clinfy-auth.aliendo.qzz.io/users/me/session-context',
        ])
    })

    it('does not refresh other 401 error codes', async () => {
        const fetchMock = vi.fn(async () => {
            return response(
                {
                    errorCode: 'INVALID_CREDENTIALS',
                    message: 'Invalid credentials',
                },
                { status: 401 },
            )
        })
        vi.stubGlobal('fetch', fetchMock)

        const result = await handlers.get('auth:session-context')?.()

        expect(result).toEqual({
            success: false,
            message: 'Invalid credentials',
        })
        expect(fetchMock).toHaveBeenCalledTimes(1)
        expect(cookies.set).not.toHaveBeenCalled()
        expect(cookies.remove).not.toHaveBeenCalled()
    })

    it('clears auth cookies and returns session-expired when refresh response is incomplete', async () => {
        const fetchMock = vi.fn(async () => {
            if (fetchMock.mock.calls.length === 1) {
                return response({ errorCode: 'AUTH_COOKIE_EXPIRED_INVALID' }, { status: 401 })
            }

            return response(
                {},
                {
                    status: 200,
                    setCookie: ['auth_token=new-access; Path=/; HttpOnly; Secure'],
                },
            )
        })
        vi.stubGlobal('fetch', fetchMock)

        const result = await handlers.get('auth:session-context')?.()

        expect(result).toEqual({
            success: false,
            message: 'Your session expired. Please sign in again.',
            reason: 'session-expired',
        })
        expect(fetchMock).toHaveBeenCalledTimes(2)
        expect(cookies.set).not.toHaveBeenCalled()
        expect(cookies.remove).toHaveBeenCalledTimes(2)
    })

    it('clears auth cookies and returns session-expired when refresh returns a server error', async () => {
        const fetchMock = vi.fn(async () => {
            if (fetchMock.mock.calls.length === 1) {
                return response({ errorCode: 'AUTH_COOKIE_EXPIRED_INVALID' }, { status: 401 })
            }

            return response(
                {
                    errorCode: 'REFRESH_FAILED',
                    message: 'Unable to refresh token',
                },
                { status: 500 },
            )
        })
        vi.stubGlobal('fetch', fetchMock)

        const result = await handlers.get('auth:session-context')?.()

        expect(result).toEqual({
            success: false,
            message: 'Your session expired. Please sign in again.',
            reason: 'session-expired',
        })
        expect(fetchMock).toHaveBeenCalledTimes(2)
        expect(cookies.set).not.toHaveBeenCalled()
        expect(cookies.remove).toHaveBeenCalledTimes(2)
    })

    it('clears auth cookies and does not refresh again when the retried request is expired', async () => {
        const fetchMock = vi.fn(async () => {
            if (fetchMock.mock.calls.length === 2) {
                return response(
                    {},
                    {
                        status: 200,
                        setCookie: [
                            'auth_token=new-access; Path=/; HttpOnly; Secure',
                            'refresh_token=new-refresh; Path=/; HttpOnly; Secure',
                        ],
                    },
                )
            }

            return response({ errorCode: 'AUTH_COOKIE_EXPIRED_INVALID' }, { status: 401 })
        })
        vi.stubGlobal('fetch', fetchMock)

        const result = await handlers.get('auth:session-context')?.()

        expect(result).toEqual({
            success: false,
            message: 'Your session expired. Please sign in again.',
            reason: 'session-expired',
        })
        expect(fetchMock).toHaveBeenCalledTimes(3)
        expect(fetchMock.mock.calls.filter(([url]) => String(url).endsWith('/users/refresh-token'))).toHaveLength(1)
        expect(cookies.remove).toHaveBeenCalledTimes(2)
    })
})

describe('auth IPC password recovery', () => {
    beforeEach(() => {
        vi.resetAllMocks()
        handlers.clear()
        events.length = 0
        registerAuthIpc()
    })

    it('registers dedicated forgot-password and reset-password channels', () => {
        expect(handlers.has('auth:forgot-password')).toBe(true)
        expect(handlers.has('auth:reset-password')).toBe(true)
    })

    it('posts the exact forgot-password request and prefers the backend success message', async () => {
        const fetchMock = vi.fn(async () => {
            return response({ message: 'Check your inbox.' }, { status: 200 })
        })
        vi.stubGlobal('fetch', fetchMock)

        const result = await handlers.get('auth:forgot-password')?.(undefined, {
            email: 'user@example.com',
            unexpected: 'must-not-cross-ipc',
        })

        expect(result).toEqual({
            success: true,
            message: 'Check your inbox.',
        })
        expect(fetchMock).toHaveBeenCalledWith('https://clinfy-auth.aliendo.qzz.io/users/forgot-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: 'user@example.com',
            }),
        })
        expect(cookies.get).not.toHaveBeenCalled()
        expect(cookies.set).not.toHaveBeenCalled()
        expect(cookies.remove).not.toHaveBeenCalled()
    })

    it('posts the exact reset-password request and prefers the backend success message', async () => {
        const fetchMock = vi.fn(async () => {
            return response({ message: 'Password updated.' }, { status: 200 })
        })
        vi.stubGlobal('fetch', fetchMock)

        const result = await handlers.get('auth:reset-password')?.(undefined, {
            email: 'user@example.com',
            token: 'ABC123xyz',
            password: 'Valid1!Password',
            unexpected: 'must-not-cross-ipc',
        })

        expect(result).toEqual({
            success: true,
            message: 'Password updated.',
        })
        expect(fetchMock).toHaveBeenCalledWith('https://clinfy-auth.aliendo.qzz.io/users/reset-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: 'user@example.com',
                token: 'ABC123xyz',
                password: 'Valid1!Password',
            }),
        })
        expect(cookies.get).not.toHaveBeenCalled()
        expect(cookies.set).not.toHaveBeenCalled()
        expect(cookies.remove).not.toHaveBeenCalled()
    })

    it.each([
        {
            channel: 'auth:forgot-password',
            request: null,
            fallback: 'Unable to request a password reset. Please try again.',
        },
        {
            channel: 'auth:forgot-password',
            request: { email: 123 },
            fallback: 'Unable to request a password reset. Please try again.',
        },
        {
            channel: 'auth:reset-password',
            request: 'invalid-request',
            fallback: 'Unable to reset your password. Please try again.',
        },
        {
            channel: 'auth:reset-password',
            request: {
                email: 'user@example.com',
                token: 'ABC123xyz',
            },
            fallback: 'Unable to reset your password. Please try again.',
        },
    ])('safely rejects malformed requests for $channel', async ({ channel, request, fallback }) => {
        const fetchMock = vi.fn()
        vi.stubGlobal('fetch', fetchMock)

        const result = await handlers.get(channel)?.(undefined, request)

        expect(result).toEqual({
            success: false,
            message: fallback,
        })
        expect(fetchMock).not.toHaveBeenCalled()
        expect(cookies.get).not.toHaveBeenCalled()
        expect(cookies.set).not.toHaveBeenCalled()
        expect(cookies.remove).not.toHaveBeenCalled()
    })

    it.each([
        {
            channel: 'auth:forgot-password',
            request: { email: 'user@example.com' },
        },
        {
            channel: 'auth:reset-password',
            request: {
                email: 'user@example.com',
                token: 'ABC123xyz',
                password: 'Valid1!Password',
            },
        },
    ])('returns the backend error for $channel without refresh or cookie activity', async ({ channel, request }) => {
        const fetchMock = vi.fn(async () => {
            return response(
                {
                    errorCode: 'AUTH_COOKIE_EXPIRED_INVALID',
                    message: 'Recovery request rejected.',
                },
                { status: 401 },
            )
        })
        vi.stubGlobal('fetch', fetchMock)

        const result = await handlers.get(channel)?.(undefined, request)

        expect(result).toEqual({
            success: false,
            message: 'Recovery request rejected.',
        })
        expect(fetchMock).toHaveBeenCalledTimes(1)
        expect(fetchMock.mock.calls.some(([url]) => String(url).endsWith('/users/refresh-token'))).toBe(false)
        expect(cookies.get).not.toHaveBeenCalled()
        expect(cookies.set).not.toHaveBeenCalled()
        expect(cookies.remove).not.toHaveBeenCalled()
    })

    it.each([
        {
            channel: 'auth:forgot-password',
            request: { email: 'user@example.com' },
            successFallback: 'Password reset instructions sent.',
            errorFallback: 'Unable to request a password reset. Please try again.',
        },
        {
            channel: 'auth:reset-password',
            request: {
                email: 'user@example.com',
                token: 'ABC123xyz',
                password: 'Valid1!Password',
            },
            successFallback: 'Your password has been reset.',
            errorFallback: 'Unable to reset your password. Please try again.',
        },
    ])(
        'uses operation-specific fallbacks for malformed and network responses on $channel',
        async ({ channel, request, successFallback, errorFallback }) => {
            const fetchMock = vi
                .fn()
                .mockResolvedValueOnce(new Response('not-json', { status: 200 }))
                .mockResolvedValueOnce(new Response('not-json', { status: 500 }))
                .mockRejectedValueOnce(new Error('network failure'))
            vi.stubGlobal('fetch', fetchMock)

            await expect(handlers.get(channel)?.(undefined, request)).resolves.toEqual({
                success: true,
                message: successFallback,
            })
            await expect(handlers.get(channel)?.(undefined, request)).resolves.toEqual({
                success: false,
                message: errorFallback,
            })
            await expect(handlers.get(channel)?.(undefined, request)).resolves.toEqual({
                success: false,
                message: errorFallback,
            })
            expect(fetchMock).toHaveBeenCalledTimes(3)
            expect(fetchMock.mock.calls.some(([url]) => String(url).endsWith('/users/refresh-token'))).toBe(false)
            expect(cookies.get).not.toHaveBeenCalled()
            expect(cookies.set).not.toHaveBeenCalled()
            expect(cookies.remove).not.toHaveBeenCalled()
        },
    )
})
