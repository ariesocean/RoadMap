## 1. Dependencies Setup
- [ ] 1.1 Add @dnd-kit/core to package.json
- [ ] 1.2 Add @dnd-kit/sortable to package.json
- [ ] 1.3 Add @dnd-kit/utilities to package.json
- [ ] 1.4 Run npm install to verify dependencies

## 2. Type Extensions (Optional)
- [ ] 2.1 Review Subtask interface in types.ts for compatibility
- [ ] 2.2 Add TypeScript types for dnd-kit if needed

## 3. State Management
- [ ] 3.1 Add `reorderSubtasks` action to taskStore
- [ ] 3.2 Implement subtask reordering logic with new order and optional hierarchy changes
- [ ] 3.3 Add persistence call to update markdown after reorder

## 4. Markdown Persistence
- [ ] 4.1 Create `updateSubtasksOrderInMarkdown` utility function
- [ ] 4.2 Handle both reordering and nestedLevel changes
- [ ] 4.3 Preserve subtask content, id, and completed state

## 5. Component Implementation
- [ ] 5.1 Create SortableSubtaskItem component wrapping SubtaskItem with dnd-kit
- [ ] 5.2 Wrap SubtaskList with SortableContext from dnd-kit
- [ ] 5.3 Implement drag sensors (mouse, touch, keyboard support)
- [ ] 5.4 Add DragOverlay for visual feedback during drag
- [ ] 5.5 Implement drop animation with Framer Motion integration

## 6. Visual Polish
- [ ] 6.1 Add drag handle cursor styles
- [ ] 6.2 Implement drop indicator (horizontal line between items)
- [ ] 6.3 Add indentation zone indicators for nesting changes
- [ ] 6.4 Style dragged item with elevated shadow effect
- [ ] 6.5 Ensure transitions match existing Framer Motion animations

## 7. Edge Case Handling
- [ ] 7.1 Empty subtask list - DnD not active
- [ ] 7.2 Single subtask - disable drag or show hint
- [ ] 7.3 Drop on self - no-op
- [ ] 7.4 Max nested level enforcement (limit to reasonable depth)
- [ ] 7.5 Debounce markdown writes during rapid reordering

## 8. Testing
- [ ] 8.1 Manual testing: Reorder subtasks within a task
- [ ] 8.2 Manual testing: Change nestedLevel via drag
- [ ] 8.3 Manual testing: Verify markdown persistence
- [ ] 8.4 Manual testing: Mobile touch drag operations
- [ ] 8.5 Manual testing: Edge cases (empty, single, self-drop)

## 9. Validation
- [ ] 9.1 Run `openspec validate add-subtask-drag-drop --strict`
- [ ] 9.2 Fix any validation errors
- [ ] 9.3 Ensure all scenarios have test coverage
