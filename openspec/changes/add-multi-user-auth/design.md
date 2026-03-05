# Design: Multi-User Authentication

## Context

当前 Roadmap Manager 是单用户应用，需要扩展为多用户架构。每个用户需要独立的数据存储空间和独立的 opencode serve 实例。

## Goals / Non-Goals

### Goals
- 多用户注册和登录
- 每个用户独立数据目录
- 每个用户独立 opencode serve 端口
- 设备自动登录（免重复登录）
- 登录历史和设备管理

### Non-Goals
- 用户间数据共享
- 真正的 JWT 认证（使用简化 token）
- 云端同步
- 密码找回功能

## Data Structure

```
RoadMap/
├── users/
│   ├── ports.json                # userId → port 映射
│   ├── mingyan_20260305/        # 用户目录 (userId)
│   │   ├── roadmap.md
│   │   ├── map-*.md
│   │   ├── roadmap-config.json
│   │   ├── devices.json        # 已授权设备
│   │   ├── login-history.json  # 登录历史
│   │   └── credentials.json    # 用户凭据(加密)
│   └── other_20260306/
└── roadmap-manager/
```

## Decisions

### 1. Port Allocation Strategy
- 端口范围：51000-51099（100个端口）
- 分配规则：从 51000 开始，找第一个未被占用的端口
- ports.json 结构：
```json
{
  "users": {
    "mingyan_20260305": 51000,
    "other_20260306": 51001
  },
  "nextPort": 51002
}
```

### 2. Device Identification
- 首次访问时前端生成 UUID 存入 localStorage
- 登录时将 deviceId 发送给后端验证
- 设备信息包含：deviceId, userAgent, loginTime

### 3. Password Storage
- 使用简化方案：密码存 JSON 文件（后续可升级为加密存储）
- 不使用真正的哈希，简单对比即可（本地应用）

### 4. API Path Strategy
- 认证相关 API：`/api/auth/*`
- 文件操作 API：`/api/*` 改为根据当前会话用户动态读取对应目录

### 5. Session Management
- 当前登录用户信息存 localStorage：`currentUser: { userId, username, token }`
- 前端 API 调用前注入 userId header
- 后端根据 userId 动态定位用户目录

## Backend API Design

### New Endpoints

| Endpoint | Method | Request | Response |
|----------|--------|---------|----------|
| `/api/auth/register` | POST | `{username, password, email}` | `{userId, port}` |
| `/api/auth/login` | POST | `{username, password, deviceId}` | `{userId, token, port}` |
| `/api/auth/auto-login` | POST | `{userId, deviceId}` | `{userId, token, port}` |
| `/api/auth/logout` | POST | `{userId}` | `{success}` |
| `/api/auth/devices` | GET | - | `{devices: []}` |
| `/api/auth/devices/:deviceId` | DELETE | - | `{success}` |
| `/api/auth/user-info` | GET | - | `{userId, username, email}` |

### Modified Endpoints

| Endpoint | Change |
|----------|--------|
| `/api/read-roadmap` | 动态读取 users/{userId}/roadmap.md |
| `/api/write-roadmap` | 动态写入 users/{userId}/roadmap.md |
| `/api/list-maps` | 动态读取 users/{userId}/map-*.md |
| `/api/config` | 动态读取 users/{userId}/roadmap-config.json |

## Frontend Changes

### authStore.ts Enhancement
```typescript
interface AuthState {
  userId: string | null;
  username: string | null;
  token: string | null;
  deviceId: string;
  
  // Actions
  setUser: (user: UserInfo) => void;
  clearUser: () => void;
  initDeviceId: () => void;
}
```

### LoginPage.tsx Changes
- 调用 `/api/auth/register` 替代模拟注册
- 调用 `/api/auth/login` 替代模拟登录
- 登录成功后保存 userId、token 到 localStorage

### File Service Changes
- 所有文件 API 添加 `X-User-Id` header
- 后端根据 header 动态选择用户目录

### OpenCode Serve Management
- 登录时调用后端启动用户端口的 opencode serve
- 登出时调用后端关闭用户端口的 opencode serve
- SDK 调用统一使用用户固定端口

## Error Handling

| Scenario | Handling |
|----------|----------|
| 用户名已存在 | 返回 400 错误 |
| 密码错误 | 返回 401 错误 |
| 设备未授权 | 返回 403 错误，引导重新登录 |
| 端口已占 | 分配下一个可用端口 |
| opencode serve 启动失败 | 返回错误，提示重试 |

## Migration Plan

1. 创建 `users/` 目录和初始 `ports.json`
2. 后端：添加认证 API
3. 后端：修改文件 API 支持动态用户目录
4. 前端：更新 authStore
5. 前端：修改 LoginPage 调用真实 API
6. 前端：添加设备管理和登录历史 UI（可选）
7. 测试完整流程
