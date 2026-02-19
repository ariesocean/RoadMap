# Change: Add session diff to modal event stream

## Why
Currently the modal event stream displays reasoning, text, tool-call, and tool-result events, but it doesn't show file change information (diff) that occurs after tool execution like Edit tool. OpenCode server already sends `session.diff` events containing file changes.

## What Changes
- Add handling for `session.diff` event type in event subscription
- Display file diff content in modal with appropriate styling
- Show file path, additions (+N), deletions (-N) for each changed file

## Impact
- Affected specs: `modal-prompt`
- Affected code:
  - `src/services/opencodeClient.ts` - add session.diff event mapping
  - `src/services/opencodeAPI.ts` - handle diff events in streaming
  - `src/store/resultModalStore.ts` - add new segment type for diff
  - `src/components/ResultModal.tsx` - render diff content in modal
