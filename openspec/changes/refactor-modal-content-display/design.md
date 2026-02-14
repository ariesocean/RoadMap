## Context

The Roadmap Manager modal displays OpenCode task execution results but currently shows only plain text. The OpenCode TUI provides rich, structured output with:
- User/assistant message distinction
- Reasoning/thinking blocks (collapsible)
- Tool call visualizations with icons and colors
- Tool results with proper formatting
- Message metadata (model, agent, duration)

We need to bring similar richness to the modal while keeping it suitable for a web-based modal dialog.

## Goals / Non-Goals

### Goals
- Display complete execution information in structured format
- Show AI thinking/reasoning process (default expanded)
- Visual distinction between different tool types
- Display command outputs, file reads, edits clearly
- Show session metadata (model used, agent, timing)

### Non-Goals
- Full terminal emulation (not required for modal)
- Complex interactive tool panels
- Real-time terminal colors (use web-safe styling)
- Code diff display
- Output truncation (full output always shown)

## OpenCode Integration

### Headless API (Reference)
OpenCode serve exposes REST API that returns structured data directly:

```
POST /session/:id/message
Response: {
  info: Message,    // { id, role, sessionID, model, agent, time, finish, ... }
  parts: Part[]     // [{ id, type, text/tool/state/... }, ...]
}
```

### SDK Types (from @opencode-ai/sdk/v2)
```typescript
// Message types
interface AssistantMessage {
  id: string
  role: 'assistant'
  sessionID: string
  parentID: string
  agent: string
  mode: string
  model: { providerID: string, modelID: string }
  finish: 'stop' | 'tool-calls' | 'length' | 'unknown'
  time: { created: number, completed?: number }
  error?: { name: string, data: { message: string } }
}

// Part types
type Part = TextPart | ToolPart | ReasoningPart

interface TextPart {
  type: 'text'
  id: string
  text: string
  synthetic?: boolean
  ignored?: boolean
}

interface ToolPart {
  type: 'tool'
  id: string
  callID: string
  tool: string  // 'bash' | 'read' | 'write' | 'edit' | 'grep' | 'glob' | ...
  state: {
    status: 'running' | 'completed' | 'error'
    input?: Record<string, any>
    output?: string
    error?: string
    metadata?: Record<string, any>
    time?: { start: number, end?: number }
  }
}

interface ReasoningPart {
  type: 'reasoning'
  id: string
  text: string
}
```

### TUI Component Mapping (Reference)
OpenCode TUI uses PART_MAPPING pattern:
```typescript
const PART_MAPPING = {
  text: TextPart,
  tool: ToolPart,
  reasoning: ReasoningPart,
}
```

Tool-specific components based on `toolPart.tool`:
- `bash` → BashTool
- `read` → ReadTool
- `write` → WriteTool
- `edit` → EditTool
- `grep` → GrepTool
- `glob` → GlobTool
- `task` → TaskTool
- `apply_patch` → ApplyPatchTool
- `todowrite` → TodoWriteTool
- ... other tools → GenericTool

### Implementation Approach

#### Option A: Use Headless API Directly
- Call `/session/:id/message` after prompt completes
- Get full structured message + parts
- Render using mapped components
- **Pros**: Cleanest, most complete data
- **Cons**: Only gets final result, no streaming

#### Option B: Process SSE Events (Current with improvements)
- Stream events and build structure incrementally
- Map each event type to Part structure
- **Pros**: Can show progress in real-time
- **Cons**: Need to handle event→Part conversion

#### Recommended: Hybrid
- Stream for real-time feedback using SSE
- Use OpenCode's event format (same events TUI receives)
- Build Part structure during streaming
- End state matches what Headless API would return

## Data Model Design

### Current State
```typescript
content: string  // Plain text concatenation
```

### New State
```typescript
interface ModalContent {
  messages: ModalMessage[]
}

interface ModalMessage {
  id: string
  role: 'user' | 'assistant'
  parts: ModalPart[]
  metadata?: {
    model?: string
    agent?: string
    duration?: number
    timestamp?: number
  }
}

type ModalPart = 
  | { type: 'text'; content: string }
  | { type: 'reasoning'; content: string }
  | { type: 'tool-call'; tool: string; input: Record<string, any> }
  | { type: 'tool-result'; tool: string; output: string; status: 'success' | 'error' | 'running' }
  | { type: 'step'; title: string }
  | { type: 'completion'; message: string }
  | { type: 'error'; message: string }
```

## Component Architecture

```
ResultModal
├── ModalHeader
│   ├── Title + Icon
│   ├── Streaming Indicator
│   └── Close Button
├── MessageList
│   ├── UserMessage
│   │   └── TextContent (markdown)
│   └── AssistantMessage
│       ├── ReasoningBlock (collapsible)
│       │   └── Thinking content
│       ├── TextBlock
│       │   └── Markdown rendered content
│       ├── ToolCallBlock
│       │   ├── BashTool (command display)
│       │   ├── ReadTool (file content preview)
│       │   ├── WriteTool (file creation)
│       │   ├── EditTool (simple edit display)
│       │   ├── GrepTool (search results)
│       │   ├── GlobTool (file list)
│       │   └── GenericTool
│       └── ToolResultBlock
│           ├── OutputDisplay
│           └── ErrorDisplay
└── PromptInput (if in prompt mode)
```

## Event Processing

### SSE Event Mapping
| Event Type | ModalPart Type | Display |
|------------|---------------|---------|
| `start` | `text` | Server message |
| `text` | `text` | AI response content |
| `reasoning` | `reasoning` | Thinking process |
| `tool-call` | `tool-call` | Tool invocation |
| `tool-result` | `tool-result` | Tool output |
| `step-start` | `step` | Step indicator |
| `done` | `completion` | Final message |
| `error` | `error` | Error message |

## Tool Styling

| Tool | Icon | Color |
|------|------|-------|
| bash | ⚡ | yellow-500 |
| read | 📖 | blue-500 |
| write | ✍️ | green-500 |
| edit | ✏️ | orange-500 |
| grep | 🔍 | purple-500 |
| glob | 📁 | indigo-500 |
| task | 🤖 | cyan-500 |
| apply_patch | 🩹 | pink-500 |

## Migration Plan

1. **Phase 1**: Update `resultModalStore.ts` to support structured content (ModalMessage[])
2. **Phase 2**: Use OpenCode event format to build Part structure during SSE streaming
3. **Phase 3**: Create modal component library following PART_MAPPING pattern
4. **Phase 4**: Implement tool-specific components (BashTool, ReadTool, etc.)
5. **Phase 5**: Update `ResultModal.tsx` to use MessageList with structured parts

## Design Decisions

| Decision | Value |
|----------|-------|
| Reasoning blocks | Default expanded |
| Tool outputs | Full display, no truncation |
| Diff display | Not supported |
