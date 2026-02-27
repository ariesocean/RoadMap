# Change: Update Disconnect Behavior

## Why
When a device disconnects, it was clearing the roadmap.md file by writing `# Roadmap\n\n` to it. This caused a race condition where other connected devices might read the empty content and sync it to their currentMap, leading to data loss.

## What Changes
1. **Disconnect no longer writes to roadmap.md**
   - Remove: `writeRoadmapFile('# Roadmap\n\n')` when disconnecting
   - This prevents affecting other devices that might read the file

2. **Disconnect clears task list via refreshTasks**
   - Add: Call `refreshTasks()` after disconnect to clear tasks from UI
   - But refreshTasks now checks isConnected state first

3. **refreshTasks checks connection state**
   - When `isConnected === false`, refreshTasks returns early without reading file
   - This ensures disconnected state always shows empty tasks

4. **Disconnect does not modify file, only UI state**
   - File content remains unchanged
   - Only currentMap is set to null and sidebar is collapsed

5. **Auto-select last edited map on connect** (NEW)
   - When app connects, automatically select the last edited map
   - Store last edited map filename in persistent storage (localStorage)
   - Update stored map when user selects a different map from sidebar
   - On connect, load the stored map automatically

## Impact
- Affected specs: maps-management
- Affected code:
  - `src/components/App.tsx` - Removed writeRoadmapFile call
  - `src/store/taskStore.ts` - Added isConnected check in refreshTasks
  - `src/store/mapsStore.ts` - Add lastEditedMap storage and auto-select logic
