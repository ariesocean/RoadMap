## 1. SDK 打包

- [ ] 1.1 创建 `src-tauri/node_modules/@custom/opencode-sdk/` 目录
- [ ] 1.2 复制 `~/.config/opencode/opencode-cli/src/sdk/` 文件到自定义目录
- [ ] 1.3 安装 `eventsource` 依赖到 Tauri 项目

### 2. Rust 后端命令

- [ ] 2.1 创建 Tauri 命令 `list_sessions` - 调用 Session.list()
- [ ] 2.2 创建 Tauri 命令 `create_session` - 调用 Session.create()
- [ ] 2.3 创建 Tauri 命令 `execute_prompt` - 调用 Session.prompt()，同步返回
- [ ] 2.4 创建 Tauri 命令 `execute_prompt_stream` - 调用 Session.promptAsync()，SSE 流返回
- [ ] 2.5 创建 Tauri 命令 `check_health` - 检查 opencode serve 是否可用

### 3. 安全措施

- [ ] 3.1 使用 `child_process::Command` 而非 shell 执行
- [ ] 3.2 验证所有输入参数（prompt, sessionId, model）
- [ ] 3.3 添加错误处理：连接失败、无效 session、超时

### 4. 前端迁移

- [ ] 4.1 移除 vite.config.ts 中的 /session, /api/execute-navigate, /api/execute-modal-prompt 中间件
- [ ] 4.2 更新 opencodeAPI.ts - 将 HTTP 调用改为 Tauri invoke
- [ ] 4.3 更新 opencodeSDK.ts - 将 HTTP 调用改为 Tauri invoke
- [ ] 4.4 更新 taskStore.ts - 移除 fetch 调用，改用 Tauri invoke
- [ ] 4.5 更新 sessionStore.ts - 移除 fetch 调用，改用 Tauri invoke
- [ ] 4.6 更新 useSession.ts - 移除 fetch 调用，改用 Tauri invoke

### 5. 验证

- [ ] 5.1 运行 npm run dev 验证开发模式正常工作
- [ ] 5.2 测试 session 列表获取功能
- [ ] 5.3 测试 navigate 命令执行
- [ ] 5.4 测试 modal prompt 功能
- [ ] 5.5 运行 typecheck 确保无类型错误
