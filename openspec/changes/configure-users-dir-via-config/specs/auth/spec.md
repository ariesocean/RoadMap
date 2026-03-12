## ADDED Requirements
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
