# Change: Add Immediate Save Mode for Map Files

## Why
When session is lost (e.g., after restarting Vite), the roadmap.md content may have updates that were not archived to the corresponding map file. Users want an "immediate save mode" - whenever roadmap.md is modified, it should immediately be saved to the currentMap's map file to prevent data loss.

## What Changes
- Add immediate save mode that syncs roadmap.md changes to the current map file in real-time
- Modify file service to automatically save to currentMap after each roadmap.md write operation
- Add configuration to enable/disable immediate save mode (enabled by default)
- Add error handling for map file write failures

## Impact
- Affected specs: maps-management
- Affected code: `src/services/fileService.ts`, `src/store/taskStore.ts`, `src/store/mapsStore.ts`
