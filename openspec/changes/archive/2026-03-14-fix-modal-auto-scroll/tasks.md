## 1. Implementation
- [x] 1.1 Add sentinel ref to ResultModal component
- [x] 1.2 Add sentinel div at end of content area
- [x] 1.3 Modify useEffect to scroll content container to bottom during streaming and after completion

## 2. Internationalization (i18n)
- [x] 2.1 Add translation keys: completed, session, prompt, model, waitingForResponse, taskCompleted
- [x] 2.2 Update ResultModal to use t() for header labels (Session, Prompt, Model)
- [x] 2.3 Update ResultModal to use t() for status messages (Waiting for response..., Task completed)
- [x] 2.4 Update taskStore to use i18n for "Done!" message
- [x] 2.5 Update useModalPrompt to use i18n for "Done!" message

## 3. Cleanup
- [x] 3.1 Remove unused contentRef from ResultModal

## 4. Validation
- [ ] 4.1 Test auto-scroll during SSE streaming - verify content scrolls to bottom as new segments arrive
- [ ] 4.2 Test manual scroll - verify user can scroll up and stay there when not streaming
- [ ] 4.3 Test prompt mode streaming - verify auto-scroll works for follow-up prompts
- [ ] 4.4 Verify scrollbar styling still works correctly
- [ ] 4.5 Test language toggle - verify all ResultModal text updates correctly between EN/ZH
