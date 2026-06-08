## Exploration: Password reset workflow

### Current State
The renderer uses a `MemoryRouter` with only `/` and `/login`. `LoginPage` already renders a “forgot your password?” link, but it only prevents the default action. Authentication requests cross the Electron boundary through typed `window.clinfy.auth` preload methods and `electron/ipc/auth.ipc.ts`; the renderer does not call backend URLs directly.

`src/configs/urls.ts` already defines `urls.auth.forgotPassword` and `urls.auth.resetPassword`, but neither is used. Auth endpoint errors follow `{ statusCode?, timestamp?, path?, errorCode?, message? }`; existing IPC handling displays the trimmed backend `message` and falls back to a local message when the response is malformed or the request fails. React forms are locally controlled with `useState`, native input semantics, shadcn `Input`/`Button`/`Alert`, explicit submitting state, and route-state messages. Vitest supports both Electron IPC unit tests and renderer component tests.

### Affected Areas
- `src/app/App.tsx` — add `/forgot-password` and `/reset-password` routes.
- `src/pages/login/LoginPage.tsx` — replace the inert recovery link with router navigation.
- `src/pages/forgot-password/ForgotPasswordPage.tsx` — collect and trim email, call the forgot-password bridge method, display endpoint errors, and navigate with email in route state.
- `src/pages/reset-password/ResetPasswordPage.tsx` — display the preserved email read-only; format and validate the verification key; block paste; validate password confirmation and strength; submit reset and return the success message to login.
- `src/configs/urls.ts` — already contains the required endpoint keys; no URL addition is expected.
- `src/shared/types/auth.ts` — add forgot/reset request and result contracts, including a successful reset message.
- `src/shared/types/electron.d.ts` — expose typed forgot/reset methods on `window.clinfy.auth`.
- `electron/preload.ts` — bridge forgot/reset IPC calls without exposing backend access to the renderer.
- `electron/ipc/auth.ipc.ts` — register handlers, POST the specified bodies, and reuse the existing endpoint-error parsing shape.
- `electron/ipc/auth.ipc.test.ts` — cover request bodies, success messages, backend reasons, malformed responses, and network fallbacks.
- `src/pages/**/*.test.tsx` — cover navigation, preserved email, token formatting/paste prevention, password validation, disabled submit state, request payloads, and displayed success/error messages.

### Approaches
1. **Extend the existing auth IPC boundary** — add typed forgot/reset operations to the current main/preload/renderer auth surface and implement two routed pages.
   - Pros: Matches the established architecture; keeps backend communication out of the renderer; centralizes error parsing; is straightforward to test at IPC and component boundaries.
   - Cons: Touches the shared type, preload, IPC, routing, page, and test layers.
   - Effort: Medium

2. **Call auth endpoints directly from renderer pages** — import `urls` and use `fetch` inside the new pages.
   - Pros: Fewer Electron-layer edits and less initial code.
   - Cons: Breaks the current auth boundary; duplicates error handling; couples UI to transport details; weakens consistency under `contextIsolation`.
   - Effort: Low initially, higher maintenance risk

### Recommendation
Use the existing auth IPC boundary. Add `forgotPassword({ email })` and `resetPassword({ email, token, password })` bridge methods, with IPC returning discriminated success/error results whose error branch always exposes the backend `message` when available.

Pass the trimmed email from Forgot Password to Reset Password through React Router state and render it in a read-only email input. If reset is opened without a valid email state, redirect to `/forgot-password` rather than allowing an incomplete request. After reset succeeds, navigate to `/login` with `replace: true` and route state containing the success `message`, which `LoginPage` already knows how to display.

Model the verification key as nine user-entered characters and render it as `XXX-XXX-XXX`; prevent `paste` on the token input and keep the submit button disabled until the raw key length is nine, the password matches `/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/`, and confirmation matches. The proposal/spec should explicitly settle whether the reset endpoint expects the raw nine-character token or the hyphenated display value; raw token submission is the safer default because formatting is a UI concern.

### Risks
- The required token character set and backend wire format are not represented in the repository; only its nine-character display requirement is known.
- “Paste must be blocked” needs both event prevention and tests; it is a UX restriction, not a security control, and should not replace server validation.
- Email exists only in memory-router state; reset must guard missing state to avoid sending an undefined identity.
- Existing `readAuthError` is session-refresh-aware. Reuse should preserve backend messages without accidentally applying refresh behavior to public forgot/reset endpoints.
- `CLAUDE.md` incorrectly says no test runner exists; `package.json`, `vitest.config.ts`, and OpenSpec configuration confirm Vitest is available and should cover this workflow.

### Ready for Proposal
Yes. The workflow fits the existing architecture and has clear implementation/test seams. The proposal should preserve the Electron IPC boundary and record the raw-versus-formatted token payload assumption for confirmation in the specification.
