# Tasks: Implement OpenCode TUI-style Modal Content Display

## 1. Data Layer & Types
- [ ] 1.1 Define Part type definitions (TextPart, ReasoningPart, ToolPart, etc.)
- [ ] 1.2 Update resultModalStore to use Part[] instead of string for content
- [ ] 1.3 Create utility functions for Part manipulation (append, update, find)
- [ ] 1.4 Write type tests to ensure Part structure integrity

## 2. Core Rendering Components
- [ ] 2.1 Create MessageList component as the main content container
- [ ] 2.2 Implement TextPartRenderer with Markdown support
- [ ] 2.3 Implement ReasoningPartRenderer with collapsible UI
- [ ] 2.4 Create ToolConfig mapping (icons, colors, labels for each tool type)
- [ ] 2.5 Implement ToolPartRenderer with status badges and borders
- [ ] 2.6 Implement ToolInputView for displaying tool parameters
- [ ] 2.7 Implement ToolOutputView for displaying tool results
- [ ] 2.8 Add Storybook stories or visual tests for all components

## 3. SSE Event Integration
- [ ] 3.1 Create event-to-Part adapter function
- [ ] 3.2 Map existing event types ('text', 'tool-call', 'tool-result') to Part types
- [ ] 3.3 Handle streaming Part updates (partial text, status changes)
- [ ] 3.4 Ensure backward compatibility with existing event stream

## 4. ResultModal Integration
- [ ] 4.1 Replace `<pre>` content block with MessageList component
- [ ] 4.2 Add scroll-to-bottom behavior for new Parts
- [ ] 4.3 Ensure dark mode support for all new components
- [ ] 4.4 Update loading states to work with Part-based display

## 5. Styling & Polish
- [ ] 5.1 Implement tool-specific color schemes (bash=yellow, read=blue, etc.)
- [ ] 5.2 Add smooth animations for expanding/collapsing reasoning blocks
- [ ] 5.3 Ensure responsive design within modal constraints
- [ ] 5.4 Verify accessibility (keyboard navigation, screen readers)

## 6. Testing & Validation
- [ ] 6.1 Test with real OpenCode server responses
- [ ] 6.2 Verify all tool types display correctly (bash, read, write, edit, grep, etc.)
- [ ] 6.3 Test long content scrolling behavior
- [ ] 6.4 Test dark mode toggle
- [ ] 6.5 Run existing test suite to ensure no regressions

## 7. Documentation
- [ ] 7.1 Add JSDoc comments to all new components
- [ ] 7.2 Update component README if exists
- [ ] 7.3 Document Part type system for future developers
