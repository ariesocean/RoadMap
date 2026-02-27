## ADDED Requirements

### Requirement: Disconnect Behavior

When a device disconnects from the connected state, the system SHALL NOT modify the roadmap.md file content. Instead, it SHALL only update the UI state to reflect disconnection.

#### Scenario: Disconnect without affecting other devices
- **WHEN** the user clicks the connection toggle to disconnect
- **AND** a current map is selected
- **THEN** the roadmap.md content SHALL be saved to the current map file
- **AND** the roadmap.md file SHALL NOT be modified with blank content
- **AND** the currentMap SHALL be set to null (unlinked from any map)
- **AND** the sidebar SHALL collapse
- **AND** the UI task list SHALL be cleared (showing empty state)

#### Scenario: Disconnected state shows no tasks
- **WHEN** the application is in disconnected state (isConnected = false)
- **AND** refreshTasks is called
- **THEN** the system SHALL NOT read from roadmap.md file
- **AND** the task list SHALL remain empty
- **AND** the achievement list SHALL remain empty

#### Scenario: Page refresh in disconnected state
- **WHEN** the user refreshes the page while disconnected
- **THEN** the application SHALL load with isConnected = false
- **AND** refreshTasks SHALL be called but skip reading the file
- **AND** the user SHALL see an empty task list

#### Scenario: Connect after disconnect
- **WHEN** the user clicks to connect
- **AND** the sidebar expands showing available maps
- **AND** the user selects a map
- **THEN** the map content SHALL be loaded into roadmap.md
- **AND** tasks SHALL be loaded from the file

## ADDED Requirements

### Requirement: Auto-select Last Edited Map on Connect
When the app connects, it SHALL automatically select and load the last edited map without requiring manual selection from the sidebar.

#### Scenario: Auto-select last edited map on connect
- **WHEN** the user clicks to connect (isConnected changes to true)
- **AND** a last edited map is stored in persistent storage
- **AND** the stored map exists in the available maps list
- **THEN** the system SHALL automatically select that map
- **AND** the map content SHALL be loaded into roadmap.md
- **AND** tasks SHALL be loaded from the file
- **AND** the sidebar SHALL remain expanded

#### Scenario: No last edited map stored
- **WHEN** the user clicks to connect
- **AND** no last edited map is stored in persistent storage
- **THEN** the system SHALL NOT auto-select any map
- **AND** the sidebar SHALL expand showing available maps
- **AND** the user SHALL manually select a map from the sidebar

#### Scenario: Last edited map no longer exists
- **WHEN** the user clicks to connect
- **AND** a last edited map is stored in persistent storage
- **AND** the stored map does NOT exist in the available maps list
- **THEN** the system SHALL NOT auto-select any map
- **AND** the sidebar SHALL expand showing available maps
- **AND** the user SHALL manually select a map from the sidebar

#### Scenario: Update last edited map on selection
- **WHEN** the user selects a map from the sidebar
- **THEN** the system SHALL store that map's filename as the last edited map
- **AND** the stored map SHALL be used for auto-select on next connect
