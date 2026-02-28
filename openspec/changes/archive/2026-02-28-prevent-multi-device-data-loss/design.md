## Context
Multi-device editing of the same map file creates a race condition during map switching. When device A and device B both connect to `map-foo`, edit it, then switch to different maps, the second device's archive operation uses stale `roadmap.md` content and overwrites the first device's work.

## Goals / Non-Goals
- Goals:
  - Prevent data loss when multiple devices switch maps concurrently
  - Preserve the most recent version of each map file
  - Maintain single-device behavior unchanged
- Non-Goals:
  - Real-time collaboration (not a CRDT or operational transform system)
  - Conflict resolution UI (this is a preventive measure, not a recovery tool)
  - Lock-based concurrency control (too heavy for this use case)

## Decisions
### Decision: Use lastEditedMapId as a version guard
- What: Check if `lastEditedMapId === currentMap.id` before archiving
- Why: `lastEditedMapId` is stored in `roadmap-config.json` and synced across devices. If it differs from the current map, another device has already switched `roadmap.md` to a different map, making the local `roadmap.md` stale for the current map.

### Decision: Skip archive silently (with warning toast)
- What: Do not archive when mismatch detected, show warning toast
- Why: Archiving would corrupt the map file with stale data. User should be aware their edits may not be saved to the previous map.

### Alternatives Considered
1. **Optimistic locking with timestamps**: Each map file gets a timestamp, compare before write
   - Rejected: Requires more infrastructure, doesn't solve the core problem that `roadmap.md` content is already stale

2. **Lock file during editing**: Create `.map-foo.lock` while connected, check before switching
   - Rejected: Locks don't work well with disconnected devices, adds complexity

3. **Three-way merge on conflict**: Detect conflict, offer merge UI
   - Rejected: Over-engineered for this use case; preventive approach is simpler

## Risks / Trade-offs
- Risk: User may lose edits if they switch maps quickly on the same device before sync completes
  - Mitigation: Add debouncing or disable map switch during sync (future enhancement)
- Risk: False positives if `lastEditedMapId` is stale due to network issues
  - Mitigation: Acceptable trade-off; better to skip archive than corrupt data
- Trade-off: Silent skip may confuse users
  - Mitigation: Add clear toast notification explaining what happened

## Migration Plan
- No migration needed: `lastEditedMapId` infrastructure already exists
- Backward compatible: single-device users see no change

## Open Questions
- Should we offer a "force archive" option for advanced users? (deferred)
- Should we add a visual indicator when archive is skipped? (to be implemented via toast)
