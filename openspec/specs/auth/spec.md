# auth Specification

## Purpose
TBD - created by archiving change add-login-page. Update Purpose after archive.
## Requirements
### Requirement: Login Page Display
The system SHALL display a login page as the entry point when the user is not logged in.

#### Scenario: Login page layout
- **WHEN** login page renders
- **THEN** the logo SHALL be displayed horizontally aligned with the app title
- **AND** the app title SHALL display "Roadmap Manager"
- **AND** the AI assistant tagline SHALL be displayed below the title

#### Scenario: Login page AI tagline
- **WHEN** login page renders
- **THEN** the primary tagline "Your AI Personal Task Assistant" SHALL be displayed with gradient text styling
- **AND** the secondary tagline "Turn natural language into structured tasks and notes" SHALL be displayed below

#### Scenario: User opens application
- **GIVEN** user is not logged in
- **WHEN** user opens the application
- **THEN** the login page SHALL be displayed instead of the main interface

#### Scenario: User refreshes page while logged in
- **GIVEN** user is logged in
- **WHEN** user refreshes the page
- **THEN** the login page SHALL NOT be displayed
- **AND** the main interface SHALL be displayed

### Requirement: Login Functionality
The system SHALL provide a login form that authenticates the user and grants access to the main interface. The login state SHALL reuse the existing `isConnected` state from `useTaskStore` to avoid duplicate development.

#### Scenario: User logs in successfully
- **GIVEN** user is on the login page
- **WHEN** user enters username and password and clicks login
- **THEN** the `isConnected` state SHALL be set to true (same as current Connected behavior)
- **AND** the username SHALL be stored in localStorage
- **AND** user SHALL be redirected to the main interface
- **AND** the username SHALL be displayed in the header

#### Scenario: Login state persistence
- **GIVEN** user has successfully logged in
- **WHEN** user refreshes the browser
- **THEN** the login state SHALL be loaded from localStorage
- **AND** `isConnected` SHALL be set to true
- **AND** user SHALL remain logged in

### Requirement: Login Error Handling
The system SHALL provide user-friendly error feedback when login fails.

#### Scenario: User enters invalid credentials
- **GIVEN** user is on the login page
- **WHEN** user enters incorrect username or password and clicks login
- **THEN** an error message SHALL be displayed
- **AND** the error message SHALL advise the user to check their username or password
- **AND** the login page SHALL remain displayed
- **AND** the `isConnected` state SHALL remain false

#### Scenario: User encounters localStorage error
- **GIVEN** user has successfully logged in
- **WHEN** the system attempts to save login state to localStorage but fails
- **THEN** an error message SHALL be displayed
- **AND** the user SHALL be logged out
- **AND** the login page SHALL be displayed

### Requirement: Registration Functionality
The system SHALL provide a registration modal for new users to create an account.

#### Scenario: User opens registration modal
- **GIVEN** user is on the login page
- **WHEN** user clicks "Sign up" link
- **THEN** the registration modal SHALL be displayed

#### Scenario: User registers successfully
- **GIVEN** user has the registration modal open
- **WHEN** user fills in username, email, password and clicks register
- **THEN** the user SHALL be automatically logged in
- **AND** the main interface SHALL be displayed
- **AND** the device SHALL be automatically registered

### Requirement: Multi-Device Support
The system SHALL allow the same user account to be accessed from multiple devices without requiring explicit device authorization.

#### Scenario: New device login
- **GIVEN** a user has an existing account
- **WHEN** a new device attempts to login with valid credentials
- **THEN** the device SHALL be automatically added to the authorized devices list
- **AND** the user SHALL be granted access
- **AND** the login SHALL succeed

#### Scenario: Returning device login
- **GIVEN** a user has previously logged in from a device
- **WHEN** the same device attempts to login with valid credentials
- **THEN** the user SHALL be granted access
- **AND** the last login time SHALL be updated

#### Scenario: Auto-login from new device
- **GIVEN** a user has previously logged in from a device and enabled auto-login
- **WHEN** the same device attempts to auto-login
- **THEN** the user SHALL be automatically logged in
- **AND** the last login time SHALL be updated

### Requirement: Account Management
The system SHALL provide an account management popup that allows users to manage their account information.

#### Scenario: User accesses account popup
- **GIVEN** user is logged in
- **WHEN** user clicks on the username in the header
- **THEN** an account management popup SHALL be displayed

#### Scenario: User updates username
- **GIVEN** account popup is open
- **WHEN** user enters a new username and confirms
- **THEN** the username SHALL be updated in the system
- **AND** the header SHALL display the new username

#### Scenario: User updates password
- **GIVEN** account popup is open
- **WHEN** user enters a new password and confirms
- **THEN** the password SHALL be updated (frontend simulation)

#### Scenario: User logs out
- **GIVEN** account popup is open
- **WHEN** user clicks the logout button
- **THEN** the `isConnected` state SHALL be set to false (same as current Disconnected behavior)
- **AND** the login state SHALL be cleared from localStorage
- **AND** the username SHALL be cleared
- **AND** the login page SHALL be displayed

### Requirement: Header Display
The system SHALL display the logged-in username in the header instead of "Connected/Disconnected" status.

#### Scenario: Display username in header
- **GIVEN** user is logged in
- **WHEN** the main interface is rendered
- **THEN** the header SHALL display the username
- **AND** the header SHALL NOT display "Connected" or "Disconnected" text

### Requirement: User Registration
The system SHALL allow users to register with username, password, and email.

#### Scenario: Successful registration
- **GIVEN** a user provides valid username (6+ chars), password, and email
- **WHEN** the user submits the registration form
- **THEN** a new user directory is created in users/{userId}/
- **AND** credentials are stored in users/{userId}/credentials.json
- **AND** a port is allocated from the available pool (51000-51099)
- **AND** the user's first device is automatically authorized
- **AND** a success message is displayed: "Registration successful! Please log in with your credentials."
- **AND** the user is returned to the login page
- **AND** the user must manually log in with their credentials

#### Scenario: Successful registration creates UserGuide map
- **GIVEN** a user provides valid username, password, and email
- **WHEN** the user submits the registration form
- **THEN** the map-UserGuide.md file from the project root is copied to the user's directory
- **AND** the roadmap-config.json is created with lastEditedMapId set to "UserGuide"
- **AND** the UserGuide map becomes the default map for the new user

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

#### Scenario: SDK client update after login
- **WHEN** the user successfully logs in via the login form
- **AND** the user has an assigned OpenCode server port
- **THEN** `updateClientBaseUrl()` SHALL be called after `setUserPort()`
- **AND** subsequent SDK operations SHALL use the correct user port

#### Scenario: SDK client update after registration
- **WHEN** the user successfully registers a new account
- **AND** the user has an assigned OpenCode server port
- **THEN** `updateClientBaseUrl()` SHALL be called after `setUserPort()`
- **AND** subsequent SDK operations SHALL use the correct user port

#### Scenario: SDK client update after auto-login
- **WHEN** the application auto-login succeeds on startup
- **AND** the user has an assigned OpenCode server port
- **THEN** `updateClientBaseUrl()` SHALL be called after `setUserPort()`
- **AND** subsequent SDK operations SHALL use the correct user port

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

### Requirement: Users Directory Configuration
The system SHALL require the users directory to be configured via a config file (`src/config/index.ts`). If not properly configured, the application MUST fail to start with a clear error message.

**Important**: The users directory is independent of the project directory and can be placed anywhere on the system using an absolute path.

#### Scenario: Application starts without usersDir configured
- **WHEN** the application starts without `usersDir` in config or config file is missing
- **THEN** an error SHALL be thrown: "usersDir must be configured in src/config/index.ts"
- **AND** the application SHALL NOT start

#### Scenario: Application starts with usersDir configured (absolute path)
- **WHEN** `usersDir` is set to a valid absolute path in config
- **AND** the directory exists or can be created
- **THEN** user data SHALL be stored in the configured directory
- **AND** all user operations (login, registration, data storage) SHALL use this directory

#### Scenario: Users directory is independent of project directory
- **WHEN** `usersDir` is configured to a path outside the project directory
- **AND** `projectDir` is configured to a different path
- **THEN** user data SHALL be stored in `usersDir`
- **AND** roadmap files SHALL be read from/written to `projectDir`
- **AND** both directories SHALL function independently

#### Scenario: Relative path rejected
- **WHEN** `usersDir` is configured with a relative path (e.g., "./users", "users")
- **THEN** an error SHALL be thrown: "usersDir must be an absolute path"
- **AND** the application SHALL NOT start

