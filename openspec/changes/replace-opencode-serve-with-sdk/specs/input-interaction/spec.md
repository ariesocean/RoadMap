## MODIFIED Requirements
### Requirement: Form Submission Control
The input area form SHALL only submit when the user explicitly intends to send a prompt, with prompt execution handled via Tauri invoke.

#### Scenario: Prompt submission triggers Tauri invoke
- **WHEN** the user submits a prompt via the form
- **THEN** the system SHALL call the `execute_navigate` Tauri command
- **AND** the response SHALL be streamed back in SSE format
- **AND** execution results SHALL be displayed in the UI
