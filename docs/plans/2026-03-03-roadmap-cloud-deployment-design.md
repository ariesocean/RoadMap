# Roadmap Manager Cloud Deployment Design

## Overview

将 Roadmap Manager 项目部署为云端服务，用户通过 macOS/iOS 原生 App 访问云服务器上的 OpenCode Server 和文件存储。

## Architecture

### System Components (Recommended)

```
┌─────────────────────────┐
│     Nginx Proxy         │  (wildcard SSL: *.example.com)
│     (Port 443/80)       │
└───────────┬─────────────┘
            │
      ┌─────┼─────┬────────────┐
      │     │     │            │
┌─────▼┐ ┌──▼──┐ │        ┌───▼───┐
│User1 │ │User2│ │   ...  │ Admin │
│Container│Container│    │  Panel  │
└───┬───┘ └──┬──┘        └────────┘
    │         │
    ├────┬────┴────────────┐
    │    │                 │
┌───▼┐ ┌▼────┐        ┌────▼────┐
│API │ │OpenCode│        │  Data   │
│Srv │ │Server │        │  Volume │
└────┘ └──────┘        └─────────┘
   │        │
   └────────┘ (mounted /data)
```

### Multi-User Isolation (Container-Per-User)

- 每个用户拥有 **2 个独立容器**：API Server + OpenCode Server
- 共享数据卷：`/data/` 挂载到两个容器
- 用户数据完全隔离（容器级别 + 卷级别）

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
| `/health` | GET | 健康检查 |

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
// opencodeSDK.ts
const BASE_URL = import.meta.env.VITE_OPENCODE_SDK_URL || '/opencode';
```

## Docker Container

### Image Strategy

使用官方 OpenCode Docker 镜像，无需自行构建。

### API Server Container

```dockerfile
FROM node:20-bullseye

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

CMD ["node", "index.js"]
```

### OpenCode Server Container

```dockerfile
FROM opencodeai/opencode-server:latest

WORKDIR /data

# 入口点保持默认
CMD ["serve", "--port", "8080"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  api-server:
    build: ./api-server
    ports:
      - "${API_PORT:-3000}:3000"
    volumes:
      - user-data:/data
    environment:
      - DATA_DIR=/data
      - PORT=3000
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
    restart: unless-stopped

  opencode:
    image: opencodeai/opencode-server:latest
    ports:
      - "${OCC_PORT:-8080}:8080"
    volumes:
      - user-data:/data
    working_dir: /data
    command: ["serve", "--port", "8080"]
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/global/health"]
    restart: unless-stopped

volumes:
  user-data:
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

- 轻量级 Node.js API + SQLite 持久化
- 用户注册 → 创建 Docker 容器 → 分配子域名
- 使用 Docker Engine API 创建/管理容器

### Flow

```
1. 用户注册
   └─> POST /users/register { email, password }
   └─> 验证通过

2. 系统创建容器
   └─> 分配唯一用户 ID (user-{uuid[:8]})
   └─> docker-compose up -d (创建 api-server + opencode 容器)
   └─> 分配子域名: user-{id}.example.com
   └─> 存储到 SQLite: users.db

3. 用户登录
   └─> POST /auth/login { email, password }
   └─> 查询 SQLite，返回容器 URL

4. 用户删除
   └─> DELETE /users/{id}
   └─> docker-compose down (停止并删除容器)
   └─> 删除数据卷
   └─> 从 SQLite 删除记录
```

### Error Handling

- 容器创建失败：回滚、记录日志、返回错误
- 端口冲突：自动重试或分配备用端口
- 用户删除失败：重试机制、人工介入告警

## Networking

### Subdomain Routing (Recommended)

```
*.example.com  ──▶  Nginx Reverse Proxy  ──▶  用户容器
                       │
                       ├─ user-abc.example.com  ──▶  User1 (3001, 8081)
                       ├─ user-def.example.com  ──▶  User2 (3002, 8082)
                       └─ user-xyz.example.com  ──▶  User3 (3003, 8083)
```

### Nginx Config Requirements

1. **Wildcard SSL 证书** (`*.example.com`)
2. **动态上游配置**：
   - 使用 `set $backend "user-xxx"` 动态路由
   - 或使用 `docker-gen` 自动生成配置
3. **端口映射管理**：
   - 每个用户分配独立端口（30001+, 80801+）

## Security Considerations

1. **Authentication**: JWT token
   ```javascript
   // auth middleware 示例
   const jwt = require('jsonwebtoken');
   const authMiddleware = (req, res, next) => {
     const token = req.headers.authorization?.split(' ')[1];
     if (!token) return res.status(401).json({ error: 'Unauthorized' });
     try {
       req.user = jwt.verify(token, process.env.JWT_SECRET);
       next();
     } catch {
       res.status(401).json({ error: 'Invalid token' });
     }
   };
   ```

2. **Container Isolation**: Docker 默认隔离
3. **Resource Limits**:
   ```yaml
   deploy:
     resources:
       limits:
         memory: 512M
         cpus: '0.5'
   ```
4. **Data Backup**:
   - 每日快照 `/data` 卷
   - 保留 7 天

## Backup & Restore

### Backup Strategy

- **频率**: 每日凌晨 3:00 (UTC)
- **保留**: 7 天
- **目标**: 对象存储 (S3/OSS)

### Restore Procedure

1. 停止用户容器
2. 删除旧数据卷
3. 从备份恢复数据
4. 启动容器

## Estimated Resources (Per User)

| Resource | Idle | Active |
|----------|------|--------|
| Memory (API) | ~100MB | ~150MB |
| Memory (OpenCode) | ~100MB | ~300MB |
| CPU | 0% | 5-15% |
| Disk | ~10MB | ~50MB |

## Timeline

- Phase 1: API Server 适配 + Docker 容器化
- Phase 2: 用户管理服务 + SQLite 持久化
- Phase 3: 前端环境配置
- Phase 4: Nginx 反向代理配置
- Phase 5: 测试部署
