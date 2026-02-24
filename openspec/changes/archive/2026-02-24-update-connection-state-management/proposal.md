# Change: Update Connection State Management

## Why
Currently, the app does not have proper multi-device synchronization for map loading state. When multiple devices access the app simultaneously, there can be conflicts causing data loss. Users need explicit control over when maps are loaded to prevent unintended overwrites.

## What Changes

1. **Clickable Connection Toggle**
   - The connection status indicator in the header becomes clickable
   - Clicking toggles between "disconnected" and "connected" states

2. **Initial Load Behavior**
   - On first device connection, no maps are loaded by default
   - Header displays "disconnected" status (replacing "Offline")

3. **Manual Map Loading**
   - When user clicks "disconnected" → becomes "connected"
   - System discovers all `map-*.md` files (shown in sidebar)
   - **No map is selected by default** - shows blank roadmap page
   - User can manually select a map from the sidebar

4. **Multi-Device Conflict Prevention**
   - When another device connects and user clicks to become "connected"
   - Previous device's state becomes "disconnected"
   - New device loads the latest maps and roadmap.md

## Impact
- Affected capabilities: session, maps-management
- Affected code:
  - `src/components/App.tsx` - Connection toggle UI
  - `src/components/Header.tsx` - Connection status display
  - `src/store/taskStore.ts` - isConnected state management
  - `src/store/mapsStore.ts` - Map loading state
  - `src/hooks/useMaps.ts` - Conditional map loading logic
