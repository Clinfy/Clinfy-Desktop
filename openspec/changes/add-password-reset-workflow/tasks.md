# Tasks: Add Password Reset Workflow

## Review Workload Forecast

| Field | Value |
|---|---|
| Estimated changed lines | 750–950 additions + deletions |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | Local slice 1 → slice 2 → slice 3; user maps slices to PRs manually |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Review boundary | Verification |
|---|---|---|---|
| 1 | Typed recovery contracts and isolated public IPC behavior | Local slice 1; standalone foundation | Focused IPC tests |
| 2 | Recovery pages, routes, validation, and messaging | Local slice 2; depends on unit 1 | Focused renderer tests |
| 3 | Regression verification and polish | Local slice 3; depends on units 1–2 | Test, lint, type-check, build |
| 4 | Pre-archive reset-form refinements | New local adjustment slice after verification | Focused reset tests, full test, lint, type-check, build |

## Phase 1: Typed Contracts and IPC

- [x] 1.1 Extend `src/shared/types/auth.ts` with forgot/reset request types and discriminated recovery results; update `src/shared/types/electron.d.ts` with both typed methods.
- [x] 1.2 Expose `forgotPassword` and `resetPassword` through `electron/preload.ts` using dedicated `auth:*` channels.
- [x] 1.3 Add public JSON POST handlers in `electron/ipc/auth.ipc.ts` using configured URLs, exact payloads, operation fallbacks, and no cookies, refresh, or session mutation.
- [x] 1.4 Extend `electron/ipc/auth.ipc.test.ts` for registration, method/URL/body, success/backend messages, malformed/network fallbacks, and zero refresh/cookie activity.
- [x] 1.5 Update the `window.clinfy.auth` mock in `src/shared/auth/session-expiration.test.tsx` so existing session scenarios remain type-safe.

## Phase 2: Renderer Pages and Routing

- [x] 2.1 Create `src/pages/forgot-password/ForgotPasswordPage.tsx` with trimmed-email validation, exact submission, disabled submitting state, fallback errors, and `{ email }` reset navigation.
- [x] 2.2 Create `src/pages/forgot-password/ForgotPasswordPage.test.tsx` covering invalid email, trimmed payload, backend/fallback errors, duplicate prevention, and successful navigation.
- [x] 2.3 Create `src/pages/reset-password/ResetPasswordPage.tsx` with the email guard, read-only email, nine token slots/separators, paste blocking, password/confirmation validation, and exact reset submission.
- [x] 2.4 Create `src/pages/reset-password/ResetPasswordPage.test.tsx` covering missing-state redirect, arbitrary raw token formatting, paste rejection, regex/mismatch feedback, disabled/duplicate submission, payload, and outcomes.
- [x] 2.5 Register both routes in `src/app/App.tsx`; update `src/pages/login/LoginPage.tsx` for recovery navigation and success/destructive route-message variants.
- [x] 2.6 Extend `src/shared/auth/session-expiration.test.tsx` to cover Login recovery navigation, reset success feedback, and unchanged destructive session-expiration feedback.

## Phase 3: Verification and Polish

- [x] 3.1 Run focused IPC and renderer tests, then `npm run test`; fix failures without weakening spec assertions.
- [x] 3.2 Run `npm run lint`, `npx tsc -b`, and `npm run build`; verify English UI copy, accessible labels, and no renderer-direct network or auth-refresh coupling.

## Phase 4: Pre-Archive Reset-Form Refinements

- [x] 4.1 Update the token UI contract to accept only ASCII letters/digits, normalize lowercase to uppercase, auto-advance accepted input, preserve invalid existing values/focus, and implement ergonomic Backspace behavior while retaining nine raw characters, ASCII separators, and paste blocking.
- [x] 4.2 Add independent accessible Eye/EyeOff visibility controls for new-password and confirmation fields.
- [x] 4.3 Add a Back action to `/forgot-password` and disable it while reset submission is pending.
- [x] 4.4 Update focused `ResetPasswordPage` tests for token normalization/filtering/focus/deletion, password visibility, back navigation, pending-state disabling, exact payloads, and preserved prior behavior.
- [x] 4.5 Run focused reset-password tests, full tests, lint, type-check, and production build; record that the previous verify report is stale and a new `sdd-verify` run is required.
