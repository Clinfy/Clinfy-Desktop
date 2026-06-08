import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { ResetPasswordPage } from '@/pages/reset-password/ResetPasswordPage'

const VALID_PASSWORD = 'Valid1!x'
const TOKEN_CHARACTERS = ['a', 'B', '1', 'c', 'D', '2', 'e', 'F', '3']

function LoginDestination() {
  const location = useLocation()
  const state = location.state as
    | { message?: string; messageVariant?: string }
    | null

  return (
    <p>
      Login destination: {state?.message} ({state?.messageVariant})
    </p>
  )
}

function renderPage(state: { email?: string } | null = { email: ' patient@example.com ' }) {
  render(
    <MemoryRouter initialEntries={[{ pathname: '/reset-password', state }]}>
      <Routes>
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/forgot-password" element={<p>Forgot password destination</p>} />
        <Route path="/login" element={<LoginDestination />} />
      </Routes>
    </MemoryRouter>,
  )
}

async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
  const tokenInputs = screen.getAllByRole('textbox', { name: /Token character/ })

  for (const [index, character] of TOKEN_CHARACTERS.entries()) {
    await user.type(tokenInputs[index], character)
  }

  await user.type(screen.getByLabelText('New password'), VALID_PASSWORD)
  await user.type(screen.getByLabelText('Confirm new password'), VALID_PASSWORD)
}

describe('ResetPasswordPage', () => {
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

  it('redirects to forgot-password when valid email state is missing', () => {
    renderPage(null)

    expect(screen.getByText('Forgot password destination')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Reset password' })).not.toBeInTheDocument()
  })

  it('redirects to forgot-password when email state is invalid', () => {
    renderPage({ email: 'invalid-email' })

    expect(screen.getByText('Forgot password destination')).toBeInTheDocument()
  })

  it('shows the trimmed email read-only and renders nine token slots with two separators', () => {
    renderPage()

    expect(screen.getByLabelText('Email')).toHaveValue('patient@example.com')
    expect(screen.getByLabelText('Email')).toHaveAttribute('readonly')
    expect(screen.getAllByRole('textbox', { name: /Token character/ })).toHaveLength(9)
    expect(screen.getAllByText('-', { selector: 'span' })).toHaveLength(2)
  })

  it('normalizes accepted token characters, auto-advances, and submits the exact raw token', async () => {
    vi.mocked(window.clinfy.auth.resetPassword).mockResolvedValue({
      success: false,
      message: 'Token expired.',
    })
    const user = userEvent.setup()
    renderPage()

    const tokenInputs = screen.getAllByRole('textbox', { name: /Token character/ })
    tokenInputs[0].focus()
    await user.keyboard('aB1cD2eF3')
    expect(tokenInputs[8]).toHaveFocus()
    await user.type(screen.getByLabelText('New password'), VALID_PASSWORD)
    await user.type(screen.getByLabelText('Confirm new password'), VALID_PASSWORD)
    await user.click(screen.getByRole('button', { name: 'Reset password' }))

    expect(tokenInputs.map((input) => (input as HTMLInputElement).value)).toEqual([
      'A',
      'B',
      '1',
      'C',
      'D',
      '2',
      'E',
      'F',
      '3',
    ])
    expect(window.clinfy.auth.resetPassword).toHaveBeenCalledWith({
      email: 'patient@example.com',
      token: 'AB1CD2EF3',
      password: VALID_PASSWORD,
    })
  })

  it('rejects non-ASCII letters and symbols without replacing values or advancing focus', async () => {
    const user = userEvent.setup()
    renderPage()
    const tokenInputs = screen.getAllByRole('textbox', { name: /Token character/ })
    const invalidCharacters = ['ſ', 'ı', 'é', '@']

    tokenInputs[0].focus()
    await user.keyboard('a')
    expect(tokenInputs[0]).toHaveValue('A')
    expect(tokenInputs[1]).toHaveFocus()

    for (const invalidCharacter of invalidCharacters) {
      fireEvent.change(tokenInputs[1], { target: { value: invalidCharacter } })
      expect(tokenInputs[1]).toHaveValue('')
      expect(tokenInputs[1]).toHaveFocus()

      tokenInputs[0].focus()
      fireEvent.change(tokenInputs[0], { target: { value: `A${invalidCharacter}` } })
      expect(tokenInputs[0]).toHaveValue('A')
      expect(tokenInputs[0]).toHaveFocus()

      tokenInputs[1].focus()
    }
  })

  it('clears the current token slot and moves backward from an empty slot', async () => {
    const user = userEvent.setup()
    renderPage()
    const tokenInputs = screen.getAllByRole('textbox', { name: /Token character/ })

    tokenInputs[0].focus()
    await user.keyboard('ab')
    expect(tokenInputs[1]).toHaveValue('B')
    expect(tokenInputs[2]).toHaveFocus()

    await user.keyboard('{Backspace}')
    expect(tokenInputs[1]).toHaveValue('')
    expect(tokenInputs[1]).toHaveFocus()

    tokenInputs[0].focus()
    await user.keyboard('{Backspace}')
    expect(tokenInputs[0]).toHaveValue('')
    expect(tokenInputs[0]).toHaveFocus()
  })

  it('moves token focus with ArrowLeft and ArrowRight', async () => {
    const user = userEvent.setup()
    renderPage()
    const tokenInputs = screen.getAllByRole('textbox', { name: /Token character/ })

    tokenInputs[4].focus()
    await user.keyboard('{ArrowLeft}')
    expect(tokenInputs[3]).toHaveFocus()

    await user.keyboard('{ArrowRight}')
    expect(tokenInputs[4]).toHaveFocus()
  })

  it('blocks pasted token content in every slot', () => {
    renderPage()
    const tokenInputs = screen.getAllByRole('textbox', { name: /Token character/ })

    for (const tokenInput of tokenInputs) {
      fireEvent.paste(tokenInput, {
        clipboardData: {
          getData: () => 'ABCDEFGHI',
        },
      })
    }

    for (const tokenInput of tokenInputs) {
      expect(tokenInput).toHaveValue('')
    }
    expect(screen.getByRole('button', { name: 'Reset password' })).toBeDisabled()
  })

  it('shows password regex and confirmation mismatch feedback', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByLabelText('New password'), 'weak')
    await user.type(screen.getByLabelText('Confirm new password'), 'different')

    expect(
      screen.getByText(
        'Use at least 8 characters with uppercase, lowercase, a number, and a special character.',
      ),
    ).toBeInTheDocument()
    expect(screen.getByText('Passwords must match.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reset password' })).toBeDisabled()
  })

  it('toggles password and confirmation visibility independently with accessible labels', async () => {
    const user = userEvent.setup()
    renderPage()
    const passwordInput = screen.getByLabelText('New password')
    const confirmationInput = screen.getByLabelText('Confirm new password')
    const newPasswordIcon = () => screen.getByTestId('new-password-visibility-icon')
    const confirmationIcon = () =>
      screen.getByTestId('password-confirmation-visibility-icon')

    expect(passwordInput).toHaveAttribute('type', 'password')
    expect(confirmationInput).toHaveAttribute('type', 'password')
    expect(screen.getByRole('button', { name: 'Show new password' })).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Show password confirmation' }),
    ).toBeInTheDocument()
    expect(newPasswordIcon()).toHaveAttribute('data-icon', 'eye')
    expect(confirmationIcon()).toHaveAttribute('data-icon', 'eye')

    await user.click(screen.getByRole('button', { name: 'Show new password' }))
    expect(passwordInput).toHaveAttribute('type', 'text')
    expect(confirmationInput).toHaveAttribute('type', 'password')
    expect(screen.getByRole('button', { name: 'Hide new password' })).toBeInTheDocument()
    expect(newPasswordIcon()).toHaveAttribute('data-icon', 'eye-off')
    expect(confirmationIcon()).toHaveAttribute('data-icon', 'eye')

    await user.click(screen.getByRole('button', { name: 'Show password confirmation' }))
    expect(confirmationInput).toHaveAttribute('type', 'text')
    expect(
      screen.getByRole('button', { name: 'Hide password confirmation' }),
    ).toBeInTheDocument()
    expect(newPasswordIcon()).toHaveAttribute('data-icon', 'eye-off')
    expect(confirmationIcon()).toHaveAttribute('data-icon', 'eye-off')

    await user.click(screen.getByRole('button', { name: 'Hide new password' }))
    await user.click(screen.getByRole('button', { name: 'Hide password confirmation' }))
    expect(passwordInput).toHaveAttribute('type', 'password')
    expect(confirmationInput).toHaveAttribute('type', 'password')
    expect(screen.getByRole('button', { name: 'Show new password' })).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Show password confirmation' }),
    ).toBeInTheDocument()
    expect(newPasswordIcon()).toHaveAttribute('data-icon', 'eye')
    expect(confirmationIcon()).toHaveAttribute('data-icon', 'eye')
  })

  it('navigates back to forgot-password so the email can be changed', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: 'Back' }))

    expect(screen.getByText('Forgot password destination')).toBeInTheDocument()
  })

  it('stays disabled for incomplete input and prevents duplicate calls while pending', async () => {
    let resolveRequest:
      | ((value: { success: false; message: string }) => void)
      | undefined
    vi.mocked(window.clinfy.auth.resetPassword).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveRequest = resolve
        }),
    )
    const user = userEvent.setup()
    renderPage()

    expect(screen.getByRole('button', { name: 'Reset password' })).toBeDisabled()

    await fillValidForm(user)
    const submitButton = screen.getByRole('button', { name: 'Reset password' })
    const form = submitButton.closest('form')

    expect(submitButton).toBeEnabled()
    expect(form).not.toBeNull()
    fireEvent.submit(form!)
    fireEvent.submit(form!)

    expect(window.clinfy.auth.resetPassword).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('button', { name: 'Resetting password...' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Back' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Show new password' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Show password confirmation' })).toBeDisabled()

    resolveRequest?.({ success: false, message: 'Try again.' })
    expect(await screen.findByText('Try again.')).toBeInTheDocument()
  })

  it('shows backend and fallback reset errors', async () => {
    const user = userEvent.setup()
    vi.mocked(window.clinfy.auth.resetPassword)
      .mockResolvedValueOnce({ success: false, message: 'Reset token expired.' })
      .mockResolvedValueOnce({ success: false, message: ' ' })
    renderPage()

    await fillValidForm(user)
    await user.click(screen.getByRole('button', { name: 'Reset password' }))
    expect(await screen.findByText('Reset token expired.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Reset password' }))
    expect(
      await screen.findByText('Unable to reset your password. Please try again.'),
    ).toBeInTheDocument()
  })

  it('shows the local fallback when resetPassword rejects', async () => {
    vi.mocked(window.clinfy.auth.resetPassword).mockRejectedValue(new Error('IPC unavailable'))
    const user = userEvent.setup()
    renderPage()

    await fillValidForm(user)
    await user.click(screen.getByRole('button', { name: 'Reset password' }))

    expect(
      await screen.findByText('Unable to reset your password. Please try again.'),
    ).toBeInTheDocument()
  })

  it('navigates to Login with the backend message and success variant', async () => {
    vi.mocked(window.clinfy.auth.resetPassword).mockResolvedValue({
      success: true,
      message: 'Password reset successfully.',
    })
    const user = userEvent.setup()
    renderPage()

    await fillValidForm(user)
    await user.click(screen.getByRole('button', { name: 'Reset password' }))

    await waitFor(() => {
      expect(
        screen.getByText('Login destination: Password reset successfully. (success)'),
      ).toBeInTheDocument()
    })
  })
})
