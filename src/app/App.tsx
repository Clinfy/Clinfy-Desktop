import { useEffect, useState } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { Skeleton } from '@/components/ui/skeleton'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ThemeProvider } from '@/shared/theme/ThemeProvider'
import { ForgotPasswordPage } from '@/pages/forgot-password/ForgotPasswordPage'
import { HomePage } from '@/pages/home/HomePage'
import { LoginPage } from '@/pages/login/LoginPage'
import { ResetPasswordPage } from '@/pages/reset-password/ResetPasswordPage'
import { clearSessionContext, saveSessionContext } from '@/shared/session/sessionContextStorage'

const SESSION_EXPIRED_LOGIN_MESSAGE = 'Your session expired. Please sign in again.'

type InitialRoute =
  | string
  | {
      pathname: string
      state: {
        message: string
      }
    }

function App() {
  const [initialRoute, setInitialRoute] = useState<InitialRoute | null>(null)

  useEffect(() => {
    let isMounted = true

    async function resolveInitialRoute() {
      const status = await window.clinfy.auth.getSessionStatus()

      if (!isMounted) {
        return
      }

      if (!status.hasRefreshToken) {
        clearSessionContext()
        setInitialRoute('/login')
        return
      }

      const sessionContextResult = await window.clinfy.auth.getSessionContext()

      if (!isMounted) {
        return
      }

      if (!sessionContextResult.success) {
        clearSessionContext()
        setInitialRoute(
          sessionContextResult.reason === 'session-expired'
            ? {
                pathname: '/login',
                state: {
                  message: sessionContextResult.message || SESSION_EXPIRED_LOGIN_MESSAGE,
                },
              }
            : '/login',
        )
        return
      }

      saveSessionContext(sessionContextResult.context)
      setInitialRoute('/')
    }

    resolveInitialRoute().catch(() => {
      if (isMounted) {
        clearSessionContext()
        setInitialRoute('/login')
      }
    })

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <ThemeProvider>
      <TooltipProvider>
        {initialRoute ? (
          <MemoryRouter initialEntries={[initialRoute]}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
            </Routes>
          </MemoryRouter>
        ) : (
          <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_var(--primary)_0,_transparent_34%),linear-gradient(135deg,_var(--background),_var(--muted))] p-6">
            <section className="w-full max-w-sm rounded-2xl border bg-card/90 p-6 shadow-xl backdrop-blur">
              <Skeleton className="mx-auto size-16 rounded-2xl" />
              <Skeleton className="mx-auto mt-6 h-5 w-40" />
              <Skeleton className="mx-auto mt-3 h-4 w-56" />
            </section>
          </main>
        )}
      </TooltipProvider>
    </ThemeProvider>
  )
}

export default App
