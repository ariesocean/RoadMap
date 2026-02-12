# Change: Add Subtask Drag-and-Drop Reordering

## Why

Users need to reorganize subtasks within a task to prioritize work more effectively. Currently, subtasks can only be toggled as completed or edited in place, but their order is fixed. Adding drag-and-drop functionality will improve task management flexibility without affecting existing features.

## What Changes

- Add drag-and-drop capability for subtasks within a single taskBox
- Support reordering subtasks (changing position in the list)
- Support changing nested hierarchy level (indentation change)
- Persist new order and hierarchy to the markdown file
- Maintain all existing subtask functionality (toggle, edit, display)
- Add visual feedback during drag operations using existing Framer Motion animations

## Impact

- Affected specs: `task-management`
- Affected code:
  - `src/components/SubtaskList.tsx` - main drag-and-drop implementation
  - `src/store/taskStore.ts` - state management for reordering
  - `src/utils/markdownUtils.ts` - markdown persistence logic
  - `src/store/types.ts` - Subtask interface (may need minor updates)
- Dependencies: Consider adding `@dnd-kit/core` and `@dnd-kit/sortable` (both ~50KB each) for robust drag-and-drop
