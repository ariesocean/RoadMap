## ADDED Requirements

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
