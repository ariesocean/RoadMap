# Tasks: Model Selection Implementation

## Phase 1: State Management

### Task 1.1: Create model configuration constants
- **File**: `roadmap-manager/src/constants/models.ts` (new)
- **Description**: Define AVAILABLE_MODELS array with all four models
- **Validation**: Verify all four models have correct providerID/modelID format

### Task 1.2: Create modelStore
- **File**: `roadmap-manager/src/store/modelStore.ts` (new)
- **Description**: Create Zustand store for model selection with localStorage persistence
- **Validation**: Run app, check localStorage after selecting different models

### Task 1.3: Add modelStore to types
- **File**: `roadmap-manager/src/store/types.ts`
- **Description**: Add ModelConfig interface and update imports
- **Validation**: TypeScript compilation passes

---

## Phase 2: UI Components

### Task 2.1: Create ModelSelector component
- **File**: `roadmap-manager/src/components/ModelSelector.tsx` (new)
- **Description**: Create dropdown component with styled options
- **Validation**: Component renders without errors, shows all four options

### Task 2.2: Add ModelSelector to Header
- **File**: `roadmap-manager/src/components/Header.tsx`
- **Description**: Import and mount ModelSelector in top-right corner
- **Validation**: Dropdown appears in header, position matches design

### Task 2.3: Style ModelSelector
- **File**: `roadmap-manager/src/styles/modelSelector.css` (new) or inline styles
- **Description**: Match existing header UI theme (dark/light mode support)
- **Validation**: Dropdown looks consistent with rest of header

---

## Phase 3: API Integration

### Task 3.1: Update taskStore submitPrompt
- **File**: `roadmap-manager/src/store/taskStore.ts`
- **Description**: Modify submitPrompt to include model in request body
- **Validation**: Network request includes model object when model is selected

### Task 3.2: Update vite.config.ts API endpoint
- **File**: `roadmap-manager/vite.config.ts`
- **Description**: Modify `/api/execute-navigate` to read model and forward to OpenCode Server
- **Validation**: OpenCode Server receives correct model format in prompt_async call

### Task 3.3: Update execute-modal-prompt endpoint
- **File**: `roadmap-manager/vite.config.ts`
- **Description**: Apply same model forwarding to `/api/execute-modal-prompt`
- **Validation**: Modal prompts also use selected model

---

## Phase 4: Testing

### Task 4.1: Test model selection flow
- **Description**: Manual testing of complete flow
- **Steps**:
  1. Select "Qwen3-Coder-Flash" from dropdown
  2. Submit a prompt
  3. Verify API request includes correct model
- **Validation**: No errors, model appears in server request

### Task 4.2: Test persistence
- **Description**: Verify localStorage persistence works
- **Steps**:
  1. Select "Big-Pickle"
  2. Refresh page
  3. Verify "Big-Pickle" is still selected
- **Validation**: Selection persists across page reloads

### Task 4.3: Test default behavior
- **Description**: Verify fallback when no model selected
- **Steps**:
  1. Clear localStorage or use incognito
  2. Submit prompt without selecting model
  3. Verify request still works (no model field)
- **Validation**: App works without breaking existing functionality

---

## Phase 5: Code Review & Cleanup

### Task 5.1: Run linting
- **Command**: `npm run lint` (or equivalent)
- **Validation**: No lint errors

### Task 5.2: TypeScript type check
- **Command**: `npm run typecheck` (or `npx tsc --noEmit`)
- **Validation**: All types compile successfully

### Task 5.3: Review changes
- **Description**: Self-review code for:
  - Consistent styling with existing components
  - Proper error handling
  - Clean separation of concerns
- **Validation**: Code meets project standards

---

## Files to Create

```
roadmap-manager/src/
├── constants/
│   └── models.ts                    # Task 1.1
├── store/
│   └── modelStore.ts               # Task 1.2
└── components/
    └── ModelSelector.tsx           # Task 2.1
```

## Files to Modify

```
roadmap-manager/src/
├── components/
│   └── Header.tsx                  # Task 2.2
├── store/
│   ├── modelStore.ts               # Task 1.2
│   ├── taskStore.ts                # Task 3.1
│   └── types.ts                    # Task 1.3
roadmap-manager/
└── vite.config.ts                  # Tasks 3.2, 3.3
```

## Dependencies Between Tasks

```
Phase 1 (1.1 → 1.2 → 1.3)
    │
    ▼
Phase 2 (2.1 → 2.2 → 2.3)
    │
    ▼
Phase 3 (3.1 depends on modelStore; 3.2 depends on 3.1)
    │
    ▼
Phase 4 (all tasks can run in parallel after Phase 3)
    │
    ▼
Phase 5 (after all testing complete)
```

## Estimated Effort

- Phase 1: 30 minutes
- Phase 2: 45 minutes
- Phase 3: 45 minutes
- Phase 4: 30 minutes
- Phase 5: 15 minutes

**Total**: ~2.5 hours
