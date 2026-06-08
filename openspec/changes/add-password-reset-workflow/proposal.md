# Proposal: Add Password Reset Workflow

## Intent

Provide password recovery while preserving the typed Electron auth boundary and backend error messages.

## Scope

### In Scope
- Route `LoginPage -> ForgotPasswordPage -> ResetPasswordPage -> LoginPage`.
- Submit `{ email }` for forgot-password and `{ email, token, password }` for reset-password through typed `window.clinfy.auth` IPC methods.
- Trim and preserve email in router state; redirect reset access without valid email state to `/forgot-password`.
- Display the token as `XXX-XXX-XXX`, block paste, and require exactly nine user-entered characters.
- Require password confirmation and `/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/`.
- Show backend `message` values with local fallbacks; return the reset success message to Login.
- Add IPC unit and renderer component coverage.

### Out of Scope
- Renderer-direct backend requests or auth-boundary redesign.
- Backend endpoint or server-validation changes.
- Git operations, branches, commits, pushes, or PRs.

## Capabilities

### New Capabilities
- `password-reset-workflow`: Recovery navigation, IPC contracts, validation, token handling, messaging, guards, and tests.

### Modified Capabilities
- None.

## Approach

Extend auth types, preload, and IPC handlers with discriminated forgot/reset results. Reuse endpoint-error parsing without session-refresh behavior. Add memory-router pages, controlled forms, disabled submitting states, and user-visible feedback.

The UI formats the token as `XXX-XXX-XXX` but submits the raw nine-character token; formatting is presentation-only. No character set is assumed beyond exactly nine user-entered characters.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `electron/ipc/auth.ipc.ts`, `electron/preload.ts` | Modified | Typed endpoint operations and error handling |
| `src/shared/types/` | Modified | Request/result and preload contracts |
| `src/app/App.tsx`, `src/pages/` | Modified/New | Routes, pages, guards, validation, messages |
| `electron/ipc/*.test.ts`, `src/pages/**/*.test.tsx` | Modified/New | Payload, navigation, validation, token, and message coverage |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Backend expects another token wire format or character set | Medium | Confirm contract before implementation; keep formatting separate |
| Public endpoints accidentally trigger refresh logic | Low | Test dedicated handlers and error branches |
| Missing router state creates incomplete reset requests | Medium | Redirect before rendering/submitting |

## Rollback Plan

Remove the two routes/pages and their typed IPC additions and tests; restore the inert Login recovery link. No backend or persisted-data migration is involved.

## Dependencies

- Backend confirmation that reset accepts the raw nine-character token and clarification of any allowed character set.
- Existing forgot/reset URLs and Vitest tooling.

## Success Criteria

- [ ] The full page flow works with guarded state, exact payloads, backend messages, and success return to Login.
- [ ] Token, password, confirmation, paste prevention, disabled submission, IPC errors, and navigation are covered by tests.
- [ ] Delivery remains local-only.
