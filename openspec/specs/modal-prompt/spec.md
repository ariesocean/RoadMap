# modal-prompt Specification

> **Deprecation Notice**: The `/api/execute-modal-prompt` and `/api/execute-navigate` endpoints have been removed from the codebase (vite.config.ts). The frontend now uses the OpenCode SDK directly. This spec is kept for historical reference only.

## Purpose
Provides a modal interface for executing follow-up prompts to OpenCode with streaming event display. This spec covers:
- **Modal Prompt Interface**: Display mode vs prompt mode switching in ResultModal
- **Event Stream Display**: Visual styling for reasoning (white italic), text (bold white), tool results (cyan), done (green), and error (red) events
- **Modal-Only Prompt API**: Dedicated API endpoint for executing prompts within modal context with SSE streaming
- **Event Deduplication**: Prevents duplicate content from being displayed during prompt processing
- **Auto-Save**: Automatically saves roadmap.md content to current map file after modal prompt execution

Note: The `/api/execute-modal-prompt` and `/api/execute-navigate` endpoints have been removed. The frontend now uses OpenCode SDK directly (see `session` spec).
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

### Requirement: Auto-Save After Modal Prompt Execution
When a modal prompt completes execution, the system SHALL automatically save the updated roadmap.md content to the current map file (if a map is selected), ensuring data consistency after custom prompt execution.

#### Scenario: Modal prompt completes successfully
- **WHEN** a modal prompt execution completes (via executeModalPrompt)
- **AND** a currentMap is selected
- **THEN** the roadmap.md content SHALL be automatically saved to the currentMap file
- **AND** tasks SHALL be refreshed from roadmap.md

#### Scenario: Modal prompt errors
- **WHEN** a modal prompt execution fails
- **THEN** no save to currentMap SHALL occur
- **AND** the map file SHALL remain unchanged

#### Scenario: Modal prompt with no currentMap
- **WHEN** a modal prompt execution completes
- **AND** no currentMap is selected
- **THEN** roadmap.md SHALL be updated
- **AND** no save to map file SHALL occur

### Requirement: Auto-Scroll During Streaming
The modal SHALL automatically scroll to the bottom of the content area when new streaming content arrives, ensuring the latest content is always visible to the user.

#### Scenario: Auto-scroll during SSE streaming
- **WHEN** new segments are added to the content area during streaming
- **THEN** the content area SHALL automatically scroll to display the newly added content
- **AND** the user SHALL see the latest streaming response in real-time

#### Scenario: Preserve manual scroll position when not streaming
- **WHEN** the user manually scrolls up in the content area
- **AND** no new content is being streamed
- **THEN** the scroll position SHALL be preserved
- **AND** new content arriving later SHALL trigger auto-scroll again

#### Scenario: Auto-scroll in prompt mode
- **WHEN** streaming response arrives while in prompt mode
- **THEN** the content area SHALL scroll to bottom to show the response
- **AND** the user can continue typing after streaming completes

