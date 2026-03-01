# Change: Auto-Save roadmap.md to currentMap after OpenCode Execution Completes

## Why
When using OpenCode to edit `roadmap.md` via navigate commands or modal prompts, the changes are only saved to `roadmap.md` but not automatically synced to the current map file. This creates a data inconsistency where the latest roadmap content is only in `roadmap.md` and not archived to the map file, risking data loss if the session is lost before a manual save or map switch.

This affects all OpenCode execution paths:
- Navigate commands from InputArea
- Custom modal prompts from ResultModal

## What Changes
- Add a callback registration mechanism to `taskStore` that triggers when any OpenCode execution completes
- Register `saveCurrentMap` as a callback in both `InputArea` and `ResultModal` components
- Automatically save roadmap changes to the current map file after any successful OpenCode execution
- This ensures that all tool execution results are immediately persisted to the map file, consistent with the immediate save mode for frontend operations

## Impact
- **Affected specs**:
  - `task-management` - task creation/updates via OpenCode now auto-save
  - `maps-management` - new auto-save requirement after OpenCode execution
  - `modal-prompt` - modal prompt execution now triggers auto-save

- **Affected code**:
  - `roadmap-manager/src/store/taskStore.ts` - add callback registration/unregistration and trigger mechanism
  - `roadmap-manager/src/components/InputArea.tsx` - register/unregister saveCurrentMap callback for navigate commands
  - `roadmap-manager/src/hooks/useModalPrompt.ts` - register/unregister saveCurrentMap callback for modal prompts
  - `roadmap-manager/src/services/fileService.ts` - no changes needed (already has saveMapFile)

- **Backward compatible**: existing behavior unchanged, only adds automatic sync
- **Zero changes to hooks or existing core logic**: pure additive functionality

## Benefits
- Prevents data loss when OpenCode edits roadmap.md and session is lost before manual save
- Consistent behavior: both frontend edits and all OpenCode edits sync to map file
- Minimal code change (~30 lines) with high impact on data safety
- Follows React hooks best practices by keeping hooks and store logic separate
- Covers all OpenCode execution paths (navigate + modal prompts)

## Technical Approach: Callback Registration Pattern

Instead of directly calling hooks from the store (which violates React rules), we use a callback registration pattern:

```
┌─────────────────────┐
│   taskStore.ts      │
│  (Zustand Store)    │
├─────────────────────┤
│ - callbacks[]       │
│ - register(cb)      │
│ - unregister(cb)    │
│ - trigger()         │
└─────────────────────┘
         ▲
         │ registered callbacks
         │
    ┌────┴─────────────────────────┐
    │                              │
┌───────────────┐          ┌───────────────────┐
│ InputArea.tsx │          │ useModalPrompt.ts │
│   (Component) │          │    (Hook)         │
└───────────────┘          └───────────────────┘
    ▲                              ▲
    │                              │
    └──────────────┬───────────────┘
                   │
         ┌─────────┴─────────┐
         │                   │
    ┌──────────┐      ┌──────────────┐
    │navigate  │      │modal-prompt  │
    │prompt    │      │execution     │
    └──────────┘      └──────────────┘
```

**Implementation Details**:
1. `taskStore` maintains an array of callbacks
2. Components register their callbacks via `useEffect`
3. When `submitPrompt` completes (done/success/timeout), all registered callbacks are invoked
4. Callbacks are automatically cleaned up on component unmount

This pattern ensures:
- Store doesn't know about hooks (decoupling)
- Components control their own lifecycle
- No memory leaks
- Multiple components can register independently
