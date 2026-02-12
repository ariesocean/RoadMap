## 1. Analysis and Design
**Dependencies:** None - Start here
**Duration:** 1-2 days

- [ ] 1.1 Analyze current dnd-kit implementation in SubtaskList.tsx
- [ ] 1.2 Identify where hierarchy detection should occur during drag
- [ ] 1.3 Design the nesting indicator visual feedback mechanism
- [ ] 1.4 Design child subtree traversal logic for hierarchy changes
- [ ] 1.5 Design cycle detection algorithm for hierarchy changes
- [ ] 1.6 Define precise drop target semantics (on top of, between, after)

## 2. Frontend Implementation
**Dependencies:** 1.1, 1.2, 1.6 must complete before starting
**Duration:** 3-4 days

- [ ] 2.1 Add visual indentation indicators to SortableSubtaskItem
- [ ] 2.2 Implement drop target hierarchy detection in handleDragEnd
- [ ] 2.3 Limit hierarchy change to maximum one level per drag
- [ ] 2.4 Add visual feedback during drag to show potential nesting level
- [ ] 2.5 Update active drag overlay with indentation preview
- [ ] 2.6 Implement child subtree traversal to update all descendants
- [ ] 2.7 Add cycle detection to prevent hierarchy circular references
- [ ] 2.8 Add cross-task move prevention logic
- [ ] 2.9 Add error notification for all rejection scenarios

**Parallel Work:**
- Tasks 2.1, 2.4, 2.5 can be done in parallel (UI components)
- Tasks 2.2, 2.3 can be done in parallel (drag detection logic)
- Tasks 2.6, 2.7 depend on 2.2

## 3. Store Implementation
**Dependencies:** 2.2, 2.3, 2.6 must complete before starting
**Duration:** 2-3 days

- [ ] 3.1 Update reorderSubtasks to accept nestedLevel changes
- [ ] 3.2 Add validation for max one level hierarchy change
- [ ] 3.3 Add validation for nestedLevel range (0-6)
- [ ] 3.4 Implement child hierarchy propagation logic
- [ ] 3.5 Add cycle detection validation
- [ ] 3.6 Implement cross-task boundary enforcement
- [ ] 3.7 Add validation for child at max level blocking parent indent

**Parallel Work:**
- Tasks 3.2, 3.3 can be done in parallel (basic validation)
- Tasks 3.4, 3.5, 3.6 depend on 3.1
- Task 3.7 depends on 3.4

## 4. Persistence Layer
**Dependencies:** 3.1 must complete before starting
**Duration:** 1-2 days

- [ ] 4.1 Verify updateSubtasksOrderInMarkdown handles nestedLevel correctly
- [ ] 4.2 Test roadmap.md structure validity after drag operations
- [ ] 4.3 Verify indentation formatting (2 spaces per level) is maintained
- [ ] 4.4 Test markdown structure with complex hierarchy changes

**Parallel Work:** All tasks can be done in parallel

## 5. Testing
**Dependencies:** All implementation tasks (2.x, 3.x, 4.x) must complete
**Duration:** 2-3 days

- [ ] 5.1 Test drag to increase indentation by one level
- [ ] 5.2 Test drag to decrease indentation by one level
- [ ] 5.3 Test that dragging more than one level is prevented
- [ ] 5.4 Test roadmap.md file structure after various drag scenarios
- [ ] 5.5 Test with multiple nested levels (0-6 max)
- [ ] 5.6 Test that children follow parent during hierarchy changes
- [ ] 5.7 Test grandchildren maintain relative hierarchy during changes
- [ ] 5.8 Test cycle detection prevents circular references
- [ ] 5.9 Test cross-task moves are rejected
- [ ] 5.10 Test parent indent blocked when child at max level
- [ ] 5.11 Test same-level reordering without hierarchy changes
- [ ] 5.12 Test error notifications display for all rejection scenarios

**Parallel Work:**
- Tests 5.1, 5.2, 5.3, 5.11 can be done in parallel (basic drag operations)
- Tests 5.6, 5.7 depend on completing implementation task 2.6
- Tests 5.8, 5.9 depend on completing implementation tasks 2.7, 2.8
- Test 5.10 depends on completing implementation task 3.7
