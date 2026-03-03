# Roadmap Cloud Deployment Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 将 Roadmap Manager 部署为云端服务，每个用户拥有独立的 Docker 容器，运行 OpenCode Server + API Server

**Architecture:** 容器级隔离 - 每个用户 2 个独立容器（API Server + OpenCode Server），共享数据卷，子域名路由

**Tech Stack:** Docker, Express.js, React, OpenCode Server, SQLite

---

## Phase 1: API Server 适配

### Task 1: 创建独立 API Server 项目（完整实现）

**Files:**
- Create: `roadmap-manager/api-server/package.json`
- Create: `roadmap-manager/api-server/index.js`
- Create: `roadmap-manager/api-server/routes/file.js`

**Step 1: Create package.json**

```json
{
  "name": "roadmap-api-server",
  "version": "1.0.0",
  "type": "module",
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5"
  }
}
```

**Step 2: Create Express server (index.js)**

```javascript
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { setupFileRoutes } from './routes/file.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = process.env.DATA_DIR || '/data';

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// API Routes - 完整实现所有 9 个端点
setupFileRoutes(app);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API Server running on port ${PORT}`));
```

**Step 3: Create file routes (routes/file.js) - 完整实现**

```javascript
import fs from 'fs';
import path from 'path';

const DATA_DIR = process.env.DATA_DIR || '/data';

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function validateMapName(name) {
  const validNameRegex = /^[\u4e00-\u9fa5a-zA-Z0-9][\u4e00-\u9fa5a-zA-Z0-9-]*$/;
  return validNameRegex.test(name);
}

export function setupFileRoutes(app) {
  // /api/read-roadmap
  app.get('/api/read-roadmap', (req, res) => {
    ensureDataDir();
    const filePath = path.join(DATA_DIR, 'roadmap.md');
    if (fs.existsSync(filePath)) {
      res.send(fs.readFileSync(filePath, 'utf-8'));
    } else {
      res.send('# Roadmap\n\n');
    }
  });

  // /api/write-roadmap
  app.post('/api/write-roadmap', (req, res) => {
    ensureDataDir();
    const filePath = path.join(DATA_DIR, 'roadmap.md');
    fs.writeFileSync(filePath, req.body.content);
    res.json({ success: true });
  });

  // /api/list-maps
  app.get('/api/list-maps', (req, res) => {
    ensureDataDir();
    const files = fs.readdirSync(DATA_DIR);
    const mapFiles = files
      .filter(f => f.startsWith('map-') && f.endsWith('.md'))
      .map(f => ({
        id: f.slice(4, -3),
        name: f.slice(4, -3),
        filename: f
      }));
    res.json(mapFiles);
  });

  // /api/create-map
  app.post('/api/create-map', (req, res) => {
    ensureDataDir();
    const rawName = req.body.name?.trim();
    if (!rawName || !validateMapName(rawName)) {
      return res.status(400).json({ error: 'Invalid map name' });
    }
    const mapName = rawName.replace(/\s+/g, '-');
    const filename = `map-${mapName}.md`;
    const filepath = path.join(DATA_DIR, filename);
    
    if (fs.existsSync(filepath)) {
      return res.status(400).json({ error: 'Map already exists' });
    }
    
    fs.writeFileSync(filepath, '');
    res.json({ id: mapName, name: mapName, filename });
  });

  // /api/delete-map
  app.post('/api/delete-map', (req, res) => {
    const filename = req.body.filename || `map-${req.body.name}.md`;
    const filepath = path.join(DATA_DIR, filename);
    
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ error: 'Map file not found' });
    }
    
    fs.unlinkSync(filepath);
    res.json({ success: true });
  });

  // /api/rename-map
  app.post('/api/rename-map', (req, res) => {
    const oldFilename = req.body.oldFilename || `map-${req.body.oldName}.md`;
    const rawNewName = req.body.newName?.trim();
    
    if (!rawNewName || !validateMapName(rawNewName)) {
      return res.status(400).json({ error: 'Invalid map name' });
    }
    
    const newName = rawNewName.replace(/\s+/g, '-');
    const newFilename = `map-${newName}.md`;
    const oldPath = path.join(DATA_DIR, oldFilename);
    const newPath = path.join(DATA_DIR, newFilename);
    
    if (!fs.existsSync(oldPath)) {
      return res.status(404).json({ error: 'Map file not found' });
    }
    if (fs.existsSync(newPath)) {
      return res.status(400).json({ error: 'A map with that name already exists' });
    }
    
    fs.renameSync(oldPath, newPath);
    res.json({ id: newName, name: newName, filename: newFilename });
  });

  // /api/read-map
  app.post('/api/read-map', (req, res) => {
    const filename = req.body.filename || `map-${req.body.name}.md`;
    const filepath = path.join(DATA_DIR, filename);
    
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ error: 'Map file not found' });
    }
    
    res.send(fs.readFileSync(filepath, 'utf-8'));
  });

  // /api/write-map
  app.post('/api/write-map', (req, res) => {
    ensureDataDir();
    const filename = req.body.filename || `map-${req.body.name}.md`;
    const filepath = path.join(DATA_DIR, filename);
    fs.writeFileSync(filepath, req.body.content);
    res.json({ success: true });
  });

  // /api/config
  app.get('/api/config', (req, res) => {
    ensureDataDir();
    const configPath = path.join(DATA_DIR, 'roadmap-config.json');
    if (fs.existsSync(configPath)) {
      res.json(JSON.parse(fs.readFileSync(configPath, 'utf-8')));
    } else {
      res.json({ lastEditedMapId: null });
    }
  });

  app.post('/api/config', (req, res) => {
    ensureDataDir();
    const configPath = path.join(DATA_DIR, 'roadmap-config.json');
    fs.writeFileSync(configPath, JSON.stringify(req.body, null, 2));
    res.json({ success: true });
  });
}
```

**Step 4: Commit**

```bash
cd roadmap-manager
git add api-server/
git commit -m "feat: extract complete API server from vite.config.ts"
```

---

### Task 2: 创建 Dockerfile

**Files:**
- Create: `roadmap-manager/api-server/Dockerfile`

**Step 1: Create Dockerfile**

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

**Step 2: Commit**

```bash
git add api-server/Dockerfile
git commit -m "feat: add Dockerfile for API server"
```

---

## Phase 2: 前端环境配置

### Task 3: 添加环境变量配置

**Files:**
- Create: `roadmap-manager/.env.example`
- Modify: `roadmap-manager/src/services/opencodeSDK.ts`

**Step 1: Create .env.example**

```
# Cloud deployment (optional - defaults to local development)
VITE_API_BASE_URL=http://localhost:3000
VITE_OPENCODE_SDK_URL=http://localhost:8080
```

**Step 2: Modify opencodeSDK.ts (修正文件引用)**

```typescript
// 找到 BASE_URL 定义，修改为：
const BASE_URL = import.meta.env.VITE_OPENCODE_SDK_URL || '/opencode';
```

**Step 3: Commit**

```bash
git add .env.example src/services/opencodeSDK.ts
git commit -m "feat: add environment-based SDK URL configuration"
```

---

### Task 4: 更新 Vite 配置支持生产构建（保留本地开发）

**Files:**
- Modify: `roadmap-manager/vite.config.ts`

**Step 1: Update vite.config.ts - 条件化 roadmapPlugin**

```typescript
// 在 vite.config.ts 顶部添加环境判断
const isCloudBuild = process.env.VITE_CLOUD_BUILD === 'true';

export default defineConfig({
  plugins: [
    react(),
    // 仅在本地开发时启用 roadmapPlugin
    !isCloudBuild ? roadmapPlugin : undefined,
  ].filter(Boolean),
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 1430,
    proxy: isCloudBuild ? undefined : {
      '/opencode': {
        target: 'http://localhost:51432',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/opencode/, ''),
      },
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    target: 'esnext',
  },
});
```

**Step 2: Commit**

```bash
git add vite.config.ts
git commit -feat: add cloud build flag to vite config"
```

---

### Task 5: 清理 vite.config.ts 死代码

**Files:**
- Modify: `roadmap-manager/vite.config.ts`

**Step 1: 删除未使用的端点**

删除以下未使用的中间件：
- `/session` 端点（当前使用 SDK）
- `/api/execute-navigate`（未使用）
- `/api/execute-modal-prompt`（未使用）

保留：
- `/api/*` 文件操作端点（本地开发用）
- OpenCode Server 启动逻辑

**Step 2: Commit**

```bash
git add vite.config.ts
git commit - "chore: remove dead code from vite.config.ts"
```

---

## Phase 3: Docker Compose 本地测试

### Task 6: 创建 Docker Compose 配置（分开容器）

**Files:**
- Create: `roadmap-manager/docker-compose.yml`
- Create: `roadmap-manager/docker-compose.yml`

**Step 1: Create docker-compose.yml**

```yaml
version: '3.8'

services:
  api-server:
    build: ./api-server
    ports:
      - "3000:3000"
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
      - "8080:8080"
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

**Step 2: Create test data directory**

```bash
mkdir -p roadmap-manager/data
touch roadmap-manager/data/roadmap.md
```

**Step 3: Test locally**

```bash
cd roadmap-manager
docker-compose up --build
# Test API: curl http://localhost:3000/api/read-roadmap
# Test OpenCode: curl http://localhost:8080/global/health
```

**Step 4: Commit**

```bash
git add docker-compose.yml
git commit -m "feat: add docker-compose with separate containers"
```

---

## Phase 4: 用户管理服务

### Task 7: 创建用户管理 API（持久化 SQLite）

**Files:**
- Create: `roadmap-manager/user-service/package.json`
- Create: `roadmap-manager/user-service/index.js`
- Create: `roadmap-manager/user-service/Dockerfile`

**Step 1: Create package.json**

```json
{
  "name": "roadmap-user-service",
  "version": "1.0.0",
  "type": "module",
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "sqlite3": "^5.1.6",
    "uuid": "^9.0.0",
    "jsonwebtoken": "^9.0.0"
  }
}
```

**Step 2: Create user service (index.js) - 持久化 SQLite**

```javascript
import express from 'express';
import sqlite3 from 'sqlite3';
import { verbose } from 'sqlite3';
import { v4 as uuid } from 'uuid';
import jwt from 'jsonwebtoken';

const app = express();
const db = new sqlite3.Database('./users.db');  // 持久化到磁盘

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE,
    password_hash TEXT,
    container_id TEXT,
    subdomain TEXT,
    created_at INTEGER
  )`);
});

// POST /register
app.post('/register', (req, res) => {
  const { email, password } = req.body;
  const userId = uuid();
  const containerId = `user-${userId.slice(0, 8)}`;
  const subdomain = `${containerId}.example.com`;
  
  // 简单密码哈希（生产环境应使用 bcrypt）
  const passwordHash = Buffer.from(password).toString('base64');
  
  db.run(
    'INSERT INTO users (id, email, password_hash, container_id, subdomain, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    [userId, email, passwordHash, containerId, subdomain, Date.now()],
    (err) => {
      if (err) {
        return res.status(400).json({ error: 'Email already exists' });
      }
      
      // TODO: 触发 Docker 容器创建
      createUserContainer(containerId);
      
      res.json({ userId, containerId, subdomain });
    }
  );
});

// POST /login
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  const passwordHash = Buffer.from(password).toString('base64');
  
  db.get(
    'SELECT * FROM users WHERE email = ? AND password_hash = ?',
    [email, passwordHash],
    (err, user) => {
      if (user) {
        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'dev-secret');
        res.json({ token, subdomain: user.subdomain });
      } else {
        res.status(401).json({ error: 'Invalid credentials' });
      }
    }
  );
});

// 辅助函数：创建用户容器
async function createUserContainer(containerId) {
  // TODO: 使用 Docker Engine API 或 docker-compose 创建容器
  console.log(`Creating containers for ${containerId}...`);
}

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`User service on ${PORT}`));
```

**Step 3: Create Dockerfile**

```dockerfile
FROM node:20-bullseye

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

CMD ["node", "index.js"]
```

**Step 4: Commit**

```bash
git add user-service/
git commit -m "feat: add user management service with persistent SQLite"
```

---

## Summary

| Phase | Tasks | Description |
|-------|-------|-------------|
| 1 | 1-2 | Extract complete API Server + Dockerfile |
| 2 | 3-5 | Frontend env config + cleanup dead code |
| 3 | 6 | Docker Compose (separate containers) |
| 4 | 7 | User management (persistent SQLite) |

---

**Plan complete.** Two execution options:

1. **Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

2. **Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

Which approach?
