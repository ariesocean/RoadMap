## ADDED Requirements

### Requirement: User Registration
The system SHALL allow users to register with username, password, and email.

#### Scenario: Successful registration
- **GIVEN** a user provides valid username (6+ chars), password, and email
- **WHEN** the user submits the registration form
- **THEN** a new user directory is created in users/{userId}/
- **AND** credentials are stored in users/{userId}/credentials.json
- **AND** a port is allocated from the available pool (51000-51099)
- **AND** the user's first device is automatically authorized
- **AND** the user is logged in automatically

#### Scenario: Username already exists
- **GIVEN** a user provides a username that already exists
- **WHEN** the user submits the registration form
- **THEN** an error message is returned: "Username already exists"

#### Scenario: Invalid username format
- **GIVEN** a user provides a username with less than 6 characters
- **WHEN** the user submits the registration form
- **AND** the response returns an error message: "Username must be at least 6 characters"

### Requirement: User Login
The system SHALL authenticate users with username and password.

#### Scenario: Successful login with valid credentials
- **GIVEN** a user provides correct username and password
- **AND** the device is already authorized
- **WHEN** the user submits the login form
- **THEN** the user is authenticated
- **AND** a token is returned
- **AND** the user's opencode serve is started on their assigned port
- **AND** login history is recorded

#### Scenario: Invalid credentials
- **GIVEN** a user provides incorrect username or password
- **WHEN** the user submits the login form
- **THEN** an error message is returned: "Invalid username or password"

#### Scenario: Device not authorized
- **GIVEN** a user provides valid credentials
- **AND** the device is not authorized
- **WHEN** the user submits the login form
- **THEN** the user is authenticated
- **AND** the device is added to the authorized devices list
- **AND** login proceeds normally

### Requirement: Device Auto-Login
The system SHALL allow previously authorized devices to login without credentials.

#### Scenario: Auto-login with authorized device
- **GIVEN** a user has previously logged in from this device
- **AND** the deviceId is stored in the user's authorized devices
- **WHEN** the app starts and detects an existing deviceId
- **THEN** the user is automatically authenticated
- **AND** the user's opencode serve is started

#### Scenario: Auto-login fails - device not found
- **GIVEN** a user attempts auto-login
- **AND** the deviceId is not found in any user's authorized devices
- **THEN** the login page is displayed for manual login

### Requirement: User Logout
The system SHALL allow users to logout and stop their opencode serve.

#### Scenario: Successful logout
- **GIVEN** a user is currently logged in
- **WHEN** the user clicks the logout button
- **THEN** the user's opencode serve is stopped
- **AND** the user's session is cleared from localStorage
- **AND** the login page is displayed

### Requirement: Device Management
The system SHALL allow users to view and manage their authorized devices.

#### Scenario: View authorized devices
- **GIVEN** a user is logged in
- **WHEN** the user requests the device list
- **THEN** a list of all authorized devices is returned
- **AND** each device includes deviceId, userAgent, and lastLoginTime

#### Scenario: Remove authorized device
- **GIVEN** a user is logged in
- **AND** the user requests to remove a specific device
- **WHEN** the device removal is confirmed
- **THEN** the device is removed from the authorized devices list
- **AND** that device will require re-authentication for future logins

### Requirement: Per-User Data Isolation
The system SHALL ensure each user's data is isolated from other users.

#### Scenario: User accesses their roadmap
- **GIVEN** a user is logged in
- **WHEN** the user loads their roadmap
- **THEN** only the data from users/{userId}/roadmap.md is returned
- **AND** no other user's data is accessible

#### Scenario: User creates a new map
- **GIVEN** a user is logged in
- **WHEN** the user creates a new map
- **THEN** the map file is created in users/{userId}/map-{name}.md
- **AND** the map is not visible to other users

### Requirement: Per-User OpenCode Serve
The system SHALL assign a dedicated opencode serve port to each user.

#### Scenario: Login starts user-specific opencode serve
- **GIVEN** a user logs in
- **WHEN** the login is successful
- **THEN** an opencode serve instance is started on the user's assigned port
- **AND** all subsequent SDK calls use this port

#### Scenario: Logout stops user-specific opencode serve
- **GIVEN** a user logs out
- **WHEN** the logout is processed
- **THEN** the user's opencode serve instance is stopped
- **AND** the port is released for potential reuse
