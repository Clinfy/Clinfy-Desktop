## Exploration: refresh-auth-token-on-expired-cookie

### Current State
- Auth IPC lives in `electron/ipc/auth.ipc.ts`; renderer calls it through `electron/preload.ts` and typed `window.clinfy.auth` in `src/shared/types/electron.d.ts`.
- Login posts to `urls.auth.login`, extracts `auth_token` and `refresh_token` from `Set-Cookie`, persists both into Electron `session.defaultSession.cookies`, then the renderer calls `getSessionContext()` and saves the returned `SessionContext` in `sessionStorage`.
- Startup in `src/app/App.tsx` checks only for a stored `refresh_token` via `auth:session-status`; if present, it calls `auth:session-context`, saves context on success, or clears only session context and routes to `/login` on failure.
- `getSessionContext()` currently sends both stored auth cookies to `urls.auth.sessionContext`. Any non-OK response returns `readErrorMessage(...)`; it does not inspect `errorCode`, call `urls.auth.refreshToken`, retry, or clear cookies on auth-expiration failures.
- `urls.auth.refreshToken` already exists in `src/configs/urls.ts`, but no code currently uses it. No auth IPC tests exist yet; current tests cover only `src/lib/utils` and the UI button.

### Affected Areas
- `electron/ipc/auth.ipc.ts` — primary implementation point: detect the exact `AUTH_COOKIE_EXPIRED_INVALID` error code, refresh with the stored `refresh_token`, persist the new `auth_token`, retry the original backend request, and clear cookies on refresh failure.
- `src/shared/types/auth.ts` — may need a typed auth/session-expired failure shape so the renderer can distinguish regular request failure from forced-login session expiry.
- `electron/preload.ts` and `src/shared/types/electron.d.ts` — affected only if a new IPC method or changed auth result contract is introduced; prefer keeping existing IPC surface if possible.
- `src/app/App.tsx` — startup already routes to `/login` on session-context failure, but it currently clears only sessionStorage; it may need to call logout/clear-cookies behavior or react to a session-expired result.
- `src/pages/login/LoginPage.tsx` — likely place to show the session-expired/auth error after redirect; currently stores only local submit errors, with no route state or shared auth message mechanism.
- `src/shared/session/sessionContextStorage.ts` — already centralizes sessionStorage context clearing; may need a broader helper if session-expired cleanup must clear all sessionStorage instead of only `clinfy-session-context`.
- `src/configs/urls.ts` — `urls.auth.refreshToken` is already configured; implementation should use this existing endpoint key.

### Approaches
1. **Main-process refresh wrapper around protected auth requests** — Keep refresh/retry logic inside `electron/ipc/auth.ipc.ts`, parse 401 JSON bodies, refresh only for `AUTH_COOKIE_EXPIRED_INVALID`, persist replacement cookies, then retry `getSessionContext()` once.
   - Pros: Centralizes cookie access in Electron main where HttpOnly cookies are already managed; preserves preload API; avoids exposing refresh token to renderer; safest security boundary.
   - Cons: Needs careful response-body parsing so the original error message is still available; retry guard is required to prevent loops.
   - Effort: Medium.

2. **Renderer-driven refresh flow** — Return a special expired-cookie failure to React, then have the renderer call a new refresh IPC method and retry the original action.
   - Pros: Makes UI flow explicit; renderer can decide messaging/navigation.
   - Cons: Spreads auth protocol details across renderer and main; more IPC surface; easier to accidentally refresh for the wrong error or duplicate retry logic per request.
   - Effort: Medium/High.

3. **Generic IPC authenticated request client** — Extract a reusable main-process request helper for all future backend calls, with refresh-on-exact-error behavior and one retry.
   - Pros: Best long-term foundation as more backend requests appear; avoids duplicating refresh behavior later.
   - Cons: More architecture work than needed today because only `sessionContext` and logout are present; risks overbuilding before concrete callers exist.
   - Effort: High.

### Recommendation
Implement the refresh behavior in the Electron main process as a small protected-request helper used first by `getSessionContext()`. Parse failed 401 JSON once, refresh only when `errorCode === "AUTH_COOKIE_EXPIRED_INVALID"`, call `GET urls.auth.refreshToken` with only the stored `refresh_token` cookie, persist any returned `auth_token` cookie, retry the original request once, and clear auth cookies plus sessionStorage-facing session context on refresh failure. Return a typed session-expired failure so `App`/`LoginPage` can route to login and show a clear auth/session-expired message.

### Risks
- Refresh endpoint cookie contract must be confirmed: current login persistence expects both `auth_token` and `refresh_token`; refresh may return only `auth_token`, so implementation should not require a new `refresh_token` unless the backend actually sends one.
- `readErrorMessage()` currently consumes the response JSON; new code must parse error bodies without trying to read the same body twice.
- `clearAuthCookies()` removes cookies using login-origin URLs; if refresh/session cookies are scoped to a different domain/path than login, removal must still use the stored cookie domain/path correctly.
- Startup currently has no way to pass a one-time “session expired” message into `LoginPage`; adding this must be small and explicit, not a broad global state system.
- There are no Electron IPC tests today; auth behavior is mostly main-process logic, so later phases should decide whether to extract pure helpers for unit tests or add IPC-level test scaffolding.

### Ready for Proposal
Yes. The proposal should scope the first slice to main-process refresh/retry for `auth:session-context`, exact `AUTH_COOKIE_EXPIRED_INVALID` matching, one retry maximum, refresh failure cleanup, and a minimal renderer path for redirecting to login with a session-expired message.
