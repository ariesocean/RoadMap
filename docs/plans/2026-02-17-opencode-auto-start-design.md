# OpenCode Server 自动启动设计

## 概述

Vite 开发服务器启动时自动检测并启动 OpenCode Server，简化开发流程。

## 背景

当前 `npm run dev` 启动后需要手动运行 `npm run opencode:server`，端口硬编码为 51432。用户希望自动化这个流程。

## 流程设计

```
Vite 启动
    ↓
检查 127.0.0.1:51432 健康状态
    ↓
┌─ 51432 可用 ──→ 继续启动 Vite
│
└─ 51432 不可用 ──→ 扫描其他常用端口 (51466 等)
                        ↓
                ┌─ 找到可用服务 ──→ 使用该端口，继续启动 Vite
                │
                └─ 未找到 ──→ 执行启动命令
                                ↓
                        ┌─ 启动成功 ──→ 等待就绪，继续启动 Vite
                        │
                        └─ 启动失败 ──→ 显示错误，Vite 无法启动
```

## 配置

- 默认端口: 51432
- 扫描端口列表: [51432, 51466, 51434]
- 启动命令: `cd /Users/SparkingAries/VibeProjects/RoadMap && (OPENCODE_SERVER_PASSWORD="" opencode serve --port 51432 &)`
- 健康检查路径: `/global/health`
- 启动超时: 30 秒

## 修改文件

- `vite.config.ts` - 添加自动检测和启动逻辑

## 错误处理

- opencode 命令不存在: 显示错误并退出
- 启动超时: 显示错误并退出
- 端口冲突: 尝试下一个端口
