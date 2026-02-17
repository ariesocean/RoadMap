# Remove Local Sessions Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 移除所有 local session 功能,所有 session 必须从服务器获取,只保留 New Conversation 用于创建新 session(提交时自动同步到服务器)

**Architecture:** 移除 localStorage 持久化和 local session 相关的状态管理,简化为纯服务器 session 模式

**Tech Stack:** React + Zustand

---

### Task 1: 清理 sessionStore.ts - 移除 localStorage 相关函数

**Files:**
- Modify: `roadmap-manager/src/store/sessionStore.ts:30-62`
- Modify: `roadmap-manager/src/store/sessionStore.ts:54-60`

**Step 1: 移除 loadSessionsFromStorage 函数**

删除 lines 30-52 的 `loadSessionsFromStorage` 函数

**Step 2: 移除 saveSessionsToStorage 函数**

删除 lines 54-60 的 `saveSessionsToStorage` 函数

**Step 3: 移除 persistSessions 调用**

搜索并移除所有 `persistSessions(sessions)` 调用:
- Line 203
- Line 218  
- Line 294
- Line 330
- Line 352

**Step 4: 移除 SESSIONS_STORAGE_KEY 和 ACTIVE_SESSION_KEY**

删除 lines 8-9

**Step 5: 提交**
```bash
git add roadmap-manager/src/store/sessionStore.ts
git commit -m "refactor: remove localStorage persistence from sessionStore"
```

---

### Task 2: 清理 sessionStore.ts - 移除 local session 相关函数

**Files:**
- Modify: `roadmap-manager/src/store/sessionStore.ts:135-138`
- Modify: `roadmap-manager/src/store/sessionStore.ts:458-490`

**Step 1: 从接口定义中移除 local session 函数**

删除 lines 135-137:
```typescript
isLocalSession: (sessionId: string) => boolean;
cleanupLocalSessions: () => void;
syncSessionToServer: (sessionId: string) => Promise<void>;
```

**Step 2: 移除 isLocalSession 实现**

删除 lines 458-463

**Step 3: 移除 cleanupLocalSessions 实现**

删除 lines 465-490

**Step 4: 移除 syncSessionToServer 实现**

删除 lines 492-529 (整个函数)

**Step 5: 提交**
```bash
git add roadmap-manager/src/store/sessionStore.ts
git commit -m "refactor: remove local session functions from sessionStore"
```

---

### Task 3: 清理 sessionStore.ts - 移除 createNewSession 中的 localStorage 写入

**Files:**
- Modify: `roadmap-manager/src/store/sessionStore.ts:200-211`

**Step 1: 简化 createNewSession**

将 createNewSession 简化为:
```typescript
createNewSession: (firstMessage?: string) => {
  const session = createNewSession(firstMessage);

  activeSessionId = session.id;
  currentSession = session;
  setActiveSessionId(session.id);

  set({ sessions: { [session.id]: session }, activeSessionId, currentSession });
  return session;
},
```

**Step 2: 提交**
```bash
git add roadmap-manager/src/store/sessionStore.ts
git commit -m "refactor: simplify createNewSession without localStorage"
```

---

### Task 4: 清理 useSession.ts - 移除 local session 相关导出

**Files:**
- Modify: `roadmap-manager/src/hooks/useSession.ts:1-27`
- Modify: `roadmap-manager/src/hooks/useSession.ts:150-170`

**Step 1: 移除 isLocalSession 和 syncSessionToServer 导入**

删除 lines 23-24:
```typescript
isLocalSession,
syncSessionToServer,
```

**Step 2: 移除 useSession 返回值中的相关字段**

删除 lines 166-167:
```typescript
isLocalSession,
syncSessionToServer,
```

**Step 3: 提交**
```bash
git add roadmap-manager/src/hooks/useSession.ts
git commit -f -m "refactor: remove local session hooks from useSession"
```

---

### Task 5: 清理 SessionList.tsx - 移除 local session 相关逻辑和 UI

**Files:**
- Modify: `roadmap-manager/src/components/SessionList.tsx:36-71`
- Modify: `roadmap-manager/src/components/SessionList.tsx:160-195`

**Step 1: 移除 isLocalSession, serverSessions 导入**

Lines 44-46 修改为:
```typescript
const { 
  sessions, 
  currentSession, 
  switchToSession, 
  deleteSession, 
  createNewSession, 
  refreshSessions,
  isLoadingServerSessions,
} = useSession();
```

**Step 2: 简化 allSessions 排序,移除 local session 分离逻辑**

Lines 51-71 修改为:
```typescript
const allSessions = Object.values(sessions).sort((a, b) => {
  const aIsNavigate = /navigate:/i.test(a.title);
  const bIsNavigate = /navigate:/i.test(b.title);

  if (aIsNavigate && !bIsNavigate) return -1;
  if (!aIsNavigate && bIsNavigate) return 1;

  const timeA = new Date(a.lastUsedAt).getTime();
  const timeB = new Date(b.lastUsedAt).getTime();
  if (timeA !== timeB) return timeB - timeA;

  const createdA = new Date(a.createdAt).getTime();
  const createdB = new Date(b.createdAt).getTime();
  if (createdA !== createdB) return createdB - createdA;

  return a.title.localeCompare(b.title);
});
```

**Step 3: 移除 server session 计数显示**

Line 159-161 修改为:
```typescript
<div className="p-2 text-xs text-secondary-text bg-gray-50 dark:bg-gray-800">
  {allSessions.length} sessions
</div>
```

**Step 4: 简化 session 渲染逻辑**

Lines 164-207 修改为:
```typescript
{allSessions.map((session) => {
  return (
    <div
      key={session.id}
      onClick={() => handleSelectSession(session.id)}
      className={`flex flex-col px-3 py-2 cursor-pointer hover:bg-secondary-bg dark:hover:bg-dark-secondary-bg transition-colors ${
        currentSession?.id === session.id
          ? 'bg-secondary-bg dark:bg-dark-secondary-bg'
          : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs text-primary-text dark:text-dark-primary-text truncate flex-1">
          {session.title}
        </span>
        {allSessions.length > 1 && (
          <button
            type="button"
            onClick={(e) => handleDeleteSession(e, session.id)}
            className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors ml-2"
            title="Delete session"
          >
            <Trash2 className="w-3 h-3 text-red-500" />
          </button>
        )}
      </div>
    </div>
  );
})}
```

**Step 5: 提交**
```bash
git add roadmap-manager/src/components/SessionList.tsx
git commit -m "refactor: remove local session UI from SessionList"
```

---

### Task 6: 验证构建

**Step 1: 运行 TypeScript 检查**

```bash
cd roadmap-manager && npm run typecheck
```

Expected: 无错误

**Step 2: 运行构建**

```bash
cd roadmap-manager && npm run build
```

Expected: 构建成功

**Step 3: 提交**
```bash
git add -A
git commit -m "chore: verify build after removing local sessions"
```

---

### 总结

改动范围:
- `sessionStore.ts`: 移除 localStorage 持久化、移除 3 个 local session 函数
- `useSession.ts`: 移除 2 个导出
- `SessionList.tsx`: 简化 UI,移除 local session 相关逻辑

行为变化:
- 服务器不可用时 session 列表为空,提交 prompt 报错(现有行为)
- 所有 session 从服务器获取
- New Conversation 保持现有逻辑(本地创建,提交时同步到服务器)
