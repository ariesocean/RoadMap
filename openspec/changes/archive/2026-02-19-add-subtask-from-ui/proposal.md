# Change: Add Subtask from UI

## Why
Users need a way to add new subtasks directly from the UI without editing the markdown file manually.

## What Changes
- Add hover-triggered bottom area in expanded TaskCard for adding new subtasks
- Add `addSubtask` method to taskStore
- Add `appendSubtaskToMarkdown` utility function
- New subtask appears at bottom of list with nestedLevel 0

## Impact
- Affected specs: sub-task-management
- Affected code:
  - `src/store/types.ts` - Add method signature
  - `src/store/taskStore.ts` - Implement addSubtask
  - `src/utils/markdownUtils.ts` - Add appendSubtaskToMarkdown
  - `src/components/SubtaskList.tsx` - Add UI for adding subtasks
