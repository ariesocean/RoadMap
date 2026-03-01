## ADDED Requirements

### Requirement: Auto-Save After Modal Prompt Execution
When a modal prompt completes execution, the system SHALL automatically save the updated roadmap.md content to the current map file (if a map is selected), ensuring data consistency after custom prompt execution.

#### Scenario: Modal prompt completes successfully
- **WHEN** a modal prompt execution completes (via executeModalPrompt)
- **AND** a currentMap is selected
- **THEN** the roadmap.md content SHALL be automatically saved to the currentMap file
- **AND** tasks SHALL be refreshed from roadmap.md

#### Scenario: Modal prompt errors
- **WHEN** a modal prompt execution fails
- **THEN** no save to currentMap SHALL occur
- **AND** the map file SHALL remain unchanged

#### Scenario: Modal prompt with no currentMap
- **WHEN** a modal prompt execution completes
- **AND** no currentMap is selected
- **THEN** roadmap.md SHALL be updated
- **AND** no save to map file SHALL occur
