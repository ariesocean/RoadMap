# TaskCard 手动拖动排序设计

## 1. 概述

为 TaskList 中的 TaskCard 添加手动拖动排序功能，用户可通过拖拽调整任务显示顺序，排序结果持久化到 roadmap.md 文件。

## 2. 需求

- TaskCard 支持手动拖动排序
- 拖拽区域：标题行（h3 所在的一行）
- 非拖拽区域：description 行（originalPrompt）、subtasks 区域、进度条等
- 排序持久化到 roadmap.md 文件（任务在文件中的顺序即为显示顺序）
- **拖拽交互：悬浮拖拽模式**
  - 鼠标移到 title 行，点击后卡片悬浮跟随鼠标
  - 原位置显示占位符
  - 移动时清晰显示卡片将被放置的位置

## 3. 技术方案

### 3.1 技术选型

使用项目已有依赖 `@dnd-kit/sortable` + `@dnd-kit/core` 的 DragOverlay 实现悬浮拖拽。

### 3.2 架构

```
TaskList
    │
    ├── DndContext
    │       │
    │       ├── SortableContext (任务列表)
    │       │       │
    │       │       └── SortableTaskCard (可拖拽项)
    │       │
    │       └── DragOverlay
    │               │
    │               └── FloatingTaskCard (悬浮卡片副本)
    │
    └── 拖拽结束 → reorderTasks() → 更新 Zustand → 写 roadmap.md
```

### 3.3 拖拽交互细节

**悬浮拖拽 (Floating Drag)**
- 用户点击 title 行并拖动时，激活拖拽
- 激活后显示一个悬浮的卡片副本跟随鼠标移动
- 原卡片位置显示半透明的占位符
- 其他卡片自动移动，为悬浮卡片腾出空间
- 释放鼠标后，卡片落入目标位置

**放置位置指示**
- 使用 `@dnd-kit` 的 `closestCenter` 碰撞检测
- 当悬浮卡片经过某个位置时，该位置显示放置指示器（边框高亮）
- 释放后卡片落入指示位置

### 3.4 组件修改

**TaskCard.tsx**
- 添加 `useSortable` hook
- 在标题行外层包裹 `useSortable` 生成的 ref 和 listeners
- 添加 `GripVertical` 图标作为拖拽手柄

**TaskList.tsx**
- 引入 `DndContext`, `DragOverlay`, `SortableContext` 等
- 添加 `active`, `onDragStart`, `onDragEnd` 状态
- 渲染 `DragOverlay` 组件：显示悬浮卡片副本
- 使用 `SortableContext` 包装任务列表

**taskStore.ts**
- 新增 `reorderTasks(newOrder: Task[])` 方法

### 3.5 文件持久化

 roadmap.md 中 task 顺序即显示顺序。重写文件时：
1. 读取当前文件内容
2. 解析出每个顶级 task 块
3. 按新顺序重新排列
4. 写回文件

## 4. 错误处理

- **文件写入失败**：保留内存状态，回退 UI，显示错误提示
- **拖拽中断**：用户意外释放（如鼠标跨出窗口），不做任何修改
- **并发操作**：用户拖拽时其他操作修改文件，refreshTasks 后以文件为准

## 5. 测试

- 单元测试：`reorderTasks` 逻辑
- 手动测试：拖拽 → 刷新页面 → 确认顺序保持
