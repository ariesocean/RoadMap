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

## ADDED Requirements
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
