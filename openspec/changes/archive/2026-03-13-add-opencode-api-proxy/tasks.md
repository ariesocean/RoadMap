## 1. Implementation (SDK & Proxy)

- [x] 1.1 Modify `src/services/opencodeClient.ts` - Change `getBaseUrl()` to return `/api/opencode` instead of `http://localhost:{port}`
- [x] 1.2 Modify `src/services/opencodeClient.ts` - Auto-append `x-user-id` header from authStore to all SDK requests
- [x] 1.3 Add proxy route in `server/index.ts` to forward `/api/opencode/*` requests to user's OpenCode Server port
- [x] 1.4 Add proxy middleware in `vite.config.ts` to forward `/api/opencode/*` requests during development

## 2. Refactoring (Extract Shared Logic)

- [x] 2.1 Create `src/services/server/opencodeProxy.ts` - Extract shared proxy logic into a reusable function
- [x] 2.2 Update `server/index.ts` - Import and use shared proxy function
- [x] 2.3 Update `vite.config.ts` - Import and use shared proxy function

## 3. Bug Fix - SSE Detection

- [x] 3.1 Fix SSE detection - detect by URL path `/global/event` instead of Accept header

## 4. Testing

- [ ] 4.1 Test with SSH tunnel (local port forwarding) - access via `http://localhost:3000`
- [ ] 4.2 Verify prompt functionality works through proxy
- [ ] 4.3 Verify dev server proxy works (`npm run dev`)

## 4. Deployment

- [ ] 4.1 Deploy to remote server
- [ ] 4.2 Test via Cloudflare Tunnel public URL

(End of file - total 32 lines)
