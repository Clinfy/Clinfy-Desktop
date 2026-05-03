import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export function HomePage() {
  const navigate = useNavigate()
  const [message, setMessage] = useState<string | null>(null)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  async function handlePing() {
    const response = await window.clinfy.app.ping()
    setMessage(response.message)
  }

  async function handleLogout() {
    if (isLoggingOut) {
      return
    }

    setIsLoggingOut(true)
    const result = await window.clinfy.auth.logout()

    if (!result.success) {
      setMessage(result.message)
      setIsLoggingOut(false)
      return
    }

    navigate('/login', { replace: true })
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted p-6">
      <section className="w-full max-w-md rounded-2xl border bg-card p-8 text-card-foreground shadow">
        <p className="text-sm font-medium text-muted-foreground">Authenticated workspace</p>
        <h1 className="mt-2 text-3xl font-bold">Clinfy Desktop</h1>

        <p className="mt-2 text-muted-foreground">
          You are signed in and ready to continue working in Clinfy.
        </p>

        <Button type="button" onClick={handlePing} className="mt-6 w-full">
          Test IPC with shadcn Button
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="mt-3 w-full"
        >
          {isLoggingOut ? 'Signing out...' : 'Log out'}
        </Button>

        {message && (
          <div className="mt-5 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {message}
          </div>
        )}
      </section>
    </main>
  )
}
