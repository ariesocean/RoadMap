# Change: Add multi-maps management sidebar feature

## Why
Currently the app only supports managing a single `roadmap.md` file. Users need the ability to manage multiple roadmap maps, switch between them, and organize their work across different projects or contexts while maintaining `roadmap.md` as the single editing surface.

## What Changes
- Add a collapsible sidebar UI component displaying all available maps
- Auto-discover all `map-*.md` files from the roadmap directory
- Implement map switching: when selecting a different map, archive current `roadmap.md` content to the previous map's file and load the newly selected map's content into `roadmap.md`
- Add full management controls: create new maps, delete maps, and rename maps from the UI
- Filename-based display naming (e.g., `map-trading.md` shows as "trading" in sidebar)
- Empty `roadmap.md` created on initial load when no active map exists

## Impact
- Affected specs: New `maps-management` capability
- Affected code:
  - New `MapsSidebar` component
  - File service extensions for map file discovery and operations
  - Store for managing current map state
  - Potential integration with existing session management
