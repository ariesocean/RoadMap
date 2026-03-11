# Design Document: User Guide English Improvement

## Overview
This design aims to improve the grammar, flow, and professional tone of the English section of `map-UserGuide.md` while maintaining compatibility with the application's roadmap rendering.

## Context
The `map-UserGuide.md` file contains a dual-language guide (English and Chinese). The application renders this file as a task list/roadmap. It is currently located in the `multi-users-prod` worktree.

## Design Details

### Content Changes
The English section will be updated to:
- Use active voice and complete sentences.
- Standardize action labels (e.g., using "Action:" for AI responses in examples).
- Clarify technical terms like "Session" and "Model Selection".
- Improve punctuation and overall readability.

### Structure Preservation
The following structure will be strictly preserved to ensure UI compatibility:
- Main title with creation date.
- Blockquote for the tagline.
- `## Subtasks` header.
- `* [ ]` and `- [ ]` bullet points for tasks and features.
- Hierarchy of tasks and subtasks.

## Verification Plan
1.  Verify the updated English section matches the approved design.
2.  Ensure the Chinese section remains untouched.
3.  Confirm the markdown structure follows the existing patterns.

## Status
- Approved by user: 2026-03-11
- Implementation: Pending implementation plan
