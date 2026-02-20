# maps-management Specification

## ADDED Requirements

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
