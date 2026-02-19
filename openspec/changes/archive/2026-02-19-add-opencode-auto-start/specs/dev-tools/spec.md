## MODIFIED Requirements
### Requirement: OpenCode Server Auto Start
The Vite development server SHALL automatically detect and start the OpenCode Server.

#### Scenario: Server already running
- **WHEN** Vite starts and OpenCode Server is already running on port 51432
- **THEN** Vite SHALL proceed with normal startup
- **AND** use the existing server port

#### Scenario: Server not running
- **WHEN** Vite starts and OpenCode Server is not running
- **THEN** Vite SHALL attempt to start OpenCode Server
- **AND** wait for server to be ready before proceeding
- **OR** exit with error if startup fails
