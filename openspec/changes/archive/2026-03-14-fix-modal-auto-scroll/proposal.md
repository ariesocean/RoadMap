# Change: Fix Modal Auto-Scroll During Streaming and Add i18n Support

## Why
1. When SSE streaming updates are received in the ResultModal, the content area does not automatically scroll to show the latest content. The current implementation uses `scrollIntoView` which only brings the element into the visible area, not to the bottom of the content container. This creates a poor user experience during streaming as users cannot see new content being added in real-time.

2. The ResultModal displays hardcoded English text (Session, Prompt, Model, Done!, etc.) which should be translatable based on the user's language setting.

## What Changes
- Modify ResultModal.tsx to properly scroll to bottom during streaming
- Add a sentinel element at the end of content area for reliable bottom detection
- Ensure scrolling happens during streaming and after completion (for "Done!" message)
- Add i18n support for ResultModal labels and messages
- Update taskStore and useModalPrompt to use i18n for "Done!" message

## Impact
- Affected specs: `modal-prompt`, `i18n`
- Affected code: 
  - `roadmap-manager/src/components/ResultModal.tsx`
  - `roadmap-manager/src/store/taskStore.ts`
  - `roadmap-manager/src/hooks/useModalPrompt.ts`
  - `roadmap-manager/src/utils/translations.ts`
