# Automated Testing Specification

## Purpose

Define the baseline automated testing capability for Clinfy Desktop so unit and renderer component behavior can be verified before build and release workflows.

## Requirements

### Requirement: Test runner commands

The system MUST provide first-class npm commands for running automated tests in single-run, watch, and coverage modes.

#### Scenario: Single-run test command

- GIVEN the project dependencies are installed
- WHEN a developer runs the single-run test command
- THEN the automated test suite MUST execute once
- AND the command MUST exit successfully when all tests pass
- AND the command MUST exit unsuccessfully when any test fails

#### Scenario: Watch test command

- GIVEN the project dependencies are installed
- WHEN a developer runs the watch test command
- THEN the automated test runner SHOULD start in an interactive or file-watch mode suitable for local development

#### Scenario: Coverage test command

- GIVEN the project dependencies are installed
- WHEN a developer runs the coverage test command
- THEN the automated test suite MUST execute with coverage reporting enabled
- AND the command MUST complete successfully when all tests pass

### Requirement: Renderer component testing

The system MUST support tests for React renderer components using a DOM-like environment and user-facing assertions.

#### Scenario: Component renders expected user-visible content

- GIVEN a renderer component has a component test
- WHEN the test renders that component
- THEN the test MUST be able to assert user-visible text, roles, labels, and DOM state

#### Scenario: DOM matchers are available

- GIVEN a renderer component test uses extended DOM assertions
- WHEN the test suite runs
- THEN the test MUST be able to use DOM-specific matchers without per-test matcher setup

### Requirement: TypeScript and Vite compatibility

The system MUST run tests against TypeScript and React JSX sources using the same project module resolution expectations as the Vite application.

#### Scenario: TypeScript test source executes

- GIVEN a test imports TypeScript application code
- WHEN the automated test suite runs
- THEN the test runner MUST transpile and execute the imported TypeScript source without requiring a separate manual build step

#### Scenario: Vite aliases resolve in tests

- GIVEN application code or tests import modules through configured project aliases
- WHEN the automated test suite runs
- THEN those imports MUST resolve consistently with the Vite application configuration

### Requirement: Electron boundary safety

The system MUST keep the initial automated testing layer focused on unit and renderer component behavior, with Electron-specific globals mocked only where tests require them.

#### Scenario: Test does not require Electron runtime by default

- GIVEN a unit or renderer component test does not exercise Electron IPC behavior
- WHEN the automated test suite runs
- THEN the test MUST NOT require a live Electron main process, preload script, or packaged application

#### Scenario: Electron global dependency is explicit

- GIVEN a test exercises code that depends on the renderer `window.clinfy` API
- WHEN the test suite runs that code
- THEN the test MUST provide an explicit mock or fixture for the required `window.clinfy` surface
- AND the mock MUST be scoped so unrelated tests do not accidentally depend on it

### Requirement: Baseline proof tests

The system MUST include minimal proof tests that demonstrate the configured test runner can execute project tests successfully.

#### Scenario: Smoke tests pass in CI-style execution

- GIVEN the test runner configuration and proof tests are present
- WHEN the single-run test command is executed
- THEN the command MUST pass without requiring manual interaction

#### Scenario: Proof tests stay narrowly scoped

- GIVEN the test runner is being introduced as an infrastructure change
- WHEN proof tests are added
- THEN they SHOULD verify representative unit or renderer component capability
- AND they MUST NOT become a broad regression suite for authentication flows in this change

### Requirement: SDD testing capability metadata

The system MUST update SDD testing capability metadata after the runner is installed so future changes can rely on the available test commands.

#### Scenario: Test runner availability is recorded

- GIVEN the automated test runner has been configured
- WHEN SDD configuration is reviewed
- THEN the configuration MUST record that a test runner is available
- AND it MUST identify the test framework and single-run test command

#### Scenario: Coverage availability is recorded

- GIVEN coverage reporting has been configured
- WHEN SDD configuration is reviewed
- THEN the configuration MUST record that coverage is available
- AND it MUST identify the coverage command

#### Scenario: Quality gates remain available

- GIVEN the automated testing metadata is updated
- WHEN the project verification commands are reviewed
- THEN the existing lint, type-check, and build commands MUST remain available as quality gates
