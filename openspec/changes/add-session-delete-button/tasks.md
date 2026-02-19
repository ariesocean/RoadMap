## 1. Implementation
- [x] 1.1 Add delete confirmation state tracking to SessionList component
- [x] 1.2 Add delete button UI to each session item in dropdown
- [x] 1.3 Implement hover styling for delete button (light red → bright red)
- [x] 1.4 Add conditional rendering for "navigate:" prefix sessions only
- [x] 1.5 Implement two-click confirmation flow
- [x] 1.6 Add deleteSession action that calls SDK in sessionStore

## 2. Validation
- [x] 2.1 Verify delete button appears on right side of each session
- [x] 2.2 Verify delete button is barely visible (light red) by default
- [x] 2.3 Verify delete button becomes bright red on hover
- [x] 2.4 Verify delete button only appears for "navigate:" sessions
- [x] 2.5 Verify first click shows confirmation state (button changes)
- [x] 2.6 Verify second click deletes session and refreshes list
- [x] 2.7 Verify non-"navigate:" sessions do not have delete button
