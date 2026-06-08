import { useRef, useState } from 'react'
import type {
  ChangeEvent,
  ClipboardEventHandler,
  KeyboardEventHandler,
  SubmitEventHandler,
} from 'react'
import { AlertCircle, Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { isValidEmail, PASSWORD_PATTERN } from '@/pages/password-recovery/validation'

const RESET_PASSWORD_FALLBACK = 'Unable to reset your password. Please try again.'

type ResetPasswordLocationState = {
  email?: string
}

export function ResetPasswordPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const submissionLock = useRef(false)
  const tokenInputRefs = useRef<Array<HTMLInputElement | null>>([])
  const routeEmail = (location.state as ResetPasswordLocationState | null)?.email
  const email = typeof routeEmail === 'string' ? routeEmail.trim() : ''
  const [tokenSlots, setTokenSlots] = useState(() => Array<string>(9).fill(''))
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [isConfirmationVisible, setIsConfirmationVisible] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isValidEmail(email)) {
    return <Navigate to="/forgot-password" replace />
  }

  const rawToken = tokenSlots.join('')
  const isTokenValid = tokenSlots.every((slot) => /^[A-Z0-9]$/.test(slot))
  const isPasswordValid = PASSWORD_PATTERN.test(password)
  const doesConfirmationMatch = confirmation === password && confirmation.length > 0
  const canSubmit =
    isTokenValid && isPasswordValid && doesConfirmationMatch && !isSubmitting

  const handleTokenChange = (index: number, event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.value === '') {
      const nextSlots = [...tokenSlots]
      nextSlots[index] = ''
      setTokenSlots(nextSlots)
      return
    }

    const candidate = Array.from(event.target.value).at(-1)

    if (candidate === undefined || !/^[A-Za-z0-9]$/.test(candidate)) {
      return
    }

    const normalizedCharacter = candidate.toUpperCase()
    const nextSlots = [...tokenSlots]
    nextSlots[index] = normalizedCharacter
    setTokenSlots(nextSlots)
    tokenInputRefs.current[index + 1]?.focus()
  }

  const blockPaste: ClipboardEventHandler<HTMLInputElement> = (event) => {
    event.preventDefault()
  }

  const handleTokenKeyDown =
    (index: number): KeyboardEventHandler<HTMLInputElement> =>
    (event) => {
      if (event.key === 'ArrowLeft' && index > 0) {
        event.preventDefault()
        tokenInputRefs.current[index - 1]?.focus()
        return
      }

      if (event.key === 'ArrowRight' && index < tokenSlots.length - 1) {
        event.preventDefault()
        tokenInputRefs.current[index + 1]?.focus()
        return
      }

      if (event.key !== 'Backspace') {
        return
      }

      event.preventDefault()
      const targetIndex = tokenSlots[index] === '' && index > 0 ? index - 1 : index
      const nextSlots = [...tokenSlots]
      nextSlots[targetIndex] = ''
      setTokenSlots(nextSlots)
      tokenInputRefs.current[targetIndex]?.focus()
    }

  const handleSubmit: SubmitEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault()

    if (!canSubmit || submissionLock.current) {
      return
    }

    submissionLock.current = true
    setIsSubmitting(true)
    setMessage(null)

    try {
      const result = await window.clinfy.auth.resetPassword({
        email,
        token: rawToken,
        password,
      })

      if (!result.success) {
        setMessage(result.message.trim() || RESET_PASSWORD_FALLBACK)
        return
      }

      navigate('/login', {
        replace: true,
        state: {
          message: result.message,
          messageVariant: 'success',
        },
      })
    } catch {
      setMessage(RESET_PASSWORD_FALLBACK)
    } finally {
      submissionLock.current = false
      setIsSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(135deg,var(--background)_0%,var(--muted)_48%,oklch(0.93_0.04_220)_100%)] p-4">
      <section className="flex w-full justify-center">
        <Card className="w-full max-w-lg border-white/60 bg-card/90 p-2 shadow-2xl shadow-primary/10 backdrop-blur">
          <CardContent className="p-6 sm:p-8">
            <div className="space-y-3 text-center">
              <img src="/logo.webp" alt="Clinfy" className="mx-auto size-24 object-contain" />
              <div>
                <p className="text-sm font-medium text-primary">Password recovery</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight">
                  Reset your password
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Enter the nine-character token and choose a new password.
                </p>
              </div>
            </div>

            <Separator className="my-7" />

            <form className="space-y-5" onSubmit={handleSubmit} noValidate>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="reset-email">
                  Email
                </label>
                <div className="relative">
                  <Mail
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  />
                  <Input
                    id="reset-email"
                    type="email"
                    value={email}
                    readOnly
                    className="h-11 bg-muted/50 pl-9"
                  />
                </div>
              </div>

              <fieldset className="space-y-2">
                <legend className="text-sm font-medium">Reset token</legend>
                <div className="flex items-center justify-center gap-1.5">
                  {tokenSlots.map((value, index) => (
                    <div className="contents" key={index}>
                      <Input
                        ref={(element) => {
                          tokenInputRefs.current[index] = element
                        }}
                        aria-label={`Token character ${index + 1}`}
                        value={value}
                        onChange={(event) => handleTokenChange(index, event)}
                        onKeyDown={handleTokenKeyDown(index)}
                        onPaste={blockPaste}
                        disabled={isSubmitting}
                        autoCapitalize="characters"
                        className="size-10 px-0 text-center font-mono text-base"
                      />
                      {(index === 2 || index === 5) && (
                        <span aria-hidden="true" className="font-medium text-muted-foreground">
                          -
                        </span>
                      )}
                    </div>
                  ))}
                </div>
                {!isTokenValid && rawToken.length > 0 && (
                  <p className="text-sm text-destructive">Enter all nine token characters.</p>
                )}
              </fieldset>

              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="new-password">
                  New password
                </label>
                <div className="relative">
                  <LockKeyhole
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  />
                  <Input
                    id="new-password"
                    type={isPasswordVisible ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    disabled={isSubmitting}
                    aria-invalid={password.length > 0 && !isPasswordValid}
                    className="h-11 px-11"
                  />
                  <button
                    type="button"
                    onClick={() => setIsPasswordVisible((currentValue) => !currentValue)}
                    disabled={isSubmitting}
                    className="absolute right-1 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label={isPasswordVisible ? 'Hide new password' : 'Show new password'}
                  >
                    {isPasswordVisible ? (
                      <EyeOff
                        aria-hidden="true"
                        data-testid="new-password-visibility-icon"
                        data-icon="eye-off"
                        className="size-4"
                      />
                    ) : (
                      <Eye
                        aria-hidden="true"
                        data-testid="new-password-visibility-icon"
                        data-icon="eye"
                        className="size-4"
                      />
                    )}
                  </button>
                </div>
                {password.length > 0 && !isPasswordValid && (
                  <p className="text-sm text-destructive">
                    Use at least 8 characters with uppercase, lowercase, a number, and a special
                    character.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="confirm-password">
                  Confirm new password
                </label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={isConfirmationVisible ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={confirmation}
                    onChange={(event) => setConfirmation(event.target.value)}
                    disabled={isSubmitting}
                    aria-invalid={confirmation.length > 0 && !doesConfirmationMatch}
                    className="h-11 pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setIsConfirmationVisible((currentValue) => !currentValue)}
                    disabled={isSubmitting}
                    className="absolute right-1 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label={
                      isConfirmationVisible
                        ? 'Hide password confirmation'
                        : 'Show password confirmation'
                    }
                  >
                    {isConfirmationVisible ? (
                      <EyeOff
                        aria-hidden="true"
                        data-testid="password-confirmation-visibility-icon"
                        data-icon="eye-off"
                        className="size-4"
                      />
                    ) : (
                      <Eye
                        aria-hidden="true"
                        data-testid="password-confirmation-visibility-icon"
                        data-icon="eye"
                        className="size-4"
                      />
                    )}
                  </button>
                </div>
                {confirmation.length > 0 && !doesConfirmationMatch && (
                  <p className="text-sm text-destructive">Passwords must match.</p>
                )}
              </div>

              {message && (
                <Alert variant="destructive" className="bg-destructive/10">
                  <AlertCircle aria-hidden="true" className="size-4" />
                  <AlertDescription>{message}</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="h-11 flex-1"
                  disabled={isSubmitting}
                  onClick={() => navigate('/forgot-password')}
                >
                  Back
                </Button>
                <Button type="submit" size="lg" className="h-11 flex-1" disabled={!canSubmit}>
                  {isSubmitting ? 'Resetting password...' : 'Reset password'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </section>
    </main>
  )
}
