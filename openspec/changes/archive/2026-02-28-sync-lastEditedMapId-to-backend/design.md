## Context

The roadmap-manager app uses a file-based architecture where map files (`map-*.md`) are stored in the project directory. Currently, user preferences like `lastEditedMapId` are stored in browser localStorage via Zustand's persist middleware. This means each device/browser has its own last edited map, causing inconsistency when users switch devices.

## Goals / Non-Goals

**Goals:**
- Store `lastEditedMapId` in a backend config file that syncs across devices
- Maintain the same user experience for auto-selecting the last edited map
- Keep the implementation simple and consistent with existing patterns

**Non-Goals:**
- Migrating other localStorage settings (sidebar collapse state, etc.)
- Adding complex user preference management
- Real-time sync notifications

## Decisions

### Config File Location and Format

**Decision:** Use `roadmap-config.json` in the project root directory.

**Rationale:**
- Consistent with existing file-based storage pattern (map-*.md files are in the same directory)
- Simple JSON format, easy to read/write
- File will be synced across devices via the same mechanism users already have (git, iCloud, etc.)

**Format:**
```json
{
  "lastEditedMapId": "trading"
}
```

### API Endpoints

**Decision:** Add two new endpoints following existing patterns:
- `GET /api/config` - Returns the config JSON
- `POST /api/config` - Updates the config JSON

**Rationale:**
- Follows existing API pattern in `vite.config.ts`
- Simple CRUD operations, no complex logic needed

### Store Architecture

**Decision:** Keep `lastEditedMapId` in `mapsStore` but remove from Zustand persist. Load/save via async actions.

**Rationale:**
- Minimal changes to existing store structure
- Async loading fits naturally with the existing connection flow
- No need for a separate config store

### Loading Strategy

**Decision:** Load `lastEditedMapId` when user connects (clicks to connect), not on app init.

**Rationale:**
- Matches existing behavior where maps are loaded on connect
- Avoids unnecessary API calls when app starts in disconnected state
- Consistent with the "Device Connection State" requirement in session spec

### Backend as Single Source of Truth

**Decision:** Never write null to backend. Disconnect does NOT clear lastEditedMapId.

**Rationale:**
- Prevents local state from overriding backend config
- On reconnect, always read from backend to get the latest value
- Fixes multi-device sync issue where local cache could override backend

**Implementation:**
- `setLastEditedMapId(null)` returns early without calling backend API
- Disconnect handler does NOT call `setLastEditedMapId(null)`
- `loadLastEditedMapId()` is called on every connect to fetch latest from backend

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Config file doesn't exist on first use | Return default values, create file on first save |
| API call failure during save | Log error, show toast notification, continue with local state |
| Race condition on multi-device edit | Accept last-write-wins semantics (same as map files) |

## Migration Plan

No data migration needed:
- Old localStorage data will be ignored
- New config file will be created on first map selection
- Users will need to select a map once after this change

## Open Questions

None - the design is straightforward and follows existing patterns.