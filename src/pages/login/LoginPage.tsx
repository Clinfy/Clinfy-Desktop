import { useState } from 'react'
import type { SubmitEventHandler } from 'react'
import { AlertCircle, CheckCircle2, Eye, EyeOff, LockKeyhole, Mail, Sparkles } from 'lucide-react'
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
    <main className="relative grid min-h-screen overflow-hidden bg-[linear-gradient(135deg,_var(--background)_0%,_var(--muted)_48%,_oklch(0.93_0.04_220)_100%)] p-4 lg:grid-cols-[1.05fr_0.95fr] lg:p-0">
      <section className="relative hidden min-h-screen flex-col justify-between overflow-hidden p-10 text-primary-foreground lg:flex">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_24%_18%,_oklch(0.76_0.18_210)_0,_transparent_34%),linear-gradient(145deg,_oklch(0.36_0.14_235),_oklch(0.22_0.09_250))]" />
        <div className="absolute -right-24 top-24 size-72 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-10 left-10 size-48 rounded-full bg-cyan-300/20 blur-3xl" />

        <div className="relative flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
            <Sparkles aria-hidden="true" className="size-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-white/70">Clinfy Desktop</p>
            <p className="text-lg font-semibold">Clinical workflows, calmer.</p>
          </div>
        </div>

        <div className="relative max-w-xl space-y-6">
          <p className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-sm text-white/75 backdrop-blur">
            Secure access for your workspace
          </p>
          <h1 className="text-5xl font-semibold tracking-tight text-balance">
            A cleaner start for focused care operations.
          </h1>
          <p className="max-w-lg text-lg leading-8 text-white/72">
            Access only the modules enabled for your session, with a desktop experience that feels
            intentional instead of provisional.
          </p>
        </div>

        <div className="relative grid max-w-xl grid-cols-2 gap-3">
          {['Session-aware menu', 'Permission-based access'].map((item) => (
            <div key={item} className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
              <CheckCircle2 aria-hidden="true" className="size-5 text-cyan-200" />
              <p className="mt-3 text-sm font-medium text-white/85">{item}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="flex min-h-[calc(100vh-2rem)] items-center justify-center lg:min-h-screen">
        <Card className="w-full max-w-md border-white/60 bg-card/90 p-2 shadow-2xl shadow-primary/10 backdrop-blur">
          <CardContent className="p-6 sm:p-8">
            <div className="space-y-3 text-center">
              <img
                src="/logo.webp"
                alt="Clinfy"
                className="mx-auto size-28 rounded-3xl object-contain shadow-sm"
              />
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
            </form>
          </CardContent>
        </Card>
      </section>
    </main>
  )
}
