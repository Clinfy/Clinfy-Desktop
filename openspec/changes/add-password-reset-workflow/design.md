# Design: Add Password Reset Workflow

## Technical Approach

Extend the existing `renderer -> preload -> auth IPC -> backend` boundary. Two public POST handlers expose typed discriminated results, while React Router carries trimmed email and outcome messages between three auth pages. Public recovery calls reuse JSON error-message parsing but never read cookies, refresh authentication, or mutate session state.

## Architecture Decisions

| Topic | Options / tradeoff | Decision and rationale |
|---|---|---|
| IPC surface | Generic auth request is smaller but weakly typed | Add `auth:forgot-password` and `auth:reset-password`, registered inside `registerAuthIpc`, and expose matching `window.clinfy.auth` methods. This follows current channel and preload conventions. |
| Public endpoint errors | Existing `readAuthError` includes refresh metadata | Extract/reuse message parsing through a public POST helper returning only `{ success, message }`; never invoke `refreshAuthCookies`. This preserves backend messages without coupling recovery to authenticated sessions. |
| Route state | Global store persists longer; router state is transient | Use `/forgot-password` and `/reset-password`; pass `{ email }` to reset and `{ message, messageVariant: 'success' }` to `/login`. Reset returns `<Navigate replace>` to forgot-password unless state contains a trimmed, valid email. |
| Token representation | A free-form token conflicts with the confirmed backend contract and makes slot navigation inconsistent | Keep nine controlled slots backed by input refs. At the UI boundary, validate the original single code point against ASCII `/^[A-Za-z0-9]$/` before uppercasing so Unicode case folding cannot convert rejected input into accepted ASCII. Normalize accepted lowercase to uppercase, auto-focus the next slot, and ignore invalid characters without replacing state or moving focus. Render ASCII hyphens after slots 3 and 6, block `onPaste`, and derive the exact payload with `slots.join('')`. Backspace clears the current populated slot; from an empty slot it focuses and clears the previous slot. |
| Form validation | Browser-only validation is difficult to test consistently | Use a shared page-local email predicate, the approved password regex, exact token length, and equality confirmation. Reset submit is enabled only when all are valid and `!isSubmitting`; the handler repeats the guard to prevent synthetic/duplicate submissions. |
| Feedback | One destructive route message cannot represent success | Extend Login route state with `messageVariant`; default absent variants to destructive for session-expiration compatibility, and render reset success with the normal alert style. Page errors prefer nonblank result messages, otherwise local endpoint-specific fallbacks. |
| Reset form controls | Shared visibility state is simpler but couples two independent secrets; omitting back navigation forces the user to restart indirectly | Follow LoginPage's Eye/EyeOff button pattern with separate visibility state and dynamic accessible labels for each password field. Add a Back button that navigates to `/forgot-password`; disable it with the rest of the form while submitting. |

## Data Flow

```text
Login --navigate--> ForgotPassword --{email}--> ResetPassword
                         |                         |
window.clinfy.auth.forgotPassword()   window.clinfy.auth.resetPassword()
                         |                         |
preload invoke --> auth IPC public POST --> configured backend URL
                                                   |
                              success {message} --> Login route state
```

## File Changes

| File | Action | Description |
|---|---|---|
| `src/shared/types/auth.ts` | Modify | Add recovery request/result contracts. |
| `src/shared/types/electron.d.ts`, `electron/preload.ts` | Modify | Type and expose both methods. |
| `electron/ipc/auth.ipc.ts` | Modify | Register channels and public JSON POST/error handling. |
| `src/app/App.tsx`, `src/pages/login/LoginPage.tsx` | Modify | Register routes, recovery navigation, and success alert state. |
| `src/pages/forgot-password/ForgotPasswordPage.tsx` | Create | Email validation, submission, and reset navigation. |
| `src/pages/reset-password/ResetPasswordPage.tsx` | Create | Guard, uppercase alphanumeric token slots with ref-driven focus/deletion behavior, independent password visibility, back navigation, validation, submission, and outcome navigation. |
| `electron/ipc/auth.ipc.test.ts` | Modify | Cover channels, exact bodies, backend/fallback errors, and zero refresh/cookie activity. |
| `src/pages/forgot-password/ForgotPasswordPage.test.tsx`, `src/pages/reset-password/ResetPasswordPage.test.tsx` | Create | Focused renderer flows and validation. |
| `src/shared/auth/session-expiration.test.tsx` | Modify | Extend typed `window.clinfy.auth` mock; retain existing behavior. |

## Interfaces / Contracts

```ts
type ForgotPasswordRequest = { email: string }
type ResetPasswordRequest = { email: string; token: string; password: string }
type PasswordRecoveryResult =
  | { success: true; message: string }
  | { success: false; message: string }

forgotPassword(request: ForgotPasswordRequest): Promise<PasswordRecoveryResult>
resetPassword(request: ResetPasswordRequest): Promise<PasswordRecoveryResult>
```

Both handlers send `POST`, `Content-Type: application/json`, and exactly the request object. Success reads an optional JSON `message` and substitutes an operation-specific success fallback; non-2xx or malformed responses return operation-specific error fallbacks.

## Testing Strategy

| Layer | Coverage |
|---|---|
| IPC Vitest | Registration, URL/method/body, success messages, backend errors, malformed/network fallback, and no refresh/cookie calls. |
| Renderer Vitest + Testing Library | Login link, trimmed email payload/state, invalid email, missing-state redirect, read-only email, ASCII token filtering/normalization, auto-advance, Backspace behavior, separators, paste prevention, independent password visibility, back navigation, regex/confirmation feedback, enabled/submitting rules, exact reset payload, and success/error propagation. |

## Security / Rollout

Context isolation remains intact: the renderer receives only two narrow methods and discriminated data. Recovery endpoints receive no stored cookies and cannot trigger refresh. No migration or feature flag is required; rollback removes routes, pages, methods, handlers, and tests.

## Open Questions

None. The refined contract explicitly supersedes the earlier unrestricted-character token decision: reset tokens are exactly nine uppercase ASCII alphanumeric characters.
