# sub-task-management Specification

## Purpose
Manages subtasks within tasks, including drag-and-drop reordering, hierarchy nesting via horizontal dragging, and persistence to roadmap.md.
## Requirements
### Requirement: Subtask Drag-and-Drop Reordering
The system SHALL allow users to drag and reorder subtasks within a single task to change their vertical position in the list.

#### Scenario: User drags subtask to new position
- **WHEN** a user clicks and holds on any part of a subtask item
- **AND** drags it vertically to a new position in the list
- **THEN** the subtask SHALL visually move following the cursor
- **AND** other subtasks SHALL shift to make space for the drop target
- **AND** upon releasing the mouse, the subtask SHALL settle in the new position
- **AND** the new order SHALL be persisted to the roadmap.md file

#### Scenario: Subtask returns to original position when dropped outside valid area
- **WHEN** a user drags a subtask and releases it outside the subtask list area
- **THEN** the subtask SHALL animate back to its original position
- **AND** no changes SHALL be made to the task's subtask order

### Requirement: Subtask Hierarchy Nesting via Drag
The system SHALL allow users to change a subtask's nestedLevel by dragging it horizontally to the left or right.

#### Scenario: User outdents a subtask by dragging left
- **WHEN** a user drags a subtask to the left edge of its current position
- **AND** releases it in the indentation zone
- **THEN** the subtask's nestedLevel SHALL decrease by 1
- **AND** the subtask SHALL appear visually less indented (outdented)
- **AND** the new hierarchy SHALL be persisted to the roadmap.md file

#### Scenario: User indents a subtask by dragging right
- **WHEN** a user drags a subtask to the right of its current indentation
- **AND** releases it in the indentation zone
- **THEN** the subtask's nestedLevel SHALL increase by 1
- **AND** the subtask SHALL appear visually more indented
- **AND** the new hierarchy SHALL be persisted to the roadmap.md file

### Requirement: Drag State Visual Feedback
The system SHALL provide visual feedback during drag operations to indicate the drag state and valid drop targets.

#### Scenario: Dragged item shows visual highlight
- **WHEN** a user begins dragging a subtask
- **THEN** the dragged item SHALL display a drop-in style visual with elevated shadow
- **AND** the opacity of the dragged item SHALL slightly decrease
- **AND** the cursor SHALL change to indicate the drag state

#### Scenario: Drop target shows insertion indicator
- **WHEN** a user drags a subtask over other list items
- **THEN** a horizontal line or indicator SHALL appear at the potential drop position
- **AND** indentation zones SHALL be highlighted when dragging near the left/right edges

### Requirement: Subtask Reordering Persistence
The system SHALL persist reordered subtasks to the roadmap.md file maintaining the new order and hierarchy.

#### Scenario: Markdown file updates after drag completion
- **WHEN** a user successfully drops a subtask in a new position or hierarchy
- **THEN** the roadmap.md file SHALL be updated with the new subtask order
- **AND** the subtask items SHALL maintain their existing properties (id, content, completed state)
- **AND** the visual display SHALL reflect the new order immediately after the drop

#### Scenario: Rapid reordering operations complete sequentially
- **WHEN** a user performs multiple drag-and-drop operations in quick succession
- **THEN** each reordering SHALL complete before the next begins
- **AND** the final state in roadmap.md SHALL reflect all operations

### Requirement: Subtask Display
Subtasks SHALL be displayed in a vertical list in the order defined by the current application state. Users MAY reorder subtasks within a task using drag-and-drop operations, and the visual order SHALL reflect the persisted order in roadmap.md.

#### Scenario: Subtasks display in persistent order
- **WHEN** the application loads a task with subtasks
- **THEN** the subtasks SHALL be displayed in the order stored in the application state
- **AND** any previous drag-and-drop reordering SHALL be reflected in the displayed order
- **AND** the display order SHALL match the order in roadmap.md after any reordering

#### Scenario: New subtasks appear at the end of the list
- **WHEN** a user adds a new subtask to a task
- **THEN** the new subtask SHALL appear at the end of the existing subtask list
- **AND** users MAY subsequently reorder the new subtask using drag-and-drop

### Requirement: Add Subtask from UI
The system SHALL allow users to add new subtasks directly from the UI by hovering over the bottom area of an expanded task card.

#### Scenario: Hover reveals add button
- **WHEN** a user hovers over the bottom area of an expanded task card
- **THEN** a "+ 添加任务" button SHALL appear
- **AND** the hover area SHALL expand in height

#### Scenario: Click reveals input
- **WHEN** a user clicks the "+ 添加任务" button
- **THEN** an input field SHALL appear with placeholder "输入任务内容..."
- **AND** the input SHALL be focused automatically

#### Scenario: Enter adds subtask
- **WHEN** a user types a subtask and presses Enter
- **THEN** a new subtask SHALL be added to the bottom of the subtask list
- **AND** the new subtask SHALL have nestedLevel of 0
- **AND** the roadmap.md file SHALL be updated with the new subtask

#### Scenario: Escape cancels adding
- **WHEN** a user is in add mode and presses Escape
- **THEN** the input SHALL disappear
- **AND** no subtask SHALL be added

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

