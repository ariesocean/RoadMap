## ADDED Requirements
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
