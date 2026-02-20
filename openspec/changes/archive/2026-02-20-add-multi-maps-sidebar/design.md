## Context
The current Roadmap Manager only supports a single `roadmap.md` file. Users need to manage multiple roadmaps for different projects/contexts while maintaining the existing workflow where `roadmap.md` is the single editing surface used by the LLM agent.

## Goals / Non-Goals

### Goals
- Enable users to manage multiple roadmap maps
- Maintain `roadmap.md` as the single editing file (LLM agent compatibility)
- Provide intuitive UI for map switching, creation, deletion, and renaming
- Auto-archive current work when switching maps to prevent data loss
- Persist sidebar state (collapsed/expanded) across sessions

### Non-Goals
- Changing the map file format (must remain compatible with existing parser)
- Modifying how the LLM agent interacts with `roadmap.md`
- Adding map merging or diff functionality
- Supporting subdirectories for map organization

## Decisions

### Decision: Auto-archive on map switch (no confirmation dialog)
**Why**: Streamlines the workflow - users want to switch maps quickly. The auto-archive ensures no data is lost without interrupting the flow.

**Alternatives considered**:
- Confirmation dialog: Adds friction to a common operation
- Manual save before switch: Too easy to forget, risking data loss

### Decision: Filename-based naming convention (`map-*.md`)
**Why**: Simple, predictable, and file-based. No additional metadata file needed. Easy to discover via glob pattern.

**Alternatives considered**:
- JSON index file: Adds complexity, potential sync issues
- Database storage: Overkill for simple file-based roadmap management

### Decision: Collapsible sidebar
**Why**: Maximizes screen real estate for the main task view when sidebar is not needed.

### Decision: Empty `roadmap.md` on initial load
**Why**: Simplest default behavior. User explicitly chooses which map to load first.

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Data loss during map switch | Auto-archive ensures content is always saved before loading new map |
| Race condition if switch happens during edit | Debounce save operations, lock during switch |
| File system permissions issues | Graceful error handling with user notification |
| Sidebar state desync | Persist state to localStorage, rehydrate on load |

## Migration Plan
No migration needed - this is a new feature. Existing `roadmap.md` remains unchanged.

## Open Questions
- Should we support importing/exporting maps?
- Should there be a "recent maps" quick-access section?
- Should map switching be undoable?
