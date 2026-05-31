# Proposal: Home Feature Catalog Gated by Endpoint Keys

## Intent

Replace the authenticated Home placeholder with a product-level menu that shows supported functionality only when the logged-in user's `SessionContext.endpoint_keys` grants access. First slice: expose a `Person` entry that visually groups Person-related ABMC areas.

## Scope

### In Scope
- Render a Home menu/catalog based on explicit feature definitions, not raw endpoint keys.
- Add one visible feature: `Person`, with `requiredEndpointKeys: ["persons.details", "genders.details"]`.
- Show Person visual sub-items for `Person ABMC` and `Gender ABMC` without implementing those ABMC screens.
- Preserve logout and safe behavior when session context or endpoint keys are missing.

### Out of Scope
- Implementing Person or Gender ABMC flows.
- Backend permission changes.
- Generic dynamic menu generation from every endpoint key.
- Final routing for complete feature pages unless a placeholder/foundation route is needed.

## Capabilities

### New Capabilities
- `home-feature-catalog`: Home renders an explicit, permission-filtered feature catalog using endpoint-key requirements.

### Modified Capabilities
- None.

## Approach

Create a small Home-local feature catalog model with stable labels, descriptions, visual grouping, and `requiredEndpointKeys: string[]`. Home reads `getSessionContext()`, normalizes `endpoint_keys` defensively, and renders catalog entries when at least one required key is present. Unknown endpoint keys stay out of the user-facing UI. The first catalog entry is `Person`, visible with either `persons.details` or `genders.details`, and it visually communicates the future Person/Gender ABMC areas.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/pages/home/HomePage.tsx` | Modified | Replace placeholder content with filtered feature catalog. |
| `src/shared/session/sessionContextStorage.ts` | Read-only | Source for stored `SessionContext`; implementation may defensively normalize consumer-side data. |
| `src/shared/types/auth.ts` | Read-only | Existing `SessionContext.endpoint_keys` contract remains source of authorization data. |
| `src/app/App.tsx` | Possible | Only if a visual/foundation route for Person is chosen later. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Misreading permission semantics | Med | Specs must state at least one `requiredEndpointKeys` match is required for visibility. |
| Dead navigation to unimplemented ABMCs | Med | Keep ABMCs visual/disabled/placeholder-only in this change. |
| Missing test runner despite Strict TDD | High | Verify with available lint/build unless test tooling is added first. |

## Rollback Plan

Revert the Home catalog changes and restore the previous placeholder Home; no persisted data or backend contracts change.

## Dependencies

- Stored session context must include `endpoint_keys` from login/startup.

## Success Criteria

- [ ] Home shows `Person` when at least one required endpoint key exists.
- [ ] Home hides `Person` only when neither required endpoint key exists.
- [ ] Person visually indicates future Person and Gender ABMC areas without implementing them.
- [ ] Logout remains available.
