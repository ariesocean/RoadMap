# Vite vs Tauri 运行模式详解

## 概述

本文档介绍 roadmap-manager 在三种运行模式下的架构差异:纯 Vite 开发模式、Tauri 开发模式、 Tauri 打包应用。

## 端口配置

| 端口 | 用途 |
|------|------|
| 51466 | OpenCode Server (由 Tauri Rust 后端启动) |
| 1430 | Vite 开发服务器前端端口 |

配置文件位置:
- `vite.config.ts` - Vite 代理端口和健康检查
- `src-tauri/src/lib.rs` - Rust 后端启动配置

## 模式对比

### 1. 纯 Vite 开发模式 (`npm run dev`)

```bash
cd roadmap-manager
npm run dev -- --host 0.0.0.0 --port 1430
```

访问: http://localhost:1430

**架构:**
```
浏览器 ←→ Vite 开发服务器 (1430) ←→ 代理转发 ←→ OpenCode Server (51466)
```

**特点:**
- 标准的 React/Vite Web 应用
- 通过 vite.config.ts 的代理转发请求
- 健康检查端口: 51466
- 每次代码保存自动刷新 (HMR)
- 调试方便,可使用浏览器 DevTools
- 没有桌面应用特性

**判断方式:** `window.__TAURI__` 不存在

---

### 2. Tauri 开发模式 (`npm run tauri dev`)

```bash
cd roadmap-manager
npm run tauri dev
```

打开: macOS 应用窗口 (Roadmap Manager)

**架构:**
```
┌─────────────────────────────────────────────────────────┐
│  Tauri WebView                                          │
│  ┌──────────────────┐    ┌──────────────────────────┐ │
│  │ 前端 (React)      │───→│ window.__TAURI__ 存在    │ │
│  │                  │    │ 调用 Rust invoke         │ │
│  └──────────────────┘    └──────────┬───────────────┘ │
└─────────────────────────────────────│─────────────────┘
                                      ↓
┌─────────────────────────────────────────────────────────┐
│  Rust 后端 (lib.rs)                                     │
│  ┌──────────────────┐    ┌──────────────────────────┐ │
│  │ execute_navigate │───→│ OpenCode Server (51466)  │ │
│  │ execute_modal... │    │                          │ │
│  └──────────────────┘    └──────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

**特点:**
- 包装在 Tauri WebView 中的 Vite 应用
- Rust 后端自动启动 OpenCode Server (端口 51466)
- 可调用 Rust 原生功能 (invoke)
- 有桌面应用体验(原生标题栏、菜单)
- 代码修改后自动重新加载

**判断方式:** `window.__TAURI__` 存在

**前端代码示例:**
```typescript
const isTauri = typeof window !== 'undefined' && (window as any).__TAURI__;

if (isTauri) {
  // 调用 Rust invoke
  await invoke('execute_navigate', { prompt, sessionId, model });
} else {
  // 调用 Vite 代理/fetch
  await fetch('/api/execute-navigate', {...});
}
```

---

### 3. Tauri 打包应用

```bash
cd roadmap-manager
npm run tauri build
# 输出: Roadmap Manager.app
```

打开: /path/to/Roadmap Manager.app

**架构:**
```
┌─────────────────────────────────────────────────────────┐
│  Tauri WebView (独立应用)                               │
│  ┌──────────────────┐    ┌──────────────────────────┐ │
│  │ 前端 (React)      │───→│ window.__TAURI__ 存在    │ │
│  │                  │    │ 调用 Rust invoke         │ │
│  └──────────────────┘    └──────────┬───────────────┘ │
└─────────────────────────────────────│─────────────────┘
                                      ↓
┌─────────────────────────────────────────────────────────┐
│  Rust 后端                                             │
│  ┌──────────────────┐    ┌──────────────────────────┐ │
│  │ execute_navigate │───→│ OpenCode Server (51466)  │ │
│  │ execute_modal... │    │                          │ │
│  └──────────────────┘    └──────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

**特点:**
- 独立的 macOS 应用程序
- 不依赖 Node.js 环境
- 不使用 vite.config.ts 配置
- 可安装到系统 Applications 目录

---

## Tauri 命令详解

### `npm run tauri dev` vs `npm run tauri build`

| | `tauri dev` | `tauri build` |
|--|-------------|---------------|
| **用途** | 开发测试 | 构建发布 |
| **输出** | 不生成安装包 | 生成 .app / .dmg |
| **编译** | 增量编译,快 | 完整编译,慢 |
| **热重载** | ✅ 有 | ❌ 无 |
| **DevTools** | ✅ 自动打开 | ❌ 不打开 |
| **是否运行** | 启动应用窗口 | 只构建不运行 |

**`tauri dev` 执行流程:**
```
1. 启动 Vite 开发服务器 (端口 1430)
2. 启动 Rust 后端 (编译 debug)
3. 打开应用窗口
4. 监听代码变化,自动重载
```

**`tauri build` 执行流程:**
```
1. Vite 打包 (生成 dist/)
2. Rust 编译 (debug/release)
3. 生成安装包 (.app / .dmg)
4. 结束 (不运行应用)
```

---

### `--debug` 标志

```bash
npm run tauri build -- --debug
```

| | `--debug` | (生产模式) |
|--|-----------|------------|
| **输出位置** | `src-tauri/target/debug/` | `src-tauri/target/release/` |
| **文件大小** | 较大 | 较小 |
| **优化** | 无优化,可调试 | 启用优化 |
| **构建速度** | 快 | 慢 |

**输出产物:**
```
src-tauri/target/debug/
├── roadmap-manager          # 可执行文件
└── bundle/
    ├── macos/Roadmap Manager.app
    └── dmg/Roadmap Manager_1.0.0_x64.dmg
```

---

## 数据存储路径

### roadmap.md 文件

| 模式 | 路径 |
|------|------|
| 纯 Vite (npm run dev) | `/Users/SparkingAries/VibeProjects/RoadMap/roadmap.md` |
| Tauri dev | `/Users/SparkingAries/Library/Application Support/roadmap-manager/roadmap.md` |
| Tauri App | `/Users/SparkingAries/Library/Application Support/roadmap-manager/roadmap.md` |

> 注: tauri dev 和 tauri build 现在使用相同路径,保持一致。

### OpenCode Server 数据

| 模式 | 路径 |
|------|------|
| 纯 Vite | 使用项目目录的 OpenCode 会话 |
| Tauri dev | `/Users/SparkingAries/Library/Application Support/roadmap-manager` |
| Tauri App | `/Users/SparkingAries/Library/Application Support/roadmap-manager` |

存储内容:
- `roadmap.md` - 任务文件
- `sessions/` - 会话数据

---

## 常见问题

### Q: 为什么显示 "OpenCode Server 未运行"?

检查端口是否一致:
- vite.config.ts 中的 `OPENCODE_PORT` 必须与 lib.rs 中启动的端口匹配
- 当前配置为 51466

### Q: Tauri dev 模式下前端走哪个后端?

无论 Vite 服务器是否运行,Tauri dev 模式下前端会优先检测 `window.__TAURI__`,如果存在则走 Rust invoke 调用。

### Q: 如何调试 Tauri 后端?

查看 Rust 代码中的打印输出:
```rust
println!("OpenCode server started on port {}", OPENCODE_PORT);
```

终端会显示这些日志。

---

## 相关文件

- `vite.config.ts` - Vite 配置,包含代理和健康检查
- `src-tauri/src/lib.rs` - Rust 后端主逻辑
- `src/store/taskStore.ts` - 任务提交逻辑,包含 Tauri 检测
- `src/hooks/useSession.ts` - 会话管理,包含 Tauri 调用
- `src/services/opencodeAPI.ts` - API 服务层,包含 Tauri 调用
