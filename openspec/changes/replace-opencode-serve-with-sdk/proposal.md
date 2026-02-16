# Change: 替换 opencode serve HTTP 接口为 opencode-cli SDK

## Why
当前项目通过 Vite 中间件代理直接调用 opencode serve 的 HTTP 接口 (`/session`, `/session/{id}/prompt_async`)，这种方式：
1. 依赖 `opencode serve` 进程运行在前端开发环境
2. 需要手动处理 HTTP 请求、认证、SSE 事件流
3. 代码重复且难以维护

使用 opencode-cli SDK 可以：
1. 统一由 Tauri/Rust 后端调用 SDK，避免前端直接依赖服务器进程
2. 事件流处理更方便
3. 简化事件流处理

## What Changes
- 移除 `vite.config.ts` 中对 opencode serve 的 HTTP 代理中间件
- 移除前端直接调用 `/session`, `/api/execute-navigate`, `/api/execute-modal-prompt` 的代码
- 在 Tauri Rust 后端添加调用 opencode-cli 自定义 SDK 的命令（通过 Node.js child_process）
- 更新前端 SDK 调用改为使用 Tauri invoke

**SDK 打包方案**：
- 将 opencode-cli SDK 复制到 `src-tauri/node_modules/@custom/opencode-sdk/`
- 安装 `eventsource` npm 包作为依赖
- 使用 `child_process::Command` 执行，避免 shell 注入

**安全措施**：
- 使用 `Command` 而非 shell 执行，防止 command injection
- 所有输入参数在传递给 SDK 前验证
- 错误处理：连接失败、无效 session、网络超时

**需要替换的具体接口调用：**

| 文件 | 方法 | 当前 HTTP 端点 | SDK 方法 |
|------|------|----------------|----------|
| opencodeAPI.ts:45 | fetchSessionsFromServer | GET /session | Session.list() |
| opencodeAPI.ts:99 | syncLocalSessionToServer | POST /session | Session.create() |
| opencodeAPI.ts:139 | processPrompt | POST /session/{id}/prompt_async | Session.promptAsync() |
| opencodeAPI.ts:214 | executeModalPrompt | POST /session/{id}/prompt_async | Session.promptAsync() |
| opencodeSDK.ts:14 | navigateWithOpencode | POST /session/{id}/prompt_async | Session.promptAsync() |
| taskStore.ts:100 | - | POST /api/execute-navigate | Tauri invoke |
| sessionStore.ts:497 | - | GET /session | Tauri invoke |
| useSession.ts:80 | - | POST /api/execute-navigate | Tauri invoke |

## Impact
- Affected specs: session, modal-prompt, input-interaction
- Affected code:
  - `vite.config.ts` - 移除代理中间件
  - `src/services/opencodeAPI.ts` - 改为调用 Tauri 命令
  - `src/services/opencodeSDK.ts` - 改为调用 Tauri 命令
  - `src/store/taskStore.ts` - 移除 HTTP 调用
  - `src/store/sessionStore.ts` - 移除 HTTP 调用
  - `src/hooks/useSession.ts` - 移除 HTTP 调用
  - `src-tauri/` - 添加 SDK 打包和新 Rust 命令

## Notes
- `opencode serve` 仍需运行在端口 51432，但调用方从前端变为 Tauri 后端
- SSE 事件流格式保持不变（`data: {...}\n\n`）
