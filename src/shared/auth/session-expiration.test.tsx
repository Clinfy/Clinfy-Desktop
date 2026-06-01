import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import App from '@/app/App'
import { LoginPage } from '@/pages/login/LoginPage'

const SESSION_STORAGE_KEY = 'clinfy-session-context'
const EXPIRED_MESSAGE = 'Your session expired. Please sign in again.'

describe('session expiration handling', () => {
  afterEach(() => {
    cleanup()
  })

  beforeEach(() => {
    sessionStorage.clear()
    window.clinfy = {
      app: {
        ping: vi.fn(),
      },
      auth: {
        login: vi.fn(),
        logout: vi.fn(),
        getSessionStatus: vi.fn().mockResolvedValue({ hasRefreshToken: true }),
        getSessionContext: vi.fn().mockResolvedValue({
          success: false,
          message: EXPIRED_MESSAGE,
          reason: 'session-expired',
        }),
      },
    }
  })

  it('clears renderer session storage and opens login with the expired-session message', async () => {
    sessionStorage.setItem(SESSION_STORAGE_KEY, '{"user_id":"user-1"}')

    render(<App />)

    await waitFor(() => {
      expect(screen.getByText(EXPIRED_MESSAGE)).toBeInTheDocument()
    })
    expect(sessionStorage.getItem(SESSION_STORAGE_KEY)).toBeNull()
  })

  it('renders a login message provided through route state', () => {
    render(
      <MemoryRouter initialEntries={[{ pathname: '/login', state: { message: EXPIRED_MESSAGE } }]}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText(EXPIRED_MESSAGE)).toBeInTheDocument()
  })
})
