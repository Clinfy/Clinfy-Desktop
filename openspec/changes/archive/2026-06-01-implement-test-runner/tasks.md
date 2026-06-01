# Tasks: Implement Test Runner

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 500-900, mostly generated `package-lock.json` |
| 400-line budget risk | High |
| Chained PRs recommended | No |
| Suggested split | PR 1 dependencies/config → PR 2 proof tests/SDD metadata |
| Delivery strategy | exception-ok |
| Chain strategy | size-exception |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: High

### Suggested Work Units

Resolved for local apply: implemented as one local batch; repository PR handling remains developer-managed.

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Install test dependencies and add Vitest setup | PR 1 | Includes `package.json`, `package-lock.json`, `vitest.config.ts`, `src/test/setup.ts`, tsconfig updates. |
| 2 | Add proof tests, metadata, and verification | PR 2 | Depends on PR 1; includes smoke tests, `openspec/config.yaml`, and command verification. |

## Phase 1: Dependencies and Scripts

- [x] 1.1 Add Vitest, jsdom, React Testing Library, jest-dom, user-event, and V8 coverage dev dependencies in `package.json`/`package-lock.json`.
- [x] 1.2 Add `test`, `test:watch`, and `test:coverage` npm scripts in `package.json`.

## Phase 2: Test Infrastructure

- [x] 2.1 Create `vitest.config.ts` with React plugin, `@` alias, `jsdom`, setup file, include/exclude patterns, and V8 coverage reporters.
- [x] 2.2 Create `src/test/setup.ts` importing `@testing-library/jest-dom/vitest`.
- [x] 2.3 Update `tsconfig.node.json` to include `vitest.config.ts` for type-check/build validation.
- [x] 2.4 Update `tsconfig.app.json` only as needed for test/setup and matcher type recognition.

## Phase 3: Proof Tests

- [x] 3.1 Add a focused unit proof test under `src/` for a pure helper such as `src/lib/utils.ts`.
- [x] 3.2 Add a focused renderer component proof test under `src/` using React Testing Library `render`/`screen` and jest-dom matchers.
- [x] 3.3 Keep proof tests independent of live Electron main/preload; add explicit `window.clinfy` mocking only if the chosen component requires it.

## Phase 4: SDD Metadata and Verification

- [x] 4.1 Update `openspec/config.yaml` testing metadata to mark Vitest unit tests and coverage commands as available.
- [x] 4.2 Run `npm run test` and verify the single-run command satisfies the smoke-test scenarios.
- [x] 4.3 Run `npm run test:coverage` and verify coverage reporting completes successfully.
- [x] 4.4 Run `npm run lint`, `npx tsc -b`, and `npm run build` to confirm existing quality gates still pass.
