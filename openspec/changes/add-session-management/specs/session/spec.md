## ADDED Requirements
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
