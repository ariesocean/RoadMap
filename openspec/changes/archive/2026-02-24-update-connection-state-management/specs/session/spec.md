## ADDED Requirements

### Requirement: Device Connection State
The system SHALL provide a manual connection state toggle that allows users to control when maps are loaded, preventing multi-device conflicts.

#### Scenario: Initial connection state
- **WHEN** the application initializes for the first time
- **THEN** the connection state SHALL default to disconnected
- **AND** no maps SHALL be loaded automatically
- **AND** the UI SHALL display "disconnected" status

#### Scenario: Manual connection toggle
- **WHEN** the user clicks the connection status indicator
- **THEN** the state SHALL toggle between connected and disconnected
- **AND** if toggling to connected, maps SHALL be loaded
- **AND** if toggling to disconnected, maps SHALL be unloaded

#### Scenario: Map loading on connection
- **WHEN** the connection state changes to connected
- **THEN** the system SHALL discover all `map-*.md` files (shown in sidebar)
- **AND** NO map SHALL be selected by default
- **AND** the roadmap SHALL show a blank page
- **AND** user SHALL manually select a map from the sidebar to load content

#### Scenario: Manual map selection after connection
- **WHEN** user clicks a map in the sidebar after connecting
- **THEN** the selected map's content SHALL be loaded into roadmap.md
- **AND** the task store SHALL refresh to display the loaded tasks

#### Scenario: Multi-device connection handling
- **WHEN** a new device connects and user toggles to connected
- **THEN** the previous device's connection state SHALL become disconnected
- **AND** the new device SHALL load the latest maps and roadmap.md
- **AND** no data conflicts SHALL occur between devices
