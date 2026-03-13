## MODIFIED Requirements

### Requirement: SDK Dynamic Port Configuration
The system SHALL initialize the OpenCode SDK client to use a backend proxy for all API calls, enabling remote access via Cloudflare Tunnel.

#### Scenario: SDK client initialization with proxy
- **WHEN** the SDK client is initialized via `getOpenCodeClient()`
- **THEN** the client SHALL connect to `/api/opencode` (backend proxy)
- **AND** all SDK requests SHALL be forwarded to the user's isolated OpenCode server
- **AND** the SDK SHALL automatically include `userId` from authStore as a query parameter

#### Scenario: SDK proxy forwards to correct user port
- **WHEN** the SDK makes a request to `/api/opencode/*`
- **AND** the request includes `userId` as a query parameter
- **THEN** the backend proxy SHALL look up the user's assigned port from `ports.json`
- **AND** the proxy SHALL forward the request to `http://localhost:{userPort}/*`
- **AND** the response SHALL be returned to the SDK client

#### Scenario: SDK handles proxy errors when user not found
- **WHEN** the backend proxy cannot find the user's port
- **THEN** the SDK SHALL return a 404 error with message "User not found or port not assigned"

#### Scenario: SDK handles proxy errors when user not logged in
- **WHEN** a request is made to `/api/opencode/*`
- **AND** no `userId` is provided in the query parameters
- **THEN** the backend proxy SHALL return a 401 error with message "Authentication required"

#### Scenario: SSE streams proxied correctly
- **WHEN** the SDK subscribes to `/global/event` (SSE stream)
- **AND** the request is made through the proxy
- **THEN** the backend proxy SHALL stream events from the user's OpenCode server
- **AND** the stream SHALL be passed through to the client without buffering

(End of file - total 42 lines)
