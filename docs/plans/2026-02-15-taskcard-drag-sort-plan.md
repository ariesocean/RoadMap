# TaskCard 手动拖动排序实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 为 TaskList 中的 TaskCard 添加手动拖动排序功能，排序结果持久化到 roadmap.md 文件。

**Architecture:** 使用 @dnd-kit/sortable 实现拖拽，拖拽结束后更新 Zustand 状态并同步写入 markdown 文件。标题行可拖拽，其他区域不可拖。

**Tech Stack:** React, @dnd-kit/sortable, Zustand, TypeScript

---

### Task 1: 修改 TaskCard 添加可拖拽属性

**Files:**
- Modify: `roadmap-manager/src/components/TaskCard.tsx:1-93`

**Step 1: 添加 import**

```typescript
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
```

**Step 2: 添加 useSortable hook**

```typescript
export const TaskCard: React.FC<TaskCardProps> = ({ task, index }) => {
  const { toggleTaskExpanded } = useTaskStore();
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
```

**Step 3: 修改标题行，添加拖拽区域**

```tsx
<div className="flex items-start justify-between">
  <div
    ref={setNodeRef}
    style={style}
    {...attributes}
    {...listeners}
    className="flex items-center gap-2 cursor-grab active:cursor-grabbing"
  >
    <GripVertical className="w-4 h-4 text-secondary-text/50" />
    <div className="flex-1">
      <h3 className="text-base font-semibold ...">
        {task.title}
      </h3>
      {/* ... rest of content */}
    </div>
  </div>
  {/* ... rest of component */}
</div>
```

**Step 4: Commit**

```bash
git add roadmap-manager/src/components/TaskCard.tsx
git commit -m "feat: add sortable to TaskCard"
```

---

### Task 2: 修改 TaskList 添加 DndContext

**Files:**
- Modify: `roadmap-manager/src/components/TaskList.tsx:1-73`

**Step 1: 添加 import**

```typescript
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
```

**Step 2: 添加 sensors 和 dragEndHandler**

```typescript
const sensors = useSensors(
  useSensor(PointerSensor),
  useSensor(KeyboardSensor, {
    coordinateGetter: sortableKeyboardCoordinates,
  })
);

const handleDragEnd = (event: DragEndEvent) => {
  const { active, over } = event;
  if (!over || active.id === over.id) return;
  
  const oldIndex = filteredTasks.findIndex(t => t.id === active.id);
  const newIndex = filteredTasks.findIndex(t => t.id === over.id);
  
  const newOrder = [...filteredTasks];
  const [movedItem] = newOrder.splice(oldIndex, 1);
  newOrder.splice(newIndex, 0, movedItem);
  
  // TODO: call reorderTasks
};
```

**Step 3: 包装 TaskCard 列表**

```tsx
<DndContext
  sensors={sensors}
  collisionDetection={closestCenter}
  onDragEnd={handleDragEnd}
>
  <SortableContext
    items={filteredTasks.map(t => t.id)}
    strategy={verticalListSortingStrategy}
  >
    <AnimatePresence mode="popLayout">
      {filteredTasks.map((task, index) => (
        <SortableTaskCard key={task.id} task={task} index={index} />
      ))}
    </AnimatePresence>
  </SortableContext>
</DndContext>
```

**Step 4: 创建 SortableTaskCard 组件**

```tsx
const SortableTaskCard = ({ task, index }: { task: Task; index: number }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });
  
  return (
    <div ref={setNodeRef} transform={transform} transition={transition} {...attributes} {...listeners}>
      <TaskCard task={task} index={index} />
    </div>
  );
};
```

**Step 5: Commit**

```bash
git add roadmap-manager/src/components/TaskList.tsx
git commit -m "feat: add DndContext to TaskList"
```

---

### Task 3: 添加 reorderTasks 到 taskStore

**Files:**
- Modify: `roadmap-manager/src/store/types.ts:75-95`
- Modify: `roadmap-manager/src/store/taskStore.ts:1-420`

**Step 1: 添加类型定义**

```typescript
// types.ts - TaskStore 接口添加
reorderTasks: (newOrder: Task[]) => Promise<void>;
```

**Step 2: 实现 reorderTasks 方法**

```typescript
reorderTasks: async (newOrder: Task[]) => {
  const { setTasks, setError } = get();
  
  try {
    setError(null);
    setTasks(newOrder);
    
    const content = await readRoadmapFile();
    // TODO: 实现 markdown 重排逻辑
    const updatedMarkdown = reorderTasksInMarkdown(content, newOrder);
    await writeRoadmapFile(updatedMarkdown);
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Failed to reorder tasks');
  }
},
```

**Step 3: Commit**

```bash
git add roadmap-manager/src/store/types.ts roadmap-manager/src/store/taskStore.ts
git commit -m "feat: add reorderTasks to taskStore"
```

---

### Task 4: 实现 markdown 重排逻辑

**Files:**
- Modify: `roadmap-manager/src/utils/markdownUtils.ts`

**Step 1: 添加 reorderTasksInMarkdown 函数**

```typescript
export function reorderTasksInMarkdown(
  content: string,
  newOrder: Task[]
): string {
  const lines = content.split('\n');
  const tasks: { title: string; startLine: number; endLine: number; lines: string[] }[] = [];
  
  // Parse current tasks
  // ...
  
  // Reorder based on newOrder
  // ...
  
  return reorderedLines.join('\n');
}
```

**Step 2: Commit**

```bash
git add roadmap-manager/src/utils/markdownUtils.ts
git commit -m "feat: implement reorderTasksInMarkdown"
```

---

### Task 5: 连接 TaskList 和 taskStore

**Files:**
- Modify: `roadmap-manager/src/components/TaskList.tsx`

**Step 1: 导入并调用 reorderTasks**

```typescript
const { tasks, reorderTasks } = useTaskStore();

// 在 handleDragEnd 中调用
await reorderTasks(newOrder);
```

**Step 2: Commit**

```bash
git add roadmap-manager/src/components/TaskList.tsx
git commit -m "feat: connect reorderTasks to TaskList"
```

---

### Task 6: 手动测试

**Step 1: 启动开发服务器**

```bash
cd roadmap-manager && npm run dev
```

**Step 2: 测试拖拽**
- 打开应用
- 拖动 TaskCard 标题行
- 释放后检查顺序是否变化

**Step 3: 测试持久化**
- 刷新页面
- 确认顺序保持

**Step 4: Commit**

```bash
git commit -m "test: manual testing for task drag sort"
```

---

**Plan complete and saved to `docs/plans/2026-02-15-taskcard-drag-sort-plan.md`. Two execution options:**

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

Which approach?
