# Change: Implement OpenCode TUI-style Modal Content Display

## Why
The current ResultModal uses a simple text-based display that concatenates all events into a single pre-formatted block. This approach has several limitations:

1. **Poor readability**: All content (thinking, tool calls, text responses) is mixed together without visual hierarchy
2. **No structured formatting**: Tool calls, file operations, and reasoning steps lack visual distinction
3. **Missing interactive elements**: No collapsible sections for thinking processes or tool outputs
4. **Inconsistent with OpenCode UX**: Users familiar with OpenCode TUI expect a similar experience

By implementing OpenCode TUI-style rendering, we can provide a professional, structured display that separates different content types with appropriate visual styling.

## What Changes

1. **New Data Structures**: Implement Part-based content model (TextPart, ReasoningPart, ToolPart)
2. **Part Renderer Components**: Create specialized React components for each content type:
   - `TextPartRenderer`: Markdown-formatted text content
   - `ReasoningPartRenderer`: Collapsible thinking blocks with gray styling
   - `ToolPartRenderer`: Tool calls with icons, status badges, and colored borders
   - `ToolInputView`/`ToolOutputView`: Structured input/output display
3. **Tool Configuration**: Define visual styles (icons, colors, labels) for each tool type
4. **MessageList Component**: Container for rendering ordered list of message parts
5. **SSE Event Adapter**: Convert existing event stream to Part-based structure
6. **Update ResultModal**: Replace simple `<pre>` block with structured MessageList

**BREAKING**: Changes the internal content storage format from string to Part array. Existing modal content display will be reformatted.

## Impact

- **Affected specs**: modal-prompt
- **Affected code**:
  - `roadmap-manager/src/components/ResultModal.tsx`
  - `roadmap-manager/src/store/resultModalStore.ts`
  - New files: Part renderers and related components
- **Dependencies**: May require additional packages for Markdown rendering (e.g., react-markdown)

## References

- Technical Reference: `/Users/SparkingAries/.config/opencode/documents/opencode_tui_headless_service_research.md`
- Screenshot Example: Shows OpenCode TUI with thinking blocks, edit blocks, and tool displays
