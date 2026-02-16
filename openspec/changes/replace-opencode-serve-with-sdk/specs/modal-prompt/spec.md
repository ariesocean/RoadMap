## MODIFIED Requirements
### Requirement: Modal-Only Prompt API
The system SHALL provide a dedicated API endpoint for executing prompts within the modal context, implemented via Tauri invoke with SSE streaming.

#### Scenario: Execute modal prompt via Tauri invoke
- **WHEN** a prompt is sent via the modal prompt API
- **THEN** the system SHALL call `Session.promptAsync()` via Tauri invoke
- **AND** the response SHALL be streamed back in Server-Sent Events format
- **AND** the response events include 'text', 'tool-call', 'tool-result', and 'done' event types

#### Scenario: Streaming response handling
- **WHEN** the modal receives streaming events from the Tauri invoke
- **THEN** each 'text' event appends content to the modal display area
- **AND** tool calls are displayed with appropriate visual indicators
- **AND** the streaming status is tracked for UI feedback
