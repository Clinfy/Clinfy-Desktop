import { useState } from 'react'
import type { FormEvent } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
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

    setIsSubmitting(false)

    if (!result.success) {
      setMessage(result.message)
      return
    }

    if (!result.cookies.access || !result.cookies.refresh) {
      setMessage('Login response did not include the required auth cookies.')
      return
    }

    navigate('/', { replace: true })
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted p-6">
      <section className="w-full max-w-md rounded-2xl border bg-card p-8 text-card-foreground shadow">
        <div className="space-y-2 text-center">
          <p className="text-sm font-medium text-muted-foreground">Welcome to Clinfy</p>
          <h1 className="text-3xl font-bold">Sign in</h1>
          <p className="text-sm text-muted-foreground">
            Enter your email and password to access your workspace.
          </p>
        </div>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={isSubmitting}
              className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none transition focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="name@example.com"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="password">
              Password
            </label>
            <div className="flex rounded-lg border bg-background focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
              <input
                id="password"
                type={isPasswordVisible ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={isSubmitting}
                className="h-10 min-w-0 flex-1 rounded-l-lg bg-transparent px-3 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setIsPasswordVisible((currentValue) => !currentValue)}
                disabled={isSubmitting}
                className="h-10 rounded-r-lg px-3 text-sm font-medium text-muted-foreground transition hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
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
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {message}
            </div>
          )}

          <Button type="submit" className="h-10 w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>
      </section>
    </main>
  )
}
