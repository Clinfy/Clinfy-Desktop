import { useEffect, useState } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ThemeProvider } from '@/shared/theme/ThemeProvider'
import { HomePage } from '@/pages/home/HomePage'
import { LoginPage } from '@/pages/login/LoginPage'
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
      {initialRoute ? (
        <MemoryRouter initialEntries={[initialRoute]}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
          </Routes>
        </MemoryRouter>
      ) : (
        <main className="flex min-h-screen items-center justify-center bg-muted p-6">
          <p className="text-sm text-muted-foreground">Loading Clinfy...</p>
        </main>
      )}
    </ThemeProvider>
  )
}

export default App
