## ADDED Requirements
### Requirement: Tauri Modal Prompt Command
The system SHALL provide a Tauri command `execute_modal_prompt` that functions identically to the VITE `/api/execute-modal-prompt` endpoint.

#### Scenario: Tauri execute_modal_prompt receives prompt
- **WHEN** Tauri invoke('execute_modal_prompt', { prompt, sessionId, model }) is called
- **THEN** the OpenCode server processes the prompt
- **AND** the response is streamed back in Server-Sent Events format
- **AND** the response events include 'text', 'tool-call', 'tool-result', 'reasoning', and 'done' event types

#### Scenario: Tauri streaming response handling
- **WHEN** the modal receives streaming events from execute_modal_prompt
- **THEN** each 'text' event is forwarded to the client
- **AND** tool calls are forwarded with appropriate event types
- **AND** the streaming status is tracked for UI feedback
- **AND** event deduplication prevents duplicate content

### Requirement: Tauri Execute Navigate SSE Support
The system SHALL implement SSE streaming for the execute_navigate Tauri command, matching the VITE endpoint behavior.

#### Scenario: Tauri execute_navigate streaming
- **WHEN** Tauri invoke('execute_navigate', { prompt, sessionId, model }) is called
- **THEN** the response streams back via events: 'start', 'session', 'text', 'tool', 'reasoning', 'done'
- **AND** event deduplication prevents duplicate tool calls
- **AND** the session is created automatically if not provided
