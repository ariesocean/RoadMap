# main-task-management Specification

## Purpose
Manages top-level (main) tasks in the roadmap. This spec covers:
- **Task Card Drag Sort**: Reorder tasks by dragging
- **Task Description Edit**: Edit task description via double-click
- **Task Title Edit**: Edit task title via double-click

Note: Creation and deletion of main tasks is handled through AI prompts (via OpenCode), not direct UI interaction. For subtask management (drag-drop, reorder, add, delete), see `sub-task-management` spec.
## Requirements
### Requirement: Task Card Drag Sort
The system SHALL allow users to manually reorder tasks in the list by dragging task cards.

#### Scenario: User drags task card
- **WHEN** a user clicks and holds on the title area of a task card
- **AND** drags it to a new position in the list
- **THEN** a floating copy of the task card SHALL follow the cursor
- **AND** other task cards SHALL shift to show the drop target
- **AND** upon releasing, the task SHALL settle in the new position

#### Scenario: Drag persists to file
- **WHEN** a user successfully reorders tasks via drag
- **THEN** the roadmap.md file SHALL be updated with the new task order
- **AND** the task order SHALL persist across page reloads

### Requirement: Task Description Edit
The system SHALL allow users to edit task description by double-clicking on it.

#### Scenario: Double-click enters edit mode
- **WHEN** a user double-clicks on a task description
- **THEN** an input field SHALL replace the description text
- **AND** the input SHALL be focused with existing text selected

#### Scenario: Enter saves changes
- **WHEN** a user edits the description and presses Enter
- **THEN** the new description SHALL be saved
- **AND** the roadmap.md file SHALL be updated
- **AND** the input SHALL return to display mode

#### Scenario: Escape cancels editing
- **WHEN** a user is editing and presses Escape
- **THEN** the changes SHALL be discarded
- **AND** the input SHALL return to display mode with original value

#### Scenario: Blur saves changes
- **WHEN** a user clicks outside the input (blur) while editing
- **THEN** the changes SHALL be saved
- **AND** the roadmap.md file SHALL be updated
- **AND** the input SHALL return to display mode

### Requirement: Task Title Edit
The system SHALL allow users to edit task title by double-clicking on it.

#### Scenario: Double-click enters edit mode
- **WHEN** a user double-clicks on a task title
- **THEN** an input field SHALL replace the title text
- **AND** the input SHALL be focused with existing text selected

#### Scenario: Enter saves changes
- **WHEN** a user edits the title and presses Enter
- **THEN** the new title SHALL be saved
- **AND** the roadmap.md file SHALL be updated
- **AND** the input SHALL return to display mode

#### Scenario: Escape cancels editing
- **WHEN** a user is editing and presses Escape
- **THEN** the changes SHALL be discarded
- **AND** the input SHALL return to display mode with original value

#### Scenario: Blur saves changes
- **WHEN** a user clicks outside the input (blur) while editing
- **THEN** the changes SHALL be saved
- **AND** the roadmap.md file SHALL be updated
- **AND** the input SHALL return to display mode

#### Scenario: Drag still works after edit
- **WHEN** a user is not editing the title
- **AND** clicks and holds on the title area
- **THEN** the task card SHALL be draggable
- **AND** drag sorting SHALL work normally

### Requirement: Task Creation and Updates via OpenCode
The system SHALL allow users to create and update tasks through OpenCode AI prompts, with all changes persisted to the roadmap file and automatically synced to the current map file.

#### Scenario: OpenCode navigate prompt execution completes successfully
- **WHEN** user submits a navigate prompt via input box
- **AND** the OpenCode server processes the command successfully
- **THEN** the roadmap.md file SHALL be updated with the new content
- **AND** if a currentMap is selected, the updated roadmap content SHALL be automatically saved to the currentMap file
- **AND** tasks SHALL be reloaded from roadmap.md to reflect changes

#### Scenario: OpenCode modal prompt execution completes successfully
- **WHEN** user submits a modal prompt (custom prompt in result modal)
- **AND** the OpenCode server processes the command successfully
- **THEN** the roadmap.md file SHALL be updated with the new content
- **AND** if a currentMap is selected, the updated roadmap content SHALL be automatically saved to the currentMap file
- **AND** tasks SHALL be reloaded from roadmap.md to reflect changes

#### Scenario: OpenCode prompt execution times out
- **WHEN** user submits a navigate or modal prompt via input box
- **AND** the execution reaches timeout
- **THEN** the roadmap.md file MAY be partially updated
- **AND** if a currentMap is selected, the roadmap content SHALL still be saved to the currentMap file
- **AND** tasks SHALL be reloaded from roadmap.md

#### Scenario: OpenCode prompt execution fails
- **WHEN** user submits a navigate or modal prompt via input box
- **AND** the execution encounters an error
- **THEN** the roadmap.md file SHALL remain unchanged
- **AND** no save to currentMap SHALL occur

#### Scenario: No currentMap selected
- **WHEN** user submits a navigate or modal prompt via input box
- **AND** no map is currently selected (currentMap === null)
- **THEN** the roadmap.md file SHALL be updated
- **AND** no save to map file SHALL occur (map file does not exist)

#### Scenario: Component unmount during prompt execution
- **WHEN** InputArea or modal prompt component unmounts while a prompt is executing
- **THEN** the callback SHALL be properly unregistered
- **AND** no memory leak SHALL occur
- **AND** if prompt completes after unmount, callback SHALL NOT execute

