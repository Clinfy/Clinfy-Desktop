import { useEffect, useState } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ThemeProvider } from '@/shared/theme/ThemeProvider'
import { HomePage } from '@/pages/home/HomePage'
import { LoginPage } from '@/pages/login/LoginPage'

function App() {
  const [initialRoute, setInitialRoute] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function resolveInitialRoute() {
      const status = await window.clinfy.auth.getSessionStatus()

      if (!isMounted) {
        return
      }

      setInitialRoute(status.hasRefreshToken ? '/' : '/login')
    }

    resolveInitialRoute().catch(() => {
      if (isMounted) {
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
