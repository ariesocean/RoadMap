# Change: Modal Event Stream Display

## Why
Display streamed content in modal with distinct styling for reasoning, text, tool-result, and status events.

## What Changes
- Replace flat content string with structured segments array
- Render segments with type-specific styling (reasoning=white italic, text=bold white, tool-result=cyan, done=green, error=red)
- Show session/prompt/model info in modal header

## Impact
- Affected specs: modal-prompt
- Affected code:
  - `src/store/resultModalStore.ts` - Add ContentSegment types and appendSegment method
  - `src/components/ResultModal.tsx` - Render segments with styling
  - `src/store/taskStore.ts` - Use appendSegment instead of appendContent
