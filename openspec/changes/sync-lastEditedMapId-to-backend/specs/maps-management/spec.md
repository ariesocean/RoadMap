## MODIFIED Requirements

### Requirement: Auto-select Last Edited Map on Connect
When the app connects, it SHALL automatically select and load the last edited map without requiring manual selection from the sidebar. The last edited map ID SHALL be stored in a backend config file (`roadmap-config.json`) for cross-device synchronization.

#### Scenario: Auto-select last edited map on connect
- **WHEN** the user clicks to connect (isConnected changes to true)
- **AND** a last edited map is stored in the backend config
- **AND** the stored map exists in the available maps list
- **THEN** the system SHALL automatically select that map
- **AND** the map content SHALL be loaded into roadmap.md
- **AND** tasks SHALL be loaded from the file
- **AND** the sidebar SHALL remain expanded

#### Scenario: No last edited map stored
- **WHEN** the user clicks to connect
- **AND** no last edited map is stored in the backend config
- **THEN** the system SHALL NOT auto-select any map
- **AND** the sidebar SHALL expand showing available maps
- **AND** the user SHALL manually select a map from the sidebar

#### Scenario: Last edited map no longer exists
- **WHEN** the user clicks to connect
- **AND** a last edited map is stored in the backend config
- **AND** the stored map does NOT exist in the available maps list
- **THEN** the system SHALL NOT auto-select any map
- **AND** the sidebar SHALL expand showing available maps
- **AND** the user SHALL manually select a map from the sidebar

#### Scenario: Update last edited map on selection
- **WHEN** the user selects a map from the sidebar
- **THEN** the system SHALL save that map's ID to the backend config
- **AND** the config file SHALL be updated immediately
- **AND** the stored map SHALL be available for auto-select on other devices

#### Scenario: Backend config file missing
- **WHEN** the backend config file does not exist
- **THEN** the system SHALL return default values (no last edited map)
- **AND** the system SHALL create the config file on first save

#### Scenario: Backend config API failure
- **WHEN** the API call to load or save the config fails
- **THEN** the error SHALL be logged
- **AND** the system SHALL continue with local state
- **AND** a toast notification MAY be shown to the user

#### Scenario: Backend is single source of truth
- **WHEN** the user disconnects from the app
- **THEN** the system SHALL NOT modify the backend config
- **AND** the lastEditedMapId SHALL remain unchanged in the backend config
- **AND** on next connect, the system SHALL read the lastEditedMapId from the backend

#### Scenario: Never write null to backend
- **WHEN** setLastEditedMapId is called with null
- **THEN** the system SHALL NOT write null to the backend config
- **AND** the existing lastEditedMapId in the backend config SHALL be preserved