# Change: Add OpenCode API Proxy

## Why
Currently, the frontend SDK connects directly to OpenCode Server via `http://localhost:{port}`. This works locally with SSH tunnels, but fails when:
1. Users access via SSH tunnel without port forwarding for OpenCode ports
2. Users access via Cloudflare Tunnel (remote server)

The browser cannot connect to internal server ports (51000+), making the app unusable in these scenarios.

## What Changes
- Add backend proxy route `/api/opencode/*` to forward SDK requests to the correct user OpenCode Server port
- Modify frontend SDK `getBaseUrl()` to use `/api/opencode` instead of `http://localhost:{port}`
- SDK client automatically includes `userId` from authStore in all requests
- SDK calls remain unchanged (no changes to caller code)
- SSE streams (`/global/event`) are also proxied
- When no user is logged in, reject any proxy requests with 401

## Impact
- Affected specs: `session` (SDK Dynamic Port Configuration requirement)
- Affected code:
  - `src/services/opencodeClient.ts` - baseUrl change, auto userId
  - `server/index.ts` - add proxy route (production)
  - `vite.config.ts` - add proxy middleware (development)
  - `src/services/server/opencodeProxy.ts` - NEW shared proxy module

## Status
- [x] SDK client modified to use `/api/opencode` with `x-user-id` header
- [x] Production proxy implemented in `server/index.ts`
- [x] Dev proxy implemented in `vite.config.ts`
- [x] Extract shared proxy logic to single module (`src/services/server/opencodeProxy.ts`)
- [ ] Testing

(End of file - total 26 lines)
