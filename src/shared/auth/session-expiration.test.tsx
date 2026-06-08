import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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
        forgotPassword: vi.fn(),
        resetPassword: vi.fn(),
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
    expect(screen.getByRole('alert')).toHaveClass('bg-destructive/10')
  })

  it('navigates from Login to password recovery', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<p>Password recovery page</p>} />
        </Routes>
      </MemoryRouter>,
    )

    await user.click(screen.getByRole('button', { name: 'Forgot your password?' }))

    expect(screen.getByText('Password recovery page')).toBeInTheDocument()
  })

  it('renders reset success feedback with the non-destructive alert variant', () => {
    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: '/login',
            state: {
              message: 'Password reset successfully.',
              messageVariant: 'success',
            },
          },
        ]}
      >
        <Routes>
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText('Password reset successfully.')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveClass('bg-primary/10')
    expect(screen.getByRole('alert')).not.toHaveClass('bg-destructive/10')
  })
})
