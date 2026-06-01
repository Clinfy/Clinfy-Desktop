# Proposal: Implement Test Runner

## Intent

Add a first-class automated test runner so Clinfy Desktop can validate TypeScript utilities and React renderer components before build verification. This removes the current “no test runner configured” limitation from SDD.

## Scope

### In Scope
- Add Vitest, React Testing Library, jsdom, jest-dom, and coverage support.
- Add npm scripts for test, watch mode, and coverage.
- Add Vitest setup/config files compatible with Vite aliases and React.
- Add minimal smoke tests proving renderer/component and/or utility testing works.
- Update SDD testing capabilities after installation.

### Out of Scope
- Electron E2E tests with Playwright.
- Backend/API contract tests.
- Large test suite for existing auth flows.

## Capabilities

### New Capabilities
- `automated-testing`: Unit/component test runner, DOM assertions, coverage command, and project testing expectations.

### Modified Capabilities
- None

## Approach

Use Vitest because it is Vite-native and supports TypeScript/JSX, `jsdom` test environments, setup files, and V8 coverage. Use React Testing Library for user-oriented component tests and import `@testing-library/jest-dom/vitest` in the setup file for DOM matchers.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `package.json` | Modified | Add test dependencies and scripts. |
| `package-lock.json` | Modified | Lock new dependencies. |
| `vitest.config.ts` | New | Configure jsdom, setupFiles, aliases, coverage. |
| `src/test/setup.ts` | New | Register jest-dom Vitest matchers. |
| `tsconfig*.json` | Modified | Include Vitest/setup/config types as needed. |
| `openspec/config.yaml` | Modified | Mark test runner and coverage available. |
| `src/**/*.test.ts(x)` | New | Minimal proof tests. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Electron globals unavailable in jsdom | Med | Mock `window.clinfy` only where needed. |
| Dependency compatibility issues | Low | Use current docs and verify with lint/build/test. |
| Tests become too broad for setup change | Low | Keep initial tests minimal. |

## Rollback Plan

Remove new dependencies/scripts/config/setup/tests and revert `openspec/config.yaml` testing updates.

## Dependencies

- Vitest, jsdom, @testing-library/react, @testing-library/jest-dom, @testing-library/user-event, @vitest/coverage-v8.

## Success Criteria

- [ ] `npm run test` passes.
- [ ] `npm run test:coverage` runs successfully.
- [ ] `npm run lint` and `npm run build` still pass.
- [ ] `openspec/config.yaml` reflects available test runner and coverage.
