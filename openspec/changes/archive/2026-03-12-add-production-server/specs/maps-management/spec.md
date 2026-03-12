## ADDED Requirements

### Requirement: Production Server Deployment
The system MUST support running in production mode with full functionality equivalent to development mode.

#### Scenario: Build generates static files
- **WHEN** `npm run build` is executed
- **THEN** static files are generated in `dist/` directory

#### Scenario: Server serves API endpoints
- **WHEN** `npm run serve` is executed
- **THEN** the server serves static files from `dist/` AND handles all API requests
- **AND** all endpoints from `maps-management` and `auth` capabilities work

### Requirement: File Operations API
The system MUST provide file operations via HTTP API in production mode.

#### Scenario: Read roadmap
- **WHEN** GET request to `/api/read-roadmap?userId=xxx`
- **THEN** returns the content of user's `roadmap.md`

#### Scenario: Write roadmap
- **WHEN** POST request to `/api/write-roadmap` with JSON body `{content: "..."}`
- **THEN** saves content to user's `roadmap.md`

#### Scenario: List maps
- **WHEN** GET request to `/api/list-maps?userId=xxx`
- **THEN** returns list of all `map-*.md` files

#### Scenario: Create map
- **WHEN** POST request to `/api/create-map` with JSON body `{name: "xxx"}`
- **THEN** creates new `map-xxx.md` file

#### Scenario: Delete map
- **WHEN** POST request to `/api/delete-map` with JSON body `{name: "xxx"}`
- **THEN** deletes the corresponding map file

#### Scenario: Read map content
- **WHEN** POST request to `/api/read-map` with JSON body `{name: "xxx"}`
- **THEN** returns content of the map file

#### Scenario: Write map content
- **WHEN** POST request to `/api/write-map` with JSON body `{name: "xxx", content: "..."}`
- **THEN** saves content to the map file
