## MODIFIED Requirements

### Requirement: User Login
The system SHALL update the SDK client configuration after successful login to use the user's assigned port.

#### Scenario: SDK client update after login
- **WHEN** the user successfully logs in via the login form
- **AND** the user has an assigned OpenCode server port
- **THEN** `updateClientBaseUrl()` SHALL be called after `setUserPort()`
- **AND** subsequent SDK operations SHALL use the correct user port

#### Scenario: SDK client update after registration
- **WHEN** the user successfully registers a new account
- **AND** the user has an assigned OpenCode server port
- **THEN** `updateClientBaseUrl()` SHALL be called after `setUserPort()`
- **AND** subsequent SDK operations SHALL use the correct user port

#### Scenario: SDK client update after auto-login
- **WHEN** the application auto-login succeeds on startup
- **AND** the user has an assigned OpenCode server port
- **THEN** `updateClientBaseUrl()` SHALL be called after `setUserPort()`
- **AND** subsequent SDK operations SHALL use the correct user port
