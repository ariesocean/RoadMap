# Change: Fix Subtask Drag-and-Drop Indent/Outdent

## Why
Currently, dragging subtasks only changes their order but does not update the nesting level (indent/outdent). Users cannot visually or functionally change subtask hierarchy through drag operations, even though the `nestedLevel` property exists in the data model.

## What Changes
- Implement horizontal drag detection to determine indent/outdent intent
- Calculate new `nestedLevel` based on horizontal drag distance during drop
- Enforce maximum one-level change per drag operation
- Update roadmap.md with proper indentation structure after drag
- Ensure saved file structure conforms to `navigate` SKILL.md format

## Impact
- Affected specs: subtask-interaction (extends existing drag reordering capability with indent/outdent)
- Affected code:
  - `roadmap-manager/src/components/SubtaskList.tsx` - drag handling logic
  - `roadmap-manager/src/utils/markdownUtils.ts` - indentation formatting
