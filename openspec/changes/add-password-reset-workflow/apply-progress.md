# Apply Progress: Add Password Reset Workflow

## Mode

Standard mode (`strict_tdd: false`).

## Workload Boundary

- Delivery: Completed the original three local slices plus a user-requested pre-archive refinement slice.
- Current work unit: Reset-password interaction refinements after the prior verification.
- Git/PR operations: Not performed; the user will map local slices to PRs manually.

## Completed Tasks

- [x] 1.1 Added forgot/reset request types, a discriminated recovery result, and typed renderer API methods.
- [x] 1.2 Exposed dedicated `auth:forgot-password` and `auth:reset-password` preload calls.
- [x] 1.3 Added isolated public JSON POST handlers with exact request bodies, backend message preference, operation-specific fallbacks, and no auth cookie/session behavior.
- [x] 1.4 Added focused IPC coverage for registration, requests, outcomes, fallbacks, and cookie/refresh isolation.
- [x] 1.5 Extended the existing `window.clinfy.auth` test mock for the new typed methods.
- [x] 2.1 Added accessible forgot-password UI with trimmed validation, exact bridge submission, fallback errors, duplicate prevention, and reset route state.
- [x] 2.2 Added focused forgot-password renderer coverage for validation, payload, outcomes, navigation, and pending-state behavior.
- [x] 2.3 Added guarded reset-password UI with read-only email, nine arbitrary-character slots, paste blocking, password validation, exact payloads, and Login success navigation.
- [x] 2.4 Added focused reset-password renderer coverage for guards, token behavior, validation, duplicate prevention, payloads, and outcomes.
- [x] 2.5 Registered recovery routes and added Login recovery navigation plus explicit success/destructive message variants.
- [x] 2.6 Extended session-expiration coverage for recovery navigation, reset success feedback, and unchanged destructive feedback.
- [x] 3.1 Ran focused password-recovery tests and the full Vitest suite; all tests passed without assertion or behavior changes.
- [x] 3.2 Ran lint, TypeScript project checking, and the production build; inspected UI copy, labels, renderer boundaries, and recovery isolation.
- [x] 4.1 Replaced unrestricted token characters with ASCII alphanumeric filtering, uppercase normalization, ref-driven auto-advance, invalid-input preservation, ergonomic Backspace behavior, and optional arrow navigation.
- [x] 4.2 Added independent Eye/EyeOff visibility controls with dynamic accessible labels for both password fields.
- [x] 4.3 Added a Back action to `/forgot-password` and disabled it while submitting.
- [x] 4.4 Reworked focused reset-page tests for the refined token contract, focus/deletion behavior, independent visibility, back navigation, pending-state controls, exact payloads, and prior outcomes.
- [x] 4.5 Ran focused and full tests, lint, type-check, and production build successfully.

## Fresh Review Fix

- Shaped renderer-controlled IPC values into exact main-process DTOs before serialization.
- Rejected non-object or malformed requests with operation-specific fallbacks and no network request.
- Added coverage proving unexpected fields never cross the IPC boundary.

## Renderer Decisions

- Shared the approved email/password predicates in a renderer-only validation module.
- Used synchronous ref locks alongside disabled states so rapid or synthetic duplicate submissions cannot cross the bridge.
- Tracked Login message variants explicitly instead of inferring the variant from message text.

## Slice 2 Fresh Review Fix

- Rendered Login success feedback through the supported default Alert variant with success-specific classes, preserving destructive session feedback.
- Replaced visual token separators with literal ASCII hyphens.
- Changed token slot normalization and validation from UTF-16 code units to Unicode code points so non-BMP characters remain intact.
- Strengthened coverage with same-tick duplicate form submissions and paste prevention assertions for all nine token slots.

## Pre-Archive Refinement Decisions

- The user's confirmed token contract supersedes the earlier unrestricted Unicode decision: only ASCII `A-Z` and `0-9` are stored, and lowercase ASCII input is normalized before state changes.
- Token slots use refs so accepted input advances focus; invalid input leaves both state and focus unchanged.
- Backspace clears a populated current slot, or moves backward and clears when the current slot is empty. Arrow Left/Right navigation is also supported.
- New-password and confirmation visibility are independent and follow LoginPage's accessible Eye/EyeOff pattern.
- Back navigation returns to `/forgot-password` without changing the exact reset IPC payload or authenticated-session boundary.

## Pre-Archive Fresh Review Fix

- Fixed a Unicode case-conversion bypass by validating the original input code point against ASCII `/^[A-Za-z0-9]$/` before uppercasing; `ſ`, `ı`, accented letters, and symbols now remain rejected without changing value or focus.
- Added direct Arrow Left/Right focus-navigation coverage.
- Added stable icon-state semantics and direct assertions that each password toggle independently changes its input type, accessible action label, and Eye/EyeOff state in both directions.
- Added direct coverage for a rejected `resetPassword` promise showing the local fallback message.

## Files Changed

- `src/shared/types/auth.ts`
- `src/shared/types/electron.d.ts`
- `electron/preload.ts`
- `electron/ipc/auth.ipc.ts`
- `electron/ipc/auth.ipc.test.ts`
- `src/shared/auth/session-expiration.test.tsx`
- `src/pages/password-recovery/validation.ts`
- `src/pages/forgot-password/ForgotPasswordPage.tsx`
- `src/pages/forgot-password/ForgotPasswordPage.test.tsx`
- `src/pages/reset-password/ResetPasswordPage.tsx`
- `src/pages/reset-password/ResetPasswordPage.test.tsx`
- `src/app/App.tsx`
- `src/pages/login/LoginPage.tsx`
- `openspec/changes/add-password-reset-workflow/specs/password-reset-workflow/spec.md`
- `openspec/changes/add-password-reset-workflow/design.md`
- `openspec/changes/add-password-reset-workflow/tasks.md`
- `openspec/changes/add-password-reset-workflow/apply-progress.md`

## Verification

Command:

```text
npm run test -- electron/ipc/auth.ipc.test.ts src/shared/auth/session-expiration.test.tsx
```

Result: 2 test files passed; 14 tests passed.

Fresh review fix:

```text
npm run test -- electron/ipc/auth.ipc.test.ts
```

Result: 1 test file passed; 16 tests passed.

Renderer slice:

```text
npm run test -- src/pages/forgot-password/ForgotPasswordPage.test.tsx src/pages/reset-password/ResetPasswordPage.test.tsx src/shared/auth/session-expiration.test.tsx
```

Result: 3 test files passed; 18 tests passed.

Slice 2 fresh review:

```text
npm run test -- src/pages/forgot-password/ForgotPasswordPage.test.tsx src/pages/reset-password/ResetPasswordPage.test.tsx src/shared/auth/session-expiration.test.tsx
```

Result: 3 test files passed; 19 tests passed.

```text
npx tsc -b
```

Result: passed with exit code 0 and no diagnostics.

Final local slice focused verification:

```text
npm run test -- electron/ipc/auth.ipc.test.ts src/pages/forgot-password/ForgotPasswordPage.test.tsx src/pages/reset-password/ResetPasswordPage.test.tsx src/shared/auth/session-expiration.test.tsx
```

Result: 4 test files passed; 35 tests passed.

```text
npm run test
```

Result: 6 test files passed; 37 tests passed.

```text
npm run lint
```

Result: passed with exit code 0 and no ESLint findings.

```text
npx tsc -b
```

Result: passed with exit code 0 and no diagnostics.

```text
npm run build
```

Result: passed with exit code 0. Vite built the renderer, Electron main process, and preload bundles. Vite emitted the existing `inlineDynamicImports` deprecation warning while building preload.

Pre-archive fresh review fix:

```text
npm run test -- src/pages/reset-password/ResetPasswordPage.test.tsx
```

Result: 1 test file passed; 15 tests passed.

```text
npm run test
```

Result: 6 test files passed; 42 tests passed.

```text
npm run lint
```

Result: passed with exit code 0 and no ESLint findings.

```text
npx tsc -b
```

Result: passed with exit code 0 and no diagnostics.

```text
npm run build
```

Result: passed with exit code 0. Vite built the renderer, Electron main process, and preload bundles. Vite emitted the existing `inlineDynamicImports` deprecation warning while building preload.

Pre-archive refinement focused verification:

```text
npm run test -- src/pages/reset-password/ResetPasswordPage.test.tsx
```

Result: 1 test file passed; 13 tests passed.

```text
npm run test
```

Result: 6 test files passed; 40 tests passed.

```text
npm run lint
```

Result: passed with exit code 0 and no ESLint findings.

```text
npx tsc -b
```

Result: passed with exit code 0 and no diagnostics.

```text
npm run build
```

Result: passed with exit code 0. Vite built the renderer, Electron main process, and preload bundles. Vite emitted the existing `inlineDynamicImports` deprecation warning while building preload.

## Final Inspection

- All password-recovery UI copy and accessible names are English.
- Email, password, confirmation, token slots, password visibility, and recovery navigation have explicit labels or accessible names.
- Recovery renderer code calls only the typed `window.clinfy.auth` bridge; it contains no direct network API usage.
- Recovery IPC uses the isolated public POST helper and does not read, write, clear, or refresh auth cookies or mutate renderer session state.

## Deviations

None. The implementation matches the updated specification and design across the original slices and the pre-archive refinement slice.

## Remaining Tasks

None in apply. All 18 tasks are complete.

## Verification Status

The existing verify report predates Phase 4 and is stale. It was intentionally not rewritten during apply. A fresh `sdd-verify` run is required before archive.
