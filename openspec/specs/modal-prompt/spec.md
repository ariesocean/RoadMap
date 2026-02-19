# modal-prompt Specification

## Purpose
TBD - created by archiving change add-modal-prompt-interface. Update Purpose after archive.
## Requirements
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

### ADDED Requirement: Event Stream Display
The modal SHALL display streaming events with distinct visual styling based on event type.

#### Scenario: Reasoning displayed in white italic
- **WHEN** a reasoning event is received during streaming
- **THEN** the content SHALL be displayed with white text and italic styling
- **AND** prefixed with "Thinking: "

#### Scenario: Text displayed in bold white
- **WHEN** a text event is received during streaming
- **THEN** the content SHALL be displayed with bold white text

#### Scenario: Tool results displayed in cyan
- **WHEN** a tool-result event is received during streaming
- **THEN** the tool name SHALL be displayed in cyan color
- **AND** prefixed with "tool {name}"

#### Scenario: Done status displayed in green
- **WHEN** a done event is received
- **THEN** "✅ Completed!" or custom message SHALL be displayed in green

#### Scenario: Error displayed in red
- **WHEN** an error event is received
- **THEN** the error message SHALL be displayed in red
- **AND** prefixed with "❌ "

#### Scenario: Session info in header
- **WHEN** the modal opens with session info
- **THEN** a header SHALL show Session title, Prompt, and Model info
- **AND** the header SHALL be styled with a border separator

#### Scenario: Hidden event types
- **WHEN** tool-call, step-start, step-end, or message-complete events are received
- **THEN** these events SHALL NOT be displayed in the modal

### Requirement: Modal-Only Prompt API
The system SHALL provide a dedicated API endpoint for executing prompts within the modal context, separate from the main navigation flow.

**Refactoring Note**: Event deduplication now uses centralized `eventProcessor.ts` utility.

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

**Refactoring Note**: Timestamp handling now uses centralized `timestamp.ts` utility.

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

### Requirement: Event Deduplication
The system SHALL implement event deduplication to prevent duplicate content from being displayed in the modal during prompt processing.

**Refactoring Note**: Event deduplication now uses centralized `eventProcessor.ts` utility. Event ID generation now uses centralized `idGenerator.ts` utility.

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

**Refactoring Note**: Both endpoints now use centralized `eventProcessor.ts` utility for consistent deduplication behavior.

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

