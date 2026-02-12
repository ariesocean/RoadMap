## Context

The roadmap manager currently displays subtasks in a fixed order as they appear in the markdown file. Users cannot reorder subtasks or adjust their hierarchy level after creation. This feature will add drag-and-drop functionality to reorganize subtasks within a single task, including both reordering (position) and reparenting (hierarchy level changes).

## Goals / Non-Goals

### Goals:
- Enable drag-and-drop reordering of subtasks within a single task
- Support changing nestedLevel through drag operations (indentation/de-indentation)
- Persist reordered subtasks to roadmap.md in correct order
- Provide smooth visual feedback during drag operations
- Maintain backward compatibility with existing subtask features

### Non-Goals:
- Dragging subtasks between different tasks (out of scope)
- Dragging tasks (only subtasks within taskBox)
- Cross-device sync of drag state (local only)
- Complex multi-select drag operations

## Decisions

### Library Selection: @dnd-kit vs react-beautiful-dnd vs react-dnd

**Decision: @dnd-kit**

Rationale:
- Modern, lightweight (~50KB total for core + sortable)
- Better TypeScript support out of the box
- More flexible than react-beautiful-dnd for complex nested structures
- Actively maintained and React 18 compatible
- Framer Motion already in project for animations

Alternatives considered:
- `react-beautiful-dnd`: No longer actively maintained, React 18 Strict Mode issues
- `react-dnd`: Lower-level API, more boilerplate, steeper learning curve
- Native HTML5 DnD: Inconsistent cross-browser support, poor mobile support

### Implementation Approach

1. **SortableList Component**: Create a wrapper around the subtask list using `@dnd-kit/sortable`
2. **Drag Modes**:
   - **Reorder**: Drag item vertically to change position
   - **Nest**: Drag item horizontally to change nestedLevel (use visual indicator)
3. **Visual Feedback**: Use Framer Motion for smooth transitions and drag previews
4. **State Management**: Add `reorderSubtasks` action to taskStore
5. **Persistence**: Update markdown file with new order and hierarchy on drop

### Data Model Considerations

Current `Subtask` interface:
```typescript
interface Subtask {
  id: string;
  content: string;
  completed: boolean;
  nestedLevel: number;
}
```

No changes required to the interface. The `nestedLevel` field already supports hierarchy.

### Drag Modes

The implementation supports two drag modes:

1. **Reorder (Vertical Drag)**: Default mode. Drag item up/down to change position in the list
2. **Nest (Horizontal Drag)**: Drag item left/right to change nestedLevel (indentation)

**Horizontal Drag Detection**:
- When drag delta exceeds 20px horizontally, enter nesting mode
- Visual feedback (highlighted dashed border) indicates nesting mode is active
- Drag further right → increase nesting level
- Drag further left → decrease nesting level
- Clamped to 0-6 nesting levels

### Visual Feedback

- **Drag Overlay**: Semi-transparent copy of the dragged item follows cursor
- **Nesting Mode**: Item displays highlighted dashed border when in nesting mode
- **Cursor**: Changes to 'grabbing' during drag operations

### State Management

Two actions handle nesting:

1. `reorderSubtasks(taskId, newOrder)` - Handles both reordering and nesting changes
2. `changeSubtaskNestedLevel(taskId, subtaskId, newNestedLevel)` - Direct nesting level update

Both actions:
- Update local state immediately for responsive UX
- Persist changes to roadmap.md on completion

### Persistence

All nesting changes persist to markdown file:
- Each subtask's `nestedLevel` preserved
- Indentation rendered as 2 spaces per level
- Maximum 6 levels enforced

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Increased bundle size (~100KB) | Tree-shakeable modules; dnd-kit is modular |
| Complex nested drag logic | Start with simple reordering; add nesting in v2 if needed |
| Mobile touch support | dnd-kit has built-in touch support |
| Performance with many subtasks | Virtualization if >100 subtasks (unlikely) |

## Migration Plan

1. Add new dependencies to package.json
2. Create `useSubtaskReorder` hook for DnD logic
3. Modify `SubtaskList` to use Sortable context
4. Add `reorderSubtasks` action to taskStore
5. Update `markdownUtils.ts` to preserve order
6. Add visual styling for drag states (overlay, placeholder)
7. Test with existing task structures
8. Implement horizontal drag detection for nesting
9. Add visual feedback for nesting mode

## Implementation Notes

### Horizontal Drag for Nesting

The key innovation is detecting horizontal vs vertical drag intent:

```typescript
const handleDragOver = (event: DragOverEvent) => {
  const { delta } = event;
  
  if (Math.abs(delta.x) > Math.abs(delta.y) && Math.abs(delta.x) > 20) {
    // Enter nesting mode
    const newLevel = activeSubtask.nestedLevel + (delta.x > 0 ? 1 : -1);
    setTargetNestingLevel(Math.max(0, Math.min(6, newLevel)));
  }
};
```

This provides intuitive nesting control without manual buttons.

### Design Decisions Revisited

**Manual Nesting Controls Removed**: Initially considered chevron buttons for manual nesting control. These were removed in favor of pure drag-based interaction, which is:
- More discoverable (drag behavior is consistent)
- Less cluttered UI (no extra buttons)
- Faster workflow (no mode switching needed)

The entire item remains draggable (per original decision), but horizontal movement now controls nesting while vertical controls reordering.
