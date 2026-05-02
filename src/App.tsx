import { useState } from 'react'

function App() {
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handlePing() {
    setMessage(null)
    setError(null)

    try {
      console.log('[renderer] window.clinfy:', window.clinfy)

      if (!window.clinfy) {
        setError('window.clinfy no existe. El preload no se cargó correctamente.')
        return
      }

      const response = await window.clinfy.app.ping()

      console.log('[renderer] response:', response)

      setMessage(response.message)
    } catch (error) {
      console.error('[renderer] ping error:', error)
      setError('Error ejecutando IPC. Revisá la consola.')
    }
  }

  return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
        <section className="w-full max-w-lg rounded-2xl bg-white p-8 shadow">
          <h1 className="text-4xl font-bold text-slate-900">
            Clinfy Desktop
          </h1>

          <p className="mt-3 text-slate-600">
            Electron + React + Vite 8 + Tailwind + TypeScript.
          </p>

          <button
              type="button"
              onClick={handlePing}
              className="mt-6 rounded-xl bg-slate-900 px-4 py-2.5 font-medium text-white transition hover:bg-slate-700"
          >
            Probar IPC
          </button>

          {message && (
              <div className="mt-5 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {message}
              </div>
          )}

          {error && (
              <div className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
          )}
        </section>
      </main>
  )
}

export default App