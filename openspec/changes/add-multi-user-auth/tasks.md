# Tasks: Add Multi-User Authentication

## 1. Backend - Data Structure & Port Management

- [ ] 1.1 Create users/ directory structure in vite.config.ts
- [ ] 1.2 Implement port allocation logic in users/ports.json
- [ ] 1.3 Add helper functions: getUserDir(), getPortsConfig(), allocatePort(), releasePort()

## 2. Backend - Authentication APIs

- [ ] 2.1 Add POST /api/auth/register endpoint
  - [ ] 2.1.1 Validate username (6 chars), password, email
  - [ ] 2.1.2 Check username uniqueness
  - [ ] 2.1.3 Generate userId: username_date
  - [ ] 2.1.4 Create user directory with credentials.json, devices.json, login-history.json
  - [ ] 2.1.5 Allocate port and update ports.json
  - [ ] 2.1.6 Register first device automatically

- [ ] 2.2 Add POST /api/auth/login endpoint
  - [ ] 2.2.1 Validate credentials against credentials.json
  - [ ] 2.2.2 Check device authorization
  - [ ] 2.2.3 Generate token
  - [ ] 2.2.4 Record login history
  - [ ] 2.2.5 Return user info and port

- [ ] 2.3 Add POST /api/auth/auto-login endpoint
  - [ ] 2.3.1 Validate userId exists
  - [ ] 2.3.2 Check deviceId in devices.json
  - [ ] 2.3.3 Return user info and port

- [ ] 2.4 Add POST /api/auth/logout endpoint
  - [ ] 2.4.1 Validate userId
  - [ ] 2.4.2 Stop opencode serve for user port
  - [ ] 2.4.3 Return success

- [ ] 2.5 Add GET /api/auth/devices endpoint
  - [ ] 2.5.1 Read devices.json for current user
  - [ ] 2.5.2 Return device list

- [ ] 2.6 Add DELETE /api/auth/devices/:deviceId endpoint
  - [ ] 2.6.1 Remove device from devices.json
  - [ ] 2.6.2 Return success

- [ ] 2.7 Add GET /api/auth/user-info endpoint
  - [ ] 2.7.1 Return current user info (username, email)

## 3. Backend - Modified File APIs

- [ ] 3.1 Modify /api/read-roadmap to use users/{userId}/roadmap.md
- [ ] 3.2 Modify /api/write-roadmap to use users/{userId}/roadmap.md
- [ ] 3.3 Modify /api/list-maps to use users/{userId}/map-*.md
- [ ] 3.4 Modify /api/create-map to create in users/{userId}/
- [ ] 3.5 Modify /api/delete-map to delete from users/{userId}/
- [ ] 3.6 Modify /api/rename-map to rename in users/{userId}/
- [ ] 3.7 Modify /api/read-map to read from users/{userId}/
- [ ] 3.8 Modify /api/write-map to write to users/{userId}/
- [ ] 3.9 Modify /api/config to use users/{userId}/roadmap-config.json

## 4. Backend - OpenCode Serve Management

- [ ] 4.1 Add startUserOpenCodeServer(userId, port) function
- [ ] 4.2 Add stopUserOpenCodeServer(port) function
- [ ] 4.3 Integrate with login/logout endpoints
- [ ] 4.4 Add health check for user-specific port

## 5. Frontend - Auth Store Enhancement

- [ ] 5.1 Update authStore.ts to include userId, token, deviceId
- [ ] 5.2 Add initDeviceId() to generate/get deviceId from localStorage
- [ ] 5.3 Add setUser() and clearUser() actions
- [ ] 5.4 Add localStorage persistence for auth state

## 6. Frontend - Login Page Integration

- [ ] 6.1 Update LoginPage.tsx to call /api/auth/register
- [ ] 6.2 Update LoginPage.tsx to call /api/auth/login
- [ ] 6.3 Handle login success: save user info, start opencode server
- [ ] 6.4 Handle login error: show error message

## 7. Frontend - File Service Updates

- [ ] 7.1 Add X-User-Id header to all file API calls
- [ ] 7.2 Update fileService.ts to include auth header

## 8. Frontend - Auto Login

- [ ] 8.1 On app startup, check for existing user session
- [ ] 8.2 If deviceId exists, call /api/auth/auto-login
- [ ] 8.3 If auto-login succeeds, skip login page

## 9. Frontend - Logout

- [ ] 9.1 Update logout flow to call /api/auth/logout
- [ ] 9.2 Clear user info from localStorage
- [ ] 9.3 Redirect to login page

## 10. Testing

- [ ] 10.1 Test user registration flow
- [ ] 10.2 Test user login flow
- [ ] 10.3 Test auto login with deviceId
- [ ] 10.4 Test logout and opencode serve shutdown
- [ ] 10.5 Test multiple users (2+ users)
- [ ] 10.6 Test file operations per user
- [ ] 10.7 Test device management

## 11. Cleanup

- [ ] 11.1 Remove simulated login logic from LoginPage.tsx
- [ ] 11.2 Clean up any unused code
- [ ] 11.3 Update comments and documentation
