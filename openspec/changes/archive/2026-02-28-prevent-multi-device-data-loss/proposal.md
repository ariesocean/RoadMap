# Change: Prevent Multi-Device Data Loss on Map Switch

## Why
When multiple devices connect to the same map simultaneously, switching maps on one device can cause permanent data loss. The current implementation always archives `roadmap.md` to the previous map file without checking if another device has already modified `roadmap.md` for a different map switch. This results in stale content overwriting newer edits.

## What Changes
- Add a guard in `handleMapSelect` that checks if `lastEditedMapId` matches the current map before archiving
- If `lastEditedMapId` differs from the map being archived, skip the archive operation
- This prevents overwriting a map file with stale content when another device has already switched to a different map

## Impact
- Affected specs: `maps-management`
- Affected code:
  - `roadmap-manager/src/hooks/useMaps.ts` - modify `handleMapSelect` to add lastEditedMapId guard
  - `roadmap-manager/src/store/mapsStore.ts` - ensure `lastEditedMapId` is accessible in the store
- Backward compatible: single-device behavior unchanged

## Benefits
- Prevents permanent data loss in multi-device scenarios
- Leverages existing `roadmap-config.json` infrastructure
- Minimal code change with high impact on data safety
