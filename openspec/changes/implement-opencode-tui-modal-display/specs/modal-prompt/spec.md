## ADDED Requirements

### Requirement: Structured Content Display
The ResultModal SHALL display content using a structured Part-based system instead of plain text concatenation.

#### Scenario: Text content rendering
- **WHEN** a text event is received from the server
- **THEN** the content SHALL be rendered as a TextPart with Markdown formatting
- **AND** the text SHALL be displayed in a readable, formatted manner

#### Scenario: Reasoning content display
- **WHEN** reasoning/thinking content is received
- **THEN** it SHALL be rendered in a collapsible ReasoningPart block
- **AND** the block SHALL have a "Thinking..." header with a disclosure indicator
- **AND** the content SHALL be displayed in gray/monospace styling when expanded

#### Scenario: Tool call display
- **WHEN** a tool-call event is received
- **THEN** it SHALL be rendered as a ToolPart with:
  - An icon representing the tool type
  - The tool name in monospace font
  - A status badge (running/completed/error)
  - A colored left border matching the tool type
- **AND** tool input parameters SHALL be displayed in a structured format
- **AND** tool output SHALL be displayed when available

### Requirement: Tool Visual Configuration
The system SHALL define visual configurations for all supported tool types.

#### Scenario: Tool icon and color mapping
- **WHEN** rendering a ToolPart for "bash" tool
- **THEN** it SHALL display with:
  - Icon: "⚡"
  - Border color: yellow
  - Background: yellow-tinted

#### Scenario: File operation tools
- **WHEN** rendering ToolParts for file operations
- **THEN** "read" SHALL use blue theme
- **AND** "write" SHALL use green theme
- **AND** "edit" SHALL use orange theme

#### Scenario: Search tools
- **WHEN** rendering ToolParts for search tools
- **THEN** "grep" SHALL use purple theme
- **AND** "glob" SHALL use indigo theme

### Requirement: Message List Container
The ResultModal SHALL use a MessageList component to organize and display multiple Part components.

#### Scenario: Multiple parts display
- **WHEN** content contains multiple Parts (text, reasoning, tools)
- **THEN** the MessageList SHALL render them in chronological order
- **AND** each Part SHALL be visually separated
- **AND** the list SHALL be scrollable when content exceeds viewport

#### Scenario: Streaming updates
- **WHEN** new Parts arrive while streaming
- **THEN** they SHALL be appended to the MessageList
- **AND** the view SHALL auto-scroll to show new content
- **AND** partial text updates SHALL update existing TextParts in place

## MODIFIED Requirements

### Requirement: Modal Prompt Interface
The ResultModal component SHALL provide a structured content display interface using Part-based rendering.

#### Scenario: Display mode with structured content
- **WHEN** a task is created and the modal opens in display mode
- **THEN** the user sees structured execution results with:
  - Collapsible reasoning blocks
  - Tool calls with visual indicators
  - Formatted text responses
- **AND** the content area SHALL use MessageList instead of pre-formatted text

#### Scenario: Streaming response with parts
- **WHEN** the modal receives streaming events from the modal prompt API
- **THEN** 'text' events SHALL create or update TextPart components
- **AND** 'tool-call' events SHALL create ToolPart components with 'running' status
- **AND** 'tool-result' events SHALL update corresponding ToolPart with output and final status
- **AND** the streaming status SHALL be tracked for UI feedback

### Requirement: Modal Prompt State Management
The resultModalStore SHALL manage content as an array of Parts instead of a string.

#### Scenario: Part-based content state
- **WHEN** the store receives new content events
- **THEN** it SHALL append or update Part objects in a contentParts array
- **AND** the Part array SHALL maintain chronological order
- **AND** helper methods SHALL be provided for Part manipulation

#### Scenario: Content clearing
- **WHEN** the modal is closed or reset
- **THEN** the contentParts array SHALL be cleared
- **AND** all Part state SHALL be reset to initial values
