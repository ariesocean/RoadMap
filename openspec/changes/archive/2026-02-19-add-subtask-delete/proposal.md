# Change: Subtask Delete from UI

## Why
Users need a way to delete subtasks directly from the UI.

## What Changes
- Clear subtask input and press Enter shows delete button
- Click delete button removes subtask
- Parent task auto-collapses when last subtask is deleted

## Impact
- Affected specs: sub-task-management
- Affected code:
  - `src/store/taskStore.ts` - Add deleteSubtask method
  - `src/utils/markdownUtils.ts` - Add deleteSubtaskFromMarkdown
  - `src/components/SubtaskList.tsx` - Add delete button UI
