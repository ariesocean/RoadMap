# 移除 Hardcoded 目录实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 将项目中所有硬编码的绝对路径改为动态获取，使项目可移植到任意机器

**Architecture:** 使用 `process.cwd()` 动态获取当前工作目录，移除所有硬编码路径

**Tech Stack:** TypeScript, Vite

---

### Task 1: 修改 vite.config.ts - PROJECT_DIR

**Files:**
- Modify: `roadmap-manager/vite.config.ts:9`

**Step 1: 修改 PROJECT_DIR 定义**

```typescript
// 修改前 (Line 9)
const PROJECT_DIR = '/Users/SparkingAries/VibeProjects/RoadMap'

// 修改后
const PROJECT_DIR = process.cwd()
```

**Step 2: 验证无语法错误**

Run: `cd roadmap-manager && npx tsc --noEmit vite.config.ts`
Expected: 无错误输出

---

### Task 2: 修改 vite.config.ts - roadmap.md 读写路径

**Files:**
- Modify: `roadmap-manager/vite.config.ts:105, 124`

**Step 1: 修改 /api/read-roadmap 路径**

```typescript
// 修改前 (Line 105)
const content = fs.readFileSync('/Users/SparkingAries/VibeProjects/RoadMap/roadmap.md', 'utf-8');

// 修改后
const content = fs.readFileSync(path.resolve(PROJECT_DIR, 'roadmap.md'), 'utf-8');
```

**Step 2: 修改 /api/write-roadmap 路径**

```typescript
// 修改前 (Line 124)
fs.writeFileSync('/Users/SparkingAries/VibeProjects/RoadMap/roadmap.md', body.content);

// 修改后
fs.writeFileSync(path.resolve(PROJECT_DIR, 'roadmap.md'), body.content);
```

---

### Task 3: 修改 vite.config.ts - maps 目录路径

**Files:**
- Modify: `roadmap-manager/vite.config.ts:139`

**Step 1: 修改 /api/list-maps 路径**

```typescript
// 修改前 (Line 139)
const mapsDir = '/Users/SparkingAries/VibeProjects/RoadMap';

// 修改后
const mapsDir = PROJECT_DIR;
```

---

### Task 4: 修改 vite.config.ts - create-map 路径

**Files:**
- Modify: `roadmap-manager/vite.config.ts:181`

**Step 1: 修改 /api/create-map 路径**

```typescript
// 修改前 (Line 181)
const filepath = `/Users/SparkingAries/VibeProjects/RoadMap/${filename}`;

// 修改后
const filepath = path.resolve(PROJECT_DIR, filename);
```

---

### Task 5: 修改 vite.config.ts - delete-map 路径

**Files:**
- Modify: `roadmap-manager/vite.config.ts:214`

**Step 1: 修改 /api/delete-map 路径**

```typescript
// 修改前 (Line 214)
const filepath = `/Users/SparkingAries/VibeProjects/RoadMap/${filename}`;

// 修改后
const filepath = path.resolve(PROJECT_DIR, filename);
```

---

### Task 6: 修改 vite.config.ts - rename-map 路径

**Files:**
- Modify: `roadmap-manager/vite.config.ts:253-254`

**Step 1: 修改 /api/rename-map 路径**

```typescript
// 修改前 (Lines 253-254)
const oldPath = `/Users/SparkingAries/VibeProjects/RoadMap/${oldFilename}`;
const newPath = `/Users/SparkingAries/VibeProjects/RoadMap/${newFilename}`;

// 修改后
const oldPath = path.resolve(PROJECT_DIR, oldFilename);
const newPath = path.resolve(PROJECT_DIR, newFilename);
```

---

### Task 7: 修改 vite.config.ts - read-map 路径

**Files:**
- Modify: `roadmap-manager/vite.config.ts:291`

**Step 1: 修改 /api/read-map 路径**

```typescript
// 修改前 (Line 291)
const filepath = `/Users/SparkingAries/VibeProjects/RoadMap/${filename}`;

// 修改后
const filepath = path.resolve(PROJECT_DIR, filename);
```

---

### Task 8: 修改 vite.config.ts - write-map 路径

**Files:**
- Modify: `roadmap-manager/vite.config.ts:319`

**Step 1: 修改 /api/write-map 路径**

```typescript
// 修改前 (Line 319)
const filepath = `/Users/SparkingAries/VibeProjects/RoadMap/${filename}`;

// 修改后
const filepath = path.resolve(PROJECT_DIR, filename);
```

---

### Task 9: 修改 vite.config.ts - session 过滤路径

**Files:**
- Modify: `roadmap-manager/vite.config.ts:395`

**Step 1: 修改 session 过滤条件**

```typescript
// 修改前 (Line 395)
s.directory === '/Users/SparkingAries/VibeProjects/RoadMap' &&

// 修改后
s.directory === PROJECT_DIR &&
```

---

### Task 10: 修改 package.json - opencode:server 路径

**Files:**
- Modify: `roadmap-manager/package.json:10`

**Step 1: 修改脚本路径**

```json
// 修改前
"opencode:server": "cd /Users/SparkingAries/VibeProjects/RoadMap && (OPENCODE_SERVER_PASSWORD=\"\" opencode serve --port 51432 &)"

// 修改后
"opencode:server": "cd . && (OPENCODE_SERVER_PASSWORD=\"\" opencode serve --port 51432 &)"
```

---

### Task 11: 修改 opencodeAPI.ts - session 过滤路径

**Files:**
- Modify: `roadmap-manager/src/services/opencodeAPI.ts:59`

**Step 1: 修改 session 过滤条件**

```typescript
// 修改前 (Line 59)
s.directory === '/Users/SparkingAries/VibeProjects/RoadMap' &&

// 修改后 - 使用 process.cwd()
s.directory === process.cwd() &&
```

---

### Task 12: 验证构建

**Step 1: 运行类型检查**

Run: `cd roadmap-manager && npx tsc --noEmit`
Expected: 无错误输出

**Step 2: 尝试构建**

Run: `cd roadmap-manager && npm run build`
Expected: 构建成功
