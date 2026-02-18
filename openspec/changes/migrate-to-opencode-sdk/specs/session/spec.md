## MODIFIED Requirements

### Requirement: Session API Integration
The system SHALL integrate session management with existing OpenCode API calls, passing sessionID to maintain conversation context. The system SHALL use the official @opencode-ai.sdk for session management and prompt execution, replacing manual HTTP calls.

**Migration Note**: Replacing manual HTTP calls with SDK. Official SDK provides `createOpencodeClient()` with session.list(), session.create(), session.promptAsync(), and session.event() for SSE.

#### Scenario: SessionID in API requests
- **WHEN** submitting a prompt to the OpenCode server
- **THEN** the current sessionID SHALL be included in the request
- **AND** the server SHALL associate the prompt with the correct session
- **AND** conversation context SHALL be maintained across prompts

#### Scenario: SessionID in API requests via SDK
- **WHEN** submitting a prompt to the OpenCode server using SDK
- **THEN** the SDK SHALL automatically include the sessionID in requests
- **AND** the server SHALL associate the prompt with the correct session
- **AND** conversation context SHALL be maintained across prompts

#### Scenario: Session-aware prompt execution
- **WHEN** a prompt is executed within an active session
- **THEN** the response SHALL be associated with that session
- **AND** the response SHALL be added to session message history
- **AND** session metadata SHALL be updated (lastUsedAt)

#### Scenario: SDK event handling for prompt execution
- **WHEN** using SDK for prompt execution
- **THEN** events SHALL be received via client.session.event() SSE subscription
- **AND** text events SHALL be parsed from SSE data
- **AND** reasoning events SHALL be parsed from SSE data
- **AND** tool events SHALL be parsed from SSE data
- **AND** tool-result events SHALL be parsed from SSE data
- **AND** completion SHALL be detected via session status event

#### Scenario: SDK connection health check
- **WHEN** checking server availability
- **THEN** SDK client initialization SHALL verify connection
- **AND** connection errors SHALL be handled gracefully
- **AND** user SHALL be notified if server is unavailable

#### Scenario: SDK authentication handling
- **WHEN** SDK makes requests to the server
- **AND** authentication credentials are provided to createOpencodeClient()
- **THEN** SDK SHALL handle Basic Authentication automatically
- **AND** authentication failures SHALL be reported to the user

#### Scenario: SDK error handling
- **WHEN** SDK encounters an error during session operations
- **THEN** appropriate error SHALL be thrown with error code
- **AND** the application SHALL handle errors gracefully
- **AND** user SHALL be notified of the error

#### Scenario: API error handling with sessions
- **WHEN** an API request fails with session-related error
- **THEN** appropriate error handling SHALL be implemented
- **AND** user SHALL be notified of session issues
- **AND** session state SHALL be recovered or reset as needed
