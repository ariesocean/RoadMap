# maps-management Specification

## Purpose
TBD - created by archiving change add-multi-maps-sidebar. Update Purpose after archive.
## Requirements
### Requirement: Map File Discovery
The system SHALL automatically discover all map files matching the `map-*.md` pattern in the roadmap directory.

#### Scenario: Discover map files on load
- **WHEN** the application initializes
- **THEN** the system SHALL scan the roadmap directory for files matching `map-*.md`
- **AND** the discovered maps SHALL be stored in the maps store
- **AND** each map SHALL have its display name extracted from the filename (e.g., `map-trading.md` → "trading")

#### Scenario: Handle no map files
- **WHEN** no `map-*.md` files exist in the directory
- **THEN** the maps list SHALL be empty
- **AND** the sidebar SHALL display an empty state with option to create new map

### Requirement: Map Switching with Auto-Archive
The system SHALL automatically archive the current `roadmap.md` content to the previous map's file when switching to a different map.

#### Scenario: Switch maps with auto-archive
- **WHEN** the user selects a different map from the sidebar
- **THEN** the current `roadmap.md` content SHALL be saved to the previous map's file (e.g., `map-previous.md`)
- **AND** the newly selected map's content SHALL be loaded into `roadmap.md`
- **AND** the task store SHALL reload tasks from the updated `roadmap.md`
- **AND** a toast notification SHALL confirm the switch

#### Scenario: No archive needed for first load
- **WHEN** switching maps for the first time (no previous map was loaded)
- **THEN** only the load operation SHALL be performed
- **AND** no archive file SHALL be created

### Requirement: Sidebar UI Display
The system SHALL provide a collapsible sidebar displaying all available maps with full management controls.

#### Scenario: Display map list
- **WHEN** the sidebar is expanded
- **THEN** all discovered maps SHALL be listed with their display names
- **AND** the currently active map SHALL be visually highlighted
- **AND** each map item SHALL show management controls (delete, rename) on hover

#### Scenario: Sidebar collapse/expand
- **WHEN** the user clicks the collapse toggle
- **THEN** the sidebar SHALL collapse to show only icons
- **AND** the collapsed state SHALL persist across app restarts
- **AND** clicking the toggle again SHALL expand the sidebar

#### Scenario: Empty state display
- **WHEN** no maps exist
- **THEN** the sidebar SHALL display an empty state message
- **AND** a prominent "Create New Map" button SHALL be shown

### Requirement: Create New Map
The system SHALL provide the ability to create new maps from the UI.

#### Scenario: Create map via UI
- **WHEN** the user clicks "Create New Map"
- **THEN** an input dialog SHALL prompt for the map name
- **AND** a new file `map-{name}.md` SHALL be created with empty content
- **AND** the new map SHALL be added to the maps list
- **AND** the sidebar SHALL refresh to show the new map

#### Scenario: Validate map name
- **WHEN** creating a new map with an invalid name
- **THEN** names containing special characters (`\/:*?"<>|`) SHALL be rejected
- **AND** duplicate names SHALL be rejected with an error message
- **AND** empty names SHALL be rejected

### Requirement: Delete Map
The system SHALL provide the ability to delete maps from the UI with confirmation.

#### Scenario: Delete map via UI
- **WHEN** the user clicks the delete button on a map
- **THEN** a confirmation dialog SHALL appear
- **AND** upon confirmation, the `map-{name}.md` file SHALL be deleted
- **AND** the map SHALL be removed from the maps list
- **AND** if the deleted map was active, `roadmap.md` SHALL be set to empty content

#### Scenario: Prevent deleting last map
- **WHEN** attempting to delete the only remaining map
- **THEN** the operation SHALL be blocked
- **AND** a warning message SHALL be shown

### Requirement: Rename Map
The system SHALL provide the ability to rename maps from the UI.

#### Scenario: Rename map via UI
- **WHEN** the user clicks the rename button on a map
- **THEN** an inline edit input or dialog SHALL appear
- **AND** upon confirmation, the file SHALL be renamed from `map-{old}.md` to `map-{new}.md`
- **AND** the maps list SHALL refresh with the updated name
- **AND** if the renamed map was active, the current map reference SHALL update

#### Scenario: Validate rename
- **WHEN** renaming to an invalid name
- **THEN** names containing special characters SHALL be rejected
- **AND** duplicate names SHALL be rejected
- **AND** the original name SHALL be preserved on error

### Requirement: Initial Load Behavior
The system SHALL create an empty `roadmap.md` file when loading with no active map.

#### Scenario: Create empty roadmap on first load
- **WHEN** the application loads and no `roadmap.md` exists
- **THEN** an empty `roadmap.md` file SHALL be created
- **AND** the user SHALL start with a blank task list
- **AND** maps SHALL still be available in the sidebar

### Requirement: Filename-Based Display Naming
The system SHALL extract display names from map filenames by removing the `map-` prefix and `.md` extension.

#### Scenario: Extract display name
- **WHEN** a map file `map-trading.md` is discovered
- **THEN** the display name SHALL be "trading"
- **AND** the sidebar SHALL show "trading" to the user

#### Scenario: Handle non-standard names
- **WHEN** a map file has a name like `map-my-project-2026.md`
- **THEN** the display name SHALL be "my-project-2026"
- **AND** hyphens and numbers SHALL be preserved in the display name

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

