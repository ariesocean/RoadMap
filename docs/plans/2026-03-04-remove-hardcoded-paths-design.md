# 移除 Hardcoded 目录设计

## 目标

将项目中所有硬编码的绝对路径改为动态获取，使项目可以 clone 到任意机器正常运行。

## 问题分析

当前项目中存在以下硬编码路径：

| 文件 | 位置 | 用途 |
|------|------|------|
| `vite.config.ts` | Line 9, 105, 124, 139, 181, 214, 253-254, 291, 319, 395 | 项目路径、roadmap.md 读写、maps 目录 |
| `package.json` | Line 10 | opencode:server 启动命令 |
| `opencodeAPI.ts` | Line 59 | session 过滤条件 |

## 方案设计

### 核心原则

使用 `process.cwd()` 自动获取当前工作目录，移除所有硬编码路径。

### 修改内容

#### 1. vite.config.ts

- 将 `PROJECT_DIR` 常量改为 `process.cwd()`
- 所有文件操作改用 `path.resolve(PROJECT_DIR, 'xxx')`

```typescript
// 修改前
const PROJECT_DIR = '/Users/SparkingAries/VibeProjects/RoadMap'
fs.readFileSync('/Users/SparkingAries/VibeProjects/RoadMap/roadmap.md')

// 修改后
const PROJECT_DIR = process.cwd()
fs.readFileSync(path.resolve(PROJECT_DIR, 'roadmap.md'))
```

#### 2. package.json

将 `opencode:server` 脚本改为动态路径：

```json
// 修改前
"opencode:server": "cd /Users/SparkingAries/VibeProjects/RoadMap && (OPENCODE_SERVER_PASSWORD=\"\" opencode serve --port 51432 &)"

// 修改后 - 使用 . 即可，默认为当前目录
"opencode:server": "cd . && (OPENCODE_SERVER_PASSWORD=\"\" opencode serve --port 51432 &)"
```

#### 3. opencodeAPI.ts

session 过滤条件需要动态获取目录：

```typescript
// 修改前
s.directory === '/Users/SparkingAries/VibeProjects/RoadMap'

// 修改后 - 使用环境变量或动态获取
const projectDir = process.env.OPENCODE_PROJECT_DIR || process.cwd()
s.directory === projectDir
```

## 兼容性

- 默认使用当前工作目录 (即 `npm run dev` 运行的目录)
- 可通过环境变量 `OPENCODE_PROJECT_DIR` 覆盖默认行为
- 配置文件 `roadmap-config.json` 保持使用 `process.cwd()` 相对路径

## 验证

修改完成后，在任意目录执行 `npm run dev` 应能正常运行。
