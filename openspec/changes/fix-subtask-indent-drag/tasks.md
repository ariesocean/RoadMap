## 1. Frontend Implementation
- [ ] 1.1 Add hierarchy detection during drag (on top, between, after)
- [ ] 1.2 Implement visual indentation preview during drag
- [ ] 1.3 Limit hierarchy change to max ±1 level
- [ ] 1.4 Handle child subtree traversal (children follow parent)

## 2. Store Implementation
- [ ] 2.1 Update reorderSubtasks to handle nestedLevel changes
- [ ] 2.2 Add validation: max ±1 level change
- [ ] 2.3 Add validation: max nesting level (6)
- [ ] 2.4 Add cycle detection

## 3. Persistence
- [ ] 3.1 Update markdown with correct 2-space indentation
- [ ] 3.2 Preserve all metadata (timestamps, completion status)

## 4. Testing
- [ ] 4.1 Test hierarchy changes (±1 level)
- [ ] 4.2 Test same-level reordering
- [ ] 4.3 Test roadmap.md structure validity
- [ ] 4.4 Test children follow parent
- [ ] 4.5 Test cycle prevention
