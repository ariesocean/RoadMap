# Design: Model Selection Feature

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Header.tsx                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  ModelSelector Component                           │    │
│  │  - Dropdown with modelID only display              │    │
│  │  - Uses modelStore for selection state             │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    modelStore.ts                             │
│  - Zustand store for selected model                         │
│  - Persists to localStorage                                 │
│  - Methods: setModel, getModel                              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   taskStore.ts                               │
│  - submitPrompt modified to include model                   │
│  - Builds API body with model object                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  vite.config.ts                              │
│  - /api/execute-navigate reads model from body              │
│  - Forwards model to OpenCode Server HTTP API               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              OpenCode Server HTTP API                       │
│  POST /session/{sessionId}/prompt_async                     │
│  {                                                          │
│    "model": { "providerID": "...", "modelID": "..." },      │
│    "parts": [{ "type": "text", "text": "prompt" }]          │
│  }                                                          │
└─────────────────────────────────────────────────────────────┘
```

## Data Models

### Model Config

```typescript
interface ModelConfig {
  providerID: string;
  modelID: string;
  displayName: string;
}

const AVAILABLE_MODELS: ModelConfig[] = [
  { providerID: 'minimax-cn-coding-plan', modelID: 'MiniMax-M2.1', displayName: 'MiniMax-M2.1' },
  { providerID: 'alibaba-cn', modelID: 'qwen3-coder-flash', displayName: 'Qwen3-Coder-Flash' },
  { providerID: 'opencode', modelID: 'big-pickle', displayName: 'Big-Pickle' },
  { providerID: 'zhipuai', modelID: 'glm-4.7', displayName: 'GLM-4.7' },
];
```

### API Request Format

The Vite middleware will construct the OpenCode Server request:

```typescript
// Before
await httpRequest({
  path: `/session/${sessionId}/prompt_async`,
  // ...
}, JSON.stringify({
  parts: [{ type: 'text', text: `navigate: ${prompt}` }]
}));

// After
await httpRequest({
  path: `/session/${sessionId}/prompt_async`,
  // ...
}, JSON.stringify({
  model: {
    providerID: selectedModel.providerID,
    modelID: selectedModel.modelID
  },
  parts: [{ type: 'text', text: `navigate: ${prompt}` }]
}));
```

## State Management

### modelStore.ts (New)

```typescript
interface ModelStore {
  selectedModel: ModelConfig | null;
  setSelectedModel: (model: ModelConfig) => void;
}
```

### Integration Points

1. **Header.tsx**: Mount ModelSelector component after theme toggle
2. **taskStore.ts**: `submitPrompt` reads model and includes in request body
3. **vite.config.ts**: `/api/execute-navigate` reads model from body and forwards to OpenCode Server

## UI Design

### ModelSelector Component

Location: Top-right header, between theme toggle and search input

```
[Search] [Theme] [Model ▼]
              ├─ MiniMax-M2.1
              ├─ Qwen3-Coder-Flash
              ├─ Big-Pickle
              └─ GLM-4.7
```

Style: Minimal dropdown matching existing UI theme

## Persistence

- Store selected model key in localStorage: `roadmap-selected-model`
- On app load, restore from localStorage
- Default: First model in list if none saved
