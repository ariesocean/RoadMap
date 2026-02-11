## Context

The Roadmap Manager uses a modal (ResultModal) to display task creation results. Users want to continue refining tasks with AI assistance within this modal without returning to the main input area. This requires adding a prompt interface to the existing modal component while maintaining the current display-only behavior as the default.

## Goals / Non-Goals

### Goals:
- Add a prompt-only input interface to the ResultModal for follow-up AI interactions
- Maintain backward compatibility with existing display-only modal behavior
- Support streaming responses within the modal context
- Provide clear visual distinction between display and prompt modes

### Non-Goals:
- Replace the main InputArea component
- Add full navigation capabilities to the modal (only prompt, not navigate: prefix handling)
- Change the existing task creation flow
- Add multi-session support within a single modal instance

## Decisions

### 1. Modal Mode State
**Decision:** Extend resultModalStore with prompt-specific state fields
- `isPromptMode: boolean` - Whether modal is in interactive prompt mode
- `promptInput: string` - Current value in the prompt input field
- `promptStreaming: boolean` - Whether a prompt is being processed
- `promptError: string | null` - Error message if prompt fails

**Rationale:** This keeps modal-specific state together and avoids prop drilling through multiple components.

### 2. UI Layout
**Decision:** Add prompt input at the bottom of the modal, below the content area
- Content area: Scrollable, displays execution results and AI responses
- Input area: Text input with submit button, appears only in prompt mode
- Toggle: "Continue with AI" button to switch from display to prompt mode

**Rationale:** Maintains readability of results while providing easy access to prompt input. Similar to chat interface patterns.

### 3. API Endpoint
**Decision:** Create `/api/execute-modal-prompt` endpoint
- Separate from `/api/execute-navigate` to maintain clear separation
- Returns same SSE format for consistency in streaming handling
- Backend routes to the same OpenCode server processing

**Rationale:** Clear separation of concerns. The main navigate endpoint handles full task workflows, while modal prompt handles focused follow-up requests.

### 4. Component Architecture
**Decision:** Create `useModalPrompt` hook
- Encapsulates all modal-specific OpenCode logic
- Manages streaming state and response processing
- Reusable if modal prompt is needed elsewhere

**Rationale:** Keeps ResultModal component clean and separates concerns. Similar pattern to existing `useOpenCode` hook.

## Risks / Trade-offs

### Risk: Modal becomes too complex
**Mitigation:** Keep the prompt interface optional (display mode first). Users only see input when they choose to continue.

### Risk: Streaming conflicts with scrolling
**Mitigation:** Auto-scroll to bottom during streaming (already implemented in current code). Allow manual scrolling when streaming completes.

### Risk: State management complexity
**Mitigation:** Extend existing resultModalStore rather than creating a new store. Clear separation between display and prompt states.

## Migration Plan

1. Add new state fields to resultModalStore (backward compatible)
2. Create new API endpoint (no impact on existing endpoints)
3. Enhance ResultModal with conditional prompt UI
4. Test that existing display-only flow still works
5. Test new prompt flow end-to-end

## Open Questions

- Should the modal remember prompt history within a session?
- Should there be a character limit for modal prompts?
- Should the modal close automatically after a successful follow-up, or stay open?
