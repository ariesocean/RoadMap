# Tasks: Add Login Page

## Implementation Order

1. [x] **Create authStore** - Create `src/stores/authStore.ts` to manage username (reuse isConnected as login state)
2. [x] **Create LoginPage component** - Migrate login page code from `roadmap-manager-login/src/App.tsx`
3. [x] **Implement login error handling** - Add error messages for invalid credentials and localStorage failures
4. [x] **Update main.tsx** - Modify entry point to render LoginPage or App based on isConnected state
5. [x] **Create AccountPopup component** - Create account management popup component
6. [x] **Update App.tsx header** - Replace Connected/Disconnected with username + AccountPopup, reuse existing toggleConnected logic
7. [x] **Write tests** - Add test scenarios for login, registration, and error handling using Playwright
8. [x] **Run type check** - Execute `npx tsc --noEmit` to validate types

## Dependencies

- Task 1 → Task 2 (authStore must exist before LoginPage can use it)
- Task 2 → Task 3 (LoginPage needs to exist before adding error handling)
- Task 1 + Task 3 → Task 4 (login state and error handling complete before modifying main.tsx)
- Task 4 → Task 5 (login state ready before displaying account management)
- Task 5 → Task 6 (AccountPopup must exist before integrating into App)
- Task 6 → Task 7 (all features implemented before testing)

## Code Reuse Reference

| Function | Reuse Source |
|----------|-------------|
| Login/Registration UI | roadmap-manager-login/src/App.tsx |
| Login state | useTaskStore.isConnected |
| localStorage operations | src/utils/storage.ts |
