# 测试文件说明

## test/test-prompt.mjs

### 测试场景
手动测试 OpenCode SDK 与 OpenCode Server 的通信功能，验证 SDK 能否正确发送 prompt 并接收流式响应。

### 上下文需求
- **依赖**: OpenCode Server 运行中 (默认端口 51432 或用户指定端口)
- **前置条件**: 已安装 `@opencode-ai/sdk` 依赖
- **测试数据**: 测试 prompt "当前在哪个路径下"
- **运行环境**: Node.js (使用 ES Modules)

### 覆盖功能
- SDK 客户端创建和初始化
- Session 创建功能
- Prompt 提交和流式响应接收
- SSE 事件解析（text delta、session status）

### 运行方式
```bash
cd roadmap-manager
node test/test-prompt.mjs
```

### 输出示例
```
Creating session...
Session: { id: 'ses_xxx', title: 'test-prompt', ... }

Sending prompt...
当前工作目录：`/Users/.../users/harvey_20260306`

Done!
```

---

## tests/login.spec.ts

### 测试场景
Playwright E2E 测试，验证用户登录功能。

### 上下文需求
- **依赖**: Playwright 测试框架
- **前置条件**: Dev Server 运行在 port 1630
- **测试数据**: 测试用户账号

### 覆盖功能
- 登录页面显示
- 用户登录流程

---
