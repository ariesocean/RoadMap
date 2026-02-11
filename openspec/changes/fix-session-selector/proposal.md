# Change: Fix Session Management Issues

## Why

The current session management implementation has two critical issues:

1. **Unintended session creation**: When users submit prompts consecutively on the main page without explicitly switching session title, the system creates new sessions instead of continuing in the existing session. This breaks conversation context and user workflow.

2. **Session title not updating**: When new tasks are created, the session title displayed on the page does not update to reflect the current conversation context, causing confusion about which session is active.

These issues stem from the lack of explicit session selection UI and poor integration with the OpenCode server's session management capabilities.

## What Changes

- **Enhance existing session dropdown**: The existing "New Conversation" dropdown will be enhanced to list all available sessions from the OpenCode server (via `GET /session` endpoint)
- **Add session selection**: Users can switch between existing sessions by selecting from the dropdown list
- **Explicit session creation with custom title**: When creating new session, add modal for title input (optional) via `POST /session`
- **Session persistence awareness**: The dropdown maintains awareness of the current session and updates the session title appropriately
- **Update session title**: Users can rename sessions via `PATCH /session/:id` with `{ title? }`

## Impact

- **Affected specs**: `session`
- **Affected code**:
  - Existing session dropdown component (currently shows "New Conversation")
  - Session management service/API integration
  - OpenCode server API client wrapper
  - Prompt submission flow
- **Breaking changes**: None; this is an additive feature that improves existing behavior
- **Dependencies**: OpenCode server running with session API endpoints
