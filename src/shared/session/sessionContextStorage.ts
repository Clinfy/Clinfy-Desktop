import type { SessionContext } from '@/shared/types/auth'

const SESSION_CONTEXT_STORAGE_KEY = 'clinfy-session-context'

export function saveSessionContext(context: SessionContext) {
  sessionStorage.setItem(SESSION_CONTEXT_STORAGE_KEY, JSON.stringify(context))
}

export function getSessionContext(): SessionContext | null {
  const storedContext = sessionStorage.getItem(SESSION_CONTEXT_STORAGE_KEY)

  if (!storedContext) {
    return null
  }

  try {
    return JSON.parse(storedContext) as SessionContext
  } catch {
    clearSessionContext()
    return null
  }
}

export function clearSessionContext() {
  sessionStorage.removeItem(SESSION_CONTEXT_STORAGE_KEY)
}
