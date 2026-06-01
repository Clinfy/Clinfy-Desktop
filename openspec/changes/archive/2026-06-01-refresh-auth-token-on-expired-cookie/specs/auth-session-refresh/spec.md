# Auth Session Refresh Specification

## Purpose

Define how Clinfy Desktop recovers an authenticated session when only the short-lived auth cookie has expired, while failing closed for unrecoverable or unrelated authentication errors.

## Requirements

### Requirement: Expired auth-cookie refresh trigger

The system MUST attempt refresh only for a backend response with HTTP 401 and exact body `errorCode: "AUTH_COOKIE_EXPIRED_INVALID"`.

#### Scenario: Matching expired-cookie response triggers refresh

- GIVEN a protected session request receives HTTP 401
- WHEN the response body has exact `errorCode: "AUTH_COOKIE_EXPIRED_INVALID"`
- THEN the system MUST attempt auth-session refresh

#### Scenario: Other 401 responses do not refresh

- GIVEN a protected session request receives HTTP 401
- WHEN the response body is missing the exact expired-cookie error code
- THEN the system MUST NOT attempt auth-session refresh

### Requirement: Refresh request uses stored refresh cookie

The system MUST call the configured refresh endpoint using the stored `refresh_token` cookie.

#### Scenario: Refresh endpoint receives refresh token

- GIVEN auth-session refresh is triggered and a stored `refresh_token` exists
- WHEN the refresh request is sent
- THEN it MUST be sent to the refresh endpoint as a GET request
- AND it MUST include the stored `refresh_token` cookie

### Requirement: Successful refresh persists token pair before retry

On refresh success, the system MUST persist both returned auth cookies, `auth_token` and `refresh_token`, before retrying the original request exactly once.

#### Scenario: Token pair persisted before retry

- GIVEN the refresh endpoint returns both `auth_token` and `refresh_token`
- WHEN refresh succeeds
- THEN the system MUST persist both returned cookies
- AND retry the original request once after persistence succeeds

#### Scenario: Incomplete refresh response fails closed

- GIVEN the refresh endpoint response is missing `auth_token` or `refresh_token`
- WHEN the system handles the refresh response
- THEN it MUST treat refresh as failed
- AND MUST NOT retry the original request

### Requirement: Refresh failure clears session and redirects to login

When refresh cannot recover the session, the system MUST clear Electron auth cookies and renderer session storage, navigate to login, and show a session-expired or auth error message.

#### Scenario: Refresh failure clears all local auth state

- GIVEN auth-session refresh fails
- WHEN the failure is handled
- THEN Electron auth cookies MUST be cleared
- AND renderer session storage MUST be cleared

#### Scenario: User is returned to login with message

- GIVEN auth-session refresh fails
- WHEN the renderer handles the expired session result
- THEN the user MUST be navigated to login
- AND a session-expired or authentication error message MUST be shown

### Requirement: Refresh retry is bounded

The system MUST NOT enter a refresh loop for the same original request.

#### Scenario: Retried request is not refreshed again

- GIVEN an original request was already retried after refresh
- WHEN the retried request receives HTTP 401 with `errorCode: "AUTH_COOKIE_EXPIRED_INVALID"`
- THEN the system MUST NOT attempt another refresh for that request
- AND it MUST fail closed to login handling
