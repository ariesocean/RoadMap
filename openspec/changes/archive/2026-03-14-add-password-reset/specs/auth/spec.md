## ADDED Requirements

### Requirement: Password Reset with Hardcoded Code
The system SHALL provide a password reset mechanism using a hardcoded reset code. The reset code SHALL never change once deployed.

#### Scenario: User clicks forgot password
- **GIVEN** user is on the login page
- **WHEN** user clicks "Forgot Password" link
- **THEN** a reset password modal SHALL be displayed
- **AND** the modal SHALL ask for email and reset code
- **AND** the modal SHALL display hint text: "Contact Harvey to get reset code"
- **AND** the modal SHALL have a close (X) button in the top right corner

#### Scenario: User enters valid email and reset code
- **GIVEN** reset password modal is displayed
- **WHEN** user enters a registered email AND the reset code "roadmap-reset-password"
- **THEN** a temporary token SHALL be returned
- **AND** user SHALL be redirected to set new password page

#### Scenario: User enters invalid reset code
- **GIVEN** reset password modal is displayed
- **WHEN** user enters an incorrect reset code
- **THEN** an error message SHALL be displayed: "Invalid reset code"
- **AND** the user SHALL remain on the reset modal

#### Scenario: User enters non-existent email
- **GIVEN** reset password modal is displayed
- **WHEN** user enters an email that is not registered
- **THEN** an error message SHALL be displayed: "Email not found"
- **AND** the user SHALL remain on the reset modal

#### Scenario: User sets new password
- **GIVEN** user has a valid temporary token
- **WHEN** user enters a new password and confirms
- **THEN** the password SHALL be updated in the system
- **AND** user SHALL be redirected to login page
- **AND** user SHALL be able to login with new password

#### Scenario: Temporary token expires
- **GIVEN** user has an expired temporary token
- **WHEN** user attempts to reset password
- **THEN** an error message SHALL be displayed: "Reset token expired"
- **AND** user SHALL be redirected to reset code entry

### Requirement: Reset Code Security
The system SHALL secure the reset code using cryptographic hashing.

#### Scenario: Reset code is stored encrypted
- **WHEN** the system is deployed
- **THEN** the reset code SHALL be SHA256 hashed before storage
- **AND** the plaintext reset code SHALL never be stored in the codebase

#### Scenario: Reset code validation
- **GIVEN** user submits a reset code
- **WHEN** the system validates the code
- **THEN** the input SHALL be hashed with SHA256
- **AND** compared against the stored hash
