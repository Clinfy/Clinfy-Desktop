## Exploration: Implement Test Runner

### Current State
Clinfy Desktop has no configured test runner, coverage tool, or test files. Verification currently relies on `npm run lint`, `npx tsc -b`, and `npm run build`. The app is Vite-native with React renderer code under `src/` and Electron main/preload code under `electron/`. TypeScript uses project references: `tsconfig.app.json` includes `src`, while `tsconfig.node.json` currently includes only `vite.config.ts`.

Context7 docs confirm Vitest supports Vite projects with `test.environment`, `setupFiles`, `coverage.provider`, and `globals`; Testing Library recommends `render` + `screen`; `@testing-library/jest-dom` provides a Vitest-specific setup import: `@testing-library/jest-dom/vitest`.

### Affected Areas
- `package.json` — add test dependencies and scripts.
- `package-lock.json` — dependency lockfile updates.
- `vitest.config.ts` — new Vitest configuration for renderer and pure TS tests.
- `src/test/setup.ts` — load jest-dom Vitest matchers and shared test setup.
- `tsconfig.app.json` / `tsconfig.node.json` — include Vitest and setup/config types where needed.
- `openspec/config.yaml` — update testing capabilities after runner installation.
- `src/**/*.test.ts(x)` — add minimal smoke/example tests to prove the runner works.

### Approaches
1. **Vitest + React Testing Library + jsdom** — Vite-native runner for TypeScript, React, DOM assertions, and coverage.
   - Pros: aligns with Vite, fast, modern, supports JSX/TS, straightforward setup with RTL and jest-dom.
   - Cons: jsdom does not emulate real Electron APIs; IPC needs mocks.
   - Effort: Medium

2. **Playwright-only E2E runner** — browser-level testing for built UI flows.
   - Pros: realistic UI behavior and useful for auth flows later.
   - Cons: heavier, not ideal as the first unit/component runner, more setup for Electron.
   - Effort: High

3. **Node test runner** — use built-in Node tests for pure functions only.
   - Pros: minimal dependency footprint.
   - Cons: poor fit for React component tests and Vite aliases.
   - Effort: Low

### Recommendation
Start with **Vitest + React Testing Library + jsdom + @testing-library/jest-dom + V8 coverage**. Configure scripts for `test`, `test:watch`, and `test:coverage`; add one small renderer/component or utility smoke test; keep Electron IPC integration and full E2E out of scope for this change.

### Risks
- React 19 + TypeScript 6 + current dependency versions may require compatible latest testing packages.
- jsdom tests need explicit mocks for `window.clinfy` or Electron-specific behavior.
- Adding globals may require TypeScript type configuration to avoid lint/type errors.

### Ready for Proposal
Yes — propose a focused first testing layer: unit/component tests with Vitest, leaving Electron E2E for a future SDD change.
