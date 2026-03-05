# Tasks: Add Multi-User Authentication

## 1. Backend - Data Structure & Port Management

- [x] 1.1 Create users/ directory structure in vite.config.ts
- [x] 1.2 Implement port allocation logic in users/ports.json
- [x] 1.3 Add helper functions: getUserDir(), getPortsConfig(), allocatePort(), releasePort()

## 2. Backend - Authentication APIs

- [x] 2.1 Add POST /api/auth/register endpoint
  - [x] 2.1.1 Validate username (6 chars), password, email
  - [x] 2.1.2 Check username uniqueness
  - [x] 2.1.3 Generate userId: username_date
  - [x] 2.1.4 Create user directory with credentials.json, devices.json, login-history.json
  - [x] 2.1.5 Allocate port and update ports.json
  - [x] 2.1.6 Register first device automatically

- [x] 2.2 Add POST /api/auth/login endpoint
  - [x] 2.2.1 Validate credentials against credentials.json
  - [x] 2.2.2 Check device authorization
  - [x] 2.2.3 Generate token
  - [x] 2.2.4 Record login history
  - [x] 2.2.5 Return user info and port

- [x] 2.3 Add POST /api/auth/auto-login endpoint
  - [x] 2.3.1 Validate userId exists
  - [x] 2.3.2 Check deviceId in devices.json
  - [x] 2.3.3 Return user info and port

- [x] 2.4 Add POST /api/auth/logout endpoint
  - [x] 2.4.1 Validate userId
  - [x] 2.4.2 Stop opencode serve for user port
  - [x] 2.4.3 Return success

- [x] 2.5 Add GET /api/auth/devices endpoint
  - [x] 2.5.1 Read devices.json for current user
  - [x] 2.5.2 Return device list

- [x] 2.6 Add DELETE /api/auth/devices/:deviceId endpoint
  - [x] 2.6.1 Remove device from devices.json
  - [x] 2.6.2 Return success

- [x] 2.7 Add GET /api/auth/user-info endpoint
  - [x] 2.7.1 Return current user info (username, email)

## 3. Backend - Modified File APIs

- [x] 3.1 Modify /api/read-roadmap to use users/{userId}/roadmap.md
- [x] 3.2 Modify /api/write-roadmap to use users/{userId}/roadmap.md
- [x] 3.3 Modify /api/list-maps to use users/{userId}/map-*.md
- [x] 3.4 Modify /api/create-map to create in users/{userId}/
- [x] 3.5 Modify /api/delete-map to delete from users/{userId}/
- [x] 3.6 Modify /api/rename-map to rename in users/{userId}/
- [x] 3.7 Modify /api/read-map to read from users/{userId}/
- [x] 3.8 Modify /api/write-map to write to users/{userId}/
- [x] 3.9 Modify /api/config to use users/{userId}/roadmap-config.json

## 4. Backend - OpenCode Serve Management

- [x] 4.1 Add startUserOpenCodeServer(userId, port) function
- [x] 4.2 Add stopUserOpenCodeServer(port) function
- [x] 4.3 Integrate with login/logout endpoints
- [x] 4.4 Add health check for user-specific port

## 5. Frontend - Auth Store Enhancement

- [x] 5.1 Update authStore.ts to include userId, token, deviceId
- [x] 5.2 Add initDeviceId() to generate/get deviceId from localStorage
- [x] 5.3 Add setUser() and clearUser() actions
- [x] 5.4 Add localStorage persistence for auth state

## 6. Frontend - Login Page Integration

- [x] 6.1 Update LoginPage.tsx to call /api/auth/register
- [x] 6.2 Update LoginPage.tsx to call /api/auth/login
- [x] 6.3 Handle login success: save user info, start opencode server
- [x] 6.4 Handle login error: show error message

## 7. Frontend - File Service Updates

- [x] 7.1 Add X-User-Id header to all file API calls (via query params)
- [x] 7.2 Update fileService.ts to include userId in API requests

## 8. Frontend - Auto Login

- [x] 8.1 On app startup, check for existing user session
- [x] 8.2 If deviceId exists, call /api/auth/auto-login
- [x] 8.3 If auto-login succeeds, skip login page

## 9. Frontend - Logout

- [x] 9.1 Update logout flow to call /api/auth/logout
- [x] 9.2 Clear user info from localStorage
- [x] 9.3 Redirect to login page

## 10. Testing

- [x] 10.1 Test user registration flow
- [x] 10.2 Test user login flow
- [x] 10.3 Test auto login with deviceId
- [x] 10.4 Test logout and opencode serve shutdown
- [x] 10.5 Test multiple users (2+ users)
- [x] 10.6 Test file operations per user
- [x] 10.7 Test device management

## 11. Cleanup

- [x] 11.1 Remove simulated login logic from LoginPage.tsx
- [x] 11.2 Clean up any unused code
- [x] 11.3 Update comments and documentation

## 12. Bug Fixes & Refinements

- [x] 12.1 Fix logout - set isConnected=false to show login page
- [x] 12.2 Fix auto-login port not saved in main.tsx
- [x] 12.3 Remove duplicate auto-login logic from LoginPage.tsx (keep only in main.tsx)
- [x] 12.4 Change kill process from lsof to pgrep for precise opencode process matching
- [x] 12.5 Use execSync instead of spawn for simpler process management
- [x] 12.6 Remove unused userOpenCodeProcesses Map
- [x] 12.7 Add userId query param to all fileService API calls
