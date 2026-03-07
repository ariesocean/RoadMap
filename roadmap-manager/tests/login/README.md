# login 测试

## 测试文件
[login.spec.ts](./login.spec.ts)

## 测试场景
Playwright E2E 测试，验证用户登录相关功能，包括：

### Login Page
- 登录页面显示验证
- 注册弹窗显示验证
- 空凭据错误提示
- 成功登录流程
- 成功注册流程

### Account Management
- 账户弹窗显示
- 用户名更新功能
- 登出功能

### Theme Toggle
- 主题切换功能

## 上下文需求
- **依赖**: Playwright 测试框架
- **前置条件**: Dev Server 运行在 port 1630
- **测试用户**: testuser / password123
- **测试数据**: localStorage 状态清理

## 覆盖功能
- ✓ 登录页面元素显示
- ✓ 用户注册流程
- ✓ 用户名密码验证
- ✓ 登录成功跳转
- ✓ 错误提示显示
- ✓ 账户管理弹窗
- ✓ 用户名修改
- ✓ 用户登出
- ✓ 主题切换

## 运行方式
```bash
# 运行登录测试
npx playwright test tests/login/login.spec.ts

# 运行所有测试
npx playwright test
```
