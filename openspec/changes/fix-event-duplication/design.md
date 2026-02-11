## Context

Roadmap Manager 通过 Vite 服务器中间件与 OpenCode Server 通信。SSE (Server-Sent Events) 用于实时推送处理进度。当前存在两个问题：

1. `/api/execute-navigate` 端点没有去重机制
2. eventId 生成使用 `Date.now()`，同一毫秒内会重复

## Goals / Non-Goals

- Goals: 消除弹窗中重复显示的 Processing 信息
- Non-Goals: 不改变 OpenCode Server API 调用逻辑

## Decisions

### Decision 1: Use Incrementing Counter for Event ID

Instead of relying on `Date.now()` which can produce duplicate values within the same millisecond, use an incrementing counter combined with session ID.

**Current (problematic):**
```typescript
const eventId = wrapper.id || `${wrapper.type}-${sessionId}-${Date.now()}`;
```

**Fixed:**
```typescript
let eventCounter = 0;
const eventId = wrapper.id || `${wrapper.type}-${sessionId}-${eventCounter++}`;
```

### Decision 2: Add Deduplication to Both Endpoints

Both `/api/execute-navigate` and `/api/execute-modal-prompt` need consistent deduplication:

```typescript
const processedEvents = new Set<string>();

// In event handler:
if (processedEvents.has(eventId)) continue;
processedEvents.add(eventId);
```

### Decision 3: Frontend Consistency

The frontend `taskStore.ts` should use the same deduplication strategy:

```typescript
let eventCounter = 0;
const processedEvents = new Set<string>();
const eventId = data.id || `${data.type}-${data.sessionId}-${eventCounter++}`;
```

## Risks / Trade-offs

- **Risk**: Counter reset on page refresh is acceptable since sessions are isolated
- **Risk**: Large number of events (unlikely) could increase memory - mitigated by event completion cleanup

## Migration Plan

1. Update vite.config.ts with new counter logic
2. Update taskStore.ts with new eventId generation
3. No database or user-facing configuration changes needed

## Open Questions

- None at this time
