# Roadmap Manager Implementation Plan

**Goal:** Build a macOS native desktop app managing roadmap.md with Microsoft To Do-style UI.

**Architecture:** Tauri 2.0 + React 18 + TypeScript + Tailwind CSS + Zustand

---

## Tech Stack

- Desktop Framework: Tauri 2.0 (Rust)
- Frontend: React 18 + TypeScript
- Styling: Tailwind CSS + Framer Motion
- State: Zustand
- AI Integration: OpenCode headless server
- Build: Vite 5

---

## UI Design

### Color Palette

| Element | Color |
|---------|-------|
| Primary | #0078D4 |
| Background | #FFFFFF |
| Secondary | #F8F9FA |
| Text | #323130 |
| Border | #E1DFDD |

### Layout

```
┌─────────────────────────────────────────┐
│              Header (56px)               │
├─────────────────────────────────────────┤
│           Task List Area                │
├─────────────────────────────────────────┤
│            Input Area (~70px)           │
└─────────────────────────────────────────┘
```

---

## Implementation Phases

### Phase 1: Project Foundation
- Task 1: Create project structure (package.json, tsconfig, vite, tailwind)

### Phase 2: Type Definitions & Utilities
- Task 2: Create type definitions (Task, Subtask, etc.)
- Task 3: Create utility functions

### Phase 3: State Management
- Task 4: Implement Zustand store (taskStore.ts)

### Phase 4: OpenCode Integration
- Task 5: Implement API service (opencodeAPI.ts)
- Task 6: Implement file service (fileService.ts)

### Phase 5: React Components
- Task 7-12: Header, TaskCard, TaskList, SubtaskList, InputArea, App

### Phase 6: Hooks & Animations
- Task 13: Custom hooks (useOpenCode, useAnimations)

### Phase 7: Markdown Parser
- Task 14: markdownUtils.ts for parsing roadmap.md

### Phase 8: Testing & Polish
- Task 15-17: Styles, testing, completion checklist

---

## Summary

**Total Tasks:** 17 tasks across 8 phases

**Status:** Implementation complete

See full implementation details in project source code.
