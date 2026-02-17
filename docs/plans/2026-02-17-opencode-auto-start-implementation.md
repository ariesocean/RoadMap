# OpenCode Server 自动启动实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Vite 启动时自动检测并启动 OpenCode Server，失败则无法启动

**Architecture:** 在 vite.config.ts 中添加启动检测逻辑，使用 child_process 启动 OpenCode Server 进程

**Tech Stack:** Node.js, Vite, child_process, http

---

### Task 1: 添加端口检测和启动工具函数

**Files:**
- Modify: `roadmap-manager/vite.config.ts:1-50`

**Step 1: 添加端口检测和启动函数**

在文件开头添加:

```typescript
import { spawn } from 'child_process';

const DEFAULT_PORTS = [51432, 51466, 51434];
const PROJECT_DIR = '/Users/SparkingAries/VibeProjects/RoadMap';

async function checkPort(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:${port}/global/health`, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(2000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function findAvailablePort(): Promise<number | null> {
  for (const port of DEFAULT_PORTS) {
    if (await checkPort(port)) {
      return port;
    }
  }
  return null;
}

async function startOpenCodeServer(port: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const env = { ...process.env, OPENCODE_SERVER_PASSWORD: '' };
    const proc = spawn('opencode', ['serve', '--port', String(port)], {
      cwd: PROJECT_DIR,
      env,
      detached: true,
      stdio: 'ignore'
    });
    
    proc.unref();
    
    let attempts = 0;
    const maxAttempts = 30;
    
    const checkInterval = setInterval(async () => {
      attempts++;
      if (await checkPort(port)) {
        clearInterval(checkInterval);
        resolve();
      } else if (attempts >= maxAttempts) {
        clearInterval(checkInterval);
        reject(new Error('OpenCode Server 启动超时'));
      }
    }, 1000);
  });
}
```

**Step 2: 验证语法正确**

Run: `cd /Users/SparkingAries/VibeProjects/RoadMap/roadmap-manager && npx tsc --noEmit vite.config.ts`
Expected: 无错误

**Step 3: Commit**

```bash
cd /Users/SparkingAries/VibeProjects/RoadMap
git add roadmap-manager/vite.config.ts
git commit -m "feat: 添加端口检测和启动函数"
```

---

### Task 2: 在 Vite 启动时调用自动检测逻辑

**Files:**
- Modify: `roadmap-manager/vite.config.ts:490-504`

**Step 1: 在 defineConfig 前添加启动逻辑**

在 export default defineConfig 之前添加:

```typescript
async function ensureOpenCodeServer() {
  console.log('[Roadmap] 检测 OpenCode Server...');
  
  let port = await findAvailablePort();
  
  if (port) {
    console.log(`[Roadmap] 找到运行中的 OpenCode Server: 端口 ${port}`);
    return port;
  }
  
  console.log('[Roadmap] 未找到 OpenCode Server，尝试启动...');
  const targetPort = DEFAULT_PORTS[0];
  
  try {
    await startOpenCodeServer(targetPort);
    console.log(`[Roadmap] OpenCode Server 已启动: 端口 ${targetPort}`);
    return targetPort;
  } catch (error) {
    console.error('[Roadmap] 启动 OpenCode Server 失败:', error);
    process.exit(1);
  }
}

const openCodePort = await ensureOpenCodeServer();

export default defineConfig({
  // ... 现有配置
```

**Step 2: 修改 checkServerHealth 使用动态端口**

修改 checkServerHealth 函数中的端口为 openCodePort:
```typescript
const req = http.get(`http://${OPENCODE_HOST}:${openCodePort}/global/health`, (res) => {
```

**Step 3: 修改中间件中的端口引用**

将所有中间件中的 `OPENCODE_PORT` 替换为 `openCodePort`

**Step 4: 验证构建**

Run: `cd /Users/SparkingAries/VibeProjects/RoadMap/roadmap-manager && npm run build`
Expected: 构建成功

**Step 5: Commit**

```bash
cd /Users/SparkingAries/VibeProjects/RoadMap
git add roadmap-manager/vite.config.ts
git commit -m "feat: Vite 启动时自动检测/启动 OpenCode Server"
```

---

### Task 3: 测试验证

**Files:**
- Test: 手动测试

**Step 1: 停止现有 OpenCode Server**

```bash
pkill -f "opencode serve" || true
```

**Step 2: 启动 Vite 开发服务器**

```bash
cd /Users/SparkingAries/VibeProjects/RoadMap/roadmap-manager && npm run dev
```

**Expected:**
- 控制台显示 "检测 OpenCode Server..."
- 自动启动 OpenCode Server
- 显示 "OpenCode Server 已启动: 端口 51432"
- Vite 正常启动

**Step 3: 再次启动 Vite（已有服务运行）**

```bash
cd /Users/SparkingAries/VibeProjects/RoadMap/roadmap-manager && npm run dev
```

**Expected:**
- 控制台显示 "找到运行中的 OpenCode Server: 端口 51432"
- Vite 正常启动

**Step 4: Commit**

```bash
cd /Users/SparkingAries/VibeProjects/RoadMap
git commit -m "test: 验证 OpenCode Server 自动启动功能"
```

---

### Task 4: 更新文档

**Files:**
- Modify: `docs/vite-tauri-architecture.md`

**Step 1: 更新端口配置说明**

将文档中关于端口的描述更新为动态检测逻辑

**Step 2: Commit**

```bash
cd /Users/SparkingAries/VibeProjects/RoadMap
git add docs/vite-tauri-architecture.md
git commit -m "docs: 更新端口配置说明"
```
