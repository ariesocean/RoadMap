# Change: Implement Tauri SSE Streaming for execute_navigate and execute_modal_prompt

## Why
Tauri 版本的功能不完整:
1. `execute_navigate` 只返回简单结果,没有 SSE 流式传输
2. `execute-modal-prompt` 在 Tauri 模式下完全缺失
3. 多个前端文件仍直接使用 fetch,没有 Tauri fallback

VITE 版本已有完整的 SSE 流式实现,需要将这些功能迁移到 Tauri。

## What Changes
- 修改 `execute_navigate` Tauri 命令实现完整的 SSE 流式传输
- 添加 `execute_modal_prompt` Tauri 命令实现
- 更新前端 `taskStore.ts` 添加 Tauri fallback
- 更新前端 `useSession.ts` 添加 Tauri fallback
- 更新 `opencodeAPI.ts` 中的 processPrompt 和 executeModalPrompt 函数
- 确保两种模式(VITE/Tauri)行为一致

## Impact
- Affected specs: roadmap-app, modal-prompt
- Affected code:
  - `src-tauri/src/lib.rs` - 添加 SSE 流式命令
  - `src/store/taskStore.ts` - 添加 Tauri fallback
  - `src/hooks/useSession.ts` - 添加 Tauri fallback
  - `src/services/opencodeAPI.ts` - 添加 Tauri fallback
