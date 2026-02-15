# Task Description Edit Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add double-click to edit functionality for task description (`originalPrompt`) in TaskCard, syncing changes to roadmap.md.

**Architecture:** Add editing state to TaskCard component, add updateTaskDescription method to taskStore, add markdown utility function to update description in file.

**Tech Stack:** React (Zustand), TypeScript, dnd-kit

---

### Task 1: Add updateTaskDescription method to taskStore

**Files:**
- Modify: `roadmap-manager/src/store/taskStore.ts:420-435`
- Modify: `roadmap-manager/src/store/types.ts:75-96`

**Step 1: Add method signature to types**

Open `roadmap-manager/src/store/types.ts` and add to `TaskStore` interface:
```typescript
updateTaskDescription: (taskId: string, description: string) => Promise<void>;
```

**Step 2: Add updateTaskDescription implementation**

Open `roadmap-manager/src/store/taskStore.ts`, add import:
```typescript
import { updateTaskDescriptionInMarkdown } from '@/utils/markdownUtils';
```

Add method before `reorderTasks`:
```typescript
updateTaskDescription: async (taskId: string, description: string) => {
  const { setError, tasks, setTasks } = get();

  try {
    setError(null);

    const targetTask = tasks.find(t => t.id === taskId);
    if (!targetTask) return;
    if (targetTask.originalPrompt === description) return;

    const updatedTasks = tasks.map(task => {
      if (task.id === taskId) {
        return { ...task, originalPrompt: description };
      }
      return task;
    });

    setTasks(updatedTasks);

    const content = await readRoadmapFile();
    const updatedMarkdown = updateTaskDescriptionInMarkdown(content, targetTask.title, description);
    await writeRoadmapFile(updatedMarkdown);
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Failed to update task description');
  }
},
```

**Step 3: Commit**

```bash
git add roadmap-manager/src/store/taskStore.ts roadmap-manager/src/store/types.ts
git commit -m "feat: add updateTaskDescription method to taskStore"
```

---

### Task 2: Add updateTaskDescriptionInMarkdown utility

**Files:**
- Modify: `roadmap-manager/src/utils/markdownUtils.ts:355-358`

**Step 1: Add utility function**

Open `roadmap-manager/src/utils/markdownUtils.ts`, add at end:
```typescript
export function updateTaskDescriptionInMarkdown(
  markdown: string,
  taskTitle: string,
  newDescription: string
): string {
  const lines = markdown.split('\n');
  let inTargetTask = false;
  let descriptionUpdated = false;
  let taskStartIndex = -1;
  let promptLineIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('## Achievements')) {
      if (inTargetTask) break;
      continue;
    }

    const taskMatch = line.match(/^# (.+)$/);
    if (taskMatch) {
      const title = taskMatch[1].trim();
      const { title: cleanTitle } = extractCreatedDate(title);

      if (cleanTitle === taskTitle) {
        inTargetTask = true;
        taskStartIndex = i;
      } else if (inTargetTask) {
        break;
      }
      continue;
    }

    if (inTargetTask) {
      const promptMatch = line.match(/^> (.+)$/);
      if (promptMatch) {
        promptLineIndex = i;
        if (newDescription) {
          lines[i] = `> ${newDescription}`;
        } else {
          lines[i] = '';
        }
        descriptionUpdated = true;
        continue;
      }

      const subtaskMatch = line.match(/^(\s*)[-*] (\[[ x]\])(.+)$/);
      if (subtaskMatch || line.match(/^##\s+Subtasks?$/i)) {
        if (newDescription && promptLineIndex === -1) {
          const insertIndex = lines.slice(0, i).filter(l => l.trim()).length > taskStartIndex + 1 ? i : taskStartIndex + 1;
          lines.splice(insertIndex, 0, `> ${newDescription}`);
          descriptionUpdated = true;
        }
        break;
      }
    }
  }

  if (!descriptionUpdated && newDescription && taskStartIndex !== -1) {
    lines.splice(taskStartIndex + 1, 0, `> ${newDescription}`);
  }

  return lines.join('\n');
}
```

**Step 2: Run typecheck**

Run: `cd roadmap-manager && npm run typecheck`
Expected: PASS (no errors)

**Step 3: Commit**

```bash
git add roadmap-manager/src/utils/markdownUtils.ts
git commit -m "feat: add updateTaskDescriptionInMarkdown utility"
```

---

### Task 3: Add double-click edit to TaskCard

**Files:**
- Modify: `roadmap-manager/src/components/TaskCard.tsx:1-118`

**Step 1: Add state and handlers**

In `TaskCard.tsx`, add imports:
```typescript
import { useState, useRef, useEffect } from 'react';
```

Add to component, after `toggleTaskExpanded`:
```typescript
const [isEditingDescription, setIsEditingDescription] = useState(false);
const [editDescription, setEditDescription] = useState(task.originalPrompt);
const descriptionInputRef = useRef<HTMLInputElement>(null);

useEffect(() => {
  setEditDescription(task.originalPrompt);
}, [task.originalPrompt]);

useEffect(() => {
  if (isEditingDescription && descriptionInputRef.current) {
    descriptionInputRef.current.focus();
    descriptionInputRef.current.select();
  }
}, [isEditingDescription]);

const handleDescriptionDoubleClick = (e: React.MouseEvent) => {
  e.stopPropagation();
  setIsEditingDescription(true);
  setEditDescription(task.originalPrompt);
};

const handleDescriptionKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
  if (e.key === 'Enter') {
    if (editDescription.trim() !== task.originalPrompt) {
      await updateTaskDescription(task.id, editDescription.trim());
    }
    setIsEditingDescription(false);
  } else if (e.key === 'Escape') {
    setIsEditingDescription(false);
    setEditDescription(task.originalPrompt);
  }
};

const handleDescriptionBlur = async () => {
  if (editDescription.trim() !== task.originalPrompt) {
    await updateTaskDescription(task.id, editDescription.trim());
  }
  setIsEditingDescription(false);
};
```

**Step 2: Add updateTaskDescription to store destructuring**

Update line 17:
```typescript
const { toggleTaskExpanded, updateTaskDescription } = useTaskStore();
```

**Step 3: Replace description display with editable input**

Replace lines 59-63 (the description display):
```tsx
{task.originalPrompt ? (
  isEditingDescription ? (
    <input
      ref={descriptionInputRef}
      type="text"
      value={editDescription}
      onChange={(e) => setEditDescription(e.target.value)}
      onKeyDown={handleDescriptionKeyDown}
      onBlur={handleDescriptionBlur}
      onClick={(e) => e.stopPropagation()}
      className="flex-1 text-sm bg-white dark:bg-dark-secondary-bg border border-primary rounded px-2 py-1 outline-none text-primary-text dark:text-dark-primary-text italic w-full"
    />
  ) : (
    <p
      className="text-sm text-secondary-text dark:text-dark-secondary-text mb-2 italic transition-colors duration-300 cursor-text"
      onDoubleClick={handleDescriptionDoubleClick}
    >
      "{task.originalPrompt}"
    </p>
  )
) : null}
```

**Step 4: Run typecheck**

Run: `cd roadmap-manager && npm run typecheck`
Expected: PASS (no errors)

**Step 5: Test manually**

Run: `cd roadmap-manager && npm run dev`
- Open app, find any task with description
- Double-click the description area
- Edit and press Enter
- Verify changes persist in roadmap.md

**Step 6: Commit**

```bash
git add roadmap-manager/src/components/TaskCard.tsx
git commit -m "feat: add double-click edit for task description"
```

---

**Plan complete and saved to `docs/plans/2026-02-15-task-description-edit-implementation.md`.**

Two execution options:

1. **Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

2. **Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

Which approach?
