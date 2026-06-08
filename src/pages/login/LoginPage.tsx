import { useState } from 'react'
import type { SubmitEventHandler } from 'react'
import { AlertCircle, Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { saveSessionContext } from '@/shared/session/sessionContextStorage'

type LoginLocationState = {
  message?: string
}

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const routeMessage = (location.state as LoginLocationState | null)?.message
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState<string | null>(routeMessage ?? null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)

  const handleSubmit: SubmitEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault()

    if (isSubmitting) {
      return
    }

    const trimmedEmail = email.trim()

    if (!trimmedEmail || !password) {
      setMessage('Enter your email and password to continue.')
      return
    }

    setIsSubmitting(true)
    setMessage(null)

    const result = await window.clinfy.auth.login({
      email: trimmedEmail,
      password,
    })

    if (!result.success) {
      setMessage(result.message)
      setIsSubmitting(false)
      return
    }

    if (!result.cookies.access || !result.cookies.refresh) {
      setMessage('Login response did not include the required auth cookies.')
      setIsSubmitting(false)
      return
    }

    const sessionContextResult = await window.clinfy.auth.getSessionContext()

    if (!sessionContextResult.success) {
      setMessage(sessionContextResult.message)
      setIsSubmitting(false)
      return
    }

    saveSessionContext(sessionContextResult.context)
    setIsSubmitting(false)
    navigate('/', { replace: true })
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(135deg,var(--background)_0%,var(--muted)_48%,oklch(0.93_0.04_220)_100%)] p-4">
      <section className="flex w-full justify-center">
        <Card className="w-full max-w-md border-white/60 bg-card/90 p-2 shadow-2xl shadow-primary/10 backdrop-blur">
          <CardContent className="p-6 sm:p-8">
            <div className="space-y-3 text-center">
              <img src="/logo.webp" alt="Clinfy" className="mx-auto size-28 object-contain" />
              <div>
                <p className="text-sm font-medium text-primary">Welcome back</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight">Sign in</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Enter your credentials to access your workspace.
                </p>
              </div>
            </div>

            <Separator className="my-7" />

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="email">
                  Email
                </label>
                <div className="relative">
                  <Mail
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  />
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    disabled={isSubmitting}
                    className="h-11 pl-9"
                    placeholder="name@example.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="password">
                  Password
                </label>
                <div className="relative">
                  <LockKeyhole
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  />
                  <Input
                    id="password"
                    type={isPasswordVisible ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    disabled={isSubmitting}
                    className="h-11 px-9"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setIsPasswordVisible((currentValue) => !currentValue)}
                    disabled={isSubmitting}
                    className="absolute right-1 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
                  >
                    {isPasswordVisible ? (
                      <EyeOff aria-hidden="true" className="size-4" />
                    ) : (
                      <Eye aria-hidden="true" className="size-4" />
                    )}
                  </button>
                </div>
              </div>

              {message && (
                <Alert variant="destructive" className="bg-destructive/10">
                  <AlertCircle aria-hidden="true" className="size-4" />
                  <AlertDescription>{message}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" size="lg" className="h-11 w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Signing in...' : 'Sign in'}
              </Button>

              <div className="text-center">
                <a
                  href="#"
                  onClick={(event) => event.preventDefault()}
                  className="text-sm text-primary underline-offset-4 hover:underline"
                >
                  forgot your password?
                </a>
              </div>
            </form>
          </CardContent>
        </Card>
      </section>
    </main>
  )
}
