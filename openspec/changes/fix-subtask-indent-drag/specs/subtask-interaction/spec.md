## ADDED Requirements
### Requirement: Subtask Hierarchy Drag-and-Drop
The system SHALL allow users to change subtask hierarchy (indentation level) through drag-and-drop operations.

#### Scenario: Increase indentation by one level
- **WHEN** a user drags a subtask and drops it on top of a sibling subtask at the same level
- **THEN** the dropped subtask SHALL become a child of the target subtask
- **AND** the dropped subtask's nestedLevel SHALL increase by 1

#### Scenario: Decrease indentation by one level
- **WHEN** a user drags a child subtask and drops it after a parent subtask
- **THEN** the dropped subtask SHALL move to the same level as its former parent
- **AND** the dropped subtask's nestedLevel SHALL decrease by 1

#### Scenario: Reorder within same level
- **WHEN** a user drags a subtask and drops it between two subtasks at the same hierarchy level
- **THEN** the subtask SHALL be reordered to the new position
- **AND** the nestedLevel SHALL remain unchanged

### Requirement: Maximum Hierarchy Change Per Drag
The system SHALL limit hierarchical changes to at most one level per drag operation.

#### Scenario: Prevent multiple level indentation increase
- **WHEN** a user attempts to drag a subtask to a position that would increase nesting by more than one level
- **THEN** the system SHALL reject the drop operation
- **AND** the subtask SHALL return to its original position
- **AND** an error notification SHALL explain that only one level change is allowed

#### Scenario: Prevent multiple level indentation decrease
- **WHEN** a user attempts to drag a subtask to a position that would decrease nesting by more than one level
- **THEN** the system SHALL reject the drop operation
- **AND** the subtask SHALL return to its original position
- **AND** an error notification SHALL explain that only one level change is allowed

### Requirement: Visual Hierarchy Feedback During Drag
The system SHALL provide visual feedback indicating the potential nesting level during drag operations.

#### Scenario: Indentation preview shown during drag
- **WHEN** a user is dragging a subtask
- **THEN** the drag overlay SHALL show the subtask at its potential new indentation level
- **AND** the visual indentation SHALL match the nestedLevel that would be applied on drop

#### Scenario: Drop target highlighting
- **WHEN** a user hovers a dragged subtask over a potential drop target
- **THEN** the target area SHALL highlight to indicate the hierarchy relationship
- **AND** the highlighting SHALL indicate whether the drop would result in sibling or child placement

### Requirement: Roadmap Structure Validity
The system SHALL ensure roadmap.md file structure remains valid and compliant with `.opencode/skills/navigate/SKILL.md` format after drag operations.

#### Scenario: Markdown structure preserved after hierarchy change
- **WHEN** a subtask hierarchy is changed through drag-and-drop
- **THEN** the roadmap.md file SHALL be updated with correct indentation (2 spaces per nesting level)
- **AND** the markdown format SHALL be `{indent}* [ ] {content}` where `{indent}` is 2 spaces × nestedLevel
- **AND** the `## Subtasks` header SHALL remain present for each main task
- **AND** all `[x]` / `[ ]` completion markers SHALL remain unchanged
- **AND** the hierarchical relationship SHALL be preserved in the markdown format
- **AND** all subtask content, completion status, and order SHALL be maintained

#### Scenario: Maximum nesting level enforced
- **WHEN** a subtask is at the maximum nesting level (6)
- **THEN** the system SHALL prevent further indentation increases
- **AND** visual feedback SHALL indicate that deeper nesting is not possible
- **AND** an error notification SHALL explain the maximum nesting level limit (6 levels maximum)

#### Scenario: Last Updated timestamp on hierarchy change
- **WHEN** a subtask hierarchy is changed through drag-and-drop
- **THEN** the `**Last Updated:**` timestamp SHALL be updated to current time
- **AND** the timestamp SHALL be updated for the parent task containing the moved subtask
- **AND** all `[created: YYYY-MM-DD HH:MM]` timestamps in task titles SHALL be preserved

#### Scenario: Invalid drop area handling
- **WHEN** a user releases a dragged subtask in an invalid drop area
- **THEN** the subtask SHALL return to its original position
- **AND** no markdown update SHALL occur
- **AND** no error notification SHALL be displayed (graceful handling)

#### Scenario: Multiple drop targets detection
- **WHEN** collision detection identifies multiple potential drop targets
- **THEN** the system SHALL use the closest target to the drop position
- **AND** if targets are equidistant, SHALL use the target with matching hierarchy level

### Requirement: Child Subtask Preservation During Hierarchy Change
The system SHALL ensure child subtasks follow their parent when the parent changes hierarchy level.

#### Scenario: Children follow parent during indentation increase
- **WHEN** a subtask with children is moved to a higher nesting level (indentation increases)
- **THEN** all direct child subtasks SHALL maintain their relative position
- **AND** each child's nestedLevel SHALL increase by the same amount as the parent
- **AND** grandchildren SHALL maintain their relative relationship to the parent

#### Scenario: Children follow parent during indentation decrease
- **WHEN** a subtask with children is moved to a lower nesting level (indentation decreases)
- **THEN** all direct child subtasks SHALL maintain their relative position
- **AND** each child's nestedLevel SHALL decrease by the same amount as the parent
- **AND** grandchildren SHALL maintain their relative relationship to the parent

#### Scenario: Outdent with sibling children present
- **WHEN** a user drags a child subtask and drops it after its parent which has other children
- **THEN** the dropped subtask SHALL become a sibling of the parent at the parent's level
- **AND** the dropped subtask's nestedLevel SHALL decrease by 1
- **AND** the dropped subtask's children SHALL follow with the same level adjustment

#### Scenario: Parent indent blocked when child at maximum level
- **WHEN** a subtask with a child at nestedLevel 6 is dragged to increase indentation
- **THEN** the system SHALL reject the drop operation
- **AND** the subtask SHALL return to its original position
- **AND** an error notification SHALL explain that a child is at maximum nesting level (6)

### Requirement: Hierarchy Cycle Prevention
The system SHALL prevent creating circular references where a subtask becomes its own ancestor.

#### Scenario: Prevent creating parent-child cycle
- **WHEN** a user attempts to drag a subtask to become a child of one of its own descendants
- **THEN** the system SHALL reject the drop operation
- **AND** the subtask SHALL return to its original position
- **AND** an error notification SHALL be displayed explaining the circular reference

### Requirement: Cross-Task Hierarchy Changes Not Allowed
The system SHALL prevent moving subtasks between different parent tasks, where a "parent task" refers to a main task (title starting with #) or another subtask.

#### Scenario: Subtask cannot move to different task
- **WHEN** a user attempts to drag a subtask to a different main task's hierarchy
- **THEN** the system SHALL reject the drop operation
- **AND** the subtask SHALL return to its original position
- **AND** an error notification SHALL explain that subtasks can only be moved within their current task

#### Scenario: Subtask cannot move between subtask hierarchies
- **WHEN** a user attempts to drag a subtask from one subtask's children to another subtask's children
- **THEN** the system SHALL reject the drop operation
- **AND** the subtask SHALL return to its original position
- **AND** an error notification SHALL explain that subtasks cannot be moved between different parent subtasks

#### Scenario: Subtask can move within same task
- **WHEN** a user drags a subtask to a different position within the same main task
- **THEN** the system SHALL allow the drag operation
- **AND** hierarchy changes SHALL be applied according to drop target rules
