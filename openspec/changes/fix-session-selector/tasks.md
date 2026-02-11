## 1. API Layer Implementation

- [ ] 1.1 Create OpenCode server API wrapper for session endpoints
  - [ ] Implement `GET /session` to fetch all sessions
  - [ ] Implement `POST /session` to create new session with title
  - [ ] Implement `PATCH /session/:id` to update session title
  - [ ] Add error handling for network failures
  - [ ] Add TypeScript types for Session and related interfaces

- [ ] 1.2 Create session service module
  - [ ] Implement `getSessions()` function with caching
  - [ ] Implement `createSession(title?: string)` function
  - [ ] Implement `updateSessionTitle(id: string, title: string)` function
  - [ ] Implement `getCurrentSession()` with localStorage persistence
  - [ ] Implement `setCurrentSession(id: string)` with localStorage persistence

## 2. Existing Dropdown Enhancement

- [ ] 2.1 Modify existing session dropdown to show session list
  - [ ] Replace static "New Conversation" with dynamic session list from `GET /session`
  - [ ] Add current session title as dropdown trigger
  - [ ] Add "New Session..." option at top of list
  - [ ] Implement scroll support for long session lists
  - [ ] Add visual highlight for current session
  - [ ] Add selection indicators (checkmark or background color)

- [ ] 2.2 Add inline title editing to dropdown
  - [ ] Add click handler on current session title for inline editing
  - [ ] Replace title display with input field on click
  - [ ] Implement save on blur and Enter key
  - [ ] Implement cancel on Escape key
  - [ ] Add `PATCH /session/:id` call on title save
  - [ ] Add character limit validation (100 chars)

- [ ] 2.3 Add keyboard navigation to dropdown
  - [ ] Arrow Up/Down to navigate session list
  - [ ] Enter to select session
  - [ ] Escape to close dropdown
  - [ ] N key to quick create new session

## 3. New Session Modal Enhancement

- [ ] 3.1 Add title input to existing new session modal
  - [ ] Add title input field with validation
  - [ ] Implement "Skip" button for auto-generated title
  - [ ] Add loading state during `POST /session` call
  - [ ] Handle success/error feedback with toast notifications

## 4. Integration

- [ ] 4.1 Connect dropdown to prompt submission
  - [ ] Modify prompt submission to use `POST /session/:id/message` with current session ID
  - [ ] Remove automatic session creation on prompt submission
  - [ ] Add error handling for session-related API failures
  - [ ] Show toast if session is invalid or deleted

- [ ] 4.2 Add session title sync on task creation
  - [ ] Hook into task creation event
  - [ ] Extract task context for title generation
  - [ ] Call `PATCH /session/:id` to update title
  - [ ] Refresh dropdown display

- [ ] 4.3 Persist current session selection
  - [ ] Store currentSessionID in localStorage under 'currentSessionID'
  - [ ] On page load, restore current session from localStorage
  - [ ] If stored session doesn't exist, select first available session

## 5. State Management

- [ ] 5.1 Create session state store
  - [ ] Implement session list state
  - [ ] Implement current session state
  - [ ] Implement loading states
  - [ ] Implement error states

- [ ] 5.2 Add session caching
  - [ ] Cache session list with TTL (30 seconds)
  - [ ] Invalidate cache on session create/update/delete
  - [ ] Implement optimistic UI updates

## 6. Testing

- [ ] 6.1 Unit tests for session service
  - [ ] Test `getSessions()` with mocked API
  - [ ] Test `createSession()` success and error scenarios
  - [ ] Test `updateSessionTitle()` with API integration
  - [ ] Test localStorage persistence

- [ ] 6.2 Component tests for existing dropdown modification
  - [ ] Test dropdown open/close
  - [ ] Test session selection from list
  - [ ] Test inline title editing
  - [ ] Test new session creation flow with title input
  - [ ] Test keyboard navigation

- [ ] 6.3 Integration tests
  - [ ] Test full session creation and selection flow
  - [ ] Test prompt submission uses correct session
  - [ ] Test session title auto-update on task creation

## 7. Polish

- [ ] 7.1 Add loading skeleton for session list while fetching
- [ ] 7.2 Add toast notifications for session operations
- [ ] 7.3 Add accessibility attributes (ARIA labels, roles, keyboard support)
- [ ] 7.4 Ensure dark/light theme compatibility
- [ ] 7.5 Add transition animations for dropdown open/close
- [ ] 7.6 Add hover states and visual feedback

## 8. Documentation

- [ ] 8.1 Add user documentation for enhanced session management
- [ ] 8.2 Add inline code comments for session service
- [ ] 8.3 Update README with new features
