## ADDED Requirements
### Requirement: Subtask Delete from UI
The system SHALL allow users to delete subtasks directly from the UI by clearing the input and confirming deletion.

#### Scenario: Delete button appears on empty input
- **WHEN** a user edits a subtask, clears the input, and presses Enter
- **THEN** a delete button (Trash icon) SHALL appear
- **AND** the input SHALL remain in edit mode

#### Scenario: Click delete removes subtask
- **WHEN** a user clicks the delete button
- **THEN** the subtask SHALL be removed from the UI
- **AND** the roadmap.md file SHALL be updated
- **AND** the edit mode SHALL close

#### Scenario: Parent collapses when last subtask deleted
- **WHEN** a user deletes the last subtask of a task
- **THEN** the parent task SHALL automatically collapse
- **AND** no subtasks SHALL be displayed

#### Scenario: Enter on empty input doesn't exit edit mode
- **WHEN** a user presses Enter on empty input without clicking delete
- **THEN** the input SHALL remain in edit mode
- **AND** the delete button SHALL stay visible
