## Context

The current implementation creates new sessions automatically when users submit prompts, but lacks proper session management UI. Users cannot:
- See all available sessions
- Switch between sessions explicitly
- Create sessions with custom titles
- Update session titles

The OpenCode server provides comprehensive session management APIs that we can leverage:
- `GET /session` - List all sessions
- `POST /session` - Create new session with optional title
- `PATCH /session/:id` - Update session title

## Goals / Non-Goals

### Goals
- Provide explicit session selection UI via dropdown
- Allow users to create sessions with custom titles
- Ensure prompts continue in the selected session, not create new ones
- Update session title display when tasks change

### Non-Goals
- Modify server-side session behavior
- Add session sharing/collaboration features
- Implement session search/filter functionality
- Add session categories or tagging

## Decisions

### 1. Existing Session Dropdown Enhancement

**Decision**: Enhance the existing "New Conversation" dropdown that is already present in the conversation header:
- Replace single "New Conversation" option with a full session list
- Current session title displayed as dropdown trigger
- List all sessions from `GET /session`
- "New Session..." option at the top of the list
- Add inline title editing on click/hover for the current session title

**Changes to existing component**:
- Expand dropdown content to show all sessions instead of just "New Conversation"
- Add session list with scroll support
- Highlight current session in the list
- Add keyboard navigation (Arrow Up/Down, Enter, Escape)
- Add hover effects and selection indicators

### 2. Session Creation Flow

**Decision**: 
- Dropdown includes "New Session..." option
- Opens a modal dialog for title input (optional, defaults to "New Conversation")
- Creates session via `POST /session` with provided title
- Automatically switches to new session

**Alternatives considered**:
- Inline title editing in dropdown → Rejected: Complex to implement and error-prone
- Auto-create on first prompt → Rejected: This is the current broken behavior

### 3. Session Title Update

**Decision**:
- When a new task is created via natural language command
- The session title should update to reflect the task context
- User can manually edit the title via the dropdown

**Implementation**: 
- Listen for task creation events
- Update session title via `PATCH /session/:id` with extracted title from task

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Session list can be long with many sessions | Add scrollbar to dropdown, consider pagination in future |
| Network latency when fetching sessions | Cache session list, show loading state |
| Session title conflicts | Allow duplicate titles, use session ID for distinction |
| OpenCode server not available | Fallback to local session management |
| Existing dropdown behavior change | Maintain familiar UX, add progressive enhancement |

## Migration Plan

1. **Phase 1**: Add API wrapper for session endpoints (GET, POST, PATCH)
2. **Phase 2**: Enhance existing dropdown to show session list
3. **Phase 3**: Add inline title editing to dropdown
4. **Phase 4**: Integrate with existing prompt submission flow
5. **Phase 5**: Add session title update on task creation
6. **Phase 6**: Test and iterate based on user feedback

## Open Questions

1. Should we limit the number of sessions displayed in the dropdown?
2. Should sessions be sorted by last activity or creation date?
3. Should we add keyboard navigation for session selection?
