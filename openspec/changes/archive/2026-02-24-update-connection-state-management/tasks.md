## 1. Implementation

- [x] 1.1 Update taskStore.ts - Change isConnected default to false and add toggle action
- [x] 1.2 Update mapsStore.ts - Add loadingEnabled state to control map loading
- [x] 1.3 Update App.tsx - Add click handler for connection toggle, disable auto map loading on init
- [x] 1.4 Update Header.tsx - Make connection status clickable, show "disconnected" text
- [x] 1.5 Update useMaps.ts - Add conditional loading based on loadingEnabled state
- [x] 1.6 Update App.tsx - Add disconnected action: save roadmap to map file, clear roadmap.md, hide sidebar

## 2. Verification

- [x] 2.1 Verify app starts with "disconnected" status
- [x] 2.2 Verify clicking "disconnected" loads maps
- [x] 2.3 Verify clicking connected toggles to disconnected
- [x] 2.4 Verify no maps load on initial connection
- [x] 2.5 Verify disconnected saves roadmap to current map file
- [x] 2.6 Verify disconnected clears roadmap.md
- [x] 2.7 Verify disconnected hides maps sidebar
