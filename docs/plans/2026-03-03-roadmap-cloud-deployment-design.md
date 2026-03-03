# Roadmap Manager Cloud Deployment Design

## Overview

将 Roadmap Manager 项目部署为云端服务，用户通过 macOS/iOS 原生 App 访问云服务器上的 OpenCode Server 和文件存储。

## Architecture

### System Components

```
┌─────────────────┐     ┌──────────────────────┐
│   Client App    │     │    Cloud Server      │
│  (macOS/iOS)    │────▶│                      │
│                 │     │  ┌────────────────┐  │
│  - React UI     │     │  │ API Server     │  │
│  - WebView      │     │  │ (Express)      │  │
│                 │     │  └───────┬────────┘  │
└─────────────────┘     │          │           │
                        │          ▼           │
                        │  ┌────────────────┐  │
                        │  │ OpenCode Server│  │
                        │  │ (Container)    │  │
                        │  └───────┬────────┘  │
                        │          │           │
                        │          ▼           │
                        │  ┌────────────────┐  │
                        │  │ User Data      │  │
                        │  │ /data/         │  │
                        │  │  - roadmap.md  │  │
                        │  │  - map-*.md    │  │
                        │  │  - .opencode/ │  │
                        │  └────────────────┘  │
                        └──────────────────────┘
```

### Multi-User Isolation (Container-Per-User)

- 每个用户拥有独立的 Docker 容器
- 每个容器内运行独立的 OpenCode Server + API Server
- 用户数据完全隔离（文件系统级别）

## API Endpoints

### File Operations (需要适配)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/read-roadmap` | GET | 读取 roadmap.md |
| `/api/write-roadmap` | POST | 写入 roadmap.md |
| `/api/list-maps` | GET | 列出所有 map 文件 |
| `/api/create-map` | POST | 创建新 map |
| `/api/delete-map` | POST | 删除 map |
| `/api/rename-map` | POST | 重命名 map |
| `/api/read-map` | POST | 读取 map 内容 |
| `/api/write-map` | POST | 写入 map 内容 |
| `/api/config` | GET/POST | 读取/保存配置 |

### OpenCode SDK (无需改动)

- 所有 session 相关操作通过 SDK 调用
- SDK 连接到容器的 OpenCode Server
- 端口: 8080

## Frontend Changes

### Environment Configuration

```typescript
// 新增环境变量
VITE_API_BASE_URL=https://user-container.example.com
VITE_OPENCODE_SDK_URL=wss://user-container.example.com
```

### SDK Configuration Update

```typescript
// opencodeClient.ts
const BASE_URL = import.meta.env.VITE_OPENCODE_SDK_URL || '/opencode';
```

## Docker Container

### Image Structure

```dockerfile
FROM node:20-bullseye

# Install Bun (for OpenCode)
RUN curl -fsSL https://bun.sh/install | bash

# Copy OpenCode binary
COPY opencode /usr/local/bin/opencode

# Create non-root user
RUN useradd -m -s /bin/bash appuser

WORKDIR /data

# API Server (Express)
COPY api-server ./api-server
RUN cd api-server && npm install --production

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

EXPOSE 3000 8080

USER appuser

CMD ["sh", "-c", "node api-server/index.js & opencode serve --port 8080"]
```

### User Data Volume

```
/data/
├── roadmap.md
├── map-*.md
├── roadmap-config.json
└── .opencode/          # OpenCode sessions & cache
```

## User Management Service

### Simple Implementation (方案三)

- 轻量级 Node.js API
- 用户注册 → 创建 Docker 容器 → 分配子域名
- 使用 Docker Engine API 或 Docker Compose

### Flow

```
1. 用户注册
   └─> POST /users/register { email, password }

2. 系统创建容器
   └─> docker run -d --name user-xxx -p 8080-8090 ...
   └─> 分配子域名: user-xxx.example.com

3. 用户登录
   └─> POST /auth/login { email, password }
   └─> 返回容器 URL

4. App 连接
   └─> 连接 https://user-xxx.example.com
```

## Networking

### Option A: Subdomain Routing

```
user1.example.com  ──┐
user2.example.com  ──┼──> Nginx Reverse Proxy ──> Docker
user3.example.com  ──┘
```

### Option B: Port-based

```
example.com:8081  ──┐
example.com:8082  ──┼──> Docker
example.com:8083  ──┘
```

推荐 Option A（子域名），用户体验更好。

## Security Considerations

1. **Authentication**: JWT token 或 API key
2. **Container Isolation**: Docker 默认隔离
3. **Resource Limits**: CPU/内存限制
4. **Data Backup**: 定期快照

## Estimated Resources (Per User)

| Resource | Idle | Active |
|----------|------|--------|
| Memory | ~150MB | ~300MB |
| CPU | 0% | 5-15% |
| Disk | ~10MB | ~50MB |

## Timeline

- Phase 1: API Server 适配 + Docker 容器化
- Phase 2: 用户管理服务
- Phase 3: 前端环境配置
- Phase 4: 测试部署
