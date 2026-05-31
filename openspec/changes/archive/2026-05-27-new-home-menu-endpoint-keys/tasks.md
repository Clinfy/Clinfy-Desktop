# Tasks: New Home Menu Gated by Endpoint Keys

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 160-230 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Add Home feature catalog and filtered menu UI | PR 1 | Single reviewable slice; verify with lint/build. |

## Phase 1: Catalog Foundation

- [x] 1.1 Create `src/pages/home/homeFeatureCatalog.ts` with `HomeFeature`, `HomeFeatureItem`, `HOME_FEATURES`, `isHomeFeatureVisible`, and `getVisibleHomeFeatures`.
- [x] 1.2 Define `Person` with `requiredEndpointKeys: ["persons.details", "genders.details"]` and planned items for `ABMC de Person` and `ABMC de Gender`.
- [x] 1.3 Implement visibility as ANY-of using `.some(...)`; hide features with empty/invalid required keys.

## Phase 2: Home UI Implementation

- [x] 2.1 Modify `src/pages/home/HomePage.tsx` to remove the debug IPC ping UI and keep logout behavior unchanged.
- [x] 2.2 Read `getSessionContext()` in `HomePage.tsx` and defensively normalize `endpoint_keys` to a string array/set.
- [x] 2.3 Render visible catalog features as product-facing cards/buttons; do not show raw endpoint key names.
- [x] 2.4 Add an empty state when no catalog features are visible while preserving logout access.

## Phase 3: Person Visual Panel

- [x] 3.1 Make the `Person` card/button select or expand an in-page panel; do not add `/person` or ABMC routes.
- [x] 3.2 Show planned `ABMC de Person` and `ABMC de Gender` areas as disabled/planned visual affordances.
- [x] 3.3 Ensure unknown endpoint keys never create extra menu entries.

## Phase 4: Verification

- [x] 4.1 Manually verify scenarios: Person visible with `persons.details`, visible with `genders.details`, hidden with neither.
- [x] 4.2 Run `npm run lint`.
- [x] 4.3 Run `npm run build`.
- [x] 4.4 Document that automated tests are blocked because Strict TDD is active but no test runner is installed.
