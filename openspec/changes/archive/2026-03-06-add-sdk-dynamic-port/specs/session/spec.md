## ADDED Requirements

### Requirement: SDK Dynamic Port Configuration
The system SHALL initialize the OpenCode SDK client with the correct server port for the current user.

#### Scenario: SDK client initialization with user port
- **WHEN** the SDK client is initialized via `getOpenCodeClient()`
- **AND** the current user has an assigned port from authStore
- **THEN** the client SHALL connect to `http://localhost:{userPort}`
- **AND** the user SHALL be able to communicate with their isolated OpenCode server

#### Scenario: SDK client initialization with default port
- **WHEN** the SDK client is initialized via `getOpenCodeClient()`
- **AND** no user is logged in (no userPort in authStore)
- **THEN** the client SHALL connect to the default port `http://localhost:51432`
- **AND** the system SHALL use the default OpenCode server

#### Scenario: Client instance reset on login
- **WHEN** a user successfully logs in
- **AND** the user has an assigned port
- **THEN** `updateClientBaseUrl()` SHALL be called
- **AND** the client instance SHALL be reset to null
- **AND** the next `getOpenCodeClient()` call SHALL create a new instance with the user's port

#### Scenario: Client instance reset on auto-login
- **WHEN** the application auto-login succeeds on startup
- **AND** the user has an assigned port
- **THEN** `updateClientBaseUrl()` SHALL be called
- **AND** subsequent SDK calls SHALL use the correct user port
