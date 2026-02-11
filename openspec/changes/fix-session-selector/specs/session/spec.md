## MODIFIED Requirements

### Requirement: Session Creation

The system SHALL provide the ability to create new sessions on demand, with user-provided or auto-generated titles based on the first user message. Users SHALL be able to explicitly create sessions through the UI.

#### Scenario: Create new session via dropdown
- **WHEN** the user selects "New Session..." from the session dropdown
- **THEN** a modal dialog SHALL appear prompting for session title
- **WHEN** the user enters a title and confirms
- **THEN** a new session SHALL be created via `POST /session` with the provided title
- **AND** the new session SHALL become the active session
- **AND** the session dropdown SHALL update to show the new session
- **WHEN** the user skips title input
- **THEN** a default title "New Conversation" SHALL be used
- **AND** the title SHALL be auto-updated from the first user message if provided

#### Scenario: Auto-generate session title from first message
- **WHEN** a new session is created without a user-provided title
- **AND** the first user message is submitted
- **THEN** the session title SHALL be generated from the first user message
- **AND** the session SHALL be updated via `PATCH /session/:id` with the new title
- **AND** the dropdown SHALL reflect the updated title

#### Scenario: Session ID format
- **WHEN** a new session is created
- **THEN** the sessionID SHALL be a UUID v4 format
- **AND** the sessionID SHALL be globally unique
- **AND** the sessionID SHALL be used in all API calls to the OpenCode server

### Requirement: Session Display

The system SHALL display an enhanced session dropdown in the UI that shows the current session and lists all available sessions, allowing users to create new sessions or switch between existing ones.

#### Scenario: Display enhanced session dropdown
- **WHEN** a session is active
- **THEN** the existing session dropdown SHALL be enhanced to show the current session title
- **AND** clicking the dropdown SHALL reveal a list of all sessions from `GET /session`
- **AND** the dropdown SHALL have a visual indicator (chevron) to show it's interactive
- **AND** the dropdown SHALL maintain its existing position in the conversation header

#### Scenario: Session list in dropdown
- **WHEN** the user opens the session dropdown
- **THEN** all available sessions SHALL be fetched via `GET /session`
- **AND** each session SHALL display its title and last activity timestamp
- **AND** the current session SHALL be visually highlighted
- **AND** sessions SHALL be sorted by last activity (most recent first)
- **AND** a "New Session..." option SHALL be at the top of the list

#### Scenario: Switch session via dropdown
- **WHEN** the user selects a different session from the dropdown
- **THEN** the system SHALL switch to the selected session
- **AND** the conversation context SHALL be loaded from the server
- **AND** the dropdown SHALL update to show the selected session title
- **AND** the currentSessionID SHALL be persisted in localStorage

#### Scenario: Edit session title
- **WHEN** the user clicks on the current session title in the dropdown
- **THEN** an inline edit mode SHALL be activated
- **WHEN** the user enters a new title and confirms
- **THEN** the session title SHALL be updated via `PATCH /session/:id`
- **AND** the dropdown SHALL reflect the updated title

#### Scenario: Enhanced new session creation
- **WHEN** the existing "New Conversation" option in the dropdown is selected
- **THEN** new session creation modal SHALL open with title input field
- **AND** the user can enter a custom title or skip for auto-generated title
- **AND** the existing session creation flow SHALL be enhanced with title support

#### Scenario: Default session on first load
- **WHEN** no session is active and the application loads
- **THEN** the system SHALL fetch all sessions via `GET /session`
- **AND** if sessions exist, the first session SHALL become active
- **AND** the dropdown SHALL display that session's title
- **AND** if no sessions exist, a new default session SHALL be created

### Requirement: Session API Integration

The system SHALL integrate session management with existing OpenCode API calls, maintaining proper session context and using the server's session management capabilities.

#### Scenario: SessionID in API requests
- **WHEN** submitting a prompt to the OpenCode server
- **THEN** the current sessionID SHALL be included in the URL path `/session/:id/message`
- **AND** the server SHALL associate the prompt with the correct session
- **AND** conversation context SHALL be maintained across prompts within the same session

#### Scenario: Prevent unintended session creation
- **WHEN** a prompt is submitted while a session is active
- **THEN** the prompt SHALL be sent to the current session's message endpoint
- **AND** a new session SHALL NOT be created
- **AND** the response SHALL be associated with the existing session

#### Scenario: Fetch sessions for dropdown
- **WHEN** the session dropdown is opened
- **THEN** the system SHALL call `GET /session` to retrieve all sessions
- **AND** the session list SHALL be cached to reduce API calls
- **AND** the cache SHALL be invalidated when a session is created, updated, or deleted

#### Scenario: Create session with custom title
- **WHEN** the user creates a new session with a custom title
- **THEN** the system SHALL call `POST /session` with body `{ title: "<user-input>" }`
- **AND** the returned session SHALL be set as the active session

#### Scenario: Update session title
- **WHEN** a session title is edited or auto-generated
- **THEN** the system SHALL call `PATCH /session/:id` with body `{ title: "<new-title>" }`
- **AND** the update SHALL be reflected in subsequent `GET /session` calls

#### Scenario: API error handling with sessions
- **WHEN** an API request fails with session-related error
- **THEN** appropriate error handling SHALL be implemented
- **AND** user SHALL be notified of session issues
- **AND** session state SHALL be recovered or reset as needed

## ADDED Requirements

### Requirement: Session Persistence Awareness

The system SHALL maintain awareness of the current session across page reloads and provide visual feedback about the active session.

#### Scenario: Persist current session
- **WHEN** a session becomes active
- **THEN** the sessionID SHALL be stored in localStorage under key 'currentSessionID'
- **WHEN** the application loads
- **AND** a stored currentSessionID exists
- **THEN** that session SHALL be restored as the active session
- **AND** the dropdown SHALL display its title

#### Scenario: Visual session indicator
- **WHEN** a session is active
- **THEN** a visual indicator SHALL show the session is connected
- **AND** the indicator SHALL reflect the session state (active, loading, error)

### Requirement: Session Title Sync on Task Creation

The system SHALL update the session title when new tasks are created to reflect the current conversation context.

#### Scenario: Auto-update title on task creation
- **WHEN** a new task is created via natural language command
- **THEN** the session title SHALL be extracted from the task context
- **AND** the session SHALL be updated via `PATCH /session/:id` with the new title
- **AND** the dropdown SHALL reflect the updated title

#### Scenario: Manual title override
- **WHEN** a user manually edits the session title
- **THEN** the manual title SHALL take precedence over auto-generated titles
- **AND** the manual title SHALL be preserved unless explicitly changed again
