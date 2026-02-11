## ADDED Requirements

### Requirement: Modal Prompt Interface
The ResultModal component SHALL provide a prompt-only input interface when opened in prompt mode, allowing users to send follow-up messages to the OpenCode server without closing the modal.

#### Scenario: Display mode with close option
- **WHEN** a task is created and the modal opens in display mode
- **THEN** the user sees the task execution results in a scrollable content area
- **AND** only a close button is available
- **AND** the user cannot submit prompts until switching to prompt mode

#### Scenario: Switching to prompt mode
- **WHEN** the user clicks a "Continue with AI" or similar button in display mode
- **THEN** a prompt input field appears at the bottom of the modal
- **AND** the display area remains visible for reference
- **AND** the user can type and submit follow-up prompts

#### Scenario: Submitting follow-up prompt in modal
- **WHEN** the user types a prompt in the modal input and submits
- **THEN** the response streams into the modal content area
- **AND** the input field shows a loading indicator during processing
- **AND** the user can continue to submit additional prompts in the same session

### Requirement: Modal-Only Prompt API
The system SHALL provide a dedicated API endpoint for executing prompts within the modal context, separate from the main navigation flow.

#### Scenario: API endpoint receives prompt
- **WHEN** a POST request is sent to /api/execute-modal-prompt with a prompt
- **THEN** the OpenCode server processes the prompt
- **AND** the response is streamed back in Server-Sent Events format
- **AND** the response events include 'text', 'tool-call', 'tool-result', and 'done' event types

#### Scenario: Streaming response handling
- **WHEN** the modal receives streaming events from the modal prompt API
- **THEN** each 'text' event appends content to the modal display area
- **AND** tool calls are displayed with appropriate visual indicators
- **AND** the streaming status is tracked for UI feedback

### Requirement: Modal Prompt State Management
The resultModalStore SHALL manage prompt-specific state separate from the main modal state.

#### Scenario: Prompt input state
- **WHEN** the user types in the modal prompt input
- **THEN** the input value is stored in promptInput state
- **AND** the state persists until the prompt is submitted or cleared

#### Scenario: Streaming state
- **WHEN** a modal prompt is being processed
- **THEN** promptStreaming is set to true
- **AND** the input is disabled during streaming
- **AND** promptStreaming returns to false when the response completes

#### Scenario: Error handling
- **WHEN** a modal prompt fails to execute
- **THEN** an error message is displayed in the content area
- **AND** promptError contains the error details
- **AND** the user can attempt to submit again after correcting the issue
