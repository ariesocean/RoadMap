# Design: Subtask Hierarchy Drag-and-Drop

## Context
Enable drag-and-drop hierarchy changes for subtasks while maintaining roadmap.md validity.

## Constraints
- Max ±1 level change per drag
- Max nesting level: 6 (12 spaces)
- Children follow parent
- Prevent circular references

## Drop Target Semantics
- **Drop on top of sibling** → becomes child (indent +1)
- **Drop between siblings** → reorder (same level)
- **Drop after parent** → becomes sibling (indent -1)

## Validation Rules
1. nestedLevel must be [0, 6]
2. Level change ≤ 1 in absolute value
3. No circular references
4. Children cannot exceed max level

## Roadmap.md Format Preservation
- `{indent}* [ ] {content}` with 2 spaces × nestedLevel
- `## Subtasks` header present
- `[created: YYYY-MM-DD HH:MM]` preserved
- `**Last Updated:**` updated on hierarchy changes
