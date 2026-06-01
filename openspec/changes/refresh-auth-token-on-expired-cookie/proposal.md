# Proposal: Refresh Auth Token on Expired Cookie

## Intent

Keep authenticated users in-session when only the short-lived `auth_token` expires. On exact backend error `AUTH_COOKIE_EXPIRED_INVALID`, refresh auth using the stored `refresh_token`, persist both refreshed tokens returned by the backend, retry once, and fail closed to login when refresh cannot recover.

## Scope

### In Scope
- Detect HTTP 401 JSON responses with exact `errorCode: "AUTH_COOKIE_EXPIRED_INVALID"` for protected auth/session requests.
- Call `GET urls.auth.refreshToken` with the stored `refresh_token`, persist the returned `auth_token` and `refresh_token`, then retry the original request once.
- On refresh failure, clear Electron auth cookies and renderer session context, route to login, and show a session-expired/auth message.

### Out of Scope
- Refreshing on other 401 errors or non-matching error codes.
- Broad generic API client refactor for future backend calls.
- Changing backend cookie contracts.

## Capabilities

### New Capabilities
- `auth-session-refresh`: Covers expired auth-cookie recovery, both-token persistence, refresh failure cleanup, and user-facing session-expired handling.

### Modified Capabilities
- None. Existing specs cover `automated-testing` and `home-feature-catalog`; neither defines auth-session behavior.

## Approach

Implement a small Electron main-process refresh/retry helper first used by `auth:session-context`. Parse failed response JSON once, refresh only when `errorCode` matches exactly, send only the stored `refresh_token` cookie to `urls.auth.refreshToken`, persist both replacement cookies/tokens returned by refresh before retrying, and retry once. Return a typed session-expired failure so `App`/`LoginPage` can clear renderer session storage, redirect, and show a clear message.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `electron/ipc/auth.ipc.ts` | Modified | Refresh, both-cookie persistence, retry, cleanup |
| `src/shared/types/auth.ts` | Modified | Typed session-expired failure if needed |
| `src/app/App.tsx` | Modified | Login redirect and renderer cleanup |
| `src/pages/login/LoginPage.tsx` | Modified | Session-expired/auth message |
| `src/shared/session/sessionContextStorage.ts` | Modified | Reuse or extend session cleanup |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Token pair persisted partially | Med | Treat refresh as valid only after both returned tokens are stored |
| Response body consumed twice | Med | Centralize JSON/error parsing |
| Retry loop | Low | Allow one retry maximum |
| Cookie removal misses scope | Med | Remove stored cookies by their actual domain/path metadata |

## Rollback Plan

Revert the auth IPC, renderer redirect/message, and session cleanup changes; restore prior direct `sessionContext` failure handling.

## Dependencies

- Existing `urls.auth.refreshToken` endpoint returns both refreshed `auth_token` and `refresh_token` cookies/tokens.

## Success Criteria

- [ ] Exact expired-cookie error refreshes and persists both tokens before retrying once successfully.
- [ ] Other 401/error codes do not refresh.
- [ ] Refresh failure clears cookies/session context, redirects to login, and shows a session-expired/auth message.
