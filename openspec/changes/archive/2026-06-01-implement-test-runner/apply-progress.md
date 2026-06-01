# Apply Progress: Implement Test Runner

## Mode

Standard mode. Strict TDD is disabled in `openspec/config.yaml`.

## Workload / PR Boundary

- Mode: size:exception for local implementation only.
- PR handling: out of scope; the developer will manage repository delivery manually.
- Boundary: implemented the full test-runner change locally in one apply batch.

## Completed Tasks

- [x] 1.1 Add Vitest, jsdom, React Testing Library, jest-dom, user-event, and V8 coverage dev dependencies in `package.json`/`package-lock.json`.
- [x] 1.2 Add `test`, `test:watch`, and `test:coverage` npm scripts in `package.json`.
- [x] 2.1 Create `vitest.config.ts` with React plugin, `@` alias, `jsdom`, setup file, include/exclude patterns, and V8 coverage reporters.
- [x] 2.2 Create `src/test/setup.ts` importing `@testing-library/jest-dom/vitest`.
- [x] 2.3 Update `tsconfig.node.json` to include `vitest.config.ts` for type-check/build validation.
- [x] 2.4 Update `tsconfig.app.json` for matcher/test type recognition.
- [x] 3.1 Add a focused unit proof test for `src/lib/utils.ts`.
- [x] 3.2 Add a focused renderer component proof test for `src/components/ui/button.tsx`.
- [x] 3.3 Keep proof tests independent of live Electron main/preload.
- [x] 4.1 Update `openspec/config.yaml` testing metadata for Vitest and coverage.
- [x] 4.2 Run `npm run test`.
- [x] 4.3 Run `npm run test:coverage`.
- [x] 4.4 Run `npm run lint`, `npx tsc -b`, and `npm run build`.

## Verification

- `npm run test` passed: 2 files, 2 tests.
- `npm run test:coverage` passed with V8 coverage.
- `npm run lint` passed.
- `npx tsc -b` passed.
- `npm run build` passed; Vite emitted the existing `inlineDynamicImports` deprecation warning for preload output.

## Deviations

- Added `coverage` to `.gitignore` and ESLint ignores so generated coverage reports do not break linting or repository hygiene.
- Installed Node.js v24.16.0 through local nvm because `node`/`npm` were not available in the execution shell.
