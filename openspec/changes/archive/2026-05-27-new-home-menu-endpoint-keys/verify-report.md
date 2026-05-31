# Verify Report: New Home Menu Gated by Endpoint Keys

## Change

`new-home-menu-endpoint-keys`

## Mode

Hybrid persistence. Standard verification gates were used because Strict TDD is active by session policy but `sdd-init/clinfy-desktop` resolved `test_command: unavailable`; no test runner exists in the project.

## Final Verdict

PASS WITH WARNINGS

The implementation satisfies the SDD proposal, spec, design, and completed tasks by source inspection and available runtime command evidence. The warning is process/testing-related: scenario-level automated runtime tests are blocked until a real test runner is installed.

## Command Evidence

| Command | Result | Evidence |
|---|---|---|
| `npm run lint` | PASS | `eslint .` completed with exit code 0. |
| `npm run build` | PASS | `tsc -b && vite build` completed with exit code 0. |

Build note: Vite emitted existing warning: `inlineDynamicImports` option is deprecated; use `codeSplitting: false` instead. This is not caused by the Home change and does not block verification.

## Completeness Table

| Artifact / Area | Status | Evidence |
|---|---|---|
| Proposal read | Complete | Engram `sdd/new-home-menu-endpoint-keys/proposal` retrieved full content. |
| Spec read | Complete | Engram `sdd/new-home-menu-endpoint-keys/spec` retrieved full content. |
| Design read | Complete | Engram `sdd/new-home-menu-endpoint-keys/design` retrieved full content. |
| Tasks read | Complete | Engram `sdd/new-home-menu-endpoint-keys/tasks` retrieved full content; 14/14 tasks checked. |
| Apply progress read | Complete | Engram `sdd/new-home-menu-endpoint-keys/apply-progress` retrieved full content. |
| Source inspection | Complete | `homeFeatureCatalog.ts`, `HomePage.tsx`, and `App.tsx` inspected. |
| Runtime verification | Partial by tooling | Lint/build passed; no test runner available for scenario tests. |

## Spec Compliance Matrix

| Requirement / Scenario | Status | Evidence |
|---|---|---|
| Explicit feature catalog | PASS | `HOME_FEATURES` is defined in `src/pages/home/homeFeatureCatalog.ts`; Home renders from `getVisibleHomeFeatures(HOME_FEATURES, endpointKeySet)`. |
| Supported feature uses product metadata | PASS | `Person` uses label/description/items; UI renders `feature.label` and `feature.description`, not endpoint key names. |
| Unknown endpoint keys ignored | PASS | Rendering iterates only `HOME_FEATURES`; unknown user keys cannot create entries. |
| Feature visibility uses ANY required endpoint key | PASS | `isHomeFeatureVisible` returns `feature.requiredEndpointKeys.some((endpointKey) => userEndpointKeys.has(endpointKey))`. |
| Person visible with `persons.details` | PASS by source inspection | `requiredEndpointKeys` contains `persons.details`; `.some(...)` makes it sufficient. Runtime automated test blocked by missing runner. |
| Person visible with `genders.details` | PASS by source inspection | `requiredEndpointKeys` contains `genders.details`; `.some(...)` makes it sufficient. Runtime automated test blocked by missing runner. |
| Person hidden without matching permissions | PASS by source inspection | `.some(...)` returns false when neither key is in the normalized Set. Runtime automated test blocked by missing runner. |
| Person visual foundation | PASS | Selected feature panel renders planned items `ABMC de Person` and `ABMC de Gender` with `Planned` status and explanatory visual-only copy. |
| ABMC flows not implemented | PASS | No ABMC route or implementation was added; `App.tsx` still only routes `/` and `/login`. |
| Empty authorized menu state | PASS | `visibleFeatures.length === 0` renders `No available functionalities`; logout button remains in header. |
| Logout remains available | PASS | `handleLogout` still calls `window.clinfy.auth.logout()`, `clearSessionContext()`, and `navigate('/login', { replace: true })`. |

## Design Coherence Table

| Design Decision | Status | Evidence |
|---|---|---|
| Catalog location in `src/pages/home/homeFeatureCatalog.ts` | PASS | File exists and owns catalog types, catalog data, and helper functions. |
| ANY-of gating with `.some(...)` | PASS | Implemented directly in `isHomeFeatureVisible`. |
| Empty/malformed keys deny by default | PASS | Home normalizes unknown `endpoint_keys` to `[]`; catalog helper hides empty `requiredEndpointKeys`. |
| No `/person` route in this slice | PASS | `App.tsx` contains only `/` and `/login`; Person selection is in-page state. |
| Remove debug IPC ping from Home | PASS | Home no longer contains ping IPC UI; only logout remains as session action. |
| Preserve storage API and auth type contracts | PASS | No changes needed in `sessionContextStorage.ts` or `auth.ts`; Home consumes existing `getSessionContext()`. |

## Task Completion

| Phase | Tasks | Status |
|---|---:|---|
| Phase 1: Catalog Foundation | 3/3 | Complete |
| Phase 2: Home UI Implementation | 4/4 | Complete |
| Phase 3: Person Visual Panel | 3/3 | Complete |
| Phase 4: Verification | 4/4 | Complete |
| Total | 14/14 | Complete |

## Issues

### CRITICAL

None.

### WARNING

1. Scenario-level automated runtime tests are unavailable because the project has no configured test runner, despite Strict TDD being active by policy. This verification therefore relies on source inspection plus `npm run lint` and `npm run build`.
2. Build passes but Vite reports a deprecated `inlineDynamicImports` option; future cleanup should migrate to `codeSplitting: false`.

### SUGGESTION

1. Before implementing Person/Gender ABMC behavior, add a renderer test runner such as Vitest + React Testing Library so permission gating and Home rendering scenarios can be covered with real tests.
2. Consider extracting `normalizeEndpointKeys` if another page later needs the same defensive session-context behavior; do not abstract it prematurely.

## Artifacts Written

- Engram topic: `sdd/new-home-menu-endpoint-keys/verify-report`
- OpenSpec file: `openspec/changes/new-home-menu-endpoint-keys/verify-report.md`
