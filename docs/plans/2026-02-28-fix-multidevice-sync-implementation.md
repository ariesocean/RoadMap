# Fix Multi-Device Sync: Remove currentMap from Persist Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 从 Zustand persist 中移除 `currentMap`，解决多设备同步时 Mac 加载错误地图的问题

**Architecture:** 修改 `mapsStore.ts` 的 `partialize` 函数，从 localStorage 持久化中排除 `currentMap`，使其成为纯运行时状态。同时清理浏览器 localStorage 中遗留的 `currentMap` 数据。

**Tech Stack:** React + TypeScript, Zustand, Vite

**Design Doc:** `docs/plans/2026-02-28-fix-multidevice-sync-currentmap.md`

---

## Prerequisites

- [ ] Vite 服务已启动（`npm run dev` 在 1430 端口）
- [ ] 项目目录：`/Users/SparkingAries/VibeProjects/RoadMap/roadmap-manager`

---

## Task 1: 修改 mapsStore.ts - 从 persist 中移除 currentMap

**Files:**
- Modify: `src/store/mapsStore.ts:109-113`

**Step 1: 读取当前文件内容**

Run: `cat src/store/mapsStore.ts | grep -A 10 "partialize"`

Expected: 显示包含 `currentMap` 的 partialize 配置

**Step 2: 修改 partialize 函数**

修改 `src/store/mapsStore.ts` 第 109-113 行：

```typescript
// Before:
partialize: (state) => ({
  isSidebarCollapsed: state.isSidebarCollapsed,
  currentMap: state.currentMap,
  immediateSaveEnabled: state.immediateSaveEnabled,
}),

// After:
partialize: (state) => ({
  isSidebarCollapsed: state.isSidebarCollapsed,
  immediateSaveEnabled: state.immediateSaveEnabled,
}),
```

**Step 3: 验证修改**

Run: `cat src/store/mapsStore.ts | grep -A 5 "partialize"`

Expected: 不再包含 `currentMap`

**Step 4: 构建验证**

Run: `npm run build`

Expected: 构建成功，无 TypeScript 错误

**Step 5: Commit**

```bash
cd roadmap-manager
git add src/store/mapsStore.ts
git commit -m "fix: remove currentMap from localStorage persist to fix multi-device sync

Problem: Mac browser was loading stale currentMap from localStorage on reconnect,
overwriting the backend's lastEditedMapId.

Solution: Remove currentMap from Zustand persist partialize so it's not stored
in localStorage. Now currentMap is purely runtime state and auto-select uses
backend's lastEditedMapId exclusively.

Fixes multi-device sync issue where device A's map was loaded instead of
device B's last edited map."
```

---

## Task 2: 清理浏览器 localStorage 遗留数据

**Files:**
- 浏览器 DevTools Console

**Step 1: 清除 localStorage 中的 currentMap**

在浏览器控制台执行：

```javascript
// 查看当前的 maps-storage
const storage = JSON.parse(localStorage.getItem('maps-storage'));
console.log('Before cleanup:', storage);

// 删除 currentMap
if (storage && storage.state) {
  delete storage.state.currentMap;
  localStorage.setItem('maps-storage', JSON.stringify(storage));
  console.log('After cleanup:', JSON.parse(localStorage.getItem('maps-storage')));
}
```

**Step 2: 验证清理**

确认 `currentMap` 字段已从 localStorage 中移除。

---

## Task 3: 功能测试

**测试场景：多设备同步**

**Step 1: Mac 端测试**

1. Mac 浏览器打开 `http://localhost:1430`
2. 刷新页面
3. 验证：页面加载后 `currentMap` 应为 null（侧边栏不会自动展开）
4. 点击 Connect
5. 选择地图 "新年计划"
6. Disconnect

**Step 2: iPad 端测试**

1. iPad Safari 打开 Mac 的 IP:1430
2. 点击 Connect
3. 应该自动加载 "新年计划"（Mac 刚才选择的）
4. 切换到地图 "GTS"
5. Disconnect

**Step 3: Mac 端验证**

1. Mac 浏览器重新 Connect
2. **预期**: 应该自动加载 "GTS"（iPad 最后选择的）
3. **不应加载**: "新年计划"（Mac 之前选择的）

**验证结果:**
- [ ] Mac 刷新后 currentMap 为 null
- [ ] iPad 自动加载 Mac 最后选择的地图
- [ ] Mac 重新加载 iPad 最后选择的地图（GTS）
- [ ] 没有加载"新年计划"

---

## Task 4: 回归测试

**Step 1: 基本功能测试**

- [ ] 创建新地图
- [ ] 重命名地图
- [ ] 删除地图
- [ ] 切换地图
- [ ] 添加/编辑任务
- [ ] 搜索任务

**Step 2: 页面刷新测试**

- [ ] 刷新页面后 Connect，验证需要手动点击 Connect
- [ ] Connect 后自动加载正确的地图

**Step 3: 侧边栏状态测试**

- [ ] 展开/折叠侧边栏
- [ ] 刷新页面后侧边栏状态保持（因为 isSidebarCollapsed 仍被 persist）

---

## Post-Implementation Checklist

- [ ] 所有测试通过
- [ ] 代码已提交
- [ ] 设计文档已更新（如需要）
- [ ] 本地存储已清理

---

## Notes

**为什么只改这一行？**
- `currentMap` 不应该跨会话保持，它是运行时状态
- `lastEditedMapId` 已经存在后端，用于跨设备同步
- 刷新页面后要求重新 Connect 是合理的行为

**可能的副作用：**
- 用户刷新页面后需要重新 Connect（但这是正确的行为）
- 侧边栏不会自动展开显示当前地图（需要 Connect 后才显示）

**验证命令：**
```bash
# 构建
npm run build

# 开发模式测试
npm run dev
```
