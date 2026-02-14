# Change: Refactor Modal Content Display

## Why
The current modal content display has significant limitations:
1. Content is stored as a flat string, losing structural information
2. All event types (text, tool-call, reasoning) are concatenated without differentiation
3. No rich UI rendering for tool calls, file reads, command outputs
4. No metadata display (model, agent, duration)
5. Limited user experience compared to OpenCode TUI

This prevents users from understanding what the AI is doing during task execution.

## What Changes

- **MODIFIED**: `resultModalStore.ts` - Change content storage from string to structured message array
- **MODIFIED**: `taskStore.ts` - Update SSE event handling to create structured message parts
- **MODIFIED**: `ResultModal.tsx` - Replace plain text rendering with component-based message list
- **ADDED**: New modal component library for rendering different part types
- **ADDED**: Tool call visualization components (bash, read, write, edit, etc.)
- **ADDED**: Reasoning/thinking display component
- **ADDED**: Message metadata display (model, agent, duration)

## Impact

- Affected specs: `modal-prompt`
- Affected code:
  - `roadmap-manager/src/store/resultModalStore.ts`
  - `roadmap-manager/src/store/taskStore.ts`
  - `roadmap-manager/src/components/ResultModal.tsx`
  - New: `roadmap-manager/src/components/modal/`
