## 1. 实现 execute_navigate SSE 流式传输
- [x] 1.1 修改 lib.rs 中 execute_navigate 命令,支持 SSE 流式传输
- [x] 1.2 添加 sessionId 和 model 参数支持
- [x] 1.3 实现事件去重机制(processedEvents Set)
- [x] 1.4 实现 OpenCode Server 事件到 SSE 事件的转发

## 2. 实现 execute_modal_prompt 命令
- [x] 2.1 在 lib.rs 中添加 execute_modal_prompt 命令
- [x] 2.2 实现完整的 SSE 流式传输逻辑
- [x] 2.3 实现事件去重机制
- [x] 2.4 添加 sessionId 和 model 参数支持

## 3. 更新前端调用 - taskStore.ts
- [x] 3.1 修改 taskStore.ts 中 processPrompt 函数,检测 Tauri 模式
- [x] 3.2 在 Tauri 模式下使用 invoke 调用 execute_navigate
- [x] 3.3 保留 VITE fetch 模式作为 fallback

## 4. 更新前端调用 - useSession.ts
- [x] 4.1 修改 useSession.ts 中 handleSubmitWithSession 函数,检测 Tauri 模式
- [x] 4.2 在 Tauri 模式下使用 invoke 调用 execute_navigate
- [x] 4.3 保留 VITE fetch 模式作为 fallback

## 5. 更新前端调用 - opencodeAPI.ts
- [x] 5.1 修改 processPrompt 函数添加 Tauri invoke
- [x] 5.2 修改 executeModalPrompt 函数添加 Tauri invoke
- [x] 5.3 传递完整的参数(prompt, sessionId, model)

## 6. 验证功能
- [x] 6.1 运行 npm run tauri dev 测试开发模式
- [x] 6.2 验证 execute_navigate 流式输出正常工作
- [x] 6.3 验证 execute_modal_prompt 流式输出正常工作
