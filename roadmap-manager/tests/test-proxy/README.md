# Test Proxy

Tests SDK functionality through the `/api/opencode` proxy.

## Usage

```bash
# Set user ID (must exist in users directory)
export USER_ID=your_user_id

# Run tests (dev server on port 1630)
node tests/test-proxy/test-proxy.mjs

# Or test against production server
export BASE_URL=http://localhost:3000
node tests/test-proxy/test-proxy.mjs
```

## Tests

1. `session.list` - List all sessions
2. `session.create` - Create a new session
3. `session.list` - List sessions again
4. `session.promptAsync + global.event` - Submit prompt and receive SSE events
5. `session.delete` - Delete the test session
