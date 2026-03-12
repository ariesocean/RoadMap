## ADDED Requirements

### Requirement: User Authentication API
The system MUST provide user authentication endpoints in production mode.

#### Scenario: Register user
- **WHEN** POST request to `/api/auth/register` with JSON body `{username, email, password, deviceId}`
- **THEN** creates new user directory and returns `{userId, token, port}`

#### Scenario: Login user
- **WHEN** POST request to `/api/auth/login` with JSON body `{username, password, deviceId, deviceInfo}`
- **THEN** validates credentials and returns `{userId, token, port, username}`

#### Scenario: Auto login
- **WHEN** POST request to `/api/auth/auto-login` with JSON body `{deviceId}`
- **THEN** validates device and returns `{userId, token, port, username}`

#### Scenario: Get user info
- **WHEN** GET request to `/api/auth/user-info?userId=xxx`
- **THEN** returns user information including port and devices

#### Scenario: Logout
- **WHEN** POST request to `/api/auth/logout` with JSON body `{userId}`
- **THEN** stops user's OpenCode server and returns success

### Requirement: User Data Management
The system MUST support user data operations in production mode.

#### Scenario: Update username
- **WHEN** POST request to `/api/auth/username` with JSON body `{userId, username}`
- **THEN** updates user's username

#### Scenario: Update password
- **WHEN** POST request to `/api/auth/password` with JSON body `{userId, currentPassword, newPassword}`
- **THEN** updates user's password

#### Scenario: Manage devices
- **WHEN** GET/DELETE request to `/api/auth/devices?userId=xxx&deviceId=xxx`
- **THEN** lists or removes user devices
