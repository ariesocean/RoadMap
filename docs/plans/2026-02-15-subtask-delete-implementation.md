# Subtask Deletion Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement feature to manually delete subtasks by clearing input field, clicking Delete button, and syncing to roadmap.md. Parent task collapses when last subtask is deleted.

**Architecture:** Extend existing TaskStore with deleteSubtask action, add markdown utility function, modify SubtaskItemContent component to show Delete button when input is empty. Follow TDD with failing tests first.

**Tech Stack:** React, TypeScript, Zustand (store), dnd-kit (UI), Lucide React (icons)

---

## Prerequisites

Before starting, ensure:
1. Current work is committed
2. Feature branch created from master
3. Development server runs: `cd roadmap-manager && npm run dev`
4. Test file exists: `roadmap-manager/src/components/__tests__/SubtaskList.test.tsx`

---

## Task 1: Add deleteSubtaskFromMarkdown Utility Function

**Files:**
- Modify: `roadmap-manager/src/utils/markdownUtils.ts`
- Test: `roadmap-manager/src/utils/__tests__/markdownUtils.test.tsx`

**Step 1: Write failing test**

```typescript
// roadmap-manager/src/utils/__tests__/markdownUtils.test.tsx

import { deleteSubtaskFromMarkdown } from '../markdownUtils';

describe('deleteSubtaskFromMarkdown', () => {
  it('should remove a subtask line from markdown', () => {
    const input = `# Task Title
> description

- [ ] Subtask 1
- [ ] Subtask to delete
- [ ] Subtask 3
`;

    const result = deleteSubtaskFromMarkdown(input, 'Subtask to delete');
    
    expect(result).not.toContain('Subtask to delete');
    expect(result).toContain('Subtask 1');
    expect(result).toContain('Subtask 3');
  });

  it('should handle nested subtasks', () => {
    const input = `# Task Title
- [ ] Parent 1
- [ ] Parent to delete
  - [ ] Nested 1
  - [ ] Nested 2
`;

    const result = deleteSubtaskFromMarkdown(input, 'Parent to delete');
    
    expect(result).not.toContain('Parent to delete');
    expect(result).toContain('Parent 1');
    expect(result).toContain('Nested 1');
  });

  it('should preserve indentation for remaining subtasks', () => {
    const input = `# Task Title
- [ ] Subtask 1
- [ ] Subtask to delete
  - [ ] Nested subtask
`;

    const result = deleteSubtaskFromMarkdown(input, 'Subtask to delete');
    
    expect(result).not.toContain('Subtask to delete');
    expect(result).toContain('Nested subtask');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd roadmap-manager && npm test -- --testPathPattern="markdownUtils.test" --verbose`
Expected: FAIL - "deleteSubtaskFromMarkdown is not a function"

**Step 3: Write minimal implementation**

```typescript
// Add at end of roadmap-manager/src/utils/markdownUtils.ts

export function deleteSubtaskFromMarkdown(
  markdown: string,
  subtaskContent: string
): string {
  const lines = markdown.split('\n');

  const updatedLines = lines.filter(line => {
    const subtaskMatch = line.match(/^(\s*)[-*] (\[[ x]\])(.+)$/);
    if (subtaskMatch) {
      const content = subtaskMatch[3].trim();
      return content !== subtaskContent;
    }
    return true;
  });

  return updatedLines.join('\n');
}
```

**Step 4: Run test to verify it passes**

Run: `cd roadmap-manager && npm test -- --testPathPattern="markdownUtils.test" --verbose`
Expected: PASS

**Step 5: Commit**

```bash
git add roadmap-manager/src/utils/markdownUtils.ts roadmap-manager/src/utils/__tests__/markdownUtils.test.tsx
git commit -m "feat: add deleteSubtaskFromMarkdown utility function"
```

---

## Task 2: Add deleteSubtask Action to TaskStore

**Files:**
- Modify: `roadmap-manager/src/store/taskStore.ts`
- Test: `roadmap-manager/src/store/__tests__/taskStore.test.tsx`

**Step 1: Write failing test**

```typescript
// roadmap-manager/src/store/__tests__/taskStore.test.tsx

import { renderHook, act } from '@testing-library/react';
import { useTaskStore } from '../taskStore';
import { Task, Subtask } from '../types';

// Mock the markdown utilities
jest.mock('../../utils/markdownUtils', () => ({
  ...jest.requireActual('../../utils/markdownUtils'),
  deleteSubtaskFromMarkdown: jest.fn((markdown, content) => markdown),
}));

describe('deleteSubtask', () => {
  const mockTask: Task = {
    id: 'task-1',
    title: 'Test Task',
    originalPrompt: 'Test prompt',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    subtasks: [
      { id: 'subtask-1', content: 'Subtask 1', completed: false, nestedLevel: 0 },
      { id: 'subtask-2', content: 'Subtask to delete', completed: false, nestedLevel: 0 },
      { id: 'subtask-3', content: 'Subtask 3', completed: true, nestedLevel: 0 },
    ],
    completedSubtasks: 1,
    totalSubtasks: 3,
    isExpanded: true,
  };

  beforeEach(() => {
    useTaskStore.setState({ tasks: [mockTask] });
  });

  it('should remove subtask from task', async () => {
    const { result } = renderHook(() => useTaskStore());

    await act(async () => {
      await result.current.deleteSubtask('task-1', 'subtask-2');
    });

    const updatedTask = result.current.tasks[0];
    expect(updatedTask.subtasks).toHaveLength(2);
    expect(updatedTask.subtasks.find(s => s.id === 'subtask-2')).toBeUndefined();
  });

  it('should update totalSubtasks count', async () => {
    const { result } = renderHook(() => useTaskStore());

    await act(async () => {
      await result.current.deleteSubtask('task-1', 'subtask-2');
    });

    const updatedTask = result.current.tasks[0];
    expect(updatedTask.totalSubtasks).toBe(2);
  });

  it('should not change completedSubtasks when deleting uncompleted', async () => {
    const { result } = renderHook(() => useTaskStore());

    await act(async () => {
      await result.current.deleteSubtask('task-1', 'subtask-2');
    });

    const updatedTask = result.current.tasks[0];
    expect(updatedTask.completedSubtasks).toBe(1);
  });

  it('should decrement completedSubtasks when deleting completed subtask', async () => {
    await act(async () => {
      await useTaskStore.getState().deleteSubtask('task-1', 'subtask-3');
    });

    const updatedTask = useTaskStore.getState().tasks[0];
    expect(updatedTask.completedSubtasks).toBe(0);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd roadmap-manager && npm test -- --testPathPattern="taskStore.test" --verbose`
Expected: FAIL - "deleteSubtask is not a function"

**Step 3: Write minimal implementation**

```typescript
// Add to roadmap-manager/src/store/taskStore.ts

// Add to imports
import { deleteSubtaskFromMarkdown } from '@/utils/markdownUtils';

// Add to TaskStore interface in types.ts
deleteSubtask: (taskId: string, subtaskId: string) => Promise<void>;

// Add implementation in taskStore.ts
deleteSubtask: async (taskId: string, subtaskId: string) => {
  const { setError, tasks, setTasks } = get();

  try {
    setError(null);

    const targetTask = tasks.find(t => t.id === taskId);
    if (!targetTask) return;

    const targetSubtask = targetTask.subtasks.find(s => s.id === subtaskId);
    if (!targetSubtask) return;

    const updatedSubtasks = targetTask.subtasks.filter(s => s.id !== subtaskId);
    const completedSubtasks = updatedSubtasks.filter(s => s.completed).length;

    const updatedTasks = tasks.map(task => {
      if (task.id === taskId) {
        return {
          ...task,
          subtasks: updatedSubtasks,
          totalSubtasks: updatedSubtasks.length,
          completedSubtasks,
        };
      }
      return task;
    });

    setTasks(updatedTasks);

    const content = await readRoadmapFile();
    const updatedMarkdown = deleteSubtaskFromMarkdown(content, targetSubtask.content);
    await writeRoadmapFile(updatedMarkdown);
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Failed to delete subtask');
  }
},
```

**Step 4: Run test to verify it passes**

Run: `cd roadmap-manager && npm test -- --testPathPattern="taskStore.test" --verbose`
Expected: PASS

**Step 5: Commit**

```bash
git add roadmap-manager/src/store/taskStore.ts roadmap-manager/src/store/__tests__/taskStore.test.tsx
git commit -m "feat: add deleteSubtask action to TaskStore"
```

---

## Task 3: Add Delete Button UI to SubtaskItemContent

**Files:**
- Modify: `roadmap-manager/src/components/SubtaskList.tsx`
- Test: `roadmap-manager/src/components/__tests__/SubtaskList.test.tsx`

**Step 1: Write failing test**

```typescript
// roadmap-manager/src/components/__tests__/SubtaskList.test.tsx

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SubtaskItemContent } from '../SubtaskList';
import { useTaskStore } from '@/store/taskStore';
import type { Subtask } from '@/store/types';

const mockSubtask: Subtask = {
  id: 'subtask-1',
  content: 'Test subtask',
  completed: false,
  nestedLevel: 0,
};

describe('SubtaskItemContent Delete Button', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show delete button when editing and input is empty', async () => {
    const onDeleteMock = vi.fn();
    render(
      <SubtaskItemContent
        subtask={mockSubtask}
        taskId="task-1"
      />
    );

    // Click to edit
    fireEvent.click(screen.getByText('Test subtask'));
    
    // Clear input
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '' } });
    
    // Press Enter
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
    });
  });

  it('should not show delete button when editing and input has content', () => {
    render(
      <SubtaskItemContent
        subtask={mockSubtask}
        taskId="task-1"
      />
    );

    // Click to edit
    fireEvent.click(screen.getByText('Test subtask'));
    
    // Input still has content
    const input = screen.getByRole('textbox');
    expect(input).toHaveValue('Test subtask');

    // Delete button should not appear
    expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
  });

  it('should call deleteSubtask when delete button is clicked', async () => {
    render(
      <SubtaskItemContent
        subtask={mockSubtask}
        taskId="task-1"
      />
    );

    // Click to edit
    fireEvent.click(screen.getByText('Test subtask'));
    
    // Clear input and press Enter
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    // Click delete button
    await waitFor(() => {
      const deleteBtn = screen.getByRole('button', { name: /delete/i });
      fireEvent.click(deleteBtn);
    });

    expect(useTaskStore.getState().deleteSubtask).toHaveBeenCalledWith('task-1', 'subtask-1');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd roadmap-manager && npm test -- --testPathPattern="SubtaskList.test" --verbose`
Expected: FAIL - multiple errors about missing delete button

**Step 3: Write minimal implementation**

```typescript
// roadmap-manager/src/components/SubtaskList.tsx

// Update imports
import { Check, Pencil, Trash } from 'lucide-react';

// In SubtaskItemContent component, add state
const [showDeleteButton, setShowDeleteButton] = useState(false);

// Update handleKeyDown
const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
  e.stopPropagation();
  if (e.key === 'Enter') {
    if (editValue.trim() === '') {
      setShowDeleteButton(true);
      return;
    }
    if (editValue.trim() && editValue !== subtask.content) {
      await updateSubtaskContent(taskId, subtask.id, editValue.trim());
    }
    setIsEditing(false);
    setShowDeleteButton(false);
  } else if (e.key === 'Escape') {
    setIsEditing(false);
    setEditValue(subtask.content);
    setShowDeleteButton(false);
  }
};

// Update handleBlur
const handleBlur = async () => {
  if (editValue.trim() && editValue !== subtask.content) {
    await updateSubtaskContent(taskId, subtask.id, editValue.trim());
  }
  if (!editValue.trim()) {
    setShowDeleteButton(true);
    return;
  }
  setIsEditing(false);
  setShowDeleteButton(false);
};

// Add delete handler
const handleDelete = async () => {
  const { deleteSubtask } = useTaskStore();
  await deleteSubtask(taskId, subtask.id);
  setIsEditing(false);
  setShowDeleteButton(false);
};

// Update input JSX
<input
  ref={inputRef}
  type="text"
  value={editValue}
  onChange={handleInputChange}
  onKeyDown={handleKeyDown}
  onBlur={handleBlur}
  onMouseDown={(e) => e.stopPropagation()}
  className="flex-1 text-sm bg-white dark:bg-dark-secondary-bg border border-primary rounded px-2 py-1 outline-none text-primary-text dark:text-dark-primary-text pr-8"
/>

// Add Delete button inside input container
{isEditing && (
  <div className="absolute right-2 top-1/2 -translate-y-1/2">
    {showDeleteButton ? (
      <button
        onClick={handleDelete}
        className="p-1 text-red-500 hover:text-red-600 transition-colors"
        title="Delete subtask"
      >
        <Trash className="w-4 h-4" />
      </button>
    ) : (
      <div className="w-4" />
    )}
  </div>
)}
```

**Step 4: Run test to verify it passes**

Run: `cd roadmap-manager && npm test -- --testPathPattern="SubtaskList.test" --verbose`
Expected: PASS

**Step 5: Commit**

```bash
git add roadmap-manager/src/components/SubtaskList.tsx roadmap-manager/src/components/__tests__/SubtaskList.test.tsx
git commit -m "feat: add delete button UI to SubtaskItemContent"
```

---

## Task 4: Handle Last Subtask Collapse

**Files:**
- Modify: `roadmap-manager/src/components/SubtaskList.tsx`

**Step 1: Write failing test**

```typescript
// Add to SubtaskList.test.tsx

it('should collapse parent task when last subtask is deleted', async () => {
  const singleSubtask: Subtask = {
    id: 'only-subtask',
    content: 'Only subtask',
    completed: false,
    nestedLevel: 0,
  };

  const taskWithOneSubtask: Task = {
    id: 'task-1',
    title: 'Test Task',
    originalPrompt: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    subtasks: [singleSubtask],
    completedSubtasks: 0,
    totalSubtasks: 1,
    isExpanded: true,
  };

  useTaskStore.setState({ tasks: [taskWithOneSubtask] });

  render(
    <SubtaskList
      subtasks={[singleSubtask]}
      taskId="task-1"
    />
  );

  // Click to edit
  const subtaskText = screen.getByText('Only subtask');
  fireEvent.click(subtaskText);

  // Clear input and press Enter
  const input = screen.getByRole('textbox');
  fireEvent.change(input, { target: { value: '' } });
  fireEvent.keyDown(input, { key: 'Enter' });

  // Click delete button
  await waitFor(() => {
    const deleteBtn = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(deleteBtn);
  });

  // Task should be collapsed
  const updatedTask = useTaskStore.getState().tasks[0];
  expect(updatedTask.isExpanded).toBe(false);
});
```

**Step 2: Run test to verify it fails**

Run: `cd roadmap-manager && npm test -- --testPathPattern="SubtaskList.test" --verbose`
Expected: FAIL - isExpanded not being set to false

**Step 3: Write minimal implementation**

```typescript
// In SubtaskItemContent, update handleDelete
const handleDelete = async () => {
  const { deleteSubtask, tasks } = useTaskStore.getState();
  
  await deleteSubtask(taskId, subtask.id);
  
  // Check if this was the last subtask
  const updatedTask = tasks.find(t => t.id === taskId);
  if (updatedTask && updatedTask.subtasks.length === 0) {
    useTaskStore.getState().toggleTaskExpanded(taskId);
  }
  
  setIsEditing(false);
  setShowDeleteButton(false);
};
```

**Step 4: Run test to verify it passes**

Run: `cd roadmap-manager && npm test -- --testPathPattern="SubtaskList.test" --verbose`
Expected: PASS

**Step 5: Commit**

```bash
git add roadmap-manager/src/components/SubtaskList.tsx
git commit -m "feat: collapse parent task when last subtask deleted"
```

---

## Task 5: Integration Testing

**Files:**
- Test: `roadmap-manager/src/components/__tests__/SubtaskList.integration.test.tsx`

**Step 1: Write integration test**

```typescript
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { SubtaskList } from '../SubtaskList';
import { useTaskStore } from '@/store/taskStore';
import type { Task } from '@/store/types';

// Mock all external services
jest.mock('../../services/fileService', () => ({
  readRoadmapFile: jest.fn(),
  writeRoadmapFile: jest.fn(),
}));

jest.mock('../../utils/markdownUtils', () => ({
  ...jest.requireActual('../../utils/markdownUtils'),
  deleteSubtaskFromMarkdown: jest.fn((m, c) => m),
}));

describe('Subtask Deletion Integration', () => {
  const mockTask: Task = {
    id: 'task-1',
    title: 'Integration Test Task',
    originalPrompt: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    subtasks: [
      { id: 's1', content: 'Subtask 1', completed: false, nestedLevel: 0 },
      { id: 's2', content: 'Subtask 2', completed: false, nestedLevel: 0 },
    ],
    completedSubtasks: 0,
    totalSubtasks: 2,
    isExpanded: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useTaskStore.setState({ tasks: [mockTask] });
  });

  it('should delete subtask and sync to file', async () => {
    const { readRoadmapFile, writeRoadmapFile } = require('../../services/fileService');
    readRoadmapFile.mockResolvedValue('markdown content');
    writeRoadmapFile.mockResolvedValue();

    render(<SubtaskList subtasks={mockTask.subtasks} taskId="task-1" />);

    // Edit second subtask
    const subtask2 = screen.getByText('Subtask 2');
    fireEvent.click(subtask2);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    // Click delete
    await waitFor(() => {
      const deleteBtn = screen.getByRole('button', { name: /delete/i });
      fireEvent.click(deleteBtn);
    });

    // Verify file sync
    await waitFor(() => {
      expect(writeRoadmapFile).toHaveBeenCalled();
    });
  });

  it('should keep task expanded when deleting non-last subtask', async () => {
    render(<SubtaskList subtasks={mockTask.subtasks} taskId="task-1" />);

    // Edit first subtask
    const subtask1 = screen.getByText('Subtask 1');
    fireEvent.click(subtask1);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() => {
      const deleteBtn = screen.getByRole('button', { name: /delete/i });
      fireEvent.click(deleteBtn);
    });

    // Task should still be expanded (has remaining subtask)
    expect(useTaskStore.getState().tasks[0].isExpanded).toBe(true);
  });
});
```

**Step 2: Run integration test**

Run: `cd roadmap-manager && npm test -- --testPathPattern="SubtaskList.integration" --verbose`
Expected: PASS

**Step 3: Commit**

```bash
git add roadmap-manager/src/components/__tests__/SubtaskList.integration.test.tsx
git commit -m "test: add integration tests for subtask deletion"
```

---

## Task 6: Manual Testing Checklist

Run these tests in browser after implementation:

- [ ] Open a task with subtasks
- [ ] Click a subtask to edit, clear the input, press Enter
- [ ] Verify Delete button appears (Trash icon, red)
- [ ] Click Delete button
- [ ] Verify subtask is removed from UI
- [ ] Verify roadmap.md is updated
- [ ] Delete remaining subtask
- [ ] Verify parent task collapses
- [ ] Try pressing Enter on empty input without clicking Delete (should stay in edit mode)
- [ ] Try clicking outside (blur) on empty input (should stay in edit mode)
- [ ] Edit subtask with content, blur (should save and exit edit mode)

---

## Summary of Changes

| File | Change Type |
|------|-------------|
| `roadmap-manager/src/utils/markdownUtils.ts` | Add `deleteSubtaskFromMarkdown` function |
| `roadmap-manager/src/store/taskStore.ts` | Add `deleteSubtask` action |
| `roadmap-manager/src/components/SubtaskList.tsx` | Add Delete button UI, handle deletion logic |
| Test files | Add unit and integration tests |

---

**Plan complete and saved to `docs/plans/2026-02-15-subtask-delete-implementation.md`.**

**Two execution options:**

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

**Which approach?**
