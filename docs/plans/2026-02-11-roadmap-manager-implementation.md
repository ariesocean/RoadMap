# Roadmap Manager Implementation Plan

> **For Opencode:** Use superpowers:executing-plans skill to implement this plan task-by-task.

**Goal:** Build a macOS native desktop app that manages roadmap.md with Microsoft To Do-style UI, integrating with OpenCode's navigate skill for natural language task management.

**Architecture:** Tauri 2.0 desktop app with React 18 frontend, Tailwind CSS styling, Zustand state management. App communicates with headless OpenCode server via HTTP API to execute navigate skill operations on roadmap.md.

**Tech Stack:**
- Desktop Framework: Tauri 2.0 (Rust)
- Frontend: React 18 + TypeScript
- Styling: Tailwind CSS + Framer Motion
- State: Zustand
- AI Integration: OpenCode headless server (navigate skill)
- Build Tool: Vite 5
- Package Manager: npm

---

## UI Design Specification

### Design Philosophy
Microsoft To Do-inspired design with:
- Minimalist aesthetics with generous whitespace
- Card-based layout for tasks
- Smooth micro-interactions and animations
- Clean, comfortable color scheme

### Color Palette

| Element | Color | Usage |
|---------|-------|-------|
| Primary | #0078D4 | Accent elements, completed checkboxes |
| Background | #FFFFFF | Main app background |
| Secondary Background | #F8F9FA | Input areas, subtle backgrounds |
| Card Background | #FFFFFF | Task cards |
| Primary Text | #323130 | Main text content |
| Secondary Text | #605E5C | Subtitles, metadata |
| Placeholder Text | #A19F9D | Input placeholders |
| Border Color | #E1DFDD | Input borders, dividers |
| Shadow | rgba(0, 0, 0, 0.08) | Card shadows |
| Hover Shadow | rgba(0, 0, 0, 0.12) | Card hover state |

### Typography
- Font Family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell
- Font Sizes:
  - Title: text-xl (20px), font-semibold
  - Body: text-sm (14px)
  - Caption: text-xs (12px)
- Line Height: Relaxed for readability

### Spacing System
- Card Padding: 16px (1rem)
- Card Margin Bottom: 12px
- Section Padding: 24px
- Input Padding: 12px-16px
- Gap Between Elements: 8px-12px

### Border Radius
- Cards: 8px
- Inputs: 8px
- Buttons: 4px-8px
- Checkboxes: 4px

### Shadows
- Card Default: box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08)
- Card Hover: box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12)
- Input Focus: ring-1, ring-primary

### Component Specifications

#### Header
- Height: 56px (py-4)
- Border: Bottom border, 1px solid #E1DFDD
- Layout: Flex row, space-between
- Logo: 32x32px, rounded corners
- Search Input: 192px (w-48), rounded-md

#### Task Card
- Padding: 16px
- Border Radius: 8px
- Border: 1px solid #F3F2F1
- Hover Effect: Slight lift (translateY -2px), shadow increase
- Content Order:
  1. Task Title (bold)
  2. Original Prompt (secondary color)
  3. Metadata row (created date, subtask count)
  4. Expand/Collapse button

#### Expand Button
- Size: 20x20px (w-5 h-5)
- Icon: Chevron arrow
- Animation: Rotate 180° on expand

#### Checkbox
- Size: 20x20px (w-5 h-5)
- Border: 2px solid #E1DFDD
- Checked State: Fill #0078D4, white checkmark
- Animation: Scale bounce, checkmark draw

#### Subtask List
- Indentation: 24px (ml-6) for nested
- Vertical Spacing: 4px-8px between items
- Hover Effect: Light gray background (#F8F9FA)

#### Input Area
- Position: Fixed bottom
- Height: ~60-70px
- Border: Top border, 1px solid #E1DFDD
- Shadow: 0 -2px 8px rgba(0, 0, 0, 0.05)
- Input Width: Full, max 800px centered
- Placeholder: "➕ Enter a prompt to create or update tasks..."

#### Empty State
- Icon: Task list illustration (gray)
- Primary Text: "No tasks yet"
- Secondary Text: "Enter a prompt below to create your first task"

### Animations (Framer Motion)

#### Card Entry Animation
- Type: slideIn
- Duration: 0.3s
- From: y: 20, opacity: 0
- To: y: 0, opacity: 1
- Stagger: 0.1s between cards

#### Checkbox Animation
- Type: spring
- Stiffness: 500
- Damping: 30
- Checkmark: scale 0 → 1, rotate -45° → 0

#### Expand/Collapse
- Type: height fade
- Duration: 0.2s
- Layout: smooth height transition

#### Loading Spinner
- Type: rotate
- Duration: 1s
- Easing: linear, infinite

#### Pulse Effect
- Scale: 1 → 1.05 → 1
- Opacity: 0.5 → 0.8 → 0.5
- Duration: 1s, infinite

### Layout Structure

```
┌─────────────────────────────────────────┐
│              Header (56px)              │ ← Fixed top
├─────────────────────────────────────────┤
│                                         │
│           Task List Area                │ ← Scrollable
│         (with bottom padding)           │
│                                         │
│                                         │
├─────────────────────────────────────────┤
│            Input Area (~70px)           │ ← Fixed bottom
│         (max-width: 800px)              │
└─────────────────────────────────────────┘
```

### Responsive Behavior
- Minimum Width: 600px
- Maximum Width: 1200px (centered on larger screens)
- Padding: 24px left/right
- Scrollbar: Thin styled (#E1DFDD)

### Accessibility
- Focus states on all interactive elements
- Keyboard navigation support
- Clear visual hierarchy
- Readable contrast ratios

---

## Phase 1: Project Foundation

### Task 1: Create Project Directory Structure

**Files to Create:**
- `roadmap-manager/package.json`
- `roadmap-manager/tsconfig.json`
- `roadmap-manager/vite.config.ts`
- `roadmap-manager/tailwind.config.js`
- `roadmap-manager/tailwind.css`
- `roadmap-manager/index.html`

**Steps:**
1. Create package.json with all required dependencies
2. Configure TypeScript compiler options
3. Set up Vite build configuration
4. Configure Tailwind CSS with custom theme colors
5. Create Tailwind CSS entry file
6. Create HTML entry point
7. Run npm install to install dependencies
8. Commit changes

---

### Task 2: Configure Tauri 2.0

**Files to Create:**
- `roadmap-manager/tauriconfig/Cargo.toml`
- `roadmap-manager/tauriconfig/tauri.conf.json`
- `roadmap-manager/tauriconfig/build.rs`
- `roadmap-manager/src/main.tsx`

**Steps:**
1. Create Cargo.toml with Tauri dependencies
2. Configure tauri.conf.json with app settings
3. Create build.rs script
4. Create React entry point main.tsx
5. Initialize Tauri project
6. Commit changes

---

## Phase 2: Type Definitions & Utilities

### Task 3: Define TypeScript Types

**Files to Create:**
- `roadmap-manager/src/store/types.ts`

**Steps:**
1. Define Task interface matching navigate skill structure
2. Define Subtask interface
3. Define OpenCode API response types
4. Define UI state types
5. Define Achievement interface for archived tasks
6. Commit changes

---

### Task 4: Create Utility Functions

**Files to Create:**
- `roadmap-manager/src/utils/dateUtils.ts`
- `roadmap-manager/src/utils/markdownUtils.ts`

**Steps:**
1. Create date formatting utilities
2. Create relative time formatting function
3. Create markdown parsing utilities
4. Create markdown generation utilities
5. Create ID extraction helper
6. Commit changes

---

## Phase 3: State Management

### Task 5: Implement Zustand Store

**Files to Create:**
- `roadmap-manager/src/store/taskStore.ts`

**Steps:**
1. Create TaskStore interface extending UIState
2. Implement tasks array storage
3. Add processing, prompt, error state
4. Implement setTasks action
5. Implement refreshTasks async action
6. Implement submitPrompt async action
7. Implement toggleSubtask async action
8. Create Zustand store instance
9. Commit changes

---

## Phase 4: OpenCode Integration

### Task 6: Create OpenCode API Service

**Files to Create:**
- `roadmap-manager/src/services/opencodeAPI.ts`

**Steps:**
1. Implement server health check function
2. Implement server start function
3. Implement prompt processing function
4. Implement tasks fetching function
5. Implement subtask toggle function
6. Add error handling for each function
7. Commit changes

---

### Task 7: Create File Service

**Files to Create:**
- `roadmap-manager/src/services/fileService.ts`

**Steps:**
1. Implement roadmap.md read function
2. Implement roadmap.md write function
3. Implement tasks loading function
4. Implement tasks saving function
5. Implement achievements read function
6. Add error handling
7. Commit changes

---

## Phase 5: React Components

### Task 8: Create Header Component

**Files to Create:**
- `roadmap-manager/src/components/Header.tsx`

**Steps:**
1. Create app logo/title section
2. Implement search bar with state
3. Add styling matching To Do design
4. Connect to Zustand store
5. Commit changes

---

### Task 9: Create Task Card Component

**Files to Create:**
- `roadmap-manager/src/components/TaskCard.tsx`

**Steps:**
1. Create task title display
2. Create original prompt display
3. Add created/updated timestamps
4. Implement expand/collapse button
5. Integrate Framer Motion animations
6. Add hover effects
7. Connect subtask list
8. Connect to Zustand store
9. Commit changes

---

### Task 10: Create Subtask List Component

**Files to Create:**
- `roadmap-manager/src/components/SubtaskList.tsx`

**Steps:**
1. Create subtask item rendering
2. Implement checkbox UI
3. Add Framer Motion checkmark animation
4. Handle indentation for nested subtasks
5. Connect toggle handler
6. Commit changes

---

### Task 11: Create Task List Component

**Files to Create:**
- `roadmap-manager/src/components/TaskList.tsx`

**Steps:**
1. Implement task filtering by search query
2. Create loading state display
3. Create empty state display
4. Add Framer Motion list animations
5. Connect to Zustand store
6. Implement auto-refresh
7. Commit changes

---

### Task 12: Create Input Area Component

**Files to Create:**
- `roadmap-manager/src/components/InputArea.tsx`

**Steps:**
1. Create text input field
2. Implement form submission handling
3. Add loading spinner animation
4. Display error messages
5. Connect to Zustand store
6. Add keyboard support
7. Commit changes

---

### Task 13: Create Main App Component

**Files to Create:**
- `roadmap-manager/src/components/App.tsx`

**Steps:**
1. Create app layout structure
2. Add Header component
3. Add TaskList component
4. Add InputArea component
5. Add padding for fixed input area
6. Commit changes

---

## Phase 6: Hooks & Animations

### Task 14: Create Custom Hooks

**Files to Create:**
- `roadmap-manager/src/hooks/useOpenCode.ts`
- `roadmap-manager/src/hooks/useAnimations.ts`

**Steps:**
1. Implement OpenCode connection hook
2. Implement connection checking interval
3. Define Framer Motion card variants
4. Define checkbox animation variants
5. Define checkmark animation variants
6. Define pulse animation variants
7. Commit changes

---

## Phase 7: Markdown Parser

### Task 15: Implement Markdown Parser

**Files to Modify:**
- `roadmap-manager/src/utils/markdownUtils.ts`

**Steps:**
1. Implement main task parsing from #
2. Implement original prompt parsing from >
3. Implement subtask parsing from * [ ]
4. Implement completed subtask parsing from * [x]
5. Implement nested subtask parsing
6. Implement markdown generation from tasks
7. Implement ID extraction
8. Commit changes

---

## Phase 8: Testing & Polish

### Task 16: Add Global Styles

**Files to Modify:**
- `roadmap-manager/src/styles/index.css`

**Steps:**
1. Add Tailwind directives
2. Define custom color palette
3. Add component classes for cards and buttons
4. Add scrollbar styling
5. Commit changes

---

### Task 17: Create Completion Checklist

**Files to Create:**
- `roadmap-manager/CHECKLIST.md`

**Steps:**
1. Create phase-by-phase checklist
2. Add verification steps
3. Document expected outcomes
4. Commit changes

---

## Summary

**Total Tasks:** 17

**Phase Distribution:**
- Phase 1: 2 tasks (Project Foundation)
- Phase 2: 2 tasks (Type Definitions & Utilities)
- Phase 3: 1 task (State Management)
- Phase 4: 2 tasks (OpenCode Integration)
- Phase 5: 6 tasks (React Components)
- Phase 6: 1 task (Hooks & Animations)
- Phase 7: 1 task (Markdown Parser)
- Phase 8: 2 tasks (Testing & Polish)

**Estimated Time:** 3-4 hours for implementation

**Next Steps:**
1. Execute tasks in order using superpowers:executing-plans skill
2. Each task should be implemented step by step
3. Verify OpenCode server integration before component work
4. Test markdown parser with real roadmap.md content

---

**Plan complete and saved to `docs/plans/2026-02-11-roadmap-manager-implementation.md`.**

**Two execution options:**

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

**Which approach?**
