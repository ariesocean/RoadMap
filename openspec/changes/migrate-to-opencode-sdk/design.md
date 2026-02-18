## Context
The Roadmap project currently communicates with the OpenCode server via manual HTTP requests and custom SSE parsing. The **official @opencode-ai/sdk** npm package provides a cleaner abstraction.

**Note**: Using official SDK `@opencode-ai/sdk` (v2 API), NOT the local opencode-cli SDK. The official SDK provides:
- `createOpencodeClient()` - Main client factory
- `client.session` - Session operations (list, create, prompt, promptAsync, abort, diff, etc.)
- `client.session.event()` - Session-level SSE event subscription
- `client.global.event()` - Global SSE event subscription
- Built-in TypeScript types and authentication handling

### Current Architecture
```
React App → fetch() → Vite Proxy (/api/*) → OpenCode Server (port 51432)
```

### Target Architecture
```
React App → opencode-sdk (OpenCodeClient) → OpenCode Server (port 51432)
```

## Goals / Non-Goals

### Goals
- Reduce code complexity by ~200 lines
- Use SDK's EventEmitter for SSE events
- Simplify authentication handling
- Enable future SDK features (abort, getDiff, getChildren)
- Maintain backward compatibility (same port 51432)

### Non-Goals
- Change user-facing behavior
- Migrate to Tauri (handled by separate change)
- Add new features beyond SDK migration
- Change port configuration

## Decisions

### Decision: Use SDK instead of direct HTTP
- **Rationale**: SDK provides battle-tested client with proper error handling, reconnection logic, and event subscription
- **Alternative considered**: Continue with manual HTTP (rejected due to maintenance burden)

### Decision: Keep same port (51432)
- **Rationale**: Avoid breaking existing server configuration
- **SDK default**: 4096 → Will configure to 51432

### Decision: Create SDK adapter layer
- **Rationale**: SDK is Node.js-focused, needs React integration (useEffect lifecycle)
- **Implementation**: Create `opencodeClient.ts` singleton with React hooks

### Decision: Event stream compatibility
- **Rationale**: Project uses `/event?session=X`, SDK uses `/global/event`
- **Resolution**: Test both; if SDK events work differently, wrap in compatibility layer

## Risks / Trade-offs

| Risk | Impact | Mitigation |
|------|--------|------------|
| Event format mismatch | Low | Compare event payloads; create adapter if needed |
| Authentication differences | Low | SDK supports custom headers; verify Basic Auth works |
| Breaking existing functionality | Medium | Test all user flows; rollback plan ready |

**Note**: SDK browser compatibility is NOT a risk - the SDK uses global `fetch` which is available in modern browsers.

## Migration Plan

### Phase 1: SDK Adapter (Week 1)
1. Create `src/services/opencodeClient.ts` - SDK wrapper with React integration
2. Implement singleton pattern for client reuse
3. Add connection health check
4. Add basic session operations (list, create)

### Phase 2: Replace Core Functions (Week 2)
1. Replace `fetchSessionsFromServer()` with SDK
2. Replace `executeModalPrompt()` with SDK events
3. Replace `processPrompt()` with SDK
4. Update `sessionStore.ts` to use SDK events

### Phase 3: Cleanup (Week 3)
1. Remove duplicate SSE parsing code
2. Remove Vite proxy middleware (if no longer needed)
3. Delete unused functions in `opencodeAPI.ts`
4. Run full test suite

### Rollback Plan
- Keep backup of original `opencodeAPI.ts`
- Feature flag to toggle between SDK and HTTP
- Can revert to HTTP mode if SDK fails

## Known Assumptions

1. **SDK**: Using official `@opencode-ai/sdk` npm package (already in package-lock.json as ^1.1.56, will verify latest v2 API)

2. **Import**: `import { createOpencodeClient } from '@opencode-ai/sdk/v2'`

3. **Authentication**: SDK supports `baseUrl` and `token` options for Basic Auth

4. **SSE Events**: SDK has built-in SSE handling via `onSseEvent` callback in `client.session.event()`
