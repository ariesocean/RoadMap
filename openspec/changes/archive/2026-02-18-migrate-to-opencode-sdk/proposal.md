# Change: Migrate to Official @opencode-ai/sdk

## Why
The current implementation uses manual HTTP requests to communicate with the OpenCode server, resulting in:
- ~200 lines of duplicate SSE event parsing code across multiple files
- Manual authentication header generation and error handling
- Lack of session management features (abort, getDiff, getChildren)
- Poor code maintainability when server API changes
- No unified event handling system

The **official @opencode-ai/sdk** npm package provides a well-designed, maintained client library that solves these issues.

## What Changes
- Replace manual HTTP calls with SDK's `OpenCodeClient` class
- Replace manual SSE parsing with SDK's EventEmitter-style `events.on()` API
- Add SDK dependency: `eventsource`, `node-fetch` (or use native)
- Simplify authentication (SDK handles Basic Auth internally)
- Remove Vite proxy middleware for OpenCode API endpoints (optional cleanup)
- Maintain same port (51432) to avoid breaking changes

## Impact
- Affected specs: `session` (MODIFIED requirements for API integration)
- Affected code:
  - `roadmap-manager/src/services/opencodeAPI.ts` - Replace with SDK wrapper
  - `roadmap-manager/src/services/opencodeSDK.ts` - Enhance SDK initialization
  - `roadmap-manager/vite.config.ts` - Remove or simplify proxy middleware
  - `roadmap-manager/src/store/sessionStore.ts` - Update to use SDK events
  - `roadmap-manager/src/store/taskStore.ts` - Update prompt submission
  - `roadmap-manager/src/hooks/useSession.ts` - Update session handling
  - `roadmap-manager/src/hooks/useModalPrompt.ts` - Update modal prompt
  - `roadmap-manager/package.json` - Add SDK dependencies (optional, SDK may already be available)
