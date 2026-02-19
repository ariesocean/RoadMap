## MODIFIED Requirements
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

### ADDED Requirement: Task Description Edit
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
