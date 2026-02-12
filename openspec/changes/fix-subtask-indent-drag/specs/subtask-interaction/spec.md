## ADDED Requirements
### Requirement: Subtask Hierarchy Drag-and-Drop
The system SHALL allow users to change subtask hierarchy through drag-and-drop.

#### Scenario: Increase indentation
- **WHEN** user drags subtask and drops on top of sibling
- **THEN** subtask becomes child (nestedLevel +1)

#### Scenario: Decrease indentation
- **WHEN** user drags child and drops after parent
- **THEN** subtask becomes sibling of parent (nestedLevel -1)

#### Scenario: Same-level reorder
- **WHEN** user drags and drops between siblings
- **THEN** subtask reorders (nestedLevel unchanged)

### Requirement: Maximum Hierarchy Change Per Drag
The system SHALL limit hierarchical changes to at most one level per drag.

#### Scenario: Prevent multiple level change
- **WHEN** user attempts to change nesting by more than one level
- **THEN** system rejects and returns subtask to original position

### Requirement: Roadmap Structure Validity
The system SHALL preserve roadmap.md format per SKILL.md after drag operations.

#### Scenario: Markdown format preserved
- **WHEN** hierarchy is changed
- **THEN** indentation uses 2 spaces per level
- **AND** `## Subtasks` header present
- **AND** timestamps and completion markers preserved
- **AND** `**Last Updated:**` updated
