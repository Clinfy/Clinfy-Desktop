# Password Reset Workflow Specification

## Purpose

Define password recovery.

## Requirements

### Requirement: Recovery Navigation

Login MUST navigate recovery users to forgot-password.

#### Scenario: Start recovery
- GIVEN the Login page is displayed
- WHEN the user activates password recovery
- THEN the forgot-password page MUST be displayed

### Requirement: Forgot-Password Submission

Forgot-password MUST require a valid email and submit exactly `{ email }`, trimmed.

#### Scenario: Valid email
- GIVEN the user entered a valid email with surrounding whitespace
- WHEN the form is submitted
- THEN the request payload MUST equal `{ email: trimmedEmail }`

#### Scenario: Invalid email
- GIVEN the email is empty or invalid
- WHEN submission is attempted
- THEN no request MUST be submitted and validation feedback MUST be displayed

### Requirement: Forgot-Password Outcome

Success MUST navigate to reset-password preserving trimmed email. Failure MUST display the backend `message`, or fallback when unavailable.

#### Scenario: Successful request
- GIVEN a valid forgot-password request succeeds
- WHEN the success result is received
- THEN reset-password MUST be displayed with the trimmed email preserved

#### Scenario: Failed request
- GIVEN a forgot-password request fails
- WHEN an error result is received
- THEN its backend message MUST be displayed, or the fallback MUST be displayed if absent

### Requirement: Reset Email Guard

Reset-password MUST show email read-only and redirect to forgot-password without valid email.

#### Scenario: Preserved email
- GIVEN reset-password receives a valid email
- WHEN the page renders
- THEN that email MUST be visible and MUST NOT be editable

#### Scenario: Missing email
- GIVEN reset-password lacks a valid email
- WHEN access is attempted
- THEN forgot-password MUST be displayed before reset submission is possible

### Requirement: Token Entry

The token MUST contain exactly nine raw ASCII characters from `A-Z` or `0-9`, display as `XXX-XXX-XXX` with ASCII hyphens after positions 3 and 6, and reject pasted input. Lowercase ASCII letters MUST be normalized to uppercase at the UI boundary.

#### Scenario: Accepted token characters
- GIVEN the user enters lowercase or uppercase ASCII letters and digits
- WHEN each accepted character is entered
- THEN lowercase letters MUST be normalized to uppercase
- AND focus MUST advance to the next token slot when one exists
- AND the token MUST be grouped as `XXX-XXX-XXX`
- AND submission MUST use the raw nine uppercase alphanumeric characters without separators

#### Scenario: Rejected token characters
- GIVEN a token slot is empty or already contains a valid character
- WHEN the user enters a character outside ASCII `A-Z`, `a-z`, or `0-9`
- THEN the invalid character MUST NOT replace a valid character
- AND focus MUST NOT advance

#### Scenario: Token deletion
- GIVEN the user is editing the token slots
- WHEN Backspace is pressed in a populated slot
- THEN the current slot MUST be cleared without moving focus
- WHEN Backspace is pressed in an empty slot after the first slot
- THEN focus MUST move to the previous slot and that slot MUST be cleared

#### Scenario: Nine-character presentation and payload
- GIVEN the user enters nine accepted characters
- WHEN the token is displayed and submitted
- THEN it MUST be grouped as `XXX-XXX-XXX`
- AND submission MUST use the raw nine characters without separators

#### Scenario: Invalid token interaction
- GIVEN the token has other than nine accepted characters or input is pasted
- WHEN submission or paste is attempted
- THEN submission MUST remain unavailable and pasted content MUST NOT be accepted

### Requirement: Reset Form Controls

The reset form MUST provide independent accessible visibility controls for the new-password and confirmation fields. It MUST also provide a Back action that navigates to `/forgot-password` and is disabled while reset submission is in progress.

#### Scenario: Independent password visibility
- GIVEN the reset form is displayed
- WHEN the user activates either password visibility control
- THEN only its associated field MUST toggle between masked and visible text
- AND its accessible label MUST describe the current show or hide action

#### Scenario: Return to forgot-password
- GIVEN the reset form is displayed and no reset request is in progress
- WHEN the user activates Back
- THEN `/forgot-password` MUST be displayed so the email can be corrected

#### Scenario: Back disabled during submission
- GIVEN a valid reset request is in progress
- WHEN the form controls are inspected
- THEN the Back action MUST be disabled until the request completes

### Requirement: Password Validation

The password MUST match `/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/`, and confirmation MUST match it.

#### Scenario: Invalid password
- GIVEN the password fails the regex or confirmation differs
- WHEN validation occurs
- THEN validation feedback MUST be displayed and submission MUST remain unavailable

#### Scenario: Valid password pair
- GIVEN the password matches the regex and confirmation matches
- WHEN validation occurs
- THEN password validation MUST pass

### Requirement: Reset Submission

Submission MUST remain disabled until all inputs are valid and while submitting. It MUST send exactly `{ email, token, password }` using trimmed email and raw token.

#### Scenario: Submit valid reset
- GIVEN email, nine-character token, password, and confirmation are valid
- WHEN the user submits
- THEN the payload MUST equal `{ email: trimmedEmail, token: rawToken, password }`
- AND submission MUST be disabled until the request completes

#### Scenario: Prevent invalid or duplicate submission
- GIVEN any input is invalid or a request is in progress
- WHEN submission is attempted
- THEN no additional request MUST be submitted

### Requirement: Reset Outcome

Success MUST return the backend message to Login. Failure MUST display the backend reset `message`, or a fallback when unavailable.

#### Scenario: Successful reset
- GIVEN a reset request succeeds with a message
- WHEN the result is received
- THEN Login MUST be displayed with that success message visible

#### Scenario: Failed reset
- GIVEN a reset request fails
- WHEN the error result is received
- THEN its backend message MUST be displayed, or the fallback MUST be displayed if absent
