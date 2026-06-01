# Design: Implement Test Runner

## Technical Approach

Add a dedicated Vitest configuration for the renderer/unit testing layer without changing the Electron runtime build. Vitest will run TypeScript/TSX tests through Vite-compatible resolution, use `jsdom` for renderer component tests, load a shared setup file for jest-dom matchers, and use V8 coverage. The first tests will prove infrastructure only: one lightweight utility or component test, avoiding broad authentication regression coverage until the next auth-focused change.

## Architecture Decisions

| Decision | Choice | Alternatives considered | Rationale |
|---|---|---|---|
| Test runner | Vitest | Jest, Node test runner | Vitest is Vite-native, supports TypeScript/JSX, setup files, jsdom, and V8 coverage with minimal project impedance. |
| DOM environment | `jsdom` globally in test config | `happy-dom`, per-file environments | React Testing Library expects browser-like APIs; a global `jsdom` config keeps the first setup simple and predictable. |
| Matchers | `src/test/setup.ts` imports `@testing-library/jest-dom/vitest` | Import matchers in every test | Central setup keeps component tests concise and matches jest-dom Vitest guidance. |
| Test APIs | Use explicit imports from `vitest` | Enable global Vitest APIs | Explicit imports avoid expanding TypeScript globals and keep tests clear under strict TypeScript settings. |
| Electron scope | Mock `window.clinfy` only in tests that need it | Boot Electron or preload in tests | The initial layer is unit/component testing, not Electron E2E; explicit mocks protect renderer tests from hidden runtime coupling. |
| Coverage | `@vitest/coverage-v8` | Istanbul provider, no coverage | V8 coverage is the native Vitest path and satisfies the proposal’s coverage command requirement. |

## Data Flow

    npm script
        └── vitest --config vitest.config.ts
                ├── Vite plugin/react transform + @ alias resolution
                ├── jsdom test environment
                ├── src/test/setup.ts -> jest-dom matchers
                └── src/**/*.test.{ts,tsx} -> assertions / coverage

No application data flow changes are introduced. The Electron main/preload processes are not started by this runner.

## File Changes

| File | Action | Description |
|---|---|---|
| `package.json` | Modify | Add `test`, `test:watch`, and `test:coverage` scripts plus Vitest, Testing Library, jsdom, user-event, and V8 coverage dev dependencies. |
| `package-lock.json` | Modify | Lock the new test dependencies. |
| `vitest.config.ts` | Create | Configure React plugin, `@` alias, `jsdom`, setup file, test include patterns, exclusions, and V8 coverage reporters. |
| `src/test/setup.ts` | Create | Import `@testing-library/jest-dom/vitest` and host future shared test setup. |
| `tsconfig.app.json` | Modify | Include test/setup files and jest-dom types if TypeScript requires matcher recognition. |
| `tsconfig.node.json` | Modify | Include `vitest.config.ts` so type-check/build validates the config. |
| `openspec/config.yaml` | Modify | Mark unit test runner and coverage commands as available after implementation. |
| `src/**/*.test.ts(x)` | Create | Add minimal proof tests for utility/component testing. |

## Interfaces / Contracts

Planned npm scripts:

```json
{
  "test": "vitest run",
  "test:watch": "vitest",
  "test:coverage": "vitest run --coverage"
}
```

The test contract is colocated `*.test.ts` and `*.test.tsx` files under `src/`. Tests that need Electron renderer APIs must define their own typed `window.clinfy` fixture or mock and clean it up after the test.

## Testing Strategy

| Layer | What to Test | Approach |
|---|---|---|
| Unit | Pure TypeScript helpers such as `cn()` or small utility behavior | Vitest assertions in `src/**/*.test.ts`. |
| Component | One simple renderer component or UI behavior | React Testing Library `render` + `screen` in jsdom with jest-dom matchers. |
| Integration | Future auth/session behavior | Deferred until the auth/cookie SDD change can add targeted tests. |
| E2E | Electron packaged/runtime flows | Out of scope; future Playwright/Electron change if needed. |

## Migration / Rollout

No data migration required. Rollout is additive: install dependencies, add config/scripts, add proof tests, then update SDD testing metadata. Rollback removes those files, dependencies, scripts, tests, and metadata updates.

## Open Questions

None.
