## MODIFIED Requirements

### Requirement: Modal Prompt Interface
The ResultModal component SHALL provide a prompt-only input interface when opened in prompt mode, allowing users to send follow-up messages to the OpenCode server without closing the modal.

#### Scenario: Display mode with close option
- **WHEN** a task is created and the modal opens in display mode
- **THEN** the user sees the task execution results in a structured message list
- **AND** each message contains appropriate parts (text, reasoning, tool calls, tool results)
- **AND** only a close button is available
- **AND** the user cannot submit prompts until switching to prompt mode

#### Scenario: Switching to prompt mode
- **WHEN** the user clicks a "Continue with AI" or similar button in display mode
- **THEN** a prompt input field appears at the bottom of the modal
- **AND** the display area remains visible for reference
- **AND** the user can type and submit follow-up prompts

#### Scenario: Submitting follow-up prompt in modal
- **WHEN** the user types a prompt in the modal input and submits
- **THEN** the response streams into the modal as structured messages
- **AND** the input field shows a loading indicator during processing
- **AND** the user can continue to submit additional prompts in the same session

### Requirement: Modal-Only Prompt API
The system SHALL provide a dedicated API endpoint for executing prompts within the modal context, separate from the main navigation flow.

#### Scenario: API endpoint receives prompt
- **WHEN** a POST request is sent to /api/execute-modal-prompt with a prompt
- **THEN** the OpenCode server processes the prompt
- **AND** the response is streamed back in Server-Sent Events format
- **AND** the response events include 'text', 'tool-call', 'tool-result', 'reasoning', and 'done' event types

#### Scenario: Streaming response handling
- **WHEN** the modal receives streaming events from the modal prompt API
- **THEN** each 'text' event creates a new text part in the current message
- **AND** 'reasoning' events create reasoning parts
- **AND** 'tool-call' events create tool call parts with appropriate metadata
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
- **THEN** an error message part is added to the content
- **AND** promptError contains the error details
- **AND** the user can attempt to submit again after correcting the issue

### Requirement: Event Deduplication
The system SHALL implement event deduplication to prevent duplicate content from being displayed in the modal during prompt processing.

#### Scenario: Server-side event deduplication
- **WHEN** the OpenCode server sends multiple events with the same content
- **THEN** the API endpoint SHALL track processed event IDs using a Set
- **AND** duplicate events SHALL be filtered out before streaming to the client
- **AND** each unique event SHALL only be processed once

#### Scenario: Event ID generation
- **WHEN** processing events from the OpenCode server
- **THEN** the eventId SHALL be generated using a monotonically increasing counter
- **AND** the counter SHALL be scoped to each session
- **AND** the format SHALL be `${eventType}-${sessionId}-${counter}`

#### Scenario: No duplicate tool calls displayed
- **WHEN** the same tool is called multiple times during execution
- **THEN** each tool-call event SHALL appear exactly once in the modal
- **AND** tool-result events SHALL not be duplicated

### Requirement: Backend Deduplication Consistency
Both `/api/execute-navigate` and `/api/execute-modal-prompt` endpoints SHALL use consistent deduplication mechanisms.

#### Scenario: Navigate endpoint deduplication
- **WHEN** events are streamed from the OpenCode server to `/api/execute-navigate`
- **THEN** the endpoint SHALL maintain a `processedEvents` Set
- **AND** events already in the Set SHALL be skipped
- **AND** the Set SHALL be scoped to each request

#### Scenario: Modal prompt endpoint deduplication
- **WHEN** events are streamed from the OpenCode server to `/api/execute-modal-prompt`
- **THEN** the endpoint SHALL maintain a `processedEvents` Set
- **AND** eventId generation SHALL use an incrementing counter
- **AND** duplicate events SHALL not reach the client

## ADDED Requirements

### Requirement: Structured Content Display
The modal SHALL display content in a structured format that distinguishes between different event types, providing clear visual separation between AI responses, thinking processes, tool invocations, and tool outputs.

#### Scenario: Text content display
- **WHEN** the AI generates text content
- **THEN** the text SHALL be rendered with markdown support
- **AND** code blocks SHALL be displayed in a code block format
- **AND** links SHALL be clickable

#### Scenario: Reasoning/thinking display
- **WHEN** the AI is processing or reasoning
- **THEN** reasoning content SHALL be displayed in a distinct block
- **AND** the reasoning block SHALL be visually differentiated (e.g., dimmed text, border)
- **AND** the reasoning block SHALL be expanded by default

#### Scenario: Tool call visualization
- **WHEN** the AI invokes a tool
- **THEN** the tool call SHALL be displayed with an appropriate icon
- **AND** the tool name SHALL be clearly visible
- **AND** tool-specific details SHALL be shown (e.g., command for bash, file path for read)

#### Scenario: Tool result display
- **WHEN** a tool completes execution
- **THEN** the result SHALL be displayed in a dedicated block
- **AND** success results SHALL be visually distinguished from errors
- **AND** full output SHALL be displayed without truncation

### Requirement: Message Metadata Display
The modal SHALL display metadata about each assistant message including the model used, agent type, and execution duration.

#### Scenario: Metadata visibility
- **WHEN** a message is complete
- **THEN** metadata SHALL be displayed at the end of the message
- **AND** the model identifier SHALL be shown
- **AND** the agent type SHALL be shown
- **AND** the execution duration SHALL be shown
