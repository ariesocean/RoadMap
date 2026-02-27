## ADDED Requirements
### Requirement: Immediate Save Mode
The system SHALL automatically save roadmap.md changes to the currentMap's map file immediately after each write operation, preventing data loss when session is lost.

#### Scenario: Auto-save to currentMap on roadmap change
- **WHEN** roadmap.md is written/modified
- **AND** a currentMap is selected
- **THEN** the roadmap.md content SHALL be immediately saved to the currentMap file
- **AND** the map file SHALL be updated in real-time

#### Scenario: No save when no currentMap
- **WHEN** roadmap.md is written/modified
- **AND** no currentMap is selected
- **THEN** only roadmap.md SHALL be updated
- **AND** no map file save operation SHALL occur

#### Scenario: Handle map file write failure
- **WHEN** immediate save to map file fails
- **THEN** the error SHALL be logged
- **AND** the roadmap.md save SHALL still succeed
- **AND** a warning SHALL be shown to the user
- **AND** retry mechanism SHALL be attempted

#### Scenario: Immediate save mode toggle
- **WHEN** user toggles immediate save mode off
- **AND** roadmap.md is modified
- **THEN** changes SHALL only be saved to roadmap.md
- **AND** map file SHALL NOT be updated until manual switch

#### Scenario: Session lost recovery
- **WHEN** application restarts after session loss
- **AND** immediate save mode was enabled
- **THEN** the latest roadmap.md content SHALL already be saved in the currentMap file
- **AND** no data loss SHALL occur
