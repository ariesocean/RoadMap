# Task Description Click-to-Edit Design

## Overview

Add double-click editing functionality for task description (`originalPrompt` field) in TaskCard, similar to existing subtask editing behavior.

## Behavior

1. **Enter edit mode**: Double-click description area
2. **Edit**: Input field shows with existing text selected
3. **Save**: Press Enter → save and exit edit mode, sync to roadmap.md
4. **Cancel**: Press Escape or blur → cancel and restore original value

## Implementation

### Component Changes (`TaskCard.tsx`)

Add state:
- `isEditingDescription: boolean`
- `editDescription: string`
- `descriptionInputRef: React.RefObject<HTMLInputElement>`

UI:
- When `isEditingDescription` is true, render `<input>` instead of `<p>`
- On input blur or Enter key, save and exit edit mode
- On Escape key, cancel and exit edit mode

### Store Changes (`taskStore.ts`)

Add method:
```typescript
updateTaskDescription: (taskId: string, description: string) => Promise<void>
```

This method should:
1. Update local state
2. Persist to roadmap.md file

### Data Flow

```
User double-clicks description
  → setIsEditingDescription(true)
  → Focus input, select text
  
User presses Enter
  → setIsEditingDescription(false)
  → Call updateTaskDescription(taskId, newDescription)
  → Update store → Persist to roadmap.md
```

## UI Specification

- Edit mode: `<input>` with same styling as description text
- Non-edit mode: `<p>` with italic styling (existing)
- Transition: No animation needed (simple toggle)

## Acceptance Criteria

1. Double-clicking description area enters edit mode
2. Input field is focused with text selected
3. Pressing Enter saves and exits edit mode
4. Pressing Escape cancels and exits edit mode
5. Clicking outside (blur) cancels and exits edit mode
6. Changes persist to roadmap.md file
