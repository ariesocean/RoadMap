## Context
The Roadmap Manager application needs to maintain persistent sessions with the OpenCode server API to preserve conversation context across app restarts. The current implementation lacks session persistence and management capabilities.

### Constraints
- Must work with both Tauri desktop app and web deployment
- Session data must persist across app restarts
- Clean session cleanup on app exit to avoid orphaned sessions
- Minimal changes to existing components
- Backward compatible with existing API structure

### Stakeholders
- End users who want persistent conversation context
- Developers maintaining the session management system

## Goals / Non-Goals
### Goals:
- Persistent session management with stable sessionIDs
- UI to display current session and create new sessions
- Automatic session cleanup on app exit
- Support for multiple concurrent sessions (future extensibility)

### Non-Goals:
- User authentication and authorization (outside scope)
- Session sharing between multiple devices
- Complex session analytics or monitoring

## Decisions

### Decision: Storage Layer Strategy
**Chosen**: Use localStorage for web, Tauri store for desktop
**Rationale**: 
- localStorage provides simple persistent storage for web deployment
- Tauri store integrates with desktop app for native experience
- Both provide cross-platform compatibility

### Decision: Session ID Format
**Chosen**: UUID v4 format (`xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx`)
**Rationale**:
- Globally unique identifier
- Collision-resistant
- Standard format for session identification

### Decision: Session Metadata Structure
**Chosen**:
```typescript
interface Session {
  id: string;
  title: string;
  createdAt: string;
  lastUsedAt: string;
  messages: Message[];
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}
```

**Rationale**: Simple structure that captures essential session data while allowing message history preservation

### Decision: UI Component Location
**Chosen**: Integrate session display into Header component, add session title and new session button
**Rationale**:
- Header provides consistent location for session info
- Easy access to session management without cluttering main content area
- Follows existing design patterns

## Risks / Trade-offs
### Risk: Session data growth
- **Mitigation**: Implement message limit per session (keep last 50 messages)
- **Trade-off**: Losing older context for memory efficiency

### Risk: Session corruption
- **Mitigation**: Add validation on session load, create new session on corruption
- **Trade-off**: Potential loss of in-progress conversation

### Risk: API compatibility
- **Mitigation**: Wrap existing API calls with session context
- **Trade-off**: Additional abstraction layer complexity

## Migration Plan
1. Create new session store and hooks
2. Add session management API endpoints
3. Update InputArea to include session display
4. Implement session persistence layer
5. Add cleanup on app exit
6. Test with both Tauri and web deployments

## Open Questions
- Should we include message history in session persistence or just session metadata?
- Do we need to support session renaming beyond auto-generated titles?
- Should we implement automatic session titles based on first message?
