## 1. Implementation
- [x] 1.1 Read current `lastEditedMapId` from store in `handleMapSelect`
- [x] 1.2 Add guard condition: skip archive if `lastEditedMapId !== currentMap.id`
- [x] 1.3 Add console log for skipped archive (debugging/visibility)
- [x] 1.4 Add toast notification when archive is skipped (user awareness)

## 2. Testing
- [ ] 2.1 Manual test: Single device map switch (verify unchanged behavior)
- [ ] 2.2 Manual test: Simulate multi-device conflict scenario
- [ ] 2.3 Verify toast notifications appear correctly

## 3. Validation
- [x] 3.1 Run `openspec validate prevent-multi-device-data-loss --strict`
- [ ] 3.2 Update spec delta if edge cases discovered during testing
