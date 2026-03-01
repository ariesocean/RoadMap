## 1. Implementation - taskStore Callback System
- [x] 1.1 Add `onSubmitPromptCompleteCallbacks: (() => void)[]` to taskStore state
- [x] 1.2 Add `registerOnSubmitPromptComplete` and `unregisterOnSubmitPromptComplete` methods
- [x] 1.3 Add `triggerOnSubmitPromptComplete` helper function to invoke all callbacks
- [x] 1.4 Modify `submitPrompt` to call `triggerOnSubmitPromptComplete()` in `done`, `success`, and `timeout` events
- [x] 1.5 Ensure callbacks are NOT triggered on `error` or `failed` events

## 2. Implementation - InputArea Integration
- [x] 2.1 Import `useMaps` in `InputArea.tsx`
- [x] 2.2 Add `useEffect` to register `saveCurrentMap` callback on mount
- [x] 2.3 Add cleanup function to unregister callback on unmount
- [x] 2.4 Add null check: only call `saveCurrentMap` if `currentMap` exists

## 3. Implementation - useModalPrompt Integration
- [x] 3.1 Import `useMaps` in `useModalPrompt.ts`
- [x] 3.2 Add `useEffect` to register `saveCurrentMap` callback on mount
- [x] 3.3 Add cleanup function to unregister callback on unmount
- [x] 3.4 Ensure `saveCurrentMap` is called after `refreshTasks()` in the `onComplete` callback

## 4. Testing
- [ ] 4.1 Manual test: Navigate command saves to roadmap.md AND map file
- [ ] 4.2 Manual test: Modal prompt saves to roadmap.md AND map file
- [ ] 4.3 Manual test: Verify console logs show successful save
- [ ] 4.4 Manual test: Component unmount doesn't cause memory leaks
- [ ] 4.5 Manual test: Error scenario does NOT trigger save
- [ ] 4.6 Manual test: No currentMap selected does NOT trigger save

## 5. Validation
- [x] 5.1 Run `openspec validate add-submit-prompt-auto-save --strict`
- [x] 5.2 Review implementation matches spec deltas
- [x] 5.3 Verify backward compatibility (existing behavior unchanged)
