## Context
The browser-based frontend cannot connect directly to OpenCode Server ports (51000+) when accessed via Cloudflare Tunnel or SSH without port forwarding. We need a backend proxy to forward SDK requests to the correct user-specific OpenCode Server.

## Goals / Non-Goals

- **Goals**: 
  - Enable remote access to OpenCode Server via backend proxy
  - Maintain backward compatibility for local development
  - Support SSE streaming for real-time events
  - Automatically handle user identification via authStore
  
- **Non-Goals**: 
  - Authentication/authorization beyond existing user isolation
  - Caching or rate limiting (not needed for single-user scenario)
  - Load balancing across multiple servers

## Decisions

### Proxy Route Structure
- **Decision**: Use Express route `/api/opencode/*` to catch all SDK requests
- **Rationale**: Matches existing API pattern (`/api/*`), easy to implement with Express

### UserId Inclusion
- **Decision**: SDK client automatically appends `userId` from authStore to all request URLs
- **Rationale**: Minimizes changes to caller code, maintains clean API surface
- **Implementation**: Modify `getBaseUrl()` to return `/api/opencode?userId={userId}` or use URL rewriting

### SSE Streaming
- **Decision**: Use Express proxy with Node.js stream passthrough for SSE
- **Rationale**: SSE is streaming by nature; need to pipe response without buffering
- **Implementation**: `proxyReq.pipe(res)` with proper headers (`Transfer-Encoding: chunked`)

### Error Handling
- **Decision**: Return standard HTTP errors (401 for auth, 404 for not found)
- **Rationale**: SDK should handle these as normal errors

## Technical Implementation

### Frontend (opencodeClient.ts)
```typescript
function getBaseUrl(): string {
  const userId = useAuthStore.getState().userId;
  if (userId) {
    return `/api/opencode?userId=${userId}`;
  }
  // No user = reject (SDK initialization should not happen without user)
  return '/api/opencode?userId='; // Will result in 401
}
```

### Backend (server/index.ts)
```typescript
// Proxy route
app.use('/api/opencode/*', async (req, res) => {
  const userId = req.query.userId as string;
  
  if (!userId) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  
  const port = getUserPort(userId);
  if (!port) {
    res.status(404).json({ error: 'User not found or port not assigned' });
    return;
  }
  
  // Forward request to user's OpenCode Server
  const targetPath = req.originalUrl.replace('/api/opencode', '');
  const targetUrl = `http://localhost:${port}${targetPath}`;
  
  // For SSE (EventStream), pipe without buffering
  if (req.accepts('text/event-stream')) {
    const proxyReq = http.request(targetUrl, { method: req.method });
    req.pipe(proxyReq);
    proxyReq.pipe(res, { end: true });
  } else {
    // Regular HTTP request
    // ... http request/response forwarding
  }
});
```

## Risks / Trade-offs

- **Risk**: Extra hop through backend may add latency
  - **Mitigation**: Only affects remote access; local development unchanged
  - **Trade-off**: Worthwhile for enabling remote Cloudflare access

- **Risk**: User server down = requests fail
  - **Mitigation**: SDK already handles connection errors; proxy just passes through

## Open Questions

- Should we add health check endpoint for the proxy itself?
- Do we need to handle CORS headers explicitly, or does Express CORS middleware cover it?
