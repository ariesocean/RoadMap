# Fix Multi-Device Sync Issue: Remove currentMap from LocalStorage Persist

**Date:** 2026-02-28  
**Issue:** Mac 重新连接后错误加载了之前存储在 localStorage 的地图，覆盖了后端配置

## Problem Description

在多设备使用场景下出现同步问题：
1. iPad 选择并保存地图 GTS，后端配置更新为 `lastEditedMapId: "GTS"`
2. iPad disconnect
3. Mac 浏览器重新 connect
4. **预期**: Mac 应加载 GTS（后端配置）
5. **实际**: Mac 加载了"新年计划"（Mac 之前存储在 localStorage 的 `currentMap`）

## Root Cause Analysis

问题根源在于 `mapsStore.ts` 中的 Zustand persist 配置：

```typescript
partialize: (state) => ({
  isSidebarCollapsed: state.isSidebarCollapsed,
  currentMap: state.currentMap,  // ← 问题所在
  immediateSaveEnabled: state.immediateSaveEnabled,
}),
```

**问题流程：**
1. Mac 之前使用时选择"新年计划"，`currentMap` 被 persist 到 localStorage
2. Mac 刷新页面后，localStorage 自动恢复 `currentMap="新年计划"`
3. 用户点击 connect，触发 `loadLastEditedMapId()` 从后端获取 `"GTS"`
4. `App.tsx` 中的 useEffect 检测到：
   - `lastEditedMapId="GTS"`
   - `currentMap="新年计划"` ≠ GTS
   - 触发 `handleMapSelect("新年计划")` 
5. `handleMapSelect` 调用 `setLastEditedMapId("新年计划")`，覆盖后端配置

## Solution

### 核心思路
从 Zustand persist 的 `partialize` 中移除 `currentMap`，让 `currentMap` 成为纯运行时状态。

### Implementation Details

**修改文件:** `roadmap-manager/src/store/mapsStore.ts`

**Before:**
```typescript
partialize: (state) => ({
  isSidebarCollapsed: state.isSidebarCollapsed,
  currentMap: state.currentMap,
  immediateSaveEnabled: state.immediateSaveEnabled,
}),
```

**After:**
```typescript
partialize: (state) => ({
  isSidebarCollapsed: state.isSidebarCollapsed,
  immediateSaveEnabled: state.immediateSaveEnabled,
}),
```

### Behavior Changes

1. **刷新页面后**: `currentMap` 变为 `null`，不会自动恢复之前选择的地图
2. **重新 connect 后**: 完全依赖后端 `lastEditedMapId` 自动选择地图
3. **用户体验**: 刷新页面后需要重新 connect，但这符合"连接后才可操作"的设计逻辑

### Testing Checklist

- [ ] Mac 选择地图 A 并 disconnect
- [ ] iPad 选择地图 B 并 disconnect
- [ ] Mac 重新 connect，验证加载的是地图 B（而非 A）
- [ ] iPad 重新 connect，验证加载的是地图 B
- [ ] 刷新页面后，`currentMap` 为 null
- [ ] 所有原有功能（切换地图、创建地图、删除地图）正常工作

## Alternative Solutions Considered

**方案 2**: 连接时强制重置 currentMap 为 null
- 优点：保留 localStorage 用于其他场景
- 缺点：需要修改多处代码，逻辑分散

**方案 3**: 修改 auto-select 逻辑，优先信任后端
- 优点：保留用户体验
- 缺点：逻辑复杂，容易引入其他 bug

选择方案 1 是因为：
- `lastEditedMapId` 已存储在后端，用于跨设备同步
- `currentMap` 应该是运行时状态，不应该跨会话保持
- 实现简单，不会引入副作用
