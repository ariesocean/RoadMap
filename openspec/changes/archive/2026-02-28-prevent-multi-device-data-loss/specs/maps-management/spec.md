## MODIFIED Requirements

### Requirement: Map Switching with Auto-Archive
The system SHALL automatically archive the current `roadmap.md` content to the previous map's file when switching to a different map, but only if the current map is still the last edited map.

#### Scenario: Switch maps with auto-archive (normal case)
- **WHEN** the user selects a different map from the sidebar
- **AND** the `lastEditedMapId` matches the current map's id
- **THEN** the current `roadmap.md` content SHALL be saved to the current map's file
- **AND** the newly selected map's content SHALL be loaded into `roadmap.md`
- **AND** the task store SHALL reload tasks from the updated `roadmap.md`
- **AND** a toast notification SHALL confirm the switch
- **AND** the `lastEditedMapId` SHALL be updated to the new map's id

#### Scenario: Skip archive when lastEditedMapId mismatch (multi-device conflict)
- **WHEN** the user selects a different map from the sidebar
- **AND** the `lastEditedMapId` from backend does NOT match the current map's id
- **THEN** the archive operation SHALL be skipped (do NOT save roadmap.md to current map file)
- **AND** the newly selected map's content SHALL still be loaded into `roadmap.md`
- **AND** a warning toast notification SHALL inform the user that the previous map was not saved
- **AND** the `lastEditedMapId` SHALL be updated to the new map's id

#### Scenario: No archive needed for first load
- **WHEN** switching maps for the first time (no previous map was loaded)
- **THEN** only the load operation SHALL be performed
- **AND** no archive file SHALL be created
