import { useState } from 'react'
import {
  ArrowRight,
  Boxes,
  CheckCircle2,
  LayoutDashboard,
  LogOut,
  Sparkles,
  UserRound,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Avatar, AvatarBadge, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
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
  const availableModuleCount = visibleFeatures.length
  const plannedFlowCount = visibleFeatures.reduce((total, feature) => total + feature.items.length, 0)

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
    <main className="min-h-screen overflow-auto bg-[linear-gradient(135deg,_var(--background),_var(--muted)_50%,_oklch(0.94_0.04_220))] p-4 lg:p-6">
      <section className="mx-auto grid min-h-[calc(100vh-2rem)] w-full max-w-7xl gap-5 lg:min-h-[calc(100vh-3rem)] lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="hidden rounded-3xl border bg-card/80 p-4 shadow-xl shadow-primary/5 backdrop-blur lg:flex lg:flex-col">
          <div className="flex items-center gap-3 px-2 py-2">
            <img src="/logo.webp" alt="Clinfy" className="size-10 rounded-2xl object-contain" />
            <div>
              <p className="text-sm font-semibold">Clinfy</p>
              <p className="text-xs text-muted-foreground">Desktop</p>
            </div>
          </div>

          <Separator className="my-4" />

          <nav aria-label="Main navigation" className="space-y-1">
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-2xl bg-primary/10 px-3 py-2 text-sm font-medium text-primary"
            >
              <LayoutDashboard aria-hidden="true" className="size-4" />
              Workspace
            </button>
          </nav>

          <div className="mt-auto rounded-2xl border bg-muted/40 p-3">
            <p className="text-xs font-medium text-muted-foreground">Session status</p>
            <div className="mt-3 flex items-center gap-2">
              <Avatar size="sm">
                <AvatarFallback>CD</AvatarFallback>
                <AvatarBadge />
              </Avatar>
              <div>
                <p className="text-sm font-medium">Authenticated</p>
                <p className="text-xs text-muted-foreground">Permissions loaded</p>
              </div>
            </div>
          </div>
        </aside>

        <section className="flex min-w-0 flex-col gap-5">
          <header className="rounded-3xl border bg-card/85 p-5 shadow-xl shadow-primary/5 backdrop-blur lg:p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-3">
                <Badge variant="secondary" className="gap-1.5">
                  <Sparkles aria-hidden="true" className="size-3" />
                  Authenticated workspace
                </Badge>
                <div>
                  <h1 className="text-3xl font-semibold tracking-tight lg:text-4xl">
                    Welcome to Clinfy Desktop
                  </h1>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                    Select an available product area to continue. This workspace only shows modules
                    enabled for your current session.
                  </p>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="w-full bg-background/70 lg:w-auto"
              >
                <LogOut aria-hidden="true" className="size-4" />
                {isLoggingOut ? 'Signing out...' : 'Log out'}
              </Button>
            </div>

            {message && (
              <Alert variant="destructive" className="mt-5 bg-destructive/10">
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            )}
          </header>

          <div className="grid gap-4 md:grid-cols-3">
            <Card className="bg-card/80 shadow-sm">
              <CardHeader>
                <CardTitle>Available modules</CardTitle>
                <CardDescription>Ready for this session</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold">{availableModuleCount}</p>
              </CardContent>
            </Card>
            <Card className="bg-card/80 shadow-sm">
              <CardHeader>
                <CardTitle>Planned flows</CardTitle>
                <CardDescription>Previewed in this workspace</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold">{plannedFlowCount}</p>
              </CardContent>
            </Card>
            <Card className="bg-primary text-primary-foreground shadow-sm">
              <CardHeader>
                <CardTitle>Access model</CardTitle>
                <CardDescription className="text-primary-foreground/70">
                  Permission-based navigation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 aria-hidden="true" className="size-4" />
                  Session context synced
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid min-h-0 gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
            <Card className="bg-card/85 shadow-xl shadow-primary/5 backdrop-blur">
              <CardHeader>
                <div>
                  <CardTitle className="text-xl">Product areas</CardTitle>
                  <CardDescription>
                    Friendly entry points instead of raw development menu items.
                  </CardDescription>
                </div>
                <CardAction>
                  <Badge variant="outline">{availableModuleCount} available</Badge>
                </CardAction>
              </CardHeader>

              <CardContent>
                {visibleFeatures.length > 0 ? (
                  <div className="grid gap-3">
                    {visibleFeatures.map((feature) => {
                      const isSelected = feature.id === selectedFeatureId

                      return (
                        <button
                          key={feature.id}
                          type="button"
                          onClick={() => setSelectedFeatureId(feature.id)}
                          className="group rounded-2xl border bg-background/70 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none aria-pressed:border-primary aria-pressed:bg-primary/5"
                          aria-pressed={isSelected}
                        >
                          <div className="flex items-start gap-4">
                            <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
                              <UserRound aria-hidden="true" className="size-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-base font-semibold">{feature.label}</h3>
                                <Badge variant={isSelected ? 'default' : 'secondary'}>
                                  Available
                                </Badge>
                              </div>
                              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                {feature.description}
                              </p>
                            </div>
                            <ArrowRight
                              aria-hidden="true"
                              className="mt-1 size-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary"
                            />
                          </div>
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed bg-background/70 p-8 text-center">
                    <Boxes aria-hidden="true" className="mx-auto size-8 text-muted-foreground" />
                    <h3 className="mt-4 font-semibold">No available functionalities</h3>
                    <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                      Your session does not include permissions for the supported Home menu
                      functionalities yet.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-card/85 shadow-xl shadow-primary/5 backdrop-blur">
              {selectedFeature ? (
                <>
                  <CardHeader>
                    <CardTitle className="text-xl">{selectedFeature.label}</CardTitle>
                    <CardDescription>{selectedFeature.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {selectedFeature.items.map((item) => (
                      <div key={item.id} className="rounded-2xl border bg-background/70 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="font-medium">{item.label}</h3>
                            <p className="mt-1 text-sm leading-6 text-muted-foreground">
                              {item.description}
                            </p>
                          </div>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge variant="outline">Planned</Badge>
                            </TooltipTrigger>
                            <TooltipContent>Visual preview; implementation comes later.</TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                    ))}

                    <p className="pt-2 text-xs leading-5 text-muted-foreground">
                      This panel is visual only. Person and Gender ABMC flows will be implemented in
                      a later change.
                    </p>
                  </CardContent>
                </>
              ) : (
                <CardContent className="flex min-h-80 flex-col items-center justify-center p-8 text-center">
                  <div className="grid size-14 place-items-center rounded-3xl bg-primary/10 text-primary">
                    <Boxes aria-hidden="true" className="size-6" />
                  </div>
                  <h2 className="mt-5 text-lg font-semibold">Select a product area</h2>
                  <p className="mt-2 max-w-xs text-sm leading-6 text-muted-foreground">
                    Choose an available menu option to preview the planned workflows.
                  </p>
                </CardContent>
              )}
            </Card>
          </div>
        </section>
      </section>
    </main>
  )
}
