# Change: Replace Session Dropdown with OpenCode Server Session Integration

## Why

The current "New Conversation" dropdown only allows creating new conversations locally and doesn't display or manage sessions from the OpenCode server. Users need to:
1. See and switch between **all existing sessions** from the OpenCode server
2. Have **default session selection** (auto-select first session)
3. Maintain **conversation context** when switching sessions
4. Create **new sessions** through the same dropdown interface

## What Changes

**This change REPLACES the existing "New Conversation" dropdown with a full session management dropdown:**

- **Replace existing dropdown**: The current `SessionList.tsx` dropdown that shows "New Conversation" will be replaced with a complete session selector
- **Fetch all sessions from server**: Call `GET /session` endpoint with HTTP Basic Authentication to retrieve all sessions from the OpenCode server
- **Display server sessions in dropdown**: Show all server sessions in the dropdown list with session titles
- **Default session selection**: Automatically select the first session (most recently used) when dropdown is shown
- **Add new session creation**: "New Conversation" becomes an option in the dropdown that creates a new session locally
- **Session switching**: Users can click any session in the dropdown to switch conversation context
- **Session refresh**: Re-fetch sessions when dropdown opens and every 30 seconds in background
- **Error handling**: Differentiate between network, authentication, and server errors with appropriate user notifications

## Key Behaviors

1. **Dropdown shows server sessions first**, then local sessions, sorted by lastUsedAt
2. **First session auto-selected** on load (most recently used)
3. **"New Conversation" is now a dropdown option** that creates a new local session
4. **Session switching preserves context** - clicking a session loads its messages
5. **Server sessions preserved on cleanup** - only local-only sessions deleted on exit

## Impact

- **Affected specs**: `session`
- **Affected code**:
  - `roadmap-manager/src/services/opencodeAPI.ts` - Add session fetch API calls with auth
  - `roadmap-manager/src/hooks/useSession.ts` - Full session management integration
  - `roadmap-manager/src/components/SessionList.tsx` - Complete rewrite to show server sessions + new session option
  - `roadmap-manager/src/store/sessionStore.ts` - Add server session sync, refresh, and cleanup
- **Breaking changes**: Yes - replaces existing dropdown behavior
- **Dependencies**: OpenCode server running with session API endpoints (`GET /session`)
