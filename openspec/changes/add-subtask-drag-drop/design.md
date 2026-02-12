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

### Drag Handle Design

**Decision: Entire item is draggable** (not just a handle icon)

Rationale:
- More intuitive UX for touch/mouse users
- Consistent with modern UI patterns (Notion, Trello)
- Reduces visual clutter (no extra handle icon needed)
- Framer Motion already handles tap interactions on checkboxes

### Edge Cases to Handle

1. **Empty subtask list**: DnD should not be active
2. **Single subtask**: No reordering possible, graceful handling
3. **Drop on self**: No-op, maintain current position
4. **Max nested level**: Prevent nesting beyond 6 levels (matches markdown heading conventions)
5. **Rapid reordering**: Debounce markdown updates to avoid performance issues

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

## Open Questions

1. Should nesting changes be intuitive? Consider adding visual guides when dragging near indentation zones
2. Should we animate the markdown file update or show a toast notification?
