import { useState } from 'react'
import { Button } from '@/components/ui/button'

function App() {
  const [message, setMessage] = useState<string | null>(null)

  async function handlePing() {
    const response = await window.clinfy.app.ping()
    setMessage(response.message)
  }

  return (
      <main className="flex min-h-screen items-center justify-center bg-muted p-6">
        <section className="w-full max-w-md rounded-2xl border bg-card p-8 text-card-foreground shadow">
          <h1 className="text-3xl font-bold">Clinfy Desktop</h1>

          <p className="mt-2 text-muted-foreground">
            Probando shadcn/ui con Electron + Vite 8.
          </p>

          <Button type="button" onClick={handlePing} className="mt-6 w-full">
            Probar IPC con shadcn Button
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

export default App