## 1. Dependencies Setup
- [x] 1.1 Add @dnd-kit/core to package.json
- [x] 1.2 Add @dnd-kit/sortable to package.json
- [x] 1.3 Add @dnd-kit/utilities to package.json
- [x] 1.4 Run npm install to verify dependencies

## 2. Type Extensions
- [x] 2.1 Review Subtask interface in types.ts for compatibility
- [x] 2.2 Add reorderSubtasks action to TaskStore interface

## 3. State Management
- [x] 3.1 Add `reorderSubtasks` action to taskStore
- [x] 3.2 Implement subtask reordering logic with new order
- [x] 3.3 Add persistence call to update markdown after reorder

## 4. Markdown Persistence
- [x] 4.1 Create `updateSubtasksOrderInMarkdown` utility function
- [x] 4.2 Handle subtask reordering in markdown file
- [x] 4.3 Preserve subtask content, id, and completed state

## 5. Component Implementation
- [x] 5.1 Create SortableSubtaskItem component wrapping SubtaskItem with dnd-kit
- [x] 5.2 Wrap SubtaskList with SortableContext from dnd-kit
- [x] 5.3 Implement drag sensors (mouse, touch, keyboard support)
- [x] 5.4 Add DragOverlay for visual feedback during drag
- [x] 5.5 Integrate with Framer Motion animations

## 6. Visual Polish
- [x] 6.1 Add cursor styles for drag (grab/grabbing)
- [x] 6.2 Add drag overlay with elevated shadow effect
- [x] 6.3 Ensure transitions match existing Framer Motion animations

## 7. Edge Case Handling
- [x] 7.1 Empty subtask list - DnD not active (SortableContext handles this)
- [x] 7.2 Single subtask - gracefully handled by dnd-kit
- [x] 7.3 Drop on self - no-op handled by dnd-kit
- [x] 7.4 Local state updates immediately for smooth UX

## 8. Validation
- [x] 8.1 Run `openspec validate add-subtask-drag-drop --strict`
- [x] 8.2 Verify TypeScript compilation in modified files
- [x] 8.3 No new TypeScript errors introduced (pre-existing errors in other files)

## Implementation Notes

### What Was Implemented:
- Drag-and-drop reordering of subtasks within a single task
- Visual feedback during drag operations (drag overlay with opacity)
- Cursor styles (grab/grabbing)
- Keyboard navigation support via dnd-kit sensors
- Markdown persistence on drop completion
- Immediate local state update for smooth UX

### Scope Simplifications:
- Reordering only (nested hierarchy changes deferred to future iteration)
- Single subtask list per task (no cross-task dragging)
- Basic visual feedback (drop indicators may be added in future)

### Dependencies Added:
- @dnd-kit/core (6.1.0) - Core drag-and-drop primitives
- @dnd-kit/sortable (8.0.0) - Sortable list functionality
- @dnd-kit/utilities (3.2.2) - Utility functions

### Files Modified:
- `package.json` - Added dependencies
- `src/store/types.ts` - Added reorderSubtasks action signature
- `src/store/taskStore.ts` - Added reorderSubtasks implementation
- `src/utils/markdownUtils.ts` - Added updateSubtasksOrderInMarkdown
- `src/components/SubtaskList.tsx` - Complete rewrite with dnd-kit integration
