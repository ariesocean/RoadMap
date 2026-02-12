# Change: Fix Subtask Hierarchy Drag-and-Drop

## Why
The current drag-and-drop implementation in the roadmap manager only supports reordering subtasks within the same hierarchy level. Users need to be able to change the indentation (nestedLevel) of subtasks through drag-and-drop operations to reorganize task hierarchies intuitively.

## What Changes
- Implement hierarchy level detection during drag operations
- Add visual indicators for nesting levels during drag
- Limit each drag operation to change hierarchy by at most one level (same-level reordering allowed)
- **Ensure roadmap.md file structure remains valid and compliant with SKILL.md format**
- Preserve all task metadata (timestamps, completion status, original prompts)
- Child subtasks follow their parent during hierarchy changes
- Prevent circular hierarchy references
- Add validation logic to enforce hierarchy constraints

## SKILL.md Format Requirements (Must Preserve)

This proposal MUST ensure roadmap.md maintains the exact format specified in `.opencode/skills/navigate/SKILL.md`:

### Main Task Format
```
# {title} [created: YYYY-MM-DD HH:MM]
> {original_prompt}

## Subtasks
* [ ] {subtask}

---
**Last Updated:** YYYY-MM-DD HH:MM
```

### Subtask Format
```
* [ ] {subtask}
```

### Validation Rules
- `[created: YYYY-MM-DD HH:MM]` timestamp MUST remain in task title
- `[x]` / `[ ]` completion markers MUST be preserved
- `#` for main tasks, `## Subtasks` header MUST be present
- `**Last Updated:**` MUST be maintained for each task
- Indentation MUST use 2 spaces per nesting level
- All metadata (ids, timestamps) MUST be preserved during hierarchy changes

## Impact
- Affected specs: `subtask-interaction`
- Affected code:
  - `roadmap-manager/src/components/SubtaskList.tsx`
  - `roadmap-manager/src/store/taskStore.ts`
  - `roadmap-manager/src/utils/markdownUtils.ts`

## Key Decisions
- **Same-level reordering:** Allowed (standard UX pattern)
- **Hierarchy change limit:** Maximum ±1 level per drag
- **Child behavior:** Children follow parent during hierarchy changes
- **Cross-task moves:** NOT allowed (subtasks stay within their parent task)
- **Maximum nesting level:** 6 levels (12 spaces total) - UX decision to prevent excessive nesting
- **Drop target semantics:**
  - Drop **on top of** a sibling → becomes child of that sibling (indent +1)
  - Drop **between** two siblings → reorders at same level (no indent change)
  - Drop **after** a parent → becomes sibling of that parent (indent -1)
- **Metadata preservation:** All SKILL.md metadata (timestamps, prompts, Last Updated) MUST survive hierarchy changes
