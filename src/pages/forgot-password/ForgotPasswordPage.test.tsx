import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { ForgotPasswordPage } from '@/pages/forgot-password/ForgotPasswordPage'

function ResetDestination() {
  const location = useLocation()
  const email = (location.state as { email?: string } | null)?.email

  return <p>Reset destination: {email}</p>
}

function renderPage() {
  render(
    <MemoryRouter initialEntries={['/forgot-password']}>
      <Routes>
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetDestination />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('ForgotPasswordPage', () => {
  afterEach(() => {
    cleanup()
  })

  beforeEach(() => {
    window.clinfy = {
      app: { ping: vi.fn() },
      auth: {
        login: vi.fn(),
        forgotPassword: vi.fn(),
        resetPassword: vi.fn(),
        logout: vi.fn(),
        getSessionStatus: vi.fn(),
        getSessionContext: vi.fn(),
      },
    }
  })

  it('shows validation feedback and does not submit an invalid email', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByLabelText('Email'), 'not-an-email')
    await user.click(screen.getByRole('button', { name: 'Send reset token' }))

    expect(screen.getByText('Enter a valid email address.')).toBeInTheDocument()
    expect(window.clinfy.auth.forgotPassword).not.toHaveBeenCalled()
  })

  it('submits exactly the trimmed email and navigates with preserved state', async () => {
    vi.mocked(window.clinfy.auth.forgotPassword).mockResolvedValue({
      success: true,
      message: 'Token sent.',
    })
    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByLabelText('Email'), '  patient@example.com  ')
    await user.click(screen.getByRole('button', { name: 'Send reset token' }))

    await waitFor(() => {
      expect(screen.getByText('Reset destination: patient@example.com')).toBeInTheDocument()
    })
    expect(window.clinfy.auth.forgotPassword).toHaveBeenCalledWith({
      email: 'patient@example.com',
    })
  })

  it('shows a backend error message', async () => {
    vi.mocked(window.clinfy.auth.forgotPassword).mockResolvedValue({
      success: false,
      message: 'No account was found.',
    })
    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByLabelText('Email'), 'patient@example.com')
    await user.click(screen.getByRole('button', { name: 'Send reset token' }))

    expect(await screen.findByText('No account was found.')).toBeInTheDocument()
  })

  it('shows the fallback when the bridge error has no usable message', async () => {
    vi.mocked(window.clinfy.auth.forgotPassword).mockResolvedValue({
      success: false,
      message: '   ',
    })
    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByLabelText('Email'), 'patient@example.com')
    await user.click(screen.getByRole('button', { name: 'Send reset token' }))

    expect(
      await screen.findByText('Unable to start password recovery. Please try again.'),
    ).toBeInTheDocument()
  })

  it('disables submission and prevents duplicate bridge calls while pending', async () => {
    let resolveRequest:
      | ((value: { success: false; message: string }) => void)
      | undefined
    vi.mocked(window.clinfy.auth.forgotPassword).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveRequest = resolve
        }),
    )
    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByLabelText('Email'), 'patient@example.com')
    const submitButton = screen.getByRole('button', { name: 'Send reset token' })
    const form = submitButton.closest('form')

    expect(form).not.toBeNull()
    fireEvent.submit(form!)
    fireEvent.submit(form!)

    expect(window.clinfy.auth.forgotPassword).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('button', { name: 'Sending reset token...' })).toBeDisabled()

    resolveRequest?.({ success: false, message: 'Try again.' })
    expect(await screen.findByText('Try again.')).toBeInTheDocument()
  })
})
