## 1. Backend API Implementation
- [x] 1.1 Add `GET /api/config` endpoint in `vite.config.ts` to read `roadmap-config.json`
- [x] 1.2 Add `POST /api/config` endpoint in `vite.config.ts` to write `roadmap-config.json`
- [x] 1.3 Handle missing config file by returning default values

## 2. Frontend Service Layer
- [x] 2.1 Add `loadConfig()` function in `fileService.ts` to fetch config
- [x] 2.2 Add `saveConfig(config)` function in `fileService.ts` to save config

## 3. Store Updates
- [x] 3.1 Remove `lastEditedMapId` from Zustand persist `partialize` in `mapsStore.ts`
- [x] 3.2 Add `loadLastEditedMapId()` async action to fetch from backend
- [x] 3.3 Update `setLastEditedMapId()` to persist to backend via API

## 4. Component Integration
- [x] 4.1 Update `App.tsx` to call `loadLastEditedMapId()` on connect
- [x] 4.2 Ensure auto-select logic waits for config to load

## 5. Backend as Single Source of Truth (Fix)
- [x] 5.1 Never write null to backend - setLastEditedMapId(null) returns early
- [x] 5.2 loadLastEditedMapId() returns the value from backend
- [x] 5.3 Disconnect does NOT clear lastEditedMapId - always read from backend

## 6. Multi-Device Sync Bug Fixes
- [x] 6.1 Remove `currentMap` from Zustand persist to prevent stale localStorage override
- [x] 6.2 Add `lastEditedMapIdLoaded` flag to prevent race condition
- [x] 6.3 Add `resetLastEditedMapIdLoaded()` to reset flag on disconnect
- [x] 6.4 Update auto-select logic to wait for backend config load

## 7. Testing
- [ ] 7.1 Test with fresh install (no existing config)
- [ ] 7.2 Test config persistence across page reloads
- [ ] 7.3 Test multi-device scenario (manual file sync verification)