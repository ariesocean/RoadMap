## MODIFIED Requirements
### Requirement: Server Session Fetching
The system SHALL fetch all sessions from the OpenCode server using the SDK client with proper authentication.

#### Scenario: Fetch sessions via Tauri invoke
- **WHEN** the application initializes
- **THEN** the system SHALL call `Session.list()` via Tauri invoke to retrieve all available sessions
- **AND** the response SHALL be parsed into a list of Session objects
- **AND** server sessions SHALL be stored in the session store for UI display

#### Scenario: Handle SDK connection failure
- **WHEN** the OpenCode server is unavailable (network error, timeout)
- **THEN** the system SHALL log a warning message
- **AND** the system SHALL continue with local session management only
- **AND** the user SHALL see a toast notification: "Server unavailable - using local sessions only"

### Requirement: Session Creation Policy
The system SHALL create new sessions locally by default, with optional server sync.

#### Scenario: Sync local session to server via Tauri
- **WHEN** the user explicitly requests to save to server
- **THEN** the system SHALL call `Session.create()` via Tauri invoke with the local session data
- **AND** the server SHALL return a server session ID
- **AND** the local session SHALL be updated with the server ID
