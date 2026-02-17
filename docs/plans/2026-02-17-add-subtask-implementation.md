# Task Card 添加 Subtask 功能实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 在展开的 Task Card 底部添加 hover 触发的添加 subtask 功能

**Architecture:** 通过更新 SubtaskList 组件添加底部 hover 区域，在 taskStore 中实现 addSubtask 方法，使用 markdownUtils 追加新 subtask 到 roadmap.md 文件。

**Tech Stack:** React, TypeScript, Zustand, @dnd-kit, Framer Motion, Lucide React

---

## 前置检查

**Step 1: 确认设计文档**

确认设计文档存在并理解需求：
- 文件: `docs/plans/2026-02-17-add-subtask-design.md`
- 核心需求：Task Card 展开后支持底部添加新 subtask

**Step 2: 检查现有文件结构**

确认以下文件存在：
- `src/store/types.ts`
- `src/utils/markdownUtils.ts`
- `src/store/taskStore.ts`
- `src/components/SubtaskList.tsx`

---

## Task 1: 更新类型定义 (types.ts)

**Files:**
- Modify: `src/store/types.ts:75-98`

**Step 1: 添加 addSubtask 方法到 TaskStore 接口**

```typescript
export interface TaskStore extends UIState {
  // ... existing properties and methods ...
  
  // Add new method for adding subtasks
  addSubtask: (taskId: string, content: string, nestedLevel?: number) => Promise<void>;
}
```

**Step 2: 验证类型定义**

确保 TypeScript 编译无错误：
```bash
cd /Users/SparkingAries/VibeProjects/RoadMap/roadmap-manager && npx tsc --noEmit
```

Expected: No errors

**Step 3: Commit**

```bash
git add src/store/types.ts
git commit -m "feat(types): add addSubtask method to TaskStore interface"
```

---

## Task 2: 添加 Markdown 工具函数 (markdownUtils.ts)

**Files:**
- Modify: `src/utils/markdownUtils.ts:471-472`

**Step 1: 在文件末尾添加 appendSubtaskToMarkdown 函数**

在最后一个函数 `deleteSubtaskFromMarkdown` 后添加：

```typescript
export function appendSubtaskToMarkdown(
  markdown: string,
  taskTitle: string,
  newSubtask: Subtask
): string {
  const lines = markdown.split('\n');
  let inTargetTask = false;
  let inAchievements = false;
  let taskStartIndex = -1;
  let lastSubtaskIndex = -1;
  let hasSubtasksHeader = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('## Achievements')) {
      inAchievements = true;
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
      } else if (inTargetTask && !inAchievements) {
        break;
      }
      continue;
    }

    if (inTargetTask && !inAchievements) {
      // Check for Subtasks header
      if (line.match(/^##\s+Subtasks?$/i)) {
        hasSubtasksHeader = true;
        continue;
      }

      // Track last subtask position
      const subtaskMatch = line.match(/^(\s*)[-*] (\[[ x]\])(.+)$/);
      if (subtaskMatch) {
        lastSubtaskIndex = i;
        continue;
      }
    }
  }

  if (taskStartIndex === -1) {
    return markdown;
  }

  // Build new subtask line
  const indent = '  '.repeat(Math.min(newSubtask.nestedLevel, 6));
  const newSubtaskLine = `${indent}* [ ] ${newSubtask.content}`;

  // Determine insert position
  let insertIndex;
  if (lastSubtaskIndex !== -1) {
    // Insert after last subtask
    insertIndex = lastSubtaskIndex + 1;
  } else if (hasSubtasksHeader) {
    // Insert after Subtasks header
    const subtasksHeaderIndex = lines.findIndex((line, idx) => 
      idx > taskStartIndex && line.match(/^##\s+Subtasks?$/i)
    );
    insertIndex = subtasksHeaderIndex + 1;
  } else {
    // No Subtasks header yet, need to add it
    let insertPos = taskStartIndex + 1;
    while (insertPos < lines.length && 
           (lines[insertPos].trim() === '' || lines[insertPos].startsWith('>'))) {
      insertPos++;
    }
    
    // Insert Subtasks header
    lines.splice(insertPos, 0, '', '## Subtasks');
    insertIndex = insertPos + 2;
  }

  // Insert new subtask
  lines.splice(insertIndex, 0, newSubtaskLine);

  return lines.join('\n');
}
```

**Step 2: 验证函数导入**

确认 `Subtask` 类型已被导入（应在文件顶部已存在）：
```typescript
import type { Task, Subtask, Achievement } from '@/store/types';
```

**Step 3: 编译检查**

```bash
npx tsc --noEmit
```

Expected: No errors

**Step 4: Commit**

```bash
git add src/utils/markdownUtils.ts
git commit -m "feat(utils): add appendSubtaskToMarkdown function"
```

---

## Task 3: 实现 addSubtask 方法 (taskStore.ts)

**Files:**
- Modify: `src/store/taskStore.ts:1-471`

**Step 1: 导入新函数**

在文件顶部的导入语句中，更新 `markdownUtils` 的导入：

```typescript
import { 
  updateCheckboxInMarkdown, 
  updateSubtaskContentInMarkdown, 
  updateSubtasksOrderInMarkdown, 
  reorderTasksInMarkdown, 
  updateTaskDescriptionInMarkdown, 
  deleteSubtaskFromMarkdown,
  appendSubtaskToMarkdown  // Add this
} from '@/utils/markdownUtils';
```

**Step 2: 导入 generateSubtaskId**

确认文件顶部已有：
```typescript
import { generateSubtaskId } from '@/utils/idGenerator';
```

如果没有，添加导入：
```typescript
import { generateTaskId, generateSubtaskId } from '@/utils/idGenerator';
```

**Step 3: 导入 getCurrentISOString**

确认文件顶部已有：
```typescript
import { getCurrentISOString } from '@/utils/timestamp';
```

如果没有，添加导入：
```typescript
import { getCurrentISOString } from '@/utils/timestamp';
```

**Step 4: 在 store 中实现 addSubtask 方法**

在 `deleteSubtask` 方法后添加：

```typescript
  addSubtask: async (taskId: string, content: string, nestedLevel: number = 0) => {
    const { setError, tasks, setTasks } = get();

    try {
      setError(null);

      // Generate new subtask ID
      const newSubtaskId = generateSubtaskId();
      
      const newSubtask: Subtask = {
        id: newSubtaskId,
        content,
        completed: false,
        nestedLevel: Math.max(0, Math.min(nestedLevel, 6)),
      };

      // Update local state
      const updatedTasks = tasks.map(task => {
        if (task.id === taskId) {
          return {
            ...task,
            subtasks: [...task.subtasks, newSubtask],
            totalSubtasks: task.totalSubtasks + 1,
            updatedAt: getCurrentISOString(),
          };
        }
        return task;
      });

      setTasks(updatedTasks);

      // Update Markdown file
      const targetTask = tasks.find(t => t.id === taskId);
      if (targetTask) {
        const markdownContent = await readRoadmapFile();
        const updatedMarkdown = appendSubtaskToMarkdown(
          markdownContent, 
          targetTask.title, 
          newSubtask
        );
        await writeRoadmapFile(updatedMarkdown);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add subtask');
    }
  },
```

**Step 5: 编译检查**

```bash
npx tsc --noEmit
```

Expected: No errors

**Step 6: Commit**

```bash
git add src/store/taskStore.ts
git commit -m "feat(store): implement addSubtask method"
```

---

## Task 4: 更新 SubtaskList 组件 UI (SubtaskList.tsx)

**Files:**
- Modify: `src/components/SubtaskList.tsx:1-379`

**Step 1: 导入 Plus 图标**

在文件顶部的导入语句中，添加 `Plus` 图标：

```typescript
import { Check, Pencil, Trash, Plus } from 'lucide-react';  // Add Plus
```

**Step 2: 在 SubtaskList 组件中添加状态和处理函数**

在组件内部（约第 245 行，现有状态声明后）添加：

```typescript
export const SubtaskList: React.FC<SubtaskListProps> = ({ subtasks, taskId }) => {
  const { reorderSubtasks, addSubtask } = useTaskStore();  // Add addSubtask
  const [activeId, setActiveId] = useState<string | null>(null);
  const [localSubtasks, setLocalSubtasks] = useState(subtasks);
  const [isInNestingMode, setIsInNestingMode] = useState(false);
  const [targetNestingLevel, setTargetNestingLevel] = useState<number | null>(null);
  
  // Add new states for adding subtask
  const [isAdding, setIsAdding] = useState(false);
  const [newSubtaskContent, setNewSubtaskContent] = useState('');
  const addInputRef = useRef<HTMLInputElement>(null);
```

**Step 3: 添加处理函数**

在 `handleDragEnd` 函数后（约第 335 行）添加：

```typescript
  const handleAddClick = () => {
    setIsAdding(true);
    setTimeout(() => addInputRef.current?.focus(), 0);
  };

  const handleAddKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newSubtaskContent.trim()) {
      await addSubtask(taskId, newSubtaskContent.trim(), 0);
      setNewSubtaskContent('');
      setIsAdding(false);
    } else if (e.key === 'Escape') {
      setIsAdding(false);
      setNewSubtaskContent('');
    }
  };

  const handleAddBlur = () => {
    if (!newSubtaskContent.trim()) {
      setIsAdding(false);
    }
  };
```

**Step 4: 更新 JSX - 添加底部区域**

在 `</DragOverlay>` 后（约第 375 行）添加底部添加区域：

```tsx
      </DragOverlay>
    </DndContext>

    {/* Add new subtask area at bottom */}
    {isAdding ? (
      <div className="mt-2 flex items-center gap-2 py-2 px-2">
        <div className="w-5 h-5 rounded border-2 border-border-color dark:border-dark-border-color" />
        <input
          ref={addInputRef}
          type="text"
          value={newSubtaskContent}
          onChange={(e) => setNewSubtaskContent(e.target.value)}
          onKeyDown={handleAddKeyDown}
          onBlur={handleAddBlur}
          placeholder="输入任务内容..."
          className="flex-1 text-sm bg-white dark:bg-dark-secondary-bg border border-primary rounded px-2 py-1 outline-none text-primary-text dark:text-dark-primary-text"
        />
      </div>
    ) : (
      <div 
        onClick={handleAddClick}
        className="mt-2 h-2 hover:h-8 border-t border-dashed border-border-color/30 hover:border-primary/50 hover:bg-secondary-bg/30 dark:hover:bg-dark-secondary-bg/30 flex items-center justify-center cursor-pointer transition-all duration-200 ease-in-out group"
      >
        <span className="opacity-0 group-hover:opacity-100 text-sm text-secondary-text dark:text-dark-secondary-text hover:text-primary flex items-center gap-1 transition-opacity duration-200">
          <Plus className="w-4 h-4" />
          添加任务
        </span>
      </div>
    )}
```

注意：需要将包裹这些内容的 `<DndContext>` 和 `<SortableContext>` 后面的闭合标签移到添加区域之前，或者直接放在 `</DndContext>` 后面。

**Step 5: 检查组件结构**

确保 JSX 结构正确：
- `<DndContext>` 包含 `<SortableContext>`
- `<SortableContext>` 包含现有的 subtask 列表
- 底部添加区域在 `</DndContext>` 之后，但在最外层 `</>` 之前

**Step 6: 编译检查**

```bash
npx tsc --noEmit
```

Expected: No errors

**Step 7: Commit**

```bash
git add src/components/SubtaskList.tsx
git commit -m "feat(ui): add bottom hover area for adding subtasks"
```

---

## Task 5: 手动测试验证

**Step 1: 启动开发服务器**

```bash
cd /Users/SparkingAries/VibeProjects/RoadMap/roadmap-manager && npm run dev
```

**Step 2: 测试场景清单**

打开浏览器访问 http://localhost:5173 (或实际端口)，验证：

| # | 测试步骤 | 期望结果 |
|---|----------|----------|
| 1 | 展开一个有 subtasks 的 Task Card | 底部显示淡色虚线分隔 |
| 2 | 鼠标 hover 到底部区域 | 区域高度增加，显示 "+ 添加任务" 按钮 |
| 3 | 点击底部区域 | 显示输入框，有 placeholder "输入任务内容..." |
| 4 | 输入内容按 Enter | 新 subtask 添加到列表底部，默认 nestLevel=0 |
| 5 | 输入内容按 Escape | 取消添加，回到 hover 区域状态 |
| 6 | 点击输入框外且内容为空 | 取消添加，回到 hover 区域状态 |
| 7 | 点击输入框外且有内容 | 保持输入框（可选：可考虑自动添加或保持） |
| 8 | 检查 roadmap.md 文件 | 新 subtask 正确追加到对应 task 下 |
| 9 | 拖拽新添加的 subtask | 可以正常拖拽排序 |
| 10 | 拖拽改变层级 | 可以正常改变 nestLevel |

**Step 3: 边界情况测试**

测试空 task（无 subtasks）：
1. 找到或创建一个没有 subtasks 的 task
2. 展开它（可能需要先添加一个 subtask 才能展开）
3. 验证添加功能是否可用

**Step 4: 停止开发服务器**

测试完成后：
```bash
Ctrl+C
```

---

## Task 6: 最终提交

**Step 1: 检查所有变更**

```bash
git status
```

Expected: 所有相关文件已 commit

**Step 2: 查看提交历史**

```bash
git log --oneline -5
```

Expected: 看到以下提交：
- feat(types): add addSubtask method to TaskStore interface
- feat(utils): add appendSubtaskToMarkdown function
- feat(store): implement addSubtask method
- feat(ui): add bottom hover area for adding subtasks

**Step 3: 最终提交（如需要）**

如果有未提交的变更：
```bash
git add .
git commit -m "feat: complete add subtask functionality"
```

---

## 变更文件清单

| 文件 | 变更类型 | 变更内容 |
|------|----------|----------|
| `src/store/types.ts` | 修改 | 添加 `addSubtask` 方法到 TaskStore 接口 |
| `src/utils/markdownUtils.ts` | 修改 | 添加 `appendSubtaskToMarkdown` 函数 |
| `src/store/taskStore.ts` | 修改 | 导入新函数并实现 `addSubtask` 方法 |
| `src/components/SubtaskList.tsx` | 修改 | 添加底部 hover 区域和输入框 UI |

---

## 回滚方案

如需回滚：

```bash
# 查看提交历史
git log --oneline

# 回滚到实施前的状态（替换 <commit-hash> 为实施前的 commit）
git reset --hard <commit-hash>

# 或软回滚保留变更
git reset --soft <commit-hash>
```

---

**计划完成时间**: 约 30-45 分钟  
**难度**: 中等  
**风险**: 低（主要是 UI 变更，不影响核心数据流）

**计划批准**: 待执行
