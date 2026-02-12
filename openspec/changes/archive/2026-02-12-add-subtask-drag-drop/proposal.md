# Change: Add Subtask Drag-and-Drop Reordering ✅ COMPLETED

## Why

Users need to reorganize subtasks within a task to prioritize work more effectively. Currently, subtasks can only be toggled as completed or edited in place, but their order is fixed. Adding drag-and-drop functionality will improve task management flexibility without affecting existing features.

## What Changes

- Add drag-and-drop capability for subtasks within a single taskBox
- Support reordering subtasks (changing position in the list)
- **Support changing nested hierarchy level through drag operations (indentation/de-indentation)** ✅
- Persist new order and hierarchy to the markdown file
- Maintain all existing subtask functionality (toggle, edit, display)
- Add visual feedback during drag operations using existing Framer Motion animations

## Impact

- Affected specs: `task-management`
- Affected code:
  - `src/components/SubtaskList.tsx` - main drag-and-drop implementation with nesting support
  - `src/store/taskStore.ts` - state management for reordering and nesting
  - `src/utils/markdownUtils.ts` - markdown persistence logic
  - `src/store/types.ts` - Subtask interface (already supports nestedLevel)
- Dependencies: Added `@dnd-kit/core` and `@dnd-kit/sortable` for robust drag-and-drop

## Features Delivered

1. **Vertical Drag** → Reorder subtask position in list
2. **Horizontal Drag** → Change subtask nesting level (indentation)
3. **Visual Feedback** → Highlighted borders during nesting mode
4. **Markdown Persistence** → All changes persist to roadmap.md
5. **Keyboard Support** → Arrow keys for accessibility
6. **Touch Support** → Works on mobile devices
