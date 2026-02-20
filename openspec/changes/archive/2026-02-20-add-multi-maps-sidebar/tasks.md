## 1. Implementation

### Phase 1: Core Infrastructure
- [x] 1.1 Add file discovery API endpoint `/api/discover-maps` to find all `map-*.md` files
- [x] 1.2 Add map file operations API endpoints: `/api/archive-map`, `/api/load-map`, `/api/create-map`, `/api/delete-map`, `/api/rename-map`
- [x] 1.3 Extend `fileService.ts` with map management functions: `discoverMaps()`, `archiveCurrentMap(mapName)`, `loadMap(mapName)`, `createMap(mapName)`, `deleteMap(mapName)`, `renameMap(oldName, newName)`
- [x] 1.4 Create `mapsStore.ts` Zustand store for managing maps state (available maps, current map, sidebar collapsed state)

### Phase 2: UI Components
- [x] 2.1 Create `MapsSidebar.tsx` component with collapsible functionality
- [x] 2.2 Implement map list display with filename-based naming
- [x] 2.3 Add map selection handler with auto-archive on switch
- [x] 2.4 Add "Create New Map" button and input dialog
- [x] 2.5 Add delete button for each map with confirmation
- [x] 2.6 Add rename functionality (inline edit or dialog)
- [x] 2.7 Add collapse/expand toggle button for sidebar

### Phase 3: Integration
- [x] 3.1 Integrate maps store with existing `taskStore.ts` to reload tasks when map changes
- [x] 3.2 Handle initial load: create empty `roadmap.md` when no active map
- [x] 3.3 Add visual indicator for currently selected map

### Phase 4: Validation & Testing
- [ ] 4.1 Test map switching preserves all data correctly
- [ ] 4.2 Test create/delete/rename operations handle edge cases (invalid names, duplicates)
- [ ] 4.3 Test sidebar collapse/expand persistence
- [ ] 4.4 Verify `roadmap.md` is always in sync with current map selection

## 2. Validation
- [ ] 2.1 Manual testing: Create 3 maps, switch between them, verify content persistence
- [ ] 2.2 Manual testing: Delete a map while it's the active map (should handle gracefully)
- [ ] 2.3 Manual testing: Rename map and verify sidebar updates immediately
- [ ] 2.4 Manual testing: Sidebar collapsed state persists across app restarts
