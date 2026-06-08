import { useRef, useState } from 'react'
import type { SubmitEventHandler } from 'react'
import { AlertCircle, ArrowLeft, Mail } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { isValidEmail } from '@/pages/password-recovery/validation'

const FORGOT_PASSWORD_FALLBACK = 'Unable to start password recovery. Please try again.'

export function ForgotPasswordPage() {
  const navigate = useNavigate()
  const submissionLock = useRef(false)
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit: SubmitEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault()

    if (submissionLock.current) {
      return
    }

    const trimmedEmail = email.trim()

    if (!isValidEmail(trimmedEmail)) {
      setMessage('Enter a valid email address.')
      return
    }

    submissionLock.current = true
    setIsSubmitting(true)
    setMessage(null)

    try {
      const result = await window.clinfy.auth.forgotPassword({ email: trimmedEmail })

      if (!result.success) {
        setMessage(result.message.trim() || FORGOT_PASSWORD_FALLBACK)
        return
      }

      navigate('/reset-password', { state: { email: trimmedEmail } })
    } catch {
      setMessage(FORGOT_PASSWORD_FALLBACK)
    } finally {
      submissionLock.current = false
      setIsSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(135deg,var(--background)_0%,var(--muted)_48%,oklch(0.93_0.04_220)_100%)] p-4">
      <section className="flex w-full justify-center">
        <Card className="w-full max-w-md border-white/60 bg-card/90 p-2 shadow-2xl shadow-primary/10 backdrop-blur">
          <CardContent className="p-6 sm:p-8">
            <div className="space-y-3 text-center">
              <img src="/logo.webp" alt="Clinfy" className="mx-auto size-28 object-contain" />
              <div>
                <p className="text-sm font-medium text-primary">Password recovery</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight">
                  Forgot your password?
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Enter your email and we will send you a reset token.
                </p>
              </div>
            </div>

            <Separator className="my-7" />

            <form className="space-y-5" onSubmit={handleSubmit} noValidate>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="recovery-email">
                  Email
                </label>
                <div className="relative">
                  <Mail
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  />
                  <Input
                    id="recovery-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    disabled={isSubmitting}
                    aria-invalid={message === 'Enter a valid email address.'}
                    className="h-11 pl-9"
                    placeholder="name@example.com"
                  />
                </div>
              </div>

              {message && (
                <Alert variant="destructive" className="bg-destructive/10">
                  <AlertCircle aria-hidden="true" className="size-4" />
                  <AlertDescription>{message}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" size="lg" className="h-11 w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Sending reset token...' : 'Send reset token'}
              </Button>

              <Button
                type="button"
                variant="link"
                className="mx-auto flex"
                onClick={() => navigate('/login')}
                disabled={isSubmitting}
              >
                <ArrowLeft aria-hidden="true" />
                Back to sign in
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>
    </main>
  )
}
