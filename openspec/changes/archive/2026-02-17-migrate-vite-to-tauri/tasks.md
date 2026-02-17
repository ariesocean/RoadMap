## 1. 检查当前 Vite 代码问题
- [x] 1.1 检查 vite.config.ts 中的硬编码路径
- [x] 1.2 检查 API 端点实现
- [x] 1.3 验证问题列表

## 2. 迁移 Vite API 到 Tauri 命令
- [x] 2.1 添加 read_roadmap Tauri 命令
- [x] 2.2 添加 write_roadmap Tauri 命令
- [x] 2.3 添加 get_sessions Tauri 命令
- [ ] 2.4 添加 execute_navigate Tauri 命令 (已有,仅保留原功能)
- [ ] 2.5 添加 execute_modal_prompt Tauri 命令

## 3. 更新前端服务调用
- [x] 3.1 更新 fileService.ts 使用 Tauri API
- [x] 3.2 更新 opencodeAPI.ts 使用 Tauri invoke
- [x] 3.3 移除 vite.config.ts 中的自定义中间件 (保留作为开发模式后备)

## 4. 配置 Tauri 构建
- [x] 4.1 启用 tauri.conf.json 中的 bundle 配置
- [x] 4.2 检查 macOS 构建配置
- [x] 4.3 验证构建配置正确

## 5. 验证迁移
- [x] 5.1 运行 npm run tauri dev 确保开发模式正常
- [ ] 5.2 验证所有功能正常工作
- [ ] 5.3 测试生产构建
