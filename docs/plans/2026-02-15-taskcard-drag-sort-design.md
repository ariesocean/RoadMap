# TaskCard 手动拖动排序设计

## 1. 概述

为 TaskList 中的 TaskCard 添加手动拖动排序功能，用户可通过拖拽调整任务显示顺序，排序结果持久化到 roadmap.md 文件。

## 2. 需求

- TaskCard 支持手动拖动排序
- 拖拽区域：标题行（h3 所在的一行）
- 非拖拽区域：description 行（originalPrompt）、subtasks 区域、进度条等
- 排序持久化到 roadmap.md 文件（任务在文件中的顺序即为显示顺序）

## 3. 技术方案

### 3.1 技术选型

使用项目已有依赖 `@dnd-kit/sortable` 实现拖拽功能。

### 3.2 架构

```
TaskList (DndContext + SortableContext)
    │
    └── SortableItem (wrapper)
            │
            └── TaskCard (useSortable hook)
                    │
                    └── 拖拽结束 → reorderTasks() → 更新 Zustand → 写 roadmap.md
```

### 3.3 组件修改

**TaskCard.tsx**
- 引入 `useSortable` from `@dnd-kit/sortable`
- 标题行外层使用 `useSortable` 生成的 attributes 和 listeners
- 在标题左侧添加 `GripVertical` 图标作为拖拽手柄
- 添加 `transform`, `transition` 属性实现平滑动画
- 拖拽时显示占位符样式

**TaskList.tsx**
- 引入 `DndContext`, `SortableContext`, `closestCenter`, `KeyboardSensor`, `PointerSensor`
- 使用 `SortableContext` 包装 TaskCard 列表
- 添加 `onDragEnd` 处理：计算新顺序 → 调用 `reorderTasks`

**taskStore.ts**
- 新增 `reorderTasks(newOrder: Task[])` 方法
- 更新 Zustand 内存状态
- 调用 markdown 服务重写文件

### 3.4 文件持久化

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
