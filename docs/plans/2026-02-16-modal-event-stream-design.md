# Modal Event Stream Display Design

## Overview

Redesign the ResultModal to display streamed content following the event stream pattern from the OpenCode SDK, with distinct styling for different content types.

## Data Structure

```typescript
type SegmentType = 'reasoning' | 'text' | 'tool-call' | 'tool-result' | 'done' | 'error' | 'timeout';

interface ContentSegment {
  id: string;
  type: SegmentType;
  content: string;
  timestamp: number;
  metadata?: {
    tool?: string;
  };
}

interface ResultModalState {
  isOpen: boolean;
  title: string;
  segments: ContentSegment[];
  onCloseCallback: (() => void) | null;
  isStreaming: boolean;

  isPromptMode: boolean;
  promptInput: string;
  promptStreaming: boolean;
  promptError: string | null;

  openModal: (title: string, sessionInfo?: SessionInfo, modelInfo?: ModelInfo, onClose?: () => void) => void;
  closeModal: () => void;
  appendSegment: (segment: ContentSegment) => void;
  clearSegments: () => void;
  setStreaming: (streaming: boolean) => void;
  setPromptMode: (enabled: boolean) => void;
  setPromptInput: (input: string) => void;
  setPromptStreaming: (streaming: boolean) => void;
  setPromptError: (error: string | null) => void;
  clearPrompt: () => void;
}

interface SessionInfo {
  title: string;
  prompt: string;
}

interface ModelInfo {
  providerID: string;
  modelID: string;
}
```

## Display Format

### Header Section (shown at top when modal opens)

```
Session: {session title}
Prompt: {user input prompt}
Model: {providerID/modelID} (only if model is selected)
```

### Content Sections (in order of arrival)

| Type | Display Format | Style |
|------|---------------|-------|
| reasoning | `Thinking: {content}` | white (chalk.white) |
| text | `{content}` | bold white (chalk.bold.white) |
| tool-result | `tool {tool_name}` | cyan (chalk.cyan) |
| done | `✅ Completed!` or custom message | green |
| error | `❌ Error: {message}` | red |
| timeout | `⏱️ Timeout` | yellow |

### Hidden Types (not displayed)

- tool-call
- step-start / step-end
- message-complete

## Component Architecture

### resultModalStore.ts

- Replace `content: string` with `segments: ContentSegment[]`
- Add `appendSegment(segment)` method
- Add `clearSegments()` method
- `openModal` accepts optional sessionInfo and modelInfo for header display

### ResultModal.tsx

- Remove `<pre>` monospace block
- Map over `segments` array
- Render each segment with type-specific styling
- Maintain auto-scroll to bottom on new segment
- Show header with session/prompt/model info when available

### taskStore.ts

- Replace `appendContent()` calls with `appendSegment()` calls
- Create proper ContentSegment objects with type from event
- Pass sessionInfo and modelInfo when opening modal

## Styling

Using chalk-style colors for reference:

```css
.reasoning {
  color: #ffffff;
  font-style: italic;
}

.text {
  color: #ffffff;
  font-weight: bold;
}

.tool {
  color: #00bcd4;
}

.done {
  color: #4caf50;
}

.error {
  color: #f44336;
}

.timeout {
  color: #ff9800;
}
```

## Implementation Notes

1. **Backward compatibility**: Keep `isPromptMode`, `promptInput` fields unchanged
2. **Segment limits**: Maximum 500 segments, remove oldest when exceeded
3. **Empty state**: Show "Waiting for response..." when segments array is empty during streaming
4. **Auto-scroll**: Maintain current scroll-to-bottom behavior

## Error Handling

- Invalid event types: Skip (don't create segment)
- Stream interruption: Keep partial segments
- Store overflow: Trim oldest segments
