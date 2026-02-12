# Change: Refactor Remove Code Redundancies

## Why
代码经过多版本迭代后存在约 120 行冗余代码，包括重复函数、重复逻辑、未使用的代码等问题。这些冗余增加了维护成本，降低了代码可读性，并可能导致后续修改时出现不一致。

## What Changes
- 合并重复的 `getCurrentISOString()` 函数 (2 处)
- 提取重复的会话排序逻辑为共享工具函数
- 创建统一的 ID 生成工具 (3+ 处重复)
- 提取事件处理逻辑为共享工具 (2 处重复)
- 集中时间戳生成 (9 处使用)
- 合并重复的 markdown 子任务生成逻辑
- 修复未使用的导入和变量
- 标准化 localStorage 包装函数
- 删除重复的类型定义
- 移除多余的 console.log

## Impact
- Affected specs: `session`, `modal-prompt`
- Affected code:
  - `src/utils/dateUtils.ts`
  - `src/utils/markdownUtils.ts`
  - `src/store/sessionStore.ts`
  - `src/store/taskStore.ts`
  - `src/services/opencodeAPI.ts`
  - `src/components/SessionList.tsx`
  - `src/components/App.tsx`
  - `src/services/fileService.ts`
- Estimated refactoring time: 2-4 hours
- Lines to remove: ~120 lines
