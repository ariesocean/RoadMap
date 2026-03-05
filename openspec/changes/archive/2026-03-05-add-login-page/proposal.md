# Proposal: Add Login Page to Roadmap Manager

## Summary

为 Roadmap Manager 添加登录页面功能，从已开发好的 `roadmap-manager-login` 项目迁移登录和注册 UI 代码，并复用现有的 Connected/Disconnected 状态管理逻辑。

## Problem Statement

当前应用没有登录功能，用户打开直接进入主界面，且顶部显示 "Connected/Disconnected" 状态。需要添加登录流程以支持用户账户管理。

## Goals

1. **复用现有登录代码** - 从 `roadmap-manager-login` 移植登录和注册 UI
2. **复用 Connected 逻辑** - 登录/登出复用现有的 isConnected 状态管理，避免重复开发
3. 登录成功后进入主界面
4. 头部显示用户名替代 Connected 状态
5. 点击用户名弹出账户管理面板（修改密码、修改用户名、登出）

## Out of Scope

- Backend API integration (frontend UI only)
- Actual password validation
- Email verification

## Implementation Strategy

### 代码复用
- 登录页面 UI: 从 `roadmap-manager-login/src/App.tsx` 移植
- 登录状态: 复用现有的 `useTaskStore` 中的 `isConnected` 状态
- localStorage: 复用现有的 `storage.ts` 工具函数

### 状态映射
| 登录状态 | Connected 状态 | 说明 |
|---------|---------------|------|
| 未登录 | Disconnected | 显示登录页 |
| 已登录 | Connected | 显示主界面 |
| 登出 | Disconnected | 清除状态，返回登录页 |
