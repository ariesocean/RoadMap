# Change: Add Multi-User Authentication

## Summary

实现多用户注册、登录、设备授权功能。每个用户拥有独立的数据目录和 opencode serve 端口，支持设备自动登录。

## Why

当前应用是单用户设计，所有用户共享同一份 roadmap 数据。需要支持多用户，每个用户有独立的数据存储空间和 opencode serve 实例。

## What Changes

### Data Storage
- 用户数据存储在 `users/{userId}/` 目录
- userId 格式：`{初始用户名(6位)}_{注册日期%Y%m%d}`
- 每个用户目录包含：roadmap.md, map-*.md, roadmap-config.json, devices.json, login-history.json

### Port Management
- 端口范围：51000-51099
- 通过 `users/ports.json` 维护 userId → port 映射
- 用户登录时启动 opencode serve 于分配端口，登出时关闭

### Authentication Flow
- **注册**：创建用户目录 → 分配端口 → 初始化配置文件 → 注册首个设备
- **登录**：验证凭据 → 检查设备授权 → 记录登录历史 → 启动 opencode serve
- **自动登录**：验证 deviceId 在 devices.json 中存在 → 直接通过 → 启动 opencode serve
- **登出**：关闭 opencode serve（保留设备授权）

### Device Management
- 首次登录自动注册设备（生成 UUID 存 localStorage）
- 支持查看已授权设备列表
- 支持移除设备授权
- 登录历史记录设备信息和登录时间

## Impact

- **Affected Specs**: `auth`, `session`, `maps-management`
- **Breaking Changes**: 文件操作 API 路径从固定目录改为动态用户目录

## Dependencies

- 依赖 `add-login-page` 已完成的前端 UI
- 依赖现有 opencode serve 启动逻辑
