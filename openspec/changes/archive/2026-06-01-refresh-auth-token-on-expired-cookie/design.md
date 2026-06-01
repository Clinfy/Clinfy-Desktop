# Design: Refresh Auth Token on Expired Cookie

## Technical Approach

Add a narrow refresh/retry path inside Electron main auth IPC, first for `auth:session-context`. The main process remains the only layer that reads/writes Electron cookies. Renderer receives a typed session-expired failure and owns `sessionStorage` cleanup plus login navigation/message. Refresh only happens for HTTP 401 responses whose parsed JSON has exact `errorCode: "AUTH_COOKIE_EXPIRED_INVALID"`.

## Architecture Decisions

| Decision | Choice | Alternatives considered | Rationale |
|---|---|---|---|
| Refresh boundary | Keep refresh, cookie persistence, retry, and cookie clearing in `electron/ipc/auth.ipc.ts`. | Move token handling to renderer or preload. | Preserves current security boundary: renderer never directly handles Electron cookies; preload stays a thin typed bridge. |
| Request helper | Introduce a small internal helper for protected auth GETs that accepts a request factory and retries once after refresh. | Broad API client abstraction. | Proposal explicitly avoids a broad client refactor; one helper prevents body double-read and retry loops. |
| Refresh trigger | Parse failed response once; refresh only when status is 401 and `errorCode` is exactly `AUTH_COOKIE_EXPIRED_INVALID`. | Refresh all 401s or message matching. | Avoids hiding invalid credentials, revoked sessions, permission failures, or unrelated auth errors. |
| Refresh request cookies | Build refresh request headers from stored `refresh_token` only when possible. | Send both `auth_token` and `refresh_token`. | Backend should prove refresh eligibility from refresh token; avoids sending known-expired access token. |
| Token persistence | Treat refresh as successful only when response provides both `auth_token` and `refresh_token`; persist both before retry. | Persist only access token or allow partial refresh. | User clarified endpoint returns both; partial persistence risks split-brain sessions. |

## Data Flow

```text
App/LoginPage ──IPC──> auth:session-context
  └─ Electron fetch session-context with stored auth cookies
      ├─ ok → return context
      ├─ 401 + AUTH_COOKIE_EXPIRED_INVALID
      │   └─ fetch refresh-token with refresh_token only
      │       ├─ ok + both cookies → persist both → retry session-context once
      │       └─ fail/missing cookies → clear Electron cookies → return sessionExpired
      └─ other error → return normal failure, no refresh
Renderer sessionExpired → clearSessionContext() → /login with message
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `electron/ipc/auth.ipc.ts` | Modify | Add expired-code constant, refresh helper, refresh-token-only cookie header builder, both-cookie validation/persistence, one retry, and failure cleanup. |
| `src/shared/types/auth.ts` | Modify | Extend failure side of `SessionContextResult` with optional `reason: 'session-expired'` or equivalent discriminant. |
| `src/shared/types/electron.d.ts` | Modify | Keep window API result type aligned through existing `SessionContextResult`. |
| `src/app/App.tsx` | Modify | On `session-expired`, clear session context and route to login with state/message. |
| `src/pages/login/LoginPage.tsx` | Modify | Read router location state and show session-expired message before manual login. |
| `src/shared/session/sessionContextStorage.ts` | Keep/Modify | Reuse `clearSessionContext`; add helper only if renderer cleanup duplication appears. |
| `src/shared/auth/session-expiration.test.tsx` or colocated tests | Create | Cover renderer cleanup/navigation/message behavior with Vitest/Testing Library. |

## Interfaces / Contracts

```ts
type SessionContextResult =
  | { success: true; context: SessionContext }
  | { success: false; message: string; reason?: 'session-expired' }
```

Internal main-process helpers should not cross preload:
- `getStoredAuthCookieHeaders({ refreshOnly?: boolean })`
- `refreshAuthCookies(): Promise<boolean>` persists both returned cookies or returns false.
- `clearAuthCookies()` continues removing both cookie names by actual cookie metadata.

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | Error parser/refresh decision, Set-Cookie extraction requiring both cookies, refresh-only cookie header composition. | Extract pure helpers where practical and test with Vitest. |
| Main IPC integration-ish | Session-context 401 exact code refreshes, persists both cookies, retries once; other 401s do not refresh; refresh failure clears cookies and returns `reason: 'session-expired'`. | Vitest with mocked `fetch` and mocked Electron `session.defaultSession.cookies`. |
| Renderer component | App/LoginPage clear session context, route to login, and display session-expired message. | Existing jsdom Testing Library setup. |

## Migration / Rollout

No migration required. Rollout is a behavior-only Electron/renderer change. Verify with `npm run test`, `npm run lint`, and `npm run build` before apply completion.

## Open Questions

None.
