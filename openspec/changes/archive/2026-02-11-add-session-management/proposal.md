# Change: Add Persistent Session Management for OpenCode Server API

## Why
The application currently lacks persistent session management when communicating with the OpenCode server API. Each interaction may create a new session or lack consistent session tracking, which leads to:
- Loss of conversation context across app restarts
- Inability to maintain coherent multi-turn conversations
- No UI to manage or switch between different conversation sessions
- No clean session cleanup when the application exits

## What Changes
- Implement persistent session storage that survives app restarts
- Create a session management system with stable sessionIDs
- Add UI components to display current session title with an icon for creating new sessions
- Implement session cleanup on app exit
- Create API endpoints for session management (create, list, delete)
- Add session persistence layer using localStorage/tauri store

## Impact
- Affected specs: `session` (new capability)
- Affected code:
  - `roadmap-manager/src/services/opencodeAPI.ts` - Add session management functions
  - `roadmap-manager/src/store/sessionStore.ts` - New session state management
  - `roadmap-manager/src/hooks/useSession.ts` - New session hook
  - `roadmap-manager/src/components/SessionHeader.tsx` - New UI component
  - `roadmap-manager/src/components/InputArea.tsx` - Integrate session display
  - Backend API routes for session management
