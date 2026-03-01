## ADDED Requirements

### Requirement: Auto-Save to Map File After OpenCode Execution
When a current map is selected and OpenCode successfully modifies roadmap.md via any prompt mechanism (navigate or modal), the system SHALL automatically save the updated roadmap content to the current map file immediately after the execution completes, ensuring data consistency between roadmap.md and the map file.

#### Scenario: Auto-save after successful navigate execution
- **WHEN** navigate submitPrompt completes successfully (done/success event)
- **AND** a currentMap is selected
- **THEN** the saveCurrentMap function SHALL be automatically invoked
- **AND** the roadmap.md content SHALL be written to the currentMap file
- **AND** a console log SHALL confirm the save operation

#### Scenario: Auto-save after successful modal prompt execution
- **WHEN** modal-prompt submitPrompt completes successfully
- **AND** a currentMap is selected
- **THEN** the saveCurrentMap function SHALL be automatically invoked
- **AND** the roadmap.md content SHALL be written to the currentMap file
- **AND** a console log SHALL confirm the save operation

#### Scenario: Auto-save after timeout
- **WHEN** submitPrompt times out (navigate or modal)
- **AND** a currentMap is selected
- **THEN** the saveCurrentMap function SHALL be automatically invoked
- **AND** the roadmap.md content (potentially partial) SHALL be written to the currentMap file

#### Scenario: No auto-save on error
- **WHEN** submitPrompt fails with an error (navigate or modal)
- **THEN** saveCurrentMap SHALL NOT be invoked
- **AND** the map file SHALL remain unchanged

#### Scenario: No auto-save when no currentMap
- **WHEN** submitPrompt completes (navigate or modal)
- **AND** currentMap is null
- **THEN** saveCurrentMap SHALL NOT be invoked
- **AND** no error SHALL occur

#### Scenario: Callback registration lifecycle
- **WHEN** InputArea or modal prompt component mounts
- **THEN** saveCurrentMap callback SHALL be registered with taskStore
- **AND** WHEN component unmounts
- **THEN** the callback SHALL be unregistered from taskStore
