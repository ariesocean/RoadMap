## 1. State Management Extension
- [x] 1.1 Extend resultModalStore with prompt mode state
- [x] 1.2 Add isPromptMode, promptInput, promptStreaming, promptError states
- [x] 1.3 Implement prompt submission methods (setPromptInput, submitPrompt, clearPrompt)

## 2. API Layer
- [x] 2.1 Create executeModalPrompt() function in opencodeAPI.ts
- [x] 2.2 Add /api/execute-modal-prompt endpoint handling
- [x] 2.3 Implement streaming response handling for modal prompts

## 3. UI Components
- [x] 3.1 Create useModalPrompt hook for modal-specific OpenCode logic
- [x] 3.2 Enhance ResultModal with prompt input area
- [x] 3.3 Add conditional rendering for prompt vs display mode
- [x] 3.4 Implement prompt submission handling with streaming
- [x] 3.5 Add visual feedback for prompt mode (loading, streaming, error states)

## 4. Integration
- [x] 4.1 Update App.tsx to pass prompt mode props to ResultModal
- [x] 4.2 Ensure task creation flow opens modal in display mode
- [x] 4.3 Test full workflow: create task → modal opens → submit follow-up → response streams

## 5. Validation
- [x] 5.1 Verify streaming responses work in modal context
- [x] 5.2 Test error handling for modal prompt failures
- [x] 5.3 Validate modal can be closed after prompt completes

## 6. Bug Fix: Scrollbar Styling
- [x] 6.1 Fix scrollbar color to match background theme (add scrollbar-thin class)
- [x] 6.2 Remove horizontal scrollbar with auto-wrap for long output (add break-all)
