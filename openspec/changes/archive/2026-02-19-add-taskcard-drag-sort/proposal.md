# Change: TaskCard Drag Sort

## Why
Users need ability to manually reorder tasks in the list view by dragging task cards.

## What Changes
- TaskCard title area becomes draggable handle
- Floating drag mode with DragOverlay
- Reorder persists to roadmap.md

## Impact
- Affected specs: task-management (new)
- Affected code:
  - `src/components/TaskCard.tsx` - Add useSortable
  - `src/components/TaskList.tsx` - Add DndContext and DragOverlay
  - `src/store/taskStore.ts` - Add reorderTasks method
  - `src/utils/markdownUtils.ts` - Add reorderTasksInMarkdown
