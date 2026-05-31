## Exploration: New home menu gated by endpoint keys

### Current State
- The renderer currently has only two routes in `src/app/App.tsx`: `/` renders `HomePage`, and `/login` renders `LoginPage`.
- `HomePage` is a placeholder authenticated landing page with IPC ping and logout actions. It does not read `SessionContext` and does not expose real feature navigation yet.
- Login and startup both call `window.clinfy.auth.getSessionContext()` and persist the returned `SessionContext` through `saveSessionContext()` in `sessionStorage`.
- `SessionContext` already contains `endpoint_keys: string[]` in `src/shared/types/auth.ts`; storage is centralized in `src/shared/session/sessionContextStorage.ts` through `saveSessionContext`, `getSessionContext`, and `clearSessionContext`.
- No existing feature pages or feature routes were found under `src/pages` beyond `home` and `login`. That means the first implementation should create the menu foundation without pretending feature screens already exist.

### Affected Areas
- `src/pages/home/HomePage.tsx` — main target: replace the placeholder workspace with a feature menu, read the stored session context, filter visible items by endpoint keys, keep logout.
- `src/shared/session/sessionContextStorage.ts` — read-only usage expected; may need defensive validation later because parsed JSON is currently cast directly to `SessionContext`.
- `src/shared/types/auth.ts` — existing `SessionContext.endpoint_keys` is the permission source; avoid changing unless endpoint metadata becomes richer.
- `src/app/App.tsx` — may need new routes when actual feature screens exist; for this change it can remain minimal unless menu items navigate to placeholders.
- `src/components/ui/button.tsx` — existing shadcn button is available for menu actions; new generic UI primitives should follow `src/components/ui/` only if needed.

### Approaches
1. **Static feature catalog filtered by endpoint keys** — Define an explicit local menu catalog with labels, descriptions, route/action, icon, and required endpoint keys; render entries whose required keys exist in `sessionContext.endpoint_keys`.
   - Pros: Clear product control, stable labels/order, easy to design, avoids exposing raw backend keys to users, works even before every endpoint has a screen.
   - Cons: Requires maintaining the catalog as features are added; unknown endpoint keys are ignored unless explicitly mapped.
   - Effort: Low/Medium.

2. **Dynamic menu directly derived from endpoint keys** — Convert every endpoint key into a visible menu item automatically.
   - Pros: No frontend catalog maintenance; backend controls visibility entirely.
   - Cons: Poor UX because endpoint keys are technical permissions, not product navigation; hard to localize, group, order, icon, or route safely; risks showing endpoints that are not real desktop features. This is coding without a product model — and that foundation will crack.
   - Effort: Low initially, High later due cleanup.

3. **Hybrid catalog with optional endpoint-key diagnostics** — Use a static feature catalog for supported desktop features, filter by endpoint keys, and optionally show an empty/diagnostic state listing unsupported keys only for debugging or future admin tooling.
   - Pros: Preserves product UX while still making backend capability gaps visible during development; safest bridge while feature pages are incomplete.
   - Cons: Slightly more structure than a basic static map; diagnostics must not become user-facing noise.
   - Effort: Medium.

### Recommendation
Use the hybrid catalog approach. The home should be a product menu, not a raw permission dump. Model supported desktop features explicitly, gate each feature by one or more `endpoint_keys`, and render a clear empty state when the user has no matching features. Keep unknown endpoint keys out of the normal UI.

A good first slice is:
- introduce a `HomeFeature`/menu item catalog near `HomePage` or in a small home-local module;
- load `getSessionContext()` inside `HomePage`;
- compute `visibleFeatures` from `endpoint_keys` with exact key matching;
- render responsive cards/buttons for visible features;
- preserve logout and a safe fallback if session context is missing or malformed.

### Risks
- Exact endpoint key names for real product features are not present in the repository. Proposal/spec must define the initial catalog keys with the user/product owner, or implementation must use a placeholder catalog until keys are known.
- No test runner exists. Strict TDD is marked active by policy, but behavioral tests cannot be honestly added until a runner is installed. Verification remains `npm run lint` and `npm run build` unless test tooling is added first.
- `getSessionContext()` currently casts parsed sessionStorage JSON without runtime validation. A corrupt but parseable object could make Home fail unless Home defensively normalizes `endpoint_keys`.
- Adding routes to non-existent feature pages would create dead navigation. The implementation should either disable/mark unavailable items or create explicit placeholder screens as a separate scoped decision.

### Ready for Proposal
Yes. The proposal should define the menu as a home-level feature catalog gated by `SessionContext.endpoint_keys`, document the initial feature entries and key names, keep implementation scoped to the home/menu foundation, and call out that real feature pages can be added incrementally behind their own routes.
