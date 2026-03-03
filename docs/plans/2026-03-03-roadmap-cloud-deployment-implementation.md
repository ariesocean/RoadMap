# Roadmap Cloud Deployment Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 将 Roadmap Manager 部署为云端服务，每个用户拥有独立的 Docker 容器，运行 OpenCode Server + API Server

**Architecture:** 容器级隔离 - 每个用户一个独立容器，文件系统级数据隔离，子域名路由

**Tech Stack:** Docker, Express.js, React, OpenCode Server

---

## Phase 1: API Server 适配

### Task 1: 创建独立 API Server 项目

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
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = process.env.DATA_DIR || '/data';

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Middleware: serve static files from DATA_DIR
app.use(express.static(DATA_DIR));

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// API Routes
const apiRoutes = [
  'read-roadmap',
  'write-roadmap', 
  'list-maps',
  'create-map',
  'delete-map',
  'rename-map',
  'read-map',
  'write-map',
  'config'
];

// ... implement routes (migrated from vite.config.ts)

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API Server running on port ${PORT}`));
```

**Step 3: Create file routes (routes/file.js)**

Migrate all `/api/*` endpoints from `vite.config.ts`:

```javascript
import fs from 'fs';
import path from 'path';

const DATA_DIR = process.env.DATA_DIR || '/data';

export function setupFileRoutes(app) {
  // /api/read-roadmap
  app.get('/api/read-roadmap', (req, res) => {
    const filePath = path.join(DATA_DIR, 'roadmap.md');
    if (fs.existsSync(filePath)) {
      res.send(fs.readFileSync(filePath, 'utf-8'));
    } else {
      res.send('# Roadmap\n\n');
    }
  });

  // /api/write-roadmap
  app.post('/api/write-roadmap', (req, res) => {
    const filePath = path.join(DATA_DIR, 'roadmap.md');
    fs.writeFileSync(filePath, req.body.content);
    res.json({ success: true });
  });

  // /api/list-maps
  app.get('/api/list-maps', (req, res) => {
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

  // Implement remaining routes similarly...
}
```

**Step 4: Commit**

```bash
cd roadmap-manager
git add api-server/
git commit -m "feat: extract API server from vite.config.ts"
```

---

### Task 2: 创建 Dockerfile

**Files:**
- Create: `roadmap-manager/api-server/Dockerfile`

**Step 1: Create Dockerfile**

```dockerfile
FROM node:20-bullseye

WORKDIR /data

# Install dependencies
COPY package*.json ./
RUN npm install --production

# Copy source
COPY . .

# Expose ports
EXPOSE 3000 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start API server (OpenCode started separately)
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
- Modify: `roadmap-manager/src/services/opencodeClient.ts:3`

**Step 1: Create .env.example**

```
# Cloud deployment (optional - defaults to local development)
VITE_API_BASE_URL=http://localhost:3000
VITE_OPENCODE_SDK_URL=http://localhost:8080
```

**Step 2: Modify opencodeClient.ts**

```typescript
// Line 3: Change from
const BASE_URL = '/opencode';

// To:
const BASE_URL = import.meta.env.VITE_OPENCODE_SDK_URL || '/opencode';
```

**Step 3: Commit**

```bash
git add .env.example src/services/opencodeClient.ts
git commit -m "feat: add environment-based SDK URL configuration"
```

---

### Task 4: 更新 Vite 配置支持生产构建

**Files:**
- Modify: `roadmap-manager/vite.config.ts:811-834`

**Step 1: Update build config**

```typescript
// Update server.proxy to support both local and cloud
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 1430,
    proxy: import.meta.env.VITE_OPENCODE_SDK_URL ? undefined : {
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
git commit -m "feat: update vite config for cloud deployment"
```

---

## Phase 3: Docker Compose 本地测试

### Task 5: 创建 Docker Compose 配置

**Files:**
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
      - ./data:/data
    environment:
      - DATA_DIR=/data
      - PORT=3000

  opencode:
    image: opencode-ai/opencode-server:latest
    ports:
      - "8080:8080"
    volumes:
      - ./data:/data
    working_dir: /data
    command: opencode serve --port 8080
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
```

**Step 4: Commit**

```bash
git add docker-compose.yml
git commit -m "feat: add docker-compose for local testing"
```

---

## Phase 4: 用户管理服务 (可选 - 方案三)

### Task 6: 创建用户管理 API

**Files:**
- Create: `roadmap-manager/user-service/package.json`
- Create: `roadmap-manager/user-service/index.js`
- Create: `roadmap-manager/user-service/docker-compose.yml`

**Step 1: Create simple user service**

```javascript
// Simple user management with SQLite
import express from 'express';
import sqlite3 from 'sqlite3';
import { v4 as uuid } from 'uuid';

const app = express();
const db = new sqlite3.Database(':memory:');

db.serialize(() => {
  db.run('CREATE TABLE users (id TEXT PRIMARY KEY, email TEXT, container_id TEXT)');
});

// POST /register
app.post('/register', (req, res) => {
  const { email, password } = req.body;
  const userId = uuid();
  const containerId = `user-${userId.slice(0, 8)}`;
  
  db.run('INSERT INTO users (id, email, container_id) VALUES (?, ?, ?)', 
    [userId, email, containerId]);
  
  // TODO: Trigger docker container creation
  
  res.json({ userId, containerId, subdomain: `${containerId}.example.com` });
});

// POST /login  
app.post('/login', (req, res) => {
  const { email } = req.body;
  db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
    if (user) {
      res.json({ subdomain: `${user.container_id}.example.com` });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  });
});

app.listen(3001, () => console.log('User service on 3001'));
```

**Step 2: Commit**

```bash
git add user-service/
git commit -m "feat: add user management service"
```

---

## Summary

| Phase | Tasks | Description |
|-------|-------|-------------|
| 1 | 1-2 | Extract API Server + Dockerfile |
| 2 | 3-4 | Frontend env config |
| 3 | 5 | Docker Compose local test |
| 4 | 6 | User management (optional) |

---

**Plan complete.** Two execution options:

1. **Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

2. **Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

Which approach?
