# opencode-server Specification

## Purpose
Development tooling and automation features for the Roadmap Manager application, including multi-user OpenCode Server management, automatic startup, health checks, and cleanup functionality.

## Requirements
### Requirement: Per-User OpenCode Server
The system SHALL manage a separate OpenCode Server instance for each logged-in user.

#### Scenario: User logs in
- **WHEN** a user successfully logs in
- **THEN** the system SHALL check if an OpenCode Server is already running for that user
- **AND** start a new server if not running
- **AND** assign a unique port based on userId

#### Scenario: Server already running for user
- **WHEN** a user logs in and their OpenCode Server is already running
- **THEN** the system SHALL use the existing server
- **AND** not start a duplicate server

#### Scenario: Multiple users
- **WHEN** multiple users are logged in simultaneously
- **THEN** each user SHALL have their own independent OpenCode Server on a unique port
- **AND** servers SHALL not interfere with each other

### Requirement: Server Health Check
The system SHALL verify OpenCode Server availability via health check endpoint.

#### Scenario: Health check
- **WHEN** checking if OpenCode Server is running
- **THEN** the system SHALL send a GET request to `/global/health`
- **AND** consider the server available if response status is 200

### Requirement: Server Startup Timeout
The system SHALL handle server startup failures gracefully.

#### Scenario: Server startup timeout
- **WHEN** OpenCode Server fails to start within 30 seconds
- **THEN** the system SHALL reject the login with error "OpenCode Server 启动超时"
- **AND** allow retry

### Requirement: Server Cleanup
The system SHALL provide functionality to stop OpenCode Server processes.

#### Scenario: Kill server by port
- **WHEN** stopping an OpenCode Server by port
- **THEN** the system SHALL find the process using `pgrep -f "opencode.*serve.*--port {port}"`
- **AND** kill the process using `kill`
- **AND** log the action

### Requirement: Development Server Integration
The Vite development server SHALL integrate with OpenCode Server proxy.

#### Scenario: Dev server proxy
- **WHEN** Vite development server starts
- **THEN** requests to `/api/opencode/*` SHALL be proxied to the user's OpenCode Server
- **AND** the proxy SHALL handle both REST and SSE streams

### Requirement: Production Server Integration
The production server SHALL integrate with OpenCode Server proxy.

#### Scenario: Production proxy
- **WHEN** production server starts
- **THEN** requests to `/api/opencode/*` SHALL be proxied to the user's OpenCode Server
- **AND** the proxy SHALL handle both REST and SSE streams
