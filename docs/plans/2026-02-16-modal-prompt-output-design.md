# Modal Prompt 输出格式重构设计

**Date:** 2026-02-16  
**Status:** Approved  
**参考:** `/Users/SparkingAries/.config/opencode/opencode-cli/test-sdk-stream.js`

## 目标

将 `executeModalPrompt` 的输出格式改为与 OpenCode SDK 事件格式一致，支持 reasoning、text、tool 等多种 part 类型。

## 背景

当前实现使用自定义的事件格式（`text`、`tool-call`、`tool-result`、`done`），需要改为与 `test-sdk-stream.js` 一致的事件格式，以便与 OpenCode SDK 保持兼容。

## 设计

### 1. 修改 `opencodeAPI.ts`

`executeModalPrompt` 函数的事件解析逻辑改为：

| 旧格式 | 新格式 |
|--------|--------|
| `type: 'text', content` | `part: { type: 'text', text }` |
| `type: 'tool-call', name` | `part: { type: 'tool', tool: name, state: { status: 'started' } }` |
| `type: 'tool-result', name` | `part: { type: 'tool', tool: name, state: { status: 'completed' } }` |
| `type: 'done'` | `message: { info: { finish: 'stop' } }` |

新增支持：
- `type: 'reasoning'` → `part: { type: 'reasoning', text }`

### 2. 更新 `useModalPrompt.ts`

修改回调参数以匹配新格式：
- `onText(text: string)` → 保持不变
- `onToolCall(name: string)` → 改为处理 `part.type === 'tool'`
- 新增 `onReasoning(text: string)` 处理 reasoning 类型

### 3. 更新 `resultModalStore.ts` (可选)

如果需要存储结构化数据，扩展 state 支持 `reasoning` 内容。

## 影响范围

- `roadmap-manager/src/services/opencodeAPI.ts`
- `roadmap-manager/src/hooks/useModalPrompt.ts`
- `roadmap-manager/src/store/resultModalStore.ts` (可选)
