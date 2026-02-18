## 1. SDK Dependency Setup

- [ ] 1.1 Verify `@opencode-ai/sdk` version in package-lock.json supports v2 API
- [ ] 1.2 Install latest version if needed: `npm install @opencode-ai/sdk@latest`
- [ ] 1.3 Configure SDK to use port 51432 (default is 4096)

## 2. SDK Adapter Layer

- [ ] 2.1 Create `src/services/opencodeClient.ts` with OpenCodeClient wrapper
- [ ] 2.2 Implement singleton pattern for client reuse
- [ ] 2.3 Implement React useEffect integration for client lifecycle
- [ ] 2.4 Add connection health check function
- [ ] 2.5 Test basic connectivity with SDK

## 3. Session Management Migration

- [ ] 3.1 Migrate `fetchSessionsFromServer()` to use `client.sessions.list()`
- [ ] 3.2 Migrate session creation to use `client.sessions.create()`
- [ ] 3.3 Migrate `syncLocalSessionToServer()` to use SDK
- [ ] 3.4 Update `sessionStore.ts` to use SDK session methods

## 4. Prompt Execution Migration

- [ ] 4.1 Migrate `executeModalPrompt()` to use SDK events
- [ ] 4.2 Implement SSE subscription using `client.events.on()`
- [ ] 4.3 Map SDK event types to existing event handlers (text, reasoning, tool, done)
- [ ] 4.4 Update `processPrompt()` to use SDK

## 5. React Integration Updates

- [ ] 5.1 Update `useSession.ts` to use SDK client
- [ ] 5.2 Update `useModalPrompt.ts` to use SDK events
- [ ] 5.3 Update `taskStore.ts` submitPrompt to use SDK
- [ ] 5.4 Update `opencodeSDK.ts` (existing file) to use SDK

## 6. Cleanup and Verification

- [ ] 6.1 Remove duplicate SSE parsing code from all files
- [ ] 6.2 Verify Vite proxy middleware can be simplified/removed
- [ ] 6.3 Run manual testing: create session, send prompt, receive response
- [ ] 6.4 Run manual testing: session dropdown, switching sessions
- [ ] 6.5 Run manual testing: modal prompt execution with streaming

## 7. Documentation

- [ ] 7.1 Update API documentation for new SDK-based implementation
- [ ] 7.2 Document any breaking changes or API differences
