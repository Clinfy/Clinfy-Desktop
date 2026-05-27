import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { clearSessionContext, getSessionContext } from '@/shared/session/sessionContextStorage'
import {
  getVisibleHomeFeatures,
  HOME_FEATURES,
  type HomeFeature,
} from '@/pages/home/homeFeatureCatalog'

function normalizeEndpointKeys(endpointKeys: unknown) {
  if (!Array.isArray(endpointKeys)) {
    return []
  }

  return endpointKeys.filter((endpointKey): endpointKey is string => typeof endpointKey === 'string')
}

export function HomePage() {
  const navigate = useNavigate()
  const sessionContext = getSessionContext()
  const endpointKeySet = new Set(normalizeEndpointKeys(sessionContext?.endpoint_keys))
  const visibleFeatures = getVisibleHomeFeatures(HOME_FEATURES, endpointKeySet)
  const [message, setMessage] = useState<string | null>(null)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [selectedFeatureId, setSelectedFeatureId] = useState<HomeFeature['id'] | null>(null)
  const selectedFeature =
    visibleFeatures.find((feature) => feature.id === selectedFeatureId) ?? null

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

    clearSessionContext()
    navigate('/login', { replace: true })
  }

  return (
    <main className="min-h-screen bg-muted p-6">
      <section className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-5xl flex-col gap-6">
        <header className="rounded-2xl border bg-card p-6 text-card-foreground shadow">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Authenticated workspace</p>
              <h1 className="mt-2 text-3xl font-bold">Clinfy Desktop</h1>
              <p className="mt-2 max-w-2xl text-muted-foreground">
                Select an available functionality to continue. The menu only shows product areas
                enabled for your session.
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full sm:w-auto"
            >
              {isLoggingOut ? 'Signing out...' : 'Log out'}
            </Button>
          </div>

          {message && (
            <div className="mt-5 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {message}
            </div>
          )}
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)]">
          <section className="rounded-2xl border bg-card p-6 text-card-foreground shadow">
            <div className="space-y-1">
              <h2 className="text-xl font-semibold">Functionalities</h2>
              <p className="text-sm text-muted-foreground">
                Product-facing options available for the logged-in user.
              </p>
            </div>

            {visibleFeatures.length > 0 ? (
              <div className="mt-6 grid gap-4">
                {visibleFeatures.map((feature) => {
                  const isSelected = feature.id === selectedFeatureId

                  return (
                    <button
                      key={feature.id}
                      type="button"
                      onClick={() => setSelectedFeatureId(feature.id)}
                      className="rounded-xl border bg-background p-5 text-left transition hover:border-primary/60 hover:shadow-sm focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                      aria-pressed={isSelected}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-lg font-semibold">{feature.label}</h3>
                          <p className="mt-2 text-sm text-muted-foreground">
                            {feature.description}
                          </p>
                        </div>

                        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                          Available
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
            ) : (
              <div className="mt-6 rounded-xl border border-dashed bg-background p-6">
                <h3 className="font-semibold">No available functionalities</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Your session does not include permissions for the supported Home menu
                  functionalities yet.
                </p>
              </div>
            )}
          </section>

          <aside className="rounded-2xl border bg-card p-6 text-card-foreground shadow">
            {selectedFeature ? (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Selected functionality</p>
                <h2 className="mt-2 text-2xl font-bold">{selectedFeature.label}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{selectedFeature.description}</p>

                <div className="mt-6 space-y-3">
                  {selectedFeature.items.map((item) => (
                    <div key={item.id} className="rounded-xl border bg-muted/40 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-semibold">{item.label}</h3>
                          <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                        </div>

                        <span className="rounded-full border px-2.5 py-1 text-xs font-medium text-muted-foreground">
                          Planned
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <p className="mt-5 text-xs text-muted-foreground">
                  This panel is visual only. Person and Gender ABMC flows will be implemented in a
                  later change.
                </p>
              </div>
            ) : (
              <div className="flex h-full min-h-64 flex-col justify-center rounded-xl border border-dashed bg-background p-6 text-center">
                <h2 className="text-lg font-semibold">Select a functionality</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Choose an available menu option to preview the planned areas for that
                  functionality.
                </p>
              </div>
            )}
          </aside>
        </div>
      </section>
    </main>
  )
}
