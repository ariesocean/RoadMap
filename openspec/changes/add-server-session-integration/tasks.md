## 1. API Integration
- [ ] 1.1 Add `fetchSessionsFromServer()` function to `opencodeAPI.ts` that calls `GET /session` with Basic auth
- [ ] 1.2 Add authentication header configuration (credentials from environment or config)
- [ ] 1.3 Add TypeScript interfaces for ServerSession response matching OpenAPI spec
- [ ] 1.4 Create utility function to convert server session format to local Session type
- [ ] 1.5 Add `syncLocalSessionToServer()` function for optional server sync
- [ ] 1.6 Add error handling for each error type (network, auth, server)

## 2. Session Store Enhancement
- [ ] 2.1 Add `fetchSessions()` action to `sessionStore.ts`
- [ ] 2.2 Add `serverSessions` state to track sessions from server
- [ ] 2.3 Add `loadServerSessions()` to initialize and sync server sessions on app start
- [ ] 2.4 Add `refreshSessions()` to re-fetch from server (called on dropdown open)
- [ ] 2.5 Add `startBackgroundRefresh()` to refresh sessions every 30 seconds
- [ ] 2.6 Add `selectDefaultSession()` to auto-select first session when multiple available
- [ ] 2.7 Add `syncToServer()` action for optional session sync
- [ ] 2.8 Add `cleanupLocalSessions()` to remove local-only sessions on exit

## 3. Hook Integration
- [ ] 3.1 Update `useSession.ts` to call server session fetch on initialization
- [ ] 3.2 Export new `fetchServerSessions()` and `selectDefaultSession()` functions
- [ ] 3.3 Add loading state handling for session fetch operations

## 4. UI Component Update
- [ ] 4.1 Modify `SessionList.tsx` to display server sessions in dropdown
- [ ] 4.2 Display server sessions with session titles
- [ ] 4.3 Add "New Conversation" as dropdown option for local session creation
- [ ] 4.4 Highlight current active session in dropdown
- [ ] 4.5 Implement click-to-switch session functionality
- [ ] 4.6 Handle empty server sessions state (show only local sessions + New Conversation)
- [ ] 4.7 Implement default session auto-selection logic on dropdown open

## 5. Testing & Validation
- [ ] 5.1 Verify session fetch endpoint returns correct data structure
- [ ] 5.2 Test dropdown displays all server sessions
- [ ] 5.3 Verify default session selection works when multiple sessions exist
- [ ] 5.4 Test session switching maintains conversation context
- [ ] 5.5 Validate error handling: network timeout
- [ ] 5.6 Validate error handling: 401/403 authentication errors
- [ ] 5.7 Validate error handling: 500 server errors
- [ ] 5.8 Test toast notification appears for each error type
- [ ] 5.9 Test refresh on dropdown open shows updated sessions
- [ ] 5.10 Test background refresh detects new server sessions
- [ ] 5.11 Test cleanup preserves server sessions and removes local-only sessions
