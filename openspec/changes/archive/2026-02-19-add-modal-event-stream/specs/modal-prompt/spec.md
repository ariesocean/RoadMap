## MODIFIED Requirements
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
