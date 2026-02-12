# Change: Fix Subtask Hierarchy Drag-and-Drop

## Why
Users need to reorganize task hierarchies by dragging subtasks to change indentation levels.

## What Changes
- Drag subtasks to change hierarchy level (indent/outdent)
- Drag to reorder within same level
- Limit: max ±1 level per drag operation
- Preserve roadmap.md structure per SKILL.md format

## Impact
- Affected specs: `subtask-interaction`
- Affected code:
  - `roadmap-manager/src/components/SubtaskList.tsx`
  - `roadmap-manager/src/store/taskStore.ts`
  - `roadmap-manager/src/utils/markdownUtils.ts`
