# Change: Add md breakpoint (768px) for 4-level responsive transitions

## Why
当前响应式系统存在以下问题：
1. **断点跳跃明显**：只在 `sm` (640px) 和 `lg` (1024px) 有明显的尺寸变化，中间 640-1024px 范围缺乏过渡
2. **字体层级不够细腻**：从 14px → 16px → 18px 的跳跃在中等屏幕显得突兀
3. **间距系统不连续**：`gap-1 sm:gap-3`、`p-2 sm:p-4` 等变化跨度较大

## What Changes
- 添加 `md:` 断点层 (768px)，形成 4 级断点系统：默认 (<640px) → sm: (≥640px) → md: (≥768px) → lg: (≥1024px)
- 为以下组件添加 md 断点的响应式过渡：
  1. `App.tsx` - Header 布局、Logo 尺寸、搜索框宽度、主内容区域间距
  2. `TaskCard.tsx` - 卡片标题、描述文字、图标尺寸、间距和 padding
  3. `TaskList.tsx` - 列表项间距
  4. `SubtaskList.tsx` - 子任务项字体、图标、间距
  5. `InputArea.tsx` - 输入区域 padding、按钮尺寸
  6. `ResultModal.tsx` - 弹窗字体、padding、图标尺寸
  7. `ModelSelector.tsx` - 模型选择器字体、间距
- 统一字体和间距的变化比例（1.5 倍递增）

## Impact
- Affected specs: main-task-management (TaskCard, TaskList, SubtaskList), input-interaction (InputArea, ModelSelector), modal-prompt (ResultModal), session (App.tsx)
- Affected code: src/components/*.tsx, src/App.tsx
