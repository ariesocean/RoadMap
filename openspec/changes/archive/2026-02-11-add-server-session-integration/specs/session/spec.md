## ADDED Requirements

### Requirement: Server Session Fetching
The system SHALL fetch all sessions from the OpenCode server using the `GET /session` endpoint with HTTP Basic Authentication.

#### Scenario: Fetch sessions from server
- **WHEN** the application initializes
- **THEN** the system SHALL call `GET /session` to retrieve all available sessions
- **AND** the system SHALL pass authentication via `Authorization` header (Basic auth with configured credentials)
- **AND** the response SHALL be parsed into a list of Session objects
- **AND** server sessions SHALL be stored in the session store for UI display

#### Scenario: Handle server unavailability
- **WHEN** the OpenCode server is unavailable (network error, timeout)
- **THEN** the system SHALL log a warning message
- **AND** the system SHALL continue with local session management only
- **AND** the user SHALL see a toast notification: "Server unavailable - using local sessions only"

#### Scenario: Handle authentication failure
- **WHEN** server returns authentication error
- ** 401/403THEN** the system SHALL log the authentication failure
- **AND** the system SHALL continue with local session management only
- **AND** the user SHALL see a toast notification: "Authentication failed - using local sessions only"

#### Scenario: Handle server error
- **WHEN** server returns 500 or other server error
- **THEN** the system SHALL log the error details
- **AND** the system SHALL continue with local session management only
- **AND** the user SHALL see a toast notification: "Server error - using local sessions only"

### Requirement: Server Session Display
The system SHALL display all sessions retrieved from the OpenCode server in the conversation dropdown, replacing the current "New Conversation" behavior.

#### Scenario: Display server sessions in dropdown
- **WHEN** the session dropdown is opened
- **THEN** all sessions from the server SHALL be listed in the dropdown
- **AND** the dropdown SHALL show the session title for each server session
- **AND** the current active session SHALL be highlighted in the dropdown

#### Scenario: Dropdown session ordering
- **WHEN** both server and local sessions exist
- **THEN** the dropdown SHALL display all server sessions first
- **AND** locally created sessions SHALL follow server sessions
- **AND** sessions SHALL be sorted by lastUsedAt timestamp (most recent first)
- **AND** if timestamps are equal, sessions SHALL be sorted by createdAt (newest first)
- **AND** if both timestamps are equal, sessions SHALL be sorted alphabetically by title

#### Scenario: New Conversation as dropdown option
- **WHEN** the dropdown is opened
- **THEN** "New Conversation" SHALL appear as an option in the dropdown
- **AND** clicking "New Conversation" SHALL create a new local session
- **AND** the new session SHALL become the active session
- **AND** the dropdown SHALL close after selecting "New Conversation"

### Requirement: Default Session Selection
The system SHALL automatically select the first session (most recently used) when multiple sessions are available.

#### Scenario: Auto-select first session on load
- **WHEN** sessions are loaded from the server
- **AND** more than one session exists
- **THEN** the system SHALL automatically select the first session in the sorted list
- **AND** the selected session SHALL become the active session for conversation context

#### Scenario: Single session auto-selection
- **WHEN** exactly one session exists
- **THEN** that session SHALL be automatically selected as the active session
- **AND** the conversation context SHALL be initialized with that session

### Requirement: Session Synchronization
The system SHALL maintain synchronization between local session state and server session data.

#### Scenario: Update local session on server fetch
- **WHEN** server sessions are fetched
- **AND** a matching local session exists for a server session
- **THEN** the local session metadata SHALL be updated with server data
- **AND** local messages SHALL be preserved if not overwritten by server

#### Scenario: New server session detection
- **WHEN** a server session does not exist locally
- **THEN** the system SHALL add it to the local session store
- **AND** the session SHALL be available for selection in the dropdown

### Requirement: Session Refresh and Synchronization
The system SHALL periodically refresh and synchronize session state with the OpenCode server.

#### Scenario: Refresh sessions on dropdown open
- **WHEN** the session dropdown is opened
- **THEN** the system SHALL re-fetch sessions from the server
- **AND** local session state SHALL be updated with the latest server data
- **AND** newly created sessions on the server SHALL appear in the dropdown

#### Scenario: Background refresh
- **WHEN** the application is active
- **THEN** the system SHALL re-fetch server sessions every 30 seconds
- **AND** if new sessions are detected, the dropdown SHALL be updated without requiring close/reopen

#### Scenario: Session modification conflict
- **WHEN** a server session has been modified by another client
- **AND** the local client has unsaved changes to that session
- **THEN** the system SHALL prioritize local changes
- **AND** the system SHALL log a conflict warning
- **AND** the server session metadata (title, timestamps) SHALL be updated locally

### Requirement: Session Cleanup Policy
The system SHALL clean up only locally-created sessions on exit, preserving server sessions.

#### Scenario: Cleanup on app exit
- **WHEN** the application is closed or exited
- **THEN** only locally-created sessions SHALL be deleted
- **AND** server sessions SHALL be preserved
- **AND** orphaned local sessions (without server ID) SHALL be cleaned up
- **AND** the system SHALL NOT delete any sessions that originated from the server

#### Scenario: Graceful cleanup with server
- **WHEN** the application receives exit signal
- **THEN** the system SHALL attempt to sync any pending local sessions to the server
- **AND** cleanup SHALL be attempted before process termination
- **AND** cleanup failure SHALL not block application exit

### Requirement: Session Creation Policy
The system SHALL create new sessions locally by default, with optional server sync.

#### Scenario: Create new conversation
- **WHEN** the user creates a new conversation
- **THEN** the system SHALL create a local session
- **AND** the new session SHALL NOT be automatically created on the server
- **AND** the user MAY optionally sync the session to the server later

#### Scenario: Sync local session to server
- **WHEN** the user explicitly requests to save to server
- **THEN** the system SHALL call `POST /session` with the local session data
- **AND** the server SHALL return a server session ID
- **AND** the local session SHALL be updated with the server ID
