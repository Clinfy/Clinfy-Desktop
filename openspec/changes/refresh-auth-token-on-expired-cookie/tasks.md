# Tasks: Refresh Auth Token on Expired Cookie

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 300-380 |
| 400-line budget risk | Medium |
| Chained PRs recommended | No |
| Suggested split | Single PR with work-unit commits |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Medium

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Main-process refresh/retry behavior with tests | PR 1 | Core auth IPC change; keep helper tests with code. |
| 2 | Renderer expired-session redirect/message with tests | PR 1 | UI handling and route-state message. |

## Phase 1: Main Auth Foundation

- [x] 1.1 In `electron/ipc/auth.ipc.ts`, add `AUTH_COOKIE_EXPIRED_INVALID` and a typed parser that reads 401 error JSON once.
- [x] 1.2 Extend `getStoredAuthCookieHeaders` in `electron/ipc/auth.ipc.ts` to support refresh-token-only cookie headers.
- [x] 1.3 Add refresh response validation in `electron/ipc/auth.ipc.ts` that requires both `auth_token` and `refresh_token` before persistence.

## Phase 2: Refresh and Retry Flow

- [x] 2.1 In `electron/ipc/auth.ipc.ts`, add `refreshAuthCookies()` using `GET urls.auth.refreshToken` with only stored `refresh_token`.
- [x] 2.2 Wrap `getSessionContext()` request handling so exact 401 + `AUTH_COOKIE_EXPIRED_INVALID` refreshes, persists both cookies, and retries once.
- [x] 2.3 Ensure refresh failure, incomplete token pair, missing refresh cookie, or retried 401 clears Electron auth cookies and returns `reason: 'session-expired'`.
- [x] 2.4 Ensure other 401/error codes return the normal failure path and never call refresh.

## Phase 3: Renderer Handling

- [x] 3.1 Update `src/shared/types/auth.ts` so failed `SessionContextResult` may include `reason: 'session-expired'`.
- [x] 3.2 Confirm `src/shared/types/electron.d.ts` remains aligned through `SessionContextResult`; edit only if type exposure breaks.
- [x] 3.3 In `src/app/App.tsx`, on `session-expired`, call `clearSessionContext()` and initialize `/login` with route state/message.
- [x] 3.4 In `src/pages/login/LoginPage.tsx`, read route state and render the session-expired/auth message before manual login.

## Phase 4: Vitest Coverage

- [x] 4.1 Add colocated `electron/ipc/auth.ipc.test.ts` covering exact-code refresh, refresh-token-only GET, both-cookie persistence, one retry, and no refresh for other 401s.
- [x] 4.2 Add `src/shared/auth/session-expiration.test.tsx` covering sessionStorage cleanup, login navigation state, and visible expired-session message.
- [x] 4.3 Run `npm run test`, `npm run lint`, and `npm run build`; fix only failures caused by this change.
