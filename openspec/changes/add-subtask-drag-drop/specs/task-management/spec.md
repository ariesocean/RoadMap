## ADDED Requirements

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

### Requirement: Keyboard Accessibility for Subtask Reordering
The system SHALL allow users to reorder and reorganize subtasks using keyboard operations.

#### Scenario: Keyboard user moves subtask up
- **WHEN** a subtask is focused
- **AND** the user presses Alt+UpArrow
- **THEN** the subtask SHALL swap positions with the item above it
- **AND** the new order SHALL be persisted to the roadmap.md file

#### Scenario: Keyboard user moves subtask down
- **WHEN** a subtask is focused
- **AND** the user presses Alt+DownArrow
- **THEN** the subtask SHALL swap positions with the item below it
- **AND** the new order SHALL be persisted to the roadmap.md file

#### Scenario: Keyboard user indents subtask
- **WHEN** a subtask is focused
- **AND** the user presses Alt+RightArrow
- **THEN** the subtask's nestedLevel SHALL increase by 1
- **AND** the new hierarchy SHALL be persisted to the roadmap.md file

#### Scenario: Keyboard user outdents subtask
- **WHEN** a subtask is focused
- **AND** the user presses Alt+LeftArrow
- **THEN** the subtask's nestedLevel SHALL decrease by 1
- **AND** the new hierarchy SHALL be persisted to the roadmap.md file

#### Scenario: Reordering performs well with many subtasks
- **WHEN** a task contains 50 or more subtasks
- **AND** a user drags one subtask to a new position
- **THEN** the drag operation SHALL remain responsive (no visible lag)
- **AND** the drop animation SHALL complete smoothly

## MODIFIED Requirements

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
