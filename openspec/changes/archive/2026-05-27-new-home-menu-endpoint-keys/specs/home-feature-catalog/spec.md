# Home Feature Catalog Specification

## Purpose

Define the authenticated Home as a product-level feature catalog filtered by the logged-in user's endpoint keys.

## Requirements

### Requirement: Explicit feature catalog

The system MUST render Home functionality from an explicit catalog of supported product features, not directly from raw `endpoint_keys`.

#### Scenario: Supported feature is represented by product metadata

- GIVEN a supported Home feature exists
- WHEN the Home menu is rendered
- THEN the feature MUST be displayed using product-facing label, description, and visual metadata
- AND raw endpoint key names MUST NOT be used as the menu label

#### Scenario: Unknown endpoint keys are ignored

- GIVEN the session context contains endpoint keys that are not mapped to a supported Home feature
- WHEN the Home menu is rendered
- THEN those unknown keys MUST NOT create additional menu entries

### Requirement: Feature visibility uses any required endpoint key

The system MUST show a catalog feature when the user has at least one endpoint key listed in that feature's `requiredEndpointKeys` array.

#### Scenario: Person visible with persons details permission

- GIVEN the logged-in user's `endpoint_keys` contains `persons.details`
- WHEN the Home menu is rendered
- THEN the `Person` feature MUST be visible

#### Scenario: Person visible with genders details permission

- GIVEN the logged-in user's `endpoint_keys` contains `genders.details`
- WHEN the Home menu is rendered
- THEN the `Person` feature MUST be visible

#### Scenario: Person hidden without matching permissions

- GIVEN the logged-in user's `endpoint_keys` contains neither `persons.details` nor `genders.details`
- WHEN the Home menu is rendered
- THEN the `Person` feature MUST NOT be visible

### Requirement: Person feature visual foundation

The system MUST provide a `Person` Home entry with `requiredEndpointKeys: ["persons.details", "genders.details"]` and visual affordances for future Person and Gender ABMC functionality.

#### Scenario: Person communicates deferred ABMC areas

- GIVEN the `Person` feature is visible
- WHEN the user reviews the Home menu
- THEN the feature SHOULD visually indicate future `Person ABMC` and `Gender ABMC` areas
- AND those ABMC flows MUST NOT be implemented by this change

### Requirement: Empty authorized menu state

The system MUST handle the absence of visible catalog features without breaking authenticated session actions.

#### Scenario: No features visible

- GIVEN the logged-in user has no endpoint keys matching supported Home features
- WHEN the Home menu is rendered
- THEN the system MUST show an empty or unavailable-features state
- AND logout MUST remain available
