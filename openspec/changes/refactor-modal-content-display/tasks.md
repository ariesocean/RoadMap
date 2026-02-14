## 1. Implementation

### Phase 0: Dependencies
- [ ] 0.1 Install react-markdown for markdown rendering

### Phase 1: Data Model Updates
- [ ] 1.1 Add new TypeScript types for ModalContent, ModalMessage, ModalPart
- [ ] 1.2 Update resultModalStore to support structured content
- [ ] 1.3 Add methods for adding parts to messages

### Phase 2: Event Processing
- [ ] 2.1 Create event processor utility for SSE events
- [ ] 2.2 Update taskStore submitPrompt to build structured messages
- [ ] 2.3 Handle all event types (text, reasoning, tool-call, etc.)

### Phase 3: Component Library
- [ ] 3.1 Create ModalMessage component (user/assistant)
- [ ] 3.2 Create TextBlock component with markdown support
- [ ] 3.3 Create ReasoningBlock component (collapsible)
- [ ] 3.4 Create ToolCallBlock component with tool-specific rendering
- [ ] 3.5 Create ToolResultBlock component
- [ ] 3.6 Create MessageList component

### Phase 4: Modal Integration
- [ ] 4.1 Update ResultModal to use MessageList
- [ ] 4.2 Add streaming animation support
- [ ] 4.3 Add metadata display (model, agent, duration)

## 2. Validation
- [ ] Verify all event types render correctly
- [ ] Test streaming behavior
- [ ] Test prompt continuation in modal
- [ ] Verify no regression in existing functionality
