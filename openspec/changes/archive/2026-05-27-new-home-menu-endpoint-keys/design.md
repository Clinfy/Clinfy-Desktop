# Design: New Home Feature Menu Gated by Endpoint Keys

## Technical Approach

Replace the placeholder Home with a small product-feature catalog local to the Home page. The catalog defines supported features with labels, descriptions, `requiredEndpointKeys`, and visual child capabilities. `HomePage` reads `SessionContext` from `sessionStorage`, defensively normalizes `endpoint_keys`, filters features with ANY-of permission semantics, and renders a card/button menu. The first feature is `Person`, visible with `persons.details` or `genders.details`, and opens an in-page visual panel for future Person/Gender ABMC work without adding routes.

## Architecture Decisions

| Decision | Choice | Alternatives considered | Rationale |
|---|---|---|---|
| Catalog location | Create `src/pages/home/homeFeatureCatalog.ts` | Inline everything in `HomePage.tsx` | Keeps product metadata and gating testable/readable without introducing shared abstractions too early. |
| Permission semantics | `hasVisibleEndpointKey = requiredEndpointKeys.some(key => userKeys.has(key))` | ALL-of matching | Confirmed product rule is ANY-of; `Person` must show with either person or gender permission. |
| Empty or malformed keys | Normalize to `[]`; deny by default | Trust parsed JSON shape | `getSessionContext()` casts JSON; Home should not crash or accidentally expose features. |
| Navigation | No new route in this slice; button selects/expands an in-page panel | Navigate to `/person` placeholder | Avoids dead routes and keeps ABMC implementation explicitly out of scope. |
| IPC ping | Remove from user-facing Home | Keep debug button | Home becomes product UI; debug IPC does not belong in the authenticated landing page. Logout remains. |

## Data Flow

```txt
sessionStorage
  -> getSessionContext()
  -> normalize endpoint_keys
  -> getVisibleHomeFeatures(catalog, keys)
  -> HomePage renders cards/buttons
  -> Person button shows planned Person/Gender ABMC panel
```

Logout flow remains unchanged: `window.clinfy.auth.logout()` -> `clearSessionContext()` -> `navigate('/login', { replace: true })`.

## File Changes

| File | Action | Description |
|---|---|---|
| `src/pages/home/homeFeatureCatalog.ts` | Create | Defines `HomeFeature`, `HomeFeatureItem`, `HOME_FEATURES`, `isHomeFeatureVisible`, and `getVisibleHomeFeatures`. |
| `src/pages/home/HomePage.tsx` | Modify | Replace placeholder ping UI with filtered menu, empty state, Person detail panel, and preserved logout behavior. |
| `src/shared/session/sessionContextStorage.ts` | No change | Continue using existing storage API; normalize consumer-side only. |
| `src/shared/types/auth.ts` | No change | Existing `SessionContext.endpoint_keys: string[]` remains the contract. |
| `src/app/App.tsx` | No change | No route added until real Person/Gender screens exist. |

## Interfaces / Contracts

```ts
type HomeFeatureItem = {
  id: 'person-abmc' | 'gender-abmc'
  label: string
  description: string
  status: 'planned'
}

type HomeFeature = {
  id: 'person'
  label: string
  description: string
  requiredEndpointKeys: string[]
  items: HomeFeatureItem[]
}
```

Initial catalog:

```ts
requiredEndpointKeys: ['persons.details', 'genders.details']
```

Visibility contract: a feature is visible when at least one required endpoint key exists in the normalized user key set. If `requiredEndpointKeys` is empty or invalid, the feature is hidden.

## Testing Strategy

| Layer | What to Test | Approach |
|---|---|---|
| Unit | ANY-of visibility helper and deny-by-default behavior | Planned once a test runner exists; do not create test files now. |
| Integration | Home renders Person/empty state from stored session context | Planned with React testing tooling later. |
| Current verification | TypeScript, lint, bundle validity | Run `npm run lint` and `npm run build`. |

## Migration / Rollout

No migration required. This only changes renderer UI and consumes existing session context data.

## Open Questions

- [ ] Exact labels can be refined later, but implementation can proceed with `Person`, `ABMC de Person`, and `ABMC de Gender`.
