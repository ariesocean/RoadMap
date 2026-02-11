## 1. State Management Extension
- [ ] 1.1 Extend resultModalStore with prompt mode state
- [ ] 1.2 Add isPromptMode, promptInput, promptStreaming, promptError states
- [ ] 1.3 Implement prompt submission methods (setPromptInput, submitPrompt, clearPrompt)

## 2. API Layer
- [ ] 2.1 Create executeModalPrompt() function in opencodeAPI.ts
- [ ] 2.2 Add /api/execute-modal-prompt endpoint handling
- [ ] 2.3 Implement streaming response handling for modal prompts

## 3. UI Components
- [ ] 3.1 Create useModalPrompt hook for modal-specific OpenCode logic
- [ ] 3.2 Enhance ResultModal with prompt input area
- [ ] 3.3 Add conditional rendering for prompt vs display mode
- [ ] 3.4 Implement prompt submission handling with streaming
- [ ] 3.5 Add visual feedback for prompt mode (loading, streaming, error states)

## 4. Integration
- [ ] 4.1 Update App.tsx to pass prompt mode props to ResultModal
- [ ] 4.2 Ensure task creation flow opens modal in display mode
- [ ] 4.3 Test full workflow: create task → modal opens → submit follow-up → response streams

## 5. Validation
- [ ] 5.1 Verify streaming responses work in modal context
- [ ] 5.2 Test error handling for modal prompt failures
- [ ] 5.3 Validate modal can be closed after prompt completes
