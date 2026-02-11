# Change: Fix Event Duplication in OpenCode Server Integration

## Why

用户在 Roadmap Manager 中创建新任务时，弹窗中显示的 Processing 信息会出现重复内容。根本原因是：

1. `vite.config.ts` 中 `/api/execute-navigate` 端点没有实现事件去重机制
2. eventId 生成依赖 `Date.now()`，同一毫秒内发送多个事件时会产生重复 ID
3. 导致 `processedEvents.has(eventId)` 误判，相同内容被多次处理和显示

## What Changes

- **vite.config.ts**:
  - 为 `/api/execute-navigate` 端点添加 `processedEvents` 去重机制
  - 改进 eventId 生成逻辑，使用递增计数器而非依赖时间戳

- **taskStore.ts**:
  - 改进 `submitPrompt` 方法中的 eventId 生成逻辑
  - 使用递增计数器确保唯一性

## Impact

- Affected specs: roadmap-skill
- Affected code:
  - `roadmap-manager/vite.config.ts` (lines 82-226, 295-381)
  - `roadmap-manager/src/store/taskStore.ts` (lines 50-188)
