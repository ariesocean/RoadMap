# session Specification

## Purpose
TBD - created by archiving change add-session-management. Update Purpose after archive.
## Requirements
### Requirement: Session Persistence
The system SHALL maintain a persistent session across application restarts, preserving the sessionID and allowing continued conversation context.

#### Scenario: Session survives app restart
- **WHEN** the application is closed and reopened
- **THEN** the same sessionID SHALL be used for new prompts
- **AND** the session metadata SHALL be loaded from persistent storage
- **AND** the conversation context SHALL be maintained

#### Scenario: Session storage location
- **WHEN** running in web browser
- **THEN** session data SHALL be stored in localStorage under key 'roadmap-sessions'
- **WHEN** running in Tauri desktop app
- **THEN** session data SHALL be stored using Tauri store API
- **AND** session data format SHALL be consistent across both platforms

#### Scenario: Session data validation
- **WHEN** loading session data from persistent storage
- **THEN** the session data SHALL be validated for correct structure
- **AND** if validation fails, a new session SHALL be created
- **AND** corrupted session data SHALL be logged for debugging

### Requirement: Session Creation
The system SHALL provide the ability to create new sessions on demand, with auto-generated titles based on the first user message.

#### Scenario: Create new session via UI
- **WHEN** the user clicks the new session icon
- **THEN** a new session SHALL be created with a unique sessionID
- **AND** the session title SHALL be auto-generated from the first user message
- **AND** the new session SHALL become the active session
- **AND** previous session data SHALL remain persisted

#### Scenario: Auto-generate session title
- **WHEN** a new session is created
- **THEN** the session title SHALL be generated from the first user message
- **AND** if the first message is too long, it SHALL be truncated to 50 characters
- **AND** ellipses SHALL be added if truncation occurs

#### Scenario: Session ID format
- **WHEN** a new session is created
- **THEN** the sessionID SHALL be a UUID v4 format
- **AND** the sessionID SHALL be globally unique
- **AND** the sessionID SHALL be used in all API calls to the OpenCode server

### Requirement: Session Display
The system SHALL display the current session title in the UI with an icon to create new sessions.

#### Scenario: Display session title
- **WHEN** a session is active
- **THEN** the session title SHALL be displayed in the header area
- **AND** the title SHALL be visible above or near the input area
- **AND** the title SHALL update when the session changes

#### Scenario: New session icon
- **WHEN** the session title is displayed
- **THEN** an icon SHALL be shown next to the title
- **AND** clicking the icon SHALL trigger new session creation
- **AND** the icon SHALL have appropriate tooltip or accessibility label

#### Scenario: Session title visibility
- **WHEN** no session is active
- **THEN** a default session SHALL be created automatically
- **AND** the default session title SHALL be displayed as "New Conversation"

### Requirement: Session Cleanup on Exit
The system SHALL clean up all sessions created by the application when the application exits.

#### Scenario: Cleanup on app exit
- **WHEN** the application is closed or exited
- **THEN** all sessions created by this application SHALL be deleted from the server
- **AND** local session data SHALL be cleared
- **AND** no orphaned sessions SHALL remain on the server

#### Scenario: Graceful cleanup
- **WHEN** the application receives exit signal
- **THEN** cleanup SHALL be attempted before process termination
- **AND** cleanup failure SHALL not block application exit
- **AND** cleanup errors SHALL be logged for debugging

#### Scenario: Partial cleanup handling
- **WHEN** cleanup operation is interrupted
- **THEN** the system SHALL retry cleanup on next startup
- **AND** orphaned sessions SHALL be identified and cleaned up

### Requirement: Session API Integration
The system SHALL integrate session management with existing OpenCode API calls, passing sessionID to maintain conversation context.

#### Scenario: SessionID in API requests
- **WHEN** submitting a prompt to the OpenCode server
- **THEN** the current sessionID SHALL be included in the request
- **AND** the server SHALL associate the prompt with the correct session
- **AND** conversation context SHALL be maintained across prompts

#### Scenario: Session-aware prompt execution
- **WHEN** a prompt is executed within an active session
- **THEN** the response SHALL be associated with that session
- **AND** the response SHALL be added to session message history
- **AND** session metadata SHALL be updated (lastUsedAt)

#### Scenario: API error handling with sessions
- **WHEN** an API request fails with session-related error
- **THEN** appropriate error handling SHALL be implemented
- **AND** user SHALL be notified of session issues
- **AND** session state SHALL be recovered or reset as needed

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

