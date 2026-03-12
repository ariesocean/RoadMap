# Change: Add Production Server Support

## Why
当前项目仅支持 `npm run dev` 开发模式运行。通过 Vite 插件 `configureServer` 实现的 API 端点（用户认证、文件操作等）仅在 dev 模式下可用。无法通过 `build` + `serve` 部署到生产环境。

## What Changes
- 添加 `server/` 目录，包含独立的生产服务器代码
- 创建 `tsconfig.server.json` 用于编译服务器代码
- 修改 `package.json` 添加 `build:server`, `serve`, `start` 脚本
- 迁移所有 API 端点逻辑到生产服务器
- 修复生产构建：将 Node.js 依赖代码 (`fs`, `path`, `crypto`, `child_process`) 从客户端代码中分离，避免浏览器尝试加载 Node.js 内置模块导致 CORS 错误

## Impact
- Affected specs: `maps-management`, `auth`
- Affected code: `vite.config.ts` (API plugin), `package.json`, 新增 `server/`

**Breaking Changes**: 无 - 开发模式保持不变
