# Design: Subtask Hierarchy Drag-and-Drop

## Context

The roadmap manager currently supports drag-and-drop reordering of subtasks but does not allow changing hierarchy levels (indentation). Users need to reorganize task hierarchies by dragging subtasks to become children or siblings of other subtasks.

### Constraints

- Maximum nesting level: 6 (12 spaces total) - UX decision to prevent excessive nesting
- Hierarchy change limit: ±1 level per drag operation
- Children must follow parent during hierarchy changes
- Circular references must be prevented
- Cross-task moves are not allowed

### Stakeholders

- End users who need to reorganize task hierarchies
- Developers maintaining the roadmap manager codebase

## Goals / Non-Goals

### Goals
- Enable intuitive hierarchy changes through drag-and-drop
- Maintain roadmap.md file structure validity
- Provide clear visual feedback during drag operations
- Prevent invalid hierarchy states

### Non-Goals
- Keyboard accessibility for hierarchy changes (separate proposal)
- Multi-task drag-and-drop operations
- Bulk hierarchy operations

## Decisions

### Decision 1: Drop Target Semantics

**What:** Define precise drop target behavior based on drop position relative to other subtasks.

**Why:** Ambiguous language ("onto", "below") leads to implementation confusion and inconsistent UX.

**Approach:**
- **Drop on top of a sibling** → becomes child of that sibling (indent +1)
- **Drop between two siblings** → reorders at same level (no indent change)
- **Drop after a parent** → becomes sibling of that parent (indent -1)

**Implementation:** Use dnd-kit's collision detection with custom drop target zones:
- Top 50% of item → "on top of" (child)
- Bottom 50% of item → "after" (sibling)
- Gap between items → "between" (reorder)

**Alternatives considered:**
1. Horizontal drag distance to indicate intent → Too subtle, hard to discover
2. Modifier keys (Shift+drag) → Not discoverable, adds complexity
3. Separate indent/outdent buttons → Doesn't leverage drag-and-drop

---

### Decision 2: Cycle Detection Algorithm

**What:** Prevent subtasks from becoming their own ancestors.

**Why:** Circular references create infinite loops and invalid hierarchy structures.

**Approach:** Recursive traversal with memoization.

**Algorithm:**
```typescript
function wouldCreateCycle(
  movedSubtaskId: string,
  targetSubtaskId: string,
  subtasks: Subtask[]
): boolean {
  // Build parent-child map
  const parentMap = buildParentMap(subtasks);
  
  // Get all descendants of moved subtask
  const descendants = getDescendants(movedSubtaskId, parentMap);
  
  // Check if target is in descendants
  return descendants.includes(targetSubtaskId);
}

function getDescendants(
  subtaskId: string,
  parentMap: Map<string, string[]>
): string[] {
  const descendants: string[] = [];
  const visited = new Set<string>();
  
  function traverse(id: string) {
    if (visited.has(id)) return;
    visited.add(id);
    
    const children = parentMap.get(id) || [];
    descendants.push(...children);
    children.forEach(traverse);
  }
  
  traverse(subtaskId);
  return descendants;
}
```

**Performance:** O(n) where n is number of subtasks. Acceptable for typical task lists (<100 subtasks).

**Alternatives considered:**
1. Iterative BFS → Same complexity, more code
2. Database-level constraints → Not applicable (file-based storage)
3. Allow cycles and detect on save → Too late, user experience suffers

---

### Decision 3: Child Subtree Traversal

**What:** When a parent changes hierarchy, all descendants must follow.

**Why:** Maintains relative hierarchy structure and prevents orphaned subtasks.

**Approach:** Build a parent-child map first, then recursively traverse and update all descendants.

**Algorithm:**
```typescript
// First, build a parent map from the flat subtask array
function buildParentMap(subtasks: Subtask[]): Map<string, string[]> {
  const parentMap = new Map<string, string[]>();
  const parentMapComplete = new Map<string, string>();
  
  // First pass: establish direct parent relationships based on nesting levels
  for (let i = 0; i < subtasks.length; i++) {
    const current = subtasks[i];
    
    // Find the parent: look backwards for the nearest subtask with level = current.nestedLevel - 1
    for (let j = i - 1; j >= 0; j--) {
      if (subtasks[j].nestedLevel === current.nestedLevel - 1) {
        parentMapComplete.set(current.id, subtasks[j].id);
        break;
      }
    }
  }
  
  // Build parent map: parent -> children[]
  for (const [childId, parentId] of parentMapComplete) {
    if (!parentMap.has(parentId)) {
      parentMap.set(parentId, []);
    }
    parentMap.get(parentId)!.push(childId);
  }
  
  return parentMap;
}

// Update descendant levels recursively
function updateDescendantLevels(
  subtasks: Subtask[],
  parentSubtaskId: string,
  levelDelta: number
): Subtask[] {
  const parentMap = buildParentMap(subtasks);
  const subtaskMap = new Map(subtasks.map(s => [s.id, s]));
  const updated = new Set<string>();
  
  function traverse(subtaskId: string) {
    if (updated.has(subtaskId)) return;
    updated.add(subtaskId);
    
    const subtask = subtaskMap.get(subtaskId);
    if (!subtask) return;
    
    // Update this subtask's level
    const newLevel = subtask.nestedLevel + levelDelta;
    if (newLevel < 0 || newLevel > 6) {
      throw new Error(`Would exceed nesting limits: ${newLevel}`);
    }
    subtask.nestedLevel = newLevel;
    
    // Traverse all children recursively
    const children = parentMap.get(subtaskId) || [];
    children.forEach(childId => traverse(childId));
  }
  
  traverse(parentSubtaskId);
  return subtasks;
}
```

**Edge Cases:**
- Child at max level (6) blocks parent indent → Reject with error
- Grandchildren would exceed max level → Reject with error

**Alternatives considered:**
1. Only update direct children → Breaks hierarchy structure
2. Allow partial updates → Creates invalid states
3. Flatten hierarchy on indent → Loses information

---

### Decision 4: Visual Feedback During Drag

**What:** Show potential nesting level in drag overlay and highlight drop targets.

**Why:** Users need to understand what will happen before dropping.

**Approach:**
1. **Drag overlay:** Show subtask at potential new indentation level
2. **Drop target highlighting:** Color-coded borders
   - Blue → sibling placement (same level)
   - Green → child placement (indent +1)
   - Orange → parent placement (indent -1)

**Implementation:**
```typescript
function getDropTargetType(
  draggedSubtask: Subtask,
  targetSubtask: Subtask,
  dropPosition: 'top' | 'bottom' | 'between'
): 'sibling' | 'child' | 'parent' {
  const levelDiff = targetSubtask.nestedLevel - draggedSubtask.nestedLevel;
  
  if (dropPosition === 'top' && levelDiff === 0) {
    return 'child';
  } else if (dropPosition === 'bottom' && levelDiff === -1) {
    return 'parent';
  } else {
    return 'sibling';
  }
}
```

**Alternatives considered:**
1. Text tooltip → Too subtle, requires reading
2. Arrow indicators → Hard to interpret
3. No preview → Users can't predict outcome

---

### Decision 5: Validation Layer

**What:** Enforce all hierarchy constraints in the store layer before persisting.

**Why:** Prevents invalid states from reaching the file system.

**Validation Rules:**
1. nestedLevel must be in range [0, 6]
2. Level change must be ≤ 1 in absolute value
3. No circular references
4. Children must not exceed max level when parent indents
5. Subtasks cannot move between tasks

**Implementation:**
```typescript
function validateHierarchyChange(
  subtasks: Subtask[],
  taskId: string,
  newOrder: { id: string; nestedLevel: number }[]
): { valid: boolean; error?: string } {
  // Rule 1: Range check
  for (const { id, nestedLevel } of newOrder) {
    if (nestedLevel < 0 || nestedLevel > 6) {
      return { valid: false, error: `Invalid nesting level: ${nestedLevel}` };
    }
  }
  
  // Rule 2: Level change limit
  const subtaskMap = new Map(subtasks.map(s => [s.id, s]));
  for (const { id, nestedLevel } of newOrder) {
    const original = subtaskMap.get(id);
    if (original && Math.abs(nestedLevel - original.nestedLevel) > 1) {
      return { valid: false, error: 'Hierarchy change limited to ±1 level' };
    }
  }
  
  // Rule 3: Cycle detection
  // Rule 4: Child max level check
  // Rule 5: Cross-task check
  
  return { valid: true };
}
```

**Alternatives considered:**
1. Validate in UI layer only → Can be bypassed
2. Validate in persistence layer only → Too late, invalid state in memory
3. No validation → Risk of corrupting roadmap.md

---

## Risks / Trade-offs

### Risk 1: Performance with Large Subtask Lists

**Risk:** Recursive traversal and cycle detection could be slow with hundreds of subtasks.

**Mitigation:**
- Memoization in cycle detection
- Early termination when cycle found
- Consider iterative approach if performance issues arise

**Trade-off:** Simpler recursive code vs. potential performance issues

---

### Risk 2: Ambiguous Drop Zones

**Risk:** Users may not understand where to drop to achieve desired hierarchy change.

**Mitigation:**
- Clear visual feedback (color-coded highlighting)
- Help text or tooltip explaining drop zones
- Consider adding visual guides (indentation lines)

**Trade-off:** More complex UI vs. better discoverability

---

### Risk 3: Edge Case Complexity

**Risk:** Many edge cases (max level, cycles, children) increase implementation complexity.

**Mitigation:**
- Comprehensive test coverage
- Clear error messages
- Phased implementation (basic first, edge cases later)

**Trade-off:** More robust implementation vs. longer development time

---

## Migration Plan

### Phase 1: Basic Hierarchy Detection
- Implement drop target semantics
- Add visual feedback
- Basic ±1 level changes

### Phase 2: Child Subtree Traversal
- Implement child propagation logic
- Add max level validation

### Phase 3: Cycle Detection
- Implement cycle detection algorithm
- Add cross-task prevention

### Phase 4: Polish
- Error notifications
- Visual feedback improvements
- Comprehensive testing

**Rollback:** If issues arise, can disable hierarchy changes by reverting to original reorderSubtasks implementation.

---

## Open Questions

1. **Should we add a "confirm" dialog for hierarchy changes?**
   - Pro: Prevents accidental hierarchy changes
   - Con: Adds friction to common operations
   - **Decision:** No, rely on visual feedback and undo capability

2. **Should we support undo/redo for hierarchy changes?**
   - Pro: Allows recovery from mistakes
   - Con: Adds complexity
   - **Decision:** Out of scope for this proposal, consider for future

3. **Should we add keyboard shortcuts for hierarchy changes?**
   - Pro: Accessibility, power users
   - Con: Out of scope per code review
   - **Decision:** Separate proposal: `add-subtask-keyboard-accessibility`

4. **Should we allow dragging multiple subtasks at once?**
   - Pro: Bulk operations
   - Con: Complexity, edge cases
   - **Decision:** Out of scope, consider for future

---

## References

- `.opencode/skills/navigate/SKILL.md` - Task format requirements
- `roadmap-manager/src/components/SubtaskList.tsx` - Current drag-and-drop implementation
- `roadmap-manager/src/store/taskStore.ts` - State management
- `roadmap-manager/src/utils/markdownUtils.ts` - Markdown persistence
- dnd-kit documentation: https://docs.dndkit.com/
