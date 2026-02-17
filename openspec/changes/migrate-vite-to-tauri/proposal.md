# Change: Migrate Vite API Endpoints to Tauri Commands

## Why
当前 Vite 开发服务器中的自定义中间件 API 端点无法在生产构建中使用。桌面应用需要将这些功能迁移到 Tauri 命令,以实现独立的桌面应用体验。

## What Changes
- 将 `/api/read-roadmap` 端点迁移为 Tauri 命令 `read_roadmap`
- 将 `/api/write-roadmap` 端点迁移为 Tauri 命令 `write_roadmap`
- 将 `/session` 端点迁移为 Tauri 命令获取会话列表
- 将 `/api/execute-navigate` 端点迁移为 Tauri 命令
- 将 `/api/execute-modal-prompt` 端点迁移为 Tauri 命令
- 移除硬编码路径,使用相对路径或配置路径
- 添加 Tauri 构建配置以生成桌面应用

## Impact
- Affected specs: roadmap-app
- Affected code:
  - `vite.config.ts` - 移除自定义中间件
  - `src-tauri/src/lib.rs` - 添加 Tauri 命令
  - `src/services/fileService.ts` - 使用 Tauri API
  - `src/services/opencodeAPI.ts` - 使用 Tauri 命令
  - `tauri.conf.json` - 启用构建配置
