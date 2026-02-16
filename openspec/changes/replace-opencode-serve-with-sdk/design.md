## Context
当前 Roadmap 应用通过 Vite 中间件将前端请求代理到 `opencode serve` (端口 51432)，这种方式仅适用于开发环境。需要迁移到使用 Tauri + opencode-cli SDK 的架构。

## Goals / Non-Goals

- Goals:
  - 移除前端对 opencode serve 进程的 HTTP 依赖
  - 使用 opencode-cli 自定义 SDK 统一调用方式
  - 支持生产环境构建（Tauri 打包后仍可正常工作）

- Non-Goals:
  - 不修改现有的 session 数据结构
  - 不改变 UI 交互逻辑
  - 不修改 opencode serve 本身

## Decisions

- Decision: 使用 Tauri invoke 调用 Rust 后端，由 Rust 后端通过 Node.js child_process 调用 opencode-cli 自定义 SDK
  - 原因: 前端无法直接使用 Node.js 版的 SDK，需要通过 Tauri 命令桥接
  - SDK 需要打包到 Tauri 应用中（见下方 SDK 打包方案）

- Decision: 保留现有事件流处理逻辑
  - 原因: 前端需要 SSE 事件流来实时显示执行结果，Tauri 命令返回 stream 类型的响应

- Decision: SDK 打包方案
  - 方案: 将 opencode-cli SDK 复制到 Tauri 项目的 `src-tauri/node_modules/` 目录
  - 原因: 硬编码路径 `~/.config/opencode/` 不可移植，需要将 SDK 内嵌到应用中
  - 依赖: 需要 `eventsource` npm 包支持 SSE

- Decision: 安全措施
  - 使用 `child_process::Command` 而非 shell 执行，避免 command injection
  - 所有输入参数在传递给 SDK 前进行验证
  - 不允许任意命令注入

## Migration Plan

1. 将 opencode-cli SDK 复制到 Tauri 项目的 node_modules
2. 在 Rust 后端添加调用 opencode serve 的命令（使用 Command + 参数）
3. 前端逐步迁移从 fetch 到 Tauri invoke
4. 移除 Vite 中间件代理
5. 验证所有功能正常工作

## Error Handling

- SDK 连接失败: 返回错误给前端，显示 "Server unavailable" toast
- 无效 session ID: 返回 INVALID_SESSION 错误码
- 网络超时: 30 秒超时，返回 TIMEOUT 错误
- SDK 异常: 捕获并返回通用错误消息

## SSE Streaming Implementation

前端期望 SSE 格式 (`data: {...}\n\n`)，Tauri stream 需要转换为相同格式：
- Rust 后端保持 SSE 格式输出
- 使用 `tauri::command::stream::Emitter` 或手动写入 SSE 格式
- 事件映射:
  - `message.part.updated` + `part.type === 'text'` → `data: {"type":"text","content":...}`
  - `message.part.updated` + `part.type === 'tool'` → `data: {"type":"tool-call",...}`
  - `message.part.updated` + `part.type === 'tool-result'` → `data: {"type":"tool-result",...}`
  - `message.part.updated` + `part.type === 'reasoning'` → `data: {"type":"reasoning",...}`
  - `message.updated` + `finish === 'stop'` → `data: {"type":"done"}`

## Open Questions

- Q: 是否需要保留 opencode serve 作为可选的后端？
  - A: 是的，opencode-cli 自定义 SDK 内部仍需要调用 opencode serve 的 HTTP API
  - 但现在是从 Tauri 后端调用，而非前端直接调用

- Q: 如何处理 SSE 事件流？
  - A: 参考 `/Users/SparkingAries/.config/opencode/opencode-cli/test-sdk-stream.js` 的实现：

  1. **Rust 后端**：在 Tauri 命令中通过 Node.js child_process 调用 opencode-cli 自定义 SDK
     - SDK 位置：打包到 `src-tauri/node_modules/@custom/opencode-sdk/`
     - 依赖：`eventsource` 包用于 SSE 监听
  2. **事件监听**：使用 `client.events.on()` 监听以下事件：
     - `message.part.updated` - 处理 text, reasoning, tool 等部分更新
     - `message.updated` - 处理完成状态 (finish === 'stop')
  3. **流式返回**：Rust 端保持 SSE 格式写入 stream
  4. **前端**：保持现有的 SSE 事件处理逻辑（onText, onToolCall, onDone 等回调）

  具体实现：
  ```javascript
  // 打包后的 SDK 调用
  import { OpenCodeClient } from '@custom/opencode-sdk/client.js'
  
  const client = new OpenCodeClient({ host: 'http://127.0.0.1:51432', sessionId })
  
  client.events.on('message.part.updated', (data) => {
    const part = data.part
    if (part.type === 'text') {
      frontend.send({ type: 'text', content: part.text })
    } else if (part.type === 'tool') {
      frontend.send({ type: 'tool-call', name: part.name })
    } else if (part.type === 'tool-result') {
      frontend.send({ type: 'tool-result', name: part.name })
    } else if (part.type === 'reasoning') {
      frontend.send({ type: 'reasoning', content: part.text })
    }
  })
  
  client.events.on('message.updated', (data) => {
    if (data.info?.finish === 'stop') {
      frontend.send({ type: 'done' })
    }
  })
  
  await client.connect()
  await client.prompt.sendAsync(prompt, { model })
  ```
