# Task Card 添加 Subtask 功能设计文档

**日期**: 2026-02-17  
**作者**: AI Assistant  
**状态**: 已批准，待实施

---

## 1. 功能概述

为已展开的 Task Card 添加在底部添加新 subtask 的功能。新任务默认添加在最底部，支持通过拖拽重新排序和改变层级。

### 1.1 需求要点
- ✅ Task Card 展开后显示添加功能
- ✅ 新 subtask 一律添加在最底部
- ✅ 默认嵌套层级为 0（根级）
- ✅ 添加后可通过拖拽调整顺序和层级
- ✅ 界面不占用固定空间，保持整洁

---

## 2. UI/UX 设计

### 2.1 交互流程

```
┌─────────────────────────────────────┐
│  [ ] Subtask 1                      │
│  [ ] Subtask 2                      │
│  [x] Subtask 3 (completed)          │
├─────────────────────────────────────┤ ← Hover 区域（平时显示虚线）
│         + 添加任务                  │ ← Hover 时显示按钮
└─────────────────────────────────────┘
```

### 2.2 状态流转

**状态 1: 默认状态**
- 底部显示淡淡的虚线分隔
- 高度约 8px
- 不显示任何按钮或文字

**状态 2: Hover 状态**
- 背景轻微变色（hover:bg-secondary-bg/30）
- 显示 "+ 添加任务" 文字按钮
- 高度扩展为 32px
- 添加 transition 动画（duration-200）

**状态 3: 输入状态**
- 点击后显示输入框
- 占位符文本："输入任务内容..."
- 输入框样式与现有 subtask 编辑框一致
- 右侧显示 ✓ 确认按钮（可选）

**状态 4: 完成添加**
- 按 Enter 确认添加
- 新任务出现在列表最底部（nestLevel: 0）
- 输入框消失，回到状态 1

### 2.3 样式规范

```typescript
// Hover 区域
const hoverAreaStyles = `
  h-2 hover:h-8
  border-t border-dashed border-border-color/30
  hover:border-primary/50
  hover:bg-secondary-bg/30 dark:hover:bg-dark-secondary-bg/30
  flex items-center justify-center
  cursor-pointer
  transition-all duration-200 ease-in-out
  group
`;

// 添加按钮
const addButtonStyles = `
  opacity-0 group-hover:opacity-100
  text-sm text-secondary-text dark:text-dark-secondary-text
  hover:text-primary
  flex items-center gap-1
  transition-opacity duration-200
`;
```

---

## 3. 数据模型变更

### 3.1 新增方法接口

在 `TaskStore` 接口中添加：

```typescript
interface TaskStore {
  // ... 现有方法
  
  /**
   * 添加新的 subtask 到指定 task
   * @param taskId - 目标 task ID
   * @param content - subtask 内容
   * @param nestedLevel - 嵌套层级（默认 0）
   */
  addSubtask: (taskId: string, content: string, nestedLevel?: number) => Promise<void>;
}
```

---

## 4. 组件变更

### 4.1 SubtaskList 组件

**文件**: `src/components/SubtaskList.tsx`

#### 4.1.1 新增状态

```typescript
const [isAdding, setIsAdding] = useState(false);
const [newSubtaskContent, setNewSubtaskContent] = useState('');
const addInputRef = useRef<HTMLInputElement>(null);
```

#### 4.1.2 新增处理函数

```typescript
const handleAddClick = () => {
  setIsAdding(true);
  setTimeout(() => addInputRef.current?.focus(), 0);
};

const handleAddKeyDown = async (e: React.KeyboardEvent) => {
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

#### 4.1.3 JSX 变更

在 `SortableContext` 后添加底部区域：

```tsx
<SortableContext items={localSubtasks.map(s => s.id)} strategy={verticalListSortingStrategy}>
  <div className="space-y-1">
    {localSubtasks.map((subtask) => (
      <SortableSubtaskItem key={subtask.id} subtask={subtask} taskId={taskId} />
    ))}
  </div>
</SortableContext>

{/* 新增：底部添加区域 */}
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

---

## 5. 状态管理变更

### 5.1 taskStore 新增方法

**文件**: `src/store/taskStore.ts`

在 store 中添加 `addSubtask` 方法：

```typescript
addSubtask: async (taskId: string, content: string, nestedLevel: number = 0) => {
  const { setError, tasks, setTasks } = get();

  try {
    setError(null);

    // 生成新 subtask ID
    const newSubtaskId = generateSubtaskId();
    
    const newSubtask: Subtask = {
      id: newSubtaskId,
      content,
      completed: false,
      nestedLevel: Math.max(0, Math.min(nestedLevel, 6)),
    };

    // 更新本地状态
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

    // 更新 Markdown 文件
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

---

## 6. Markdown 工具函数

### 6.1 新增 appendSubtaskToMarkdown

**文件**: `src/utils/markdownUtils.ts`

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
      // 检查是否有 Subtasks 标题
      if (line.match(/^##\s+Subtasks?$/i)) {
        hasSubtasksHeader = true;
        continue;
      }

      // 记录最后一个 subtask 的位置
      const subtaskMatch = line.match(/^(\s*)[-*] (\[[ x]\])(.+)$/);
      if (subtaskMatch) {
        lastSubtaskIndex = i;
        continue;
      }

      // 记录 Last Updated 行位置
      if (line.startsWith('**Last Updated:**')) {
        // 如果之前有 subtask，在它后面插入
        // 如果没有 subtask，在 Subtasks 标题后插入，或在 task 描述后插入
        break;
      }
    }
  }

  if (taskStartIndex === -1) {
    return markdown;
  }

  // 构建新的 subtask 行
  const indent = '  '.repeat(Math.min(newSubtask.nestedLevel, 6));
  const newSubtaskLine = `${indent}* [ ] ${newSubtask.content}`;

  // 确定插入位置
  let insertIndex;
  if (lastSubtaskIndex !== -1) {
    // 在最后一个 subtask 后插入
    insertIndex = lastSubtaskIndex + 1;
  } else if (hasSubtasksHeader) {
    // 在 Subtasks 标题后插入
    const subtasksHeaderIndex = lines.findIndex((line, idx) => 
      idx > taskStartIndex && line.match(/^##\s+Subtasks?$/i)
    );
    insertIndex = subtasksHeaderIndex + 1;
  } else {
    // 没有 Subtasks 标题，需要先添加标题
    // 找到插入位置（在 task 描述后或空行后）
    let insertPos = taskStartIndex + 1;
    while (insertPos < lines.length && 
           (lines[insertPos].trim() === '' || lines[insertPos].startsWith('>'))) {
      insertPos++;
    }
    
    // 插入 Subtasks 标题
    lines.splice(insertPos, 0, '', '## Subtasks');
    insertIndex = insertPos + 2;
  }

  // 插入新 subtask
  lines.splice(insertIndex, 0, newSubtaskLine);

  return lines.join('\n');
}
```

---

## 7. 类型定义更新

### 7.1 TaskStore 接口

**文件**: `src/store/types.ts`

在 `TaskStore` 接口中添加新方法：

```typescript
export interface TaskStore extends UIState {
  // ... 现有属性
  
  // 新增方法
  addSubtask: (taskId: string, content: string, nestedLevel?: number) => Promise<void>;
}
```

---

## 8. 依赖与导入

### 8.1 SubtaskList.tsx 需要添加的导入

```typescript
import { Plus } from 'lucide-react';  // 新增图标导入
```

### 8.2 taskStore.ts 需要确保的导入

```typescript
import { appendSubtaskToMarkdown } from '@/utils/markdownUtils';
import { generateSubtaskId } from '@/utils/idGenerator';
```

---

## 9. 边界情况处理

| 场景 | 处理方案 |
|------|----------|
| Task 没有 subtasks | 自动添加 "## Subtasks" 标题 |
| 输入框按 Escape | 取消添加，清空输入 |
| 输入框失去焦点且为空 | 取消添加状态 |
| Markdown 写入失败 | 显示错误提示，不更新本地状态（需考虑回滚） |
| Task 不存在 | 静默失败，记录错误 |
| 内容为空按 Enter | 不执行添加，保持输入框焦点 |

---

## 10. 测试要点

1. **功能测试**
   - 点击 hover 区域显示输入框
   - 输入内容按 Enter 添加成功
   - 新 subtask 出现在列表最底部
   - 新 subtask 默认 nestLevel 为 0

2. **Markdown 测试**
   - 有现有 subtasks 时正确追加
   - 无 subtasks 时自动添加 Subtasks 标题
   - 格式正确（缩进、checkbox）

3. **交互测试**
   - Escape 取消添加
   - 空内容不添加
   - 失去焦点行为正确

4. **拖拽集成测试**
   - 添加后可立即拖拽排序
   - 添加后可拖拽改变层级

---

## 11. 实施步骤

1. ✅ 更新 `src/store/types.ts` - 添加 `addSubtask` 方法签名
2. ✅ 更新 `src/utils/markdownUtils.ts` - 添加 `appendSubtaskToMarkdown` 函数
3. ✅ 更新 `src/store/taskStore.ts` - 实现 `addSubtask` 方法
4. ✅ 更新 `src/components/SubtaskList.tsx` - 添加底部添加区域 UI
5. ✅ 测试与验证

---

## 12. 变更文件清单

| 文件 | 变更类型 | 说明 |
|------|----------|------|
| `src/store/types.ts` | 修改 | 添加 `addSubtask` 到 TaskStore 接口 |
| `src/utils/markdownUtils.ts` | 修改 | 添加 `appendSubtaskToMarkdown` 函数 |
| `src/store/taskStore.ts` | 修改 | 实现 `addSubtask` 方法 |
| `src/components/SubtaskList.tsx` | 修改 | 添加底部 hover 添加区域和输入框 |

---

**设计批准**: ✅ 已批准  
**下一步**: 创建实施计划 (writing-plans)
