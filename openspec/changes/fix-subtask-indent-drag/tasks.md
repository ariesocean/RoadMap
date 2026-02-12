## 1. Implementation

- [ ] 1.1 Add horizontal drag tracking in SubtaskList to detect indent/outdent intent
- [ ] 1.2 Implement level calculation logic with max one-level change constraint
- [ ] 1.3 Update handleDragEnd to compute new nestedLevel based on horizontal offset
- [ ] 1.4 Ensure visual feedback during drag shows intended indent level
- [ ] 1.5 Update markdownUtils to preserve correct indentation format in roadmap.md
- [ ] 1.6 Validate saved file structure matches navigate SKILL.md requirements

## 2. Validation

- [ ] 2.1 Test drag left (outdent) reduces nestedLevel by max 1
- [ ] 2.2 Test drag right (indent) increases nestedLevel by max 1
- [ ] 2.3 Verify nestedLevel never goes below 0
- [ ] 2.4 Verify saved roadmap.md maintains proper indentation format
- [ ] 2.5 Test reordering without horizontal movement preserves levels
