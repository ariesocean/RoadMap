# Design: Multi-User Authentication System

## Overview

Implement multi-user registration and login functionality with per-user data isolation, dedicated OpenCode server ports, and device-based auto-login.

## Data Structure

```
RoadMap/                          # Project root
├── users/
│   ├── ports.json                # userId → port mapping
│   ├── mingyan_20260305/        # User directory (userId)
│   │   ├── roadmap.md
│   │   ├── map-*.md
│   │   ├── roadmap-config.json
│   │   ├── devices.json         # Authorized devices
│   │   └── login-history.json   # Login history
│   └── otheruser_20260306/
└── roadmap-manager/
```

## User ID Generation

- Format: `{username}_{YYYYMMDD}` (max 6 chars username + underscore + date)
- Example: `mingyan_20260305`

## Port Management

- **Range**: 51000-51099
- **Allocation**: Sequential from 51000, find first unused port
- **ports.json structure**:
```json
{
  "users": {
    "mingyan_20260305": 51000,
    "other_20260306": 51001
  },
  "nextPort": 51002
}
```

## Authentication Flow

### Registration
1. Validate username (6 chars max), email, password
2. Check username not exists
3. Create `users/{userId}/` directory
4. Allocate port from pool
5. Initialize config files
6. Register first device (current device)
7. Return userId and token

### Login
1. Validate username, password, deviceId
2. Check user exists and password matches
3. Check device authorized in devices.json
4. Record login history
5. Start OpenCode server on user's port
6. Return userId, token

### Auto-Login (Device-Based)
1. Receive deviceId from localStorage
2. Check device exists in any user's devices.json
3. If found: start OpenCode server, return user info
4. If not found: return 401, prompt login

### Logout
1. Stop OpenCode server on user's port
2. Clear session (keep device authorization)

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/register` | POST | Register new user |
| `/api/auth/login` | POST | Login with credentials |
| `/api/auth/logout` | POST | Logout |
| `/api/auth/auto-login` | POST | Auto-login with deviceId |
| `/api/auth/devices` | GET | List authorized devices |
| `/api/auth/devices/:deviceId` | DELETE | Remove device |
| `/api/auth/user-info` | GET | Get current user info |
| `/api/auth/verify-token` | POST | Verify token validity |

## Device & Login History

### devices.json
```json
{
  "devices": [
    {
      "deviceId": "uuid-xxx",
      "name": "MacBook Pro",
      "registeredAt": "2026-03-05T10:00:00Z",
      "lastLoginAt": "2026-03-05T10:00:00Z"
    }
  ]
}
```

### login-history.json
```json
{
  "history": [
    {
      "deviceId": "uuid-xxx",
      "loginAt": "2026-03-05T10:00:00Z",
      "deviceInfo": "Chrome/macOS"
    }
  ]
}
```

## Frontend Changes

### LoginPage.tsx
- Replace mock login with real API calls
- Handle deviceId generation and storage
- Store token in localStorage
- Initialize user-specific file paths after login

### authStore.ts
- Add: userId, token, deviceId, isAuthenticated
- Add: login, logout, autoLogin actions
- Persist state to localStorage

### fileService.ts
- Add base path parameter to all file operations
- API calls include userId in request or use user-specific base path

### Session/Port Management
- Login: Start OpenCode server on user's port (check if already running)
- Logout: Stop OpenCode server on user's port
- All OpenCode API calls use user's dedicated port

## Backend Changes (vite.config.ts)

### New Middleware
- `/api/auth/*` - Authentication endpoints
- Modify existing `/api/*` to use dynamic user directory

### Dynamic User Directory
- Current user stored in request context
- All file operations read from `users/{userId}/`

### OpenCode Server Management
- Start: `opencode serve --port {userPort}` in user directory
- Stop: Kill process on port
- Health check: `http://127.0.0.1:{userPort}/global/health`

## Security Considerations

- Passwords stored as SHA-256 hash (simple, local app)
- Device tokens stored in localStorage + backend
- Each user isolated to own directory
- OpenCode server bound to localhost only

## Acceptance Criteria

1. User can register with username, email, password
2. User can login with credentials
3. Registered device can auto-login without credentials
4. User data isolated to own directory
5. Each user has dedicated OpenCode server port
6. Logout stops user's OpenCode server
7. Device list viewable, devices can be removed
8. Login history recorded
9. All existing functionality preserved for logged-in user
