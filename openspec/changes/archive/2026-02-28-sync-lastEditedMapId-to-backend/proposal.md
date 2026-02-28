# Change: Sync lastEditedMapId to Backend

## Why
Currently `lastEditedMapId` is stored in browser localStorage, meaning each device has its own last edited map. Users want all devices to share the same last edited map for a consistent experience when switching between devices.

## What Changes
- Move `lastEditedMapId` from localStorage to a backend-stored JSON config file (`roadmap-config.json`)
- Create new API endpoints to read/write the config file
- Update frontend to load/save `lastEditedMapId` via API instead of Zustand persist
- **Never write null to backend** - backend is the single source of truth
- Disconnect does NOT clear lastEditedMapId - always read from backend on connect

## Impact
- Affected specs: `maps-management`
- Affected code:
  - `vite.config.ts` - new `/api/config` endpoints
  - `src/store/mapsStore.ts` - remove `lastEditedMapId` from persist, add async load/save, never save null
  - `src/services/fileService.ts` - new config service functions
  - `src/components/App.tsx` - update auto-select logic on connect

## Benefits
- All devices see the same last edited map after file sync
- User experience continuity across devices
- Backend is single source of truth - no local state overriding
- Foundation for future cross-device settings