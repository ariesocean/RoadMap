# Modal Event Stream Display Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign ResultModal to display streamed content with distinct styling for reasoning, text, and tool events following the OpenCode SDK pattern.

**Architecture:** Replace flat content string with structured segments array in resultModalStore. Update ResultModal to render segments with type-specific styling. Update taskStore to create segments during streaming.

**Tech Stack:** React, Zustand, TypeScript

---

## Task 1: Update resultModalStore.ts

**Files:**
- Modify: `roadmap-manager/src/store/resultModalStore.ts`

**Step 1: Add types**

Add after the existing interfaces:

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

interface SessionInfo {
  title: string;
  prompt: string;
}

interface ModelInfo {
  providerID: string;
  modelID: string;
}
```

**Step 2: Update ResultModalState**

Replace `content: string` with `segments: ContentSegment[]`, add `sessionInfo` and `modelInfo`:

```typescript
interface ResultModalState {
  isOpen: boolean;
  title: string;
  segments: ContentSegment[];
  sessionInfo: SessionInfo | null;
  modelInfo: ModelInfo | null;
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
```

**Step 3: Update store implementation**

Replace the initial state and methods:

```typescript
export const useResultModalStore = create<ResultModalState>((set) => ({
  isOpen: false,
  title: '',
  segments: [],
  sessionInfo: null,
  modelInfo: null,
  onCloseCallback: null,
  isStreaming: false,

  isPromptMode: false,
  promptInput: '',
  promptStreaming: false,
  promptError: null,

  openModal: (title: string, sessionInfo?: SessionInfo, modelInfo?: ModelInfo, onClose?: () => void) => {
    set({
      isOpen: true,
      title,
      segments: [],
      sessionInfo: sessionInfo || null,
      modelInfo: modelInfo || null,
      onCloseCallback: onClose || null,
      isStreaming: false,
      isPromptMode: false,
      promptInput: '',
      promptStreaming: false,
      promptError: null,
    });
  },

  closeModal: () => {
    const callback = get().onCloseCallback;
    set({
      isOpen: false,
      title: '',
      segments: [],
      sessionInfo: null,
      modelInfo: null,
      onCloseCallback: null,
      isStreaming: false,
      isPromptMode: false,
      promptInput: '',
      promptStreaming: false,
      promptError: null,
    });
    if (callback) callback();
  },

  appendSegment: (segment: ContentSegment) => {
    set((state) => {
      const newSegments = [...state.segments, segment];
      if (newSegments.length > 500) {
        newSegments.shift();
      }
      return { segments: newSegments };
    });
  },

  clearSegments: () => {
    set({ segments: [] });
  },

  setStreaming: (streaming: boolean) => {
    set({ isStreaming: streaming });
  },

  setPromptMode: (enabled: boolean) => {
    set({ isPromptMode: enabled, promptError: null });
  },

  setPromptInput: (input: string) => {
    set({ promptInput: input, promptError: null });
  },

  setPromptStreaming: (streaming: boolean) => {
    set({ promptStreaming: streaming });
  },

  setPromptError: (error: string | null) => {
    set({ promptError: error });
  },

  clearPrompt: () => {
    set({ promptInput: '', promptStreaming: false, promptError: null });
  },
}));
```

**Step 4: Commit**

```bash
git add roadmap-manager/src/store/resultModalStore.ts
git commit -m "feat: add structured segments to resultModalStore"
```

---

## Task 2: Update ResultModal.tsx

**Files:**
- Modify: `roadmap-manager/src/components/ResultModal.tsx`

**Step 1: Update imports and store usage**

Replace store fields:

```typescript
const {
  isOpen,
  title,
  segments,
  sessionInfo,
  modelInfo,
  closeModal,
  isStreaming,
  promptStreaming,
} = useResultModalStore();
```

**Step 2: Add segment rendering**

Replace the `<pre>` content area with segment mapping:

```tsx
<div className="px-4 py-3">
  <div className="text-sm text-gray-700 dark:text-gray-300 font-mono bg-gray-50 dark:bg-gray-900 p-3 rounded max-h-[50vh] overflow-auto">
    {sessionInfo && (
      <div className="text-gray-500 dark:text-gray-400 mb-2 border-b border-gray-200 dark:border-gray-700 pb-2">
        <div>Session: {sessionInfo.title}</div>
        <div>Prompt: {sessionInfo.prompt}</div>
        {modelInfo && (
          <div>Model: {modelInfo.providerID}/{modelInfo.modelID}</div>
        )}
      </div>
    )}
    {segments.length === 0 && isStreaming && (
      <span className="text-gray-500">Waiting for response...</span>
    )}
    {segments.length === 0 && !isStreaming && (
      <span className="text-gray-500">Task completed</span>
    )}
    {segments.map((segment) => {
      switch (segment.type) {
        case 'reasoning':
          return (
            <div key={segment.id} className="text-white italic mb-1">
              Thinking: {segment.content}
            </div>
          );
        case 'text':
          return (
            <div key={segment.id} className="text-white font-bold mb-1">
              {segment.content}
            </div>
          );
        case 'tool-result':
          return (
            <div key={segment.id} className="text-cyan-500 mb-1">
              tool {segment.metadata?.tool || 'unknown'}
            </div>
          );
        case 'done':
          return (
            <div key={segment.id} className="text-green-500 mb-1">
              {segment.content || '✅ Completed!'}
            </div>
          );
        case 'error':
          return (
            <div key={segment.id} className="text-red-500 mb-1">
              ❌ {segment.content}
            </div>
          );
        case 'timeout':
          return (
            <div key={segment.id} className="text-yellow-500 mb-1">
              ⏱️ {segment.content || 'Timeout'}
            </div>
          );
        default:
          return null;
      }
    })}
  </div>
</div>
```

**Step 3: Update useEffect for scrolling**

```typescript
useEffect(() => {
  if (isOpen && preRef.current) {
    preRef.current.scrollTop = preRef.current.scrollHeight;
  }
}, [segments, isOpen, promptStreaming]);
```

**Step 4: Add ref to container**

Add `ref={preRef}` to the content div:

```tsx
<div
  ref={preRef}
  className="text-sm text-gray-700 dark:text-gray-300 font-mono bg-gray-50 dark:bg-gray-900 p-3 rounded max-h-[50vh] overflow-auto"
>
```

**Step 5: Commit**

```bash
git add roadmap-manager/src/components/ResultModal.tsx
git commit -m "feat: render segments with type-specific styling in ResultModal"
```

---

## Task 3: Update taskStore.ts

**Files:**
- Modify: `roadmap-manager/src/store/taskStore.ts`

**Step 1: Update imports**

```typescript
import { useResultModalStore, type ContentSegment } from './resultModalStore';
```

**Step 2: Update submitPrompt method**

Replace `appendContent` calls with `appendSegment` calls. Get session and model info:

```typescript
const { openModal, appendSegment, setStreaming } = useResultModalStore.getState();
const { selectedModel } = useModelStore.getState();

// Get session info
let sessionInfo = null;
if (currentSession) {
  sessionInfo = {
    title: currentSession.title,
    prompt: prompt,
  };
}

// Get model info
let modelInfo = null;
if (selectedModel) {
  modelInfo = {
    providerID: selectedModel.providerID,
    modelID: selectedModel.modelID,
  };
}

openModal('Processing', sessionInfo, modelInfo);
```

**Step 3: Replace event handling**

In the while loop, replace content appending with segment creation:

```typescript
// Helper to create segment
const createSegment = (type: ContentSegment['type'], content: string, metadata?: ContentSegment['metadata']): ContentSegment => ({
  id: `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  type,
  content,
  timestamp: Date.now(),
  metadata,
});

// Replace all appendContent calls:

// For start/started events:
appendSegment(createSegment('text', data.message || ''));

// For text events:
appendSegment(createSegment('text', data.content || ''));

// For tool-call events (skip - don't display):
// appendSegment(createSegment('tool-call', data.name || 'unknown'));

// For tool-result events:
appendSegment(createSegment('tool-result', '', { tool: data.name || 'unknown' }));

// For step-start events (skip - don't display):
// appendSegment(createSegment('step-start', data.snapshot || 'Step'));

// For step-end events (skip - don't display):
// appendSegment(createSegment('step-end', ''));

// For reasoning events:
appendSegment(createSegment('reasoning', data.content || ''));

// For message-complete (skip):
// appendSegment(createSegment('message-complete', ''));

// For done/success:
appendSegment(createSegment('done', data.message || ''));

// For error/failed:
appendSegment(createSegment('error', data.message || 'Error'));

// For timeout:
appendSegment(createSegment('timeout', data.message || ''));
```

**Step 4: Remove setContent call at end (no longer needed)**

Delete line: `setContent(resultContent);`

**Step 5: Commit**

```bash
git add roadmap-manager/src/store/taskStore.ts
git commit -m "feat: use structured segments in taskStore streaming"
```

---

## Task 4: Test the implementation

**Step 1: Start the dev server**

```bash
cd roadmap-manager && npm run dev
```

**Step 2: Test the flow**

1. Enter a prompt in the input area
2. Open the modal and verify:
   - Header shows Session, Prompt, and Model info
   - Reasoning displays as "Thinking: ..." in white italic
   - Text displays in bold white
   - Tool results display as "tool {name}" in cyan
   - Done/Error show with appropriate colors
   - tool-call and step-start are not displayed
3. Verify auto-scroll works

**Step 3: Commit**

```bash
git commit -m "test: verify modal event stream display works"
```

---

## Plan complete

**Files modified:**
- `roadmap-manager/src/store/resultModalStore.ts`
- `roadmap-manager/src/components/ResultModal.tsx`
- `roadmap-manager/src/store/taskStore.ts`

**Execution choice:**
1. **Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks
2. **Parallel Session** - Open new session with executing-plans skill

Which approach?
