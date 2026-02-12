# subtask-interaction Specification

## ADDED Requirements

### Requirement: Subtask Drag Reordering
Users SHALL be able to reorder subtasks within a task by dragging them to a new position.

#### Scenario: Reorder subtask to new position
- **WHEN** user drags a subtask vertically to a new position
- **AND** horizontal movement is minimal (less than threshold)
- **THEN** the subtask SHALL move to the new position
- **AND** the nestedLevel SHALL remain unchanged
- **AND** the roadmap.md file SHALL be updated with new order

### Requirement: Subtask Indent via Drag
Users SHALL be able to increase subtask nesting level (indent) by dragging right during a drag operation.

#### Scenario: Indent subtask one level
- **WHEN** user drags a subtask right beyond the indent threshold
- **AND** the current nestedLevel is less than the maximum allowed
- **THEN** the nestedLevel SHALL increase by exactly 1
- **AND** the subtask SHALL visually appear indented
- **AND** the roadmap.md SHALL reflect the increased indentation with proper spacing

#### Scenario: Prevent indent beyond maximum level
- **WHEN** user drags a subtask right at maximum nestedLevel
- **THEN** the nestedLevel SHALL NOT increase
- **AND** visual feedback SHALL indicate the limit

### Requirement: Subtask Outdent via Drag
Users SHALL be able to decrease subtask nesting level (outdent) by dragging left during a drag operation.

#### Scenario: Outdent subtask one level
- **WHEN** user drags a subtask left beyond the outdent threshold
- **AND** the current nestedLevel is greater than 0
- **THEN** the nestedLevel SHALL decrease by exactly 1
- **AND** the subtask SHALL visually appear at the lower level
- **AND** the roadmap.md SHALL reflect the decreased indentation

#### Scenario: Prevent outdent below root level
- **WHEN** user drags a subtask left at nestedLevel 0
- **THEN** the nestedLevel SHALL remain at 0
- **AND** visual feedback SHALL indicate the limit

### Requirement: Single Level Change Constraint
Each drag operation SHALL change nestedLevel by at most one level, regardless of horizontal drag distance.

#### Scenario: Large horizontal drag limited to one level
- **WHEN** user drags a subtask significantly right or left
- **THEN** nestedLevel SHALL change by at most 1 from original level
- **AND** excessive horizontal movement SHALL NOT cause multiple level changes

### Requirement: Roadmap.md Structure Preservation
After any drag operation, the saved roadmap.md file SHALL maintain the structure defined in the navigate SKILL.md.

#### Scenario: Proper indentation in saved file
- **WHEN** a subtask with nestedLevel N is saved
- **THEN** the markdown SHALL use 2 spaces per level as indentation prefix
- **AND** the format SHALL be `{indent}* [ ] {content}` for incomplete subtasks
- **AND** the format SHALL be `{indent}* [x] {content}` for completed subtasks

#### Scenario: Task section structure preserved
- **WHEN** subtasks are reordered or re-leveled
- **THEN** the task title SHALL remain as `# {title} [created: ...]`
- **AND** the original prompt SHALL remain as `> {prompt}`
- **AND** subtasks SHALL use `* [ ]` or `* [x]` format with proper indentation
