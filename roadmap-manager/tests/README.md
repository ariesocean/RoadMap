# 测试目录

## 测试文件列表

| 文件夹 | 测试文件 | 描述 |
|--------|----------|------|
| [login](./login/) | login.spec.ts | 用户登录、注册、账户管理 E2E 测试 |
| [test-prompt](./test-prompt/) | test-prompt.mjs | OpenCode SDK 通信测试脚本 |

## 运行测试

```bash
cd roadmap-manager

# 运行所有 Playwright 测试
npx playwright test

# 运行登录测试
npx playwright test tests/login/login.spec.ts

# 运行 OpenCode SDK 测试
node tests/test-prompt.mjs
```
