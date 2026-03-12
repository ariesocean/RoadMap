## 1. Setup Infrastructure
- [x] 1.1 Create `tsconfig.server.json` for server TypeScript compilation
- [x] 1.2 Create `server/` directory structure

## 2. Implement Production Server
- [x] 2.1 Create `server/index.ts` with Express server setup
- [x] 2.2 Add static file serving for `dist/` directory
- [x] 2.3 Implement all API endpoints from `vite.config.ts`
- [x] 2.4 Add OpenCode Server port management

## 3. Update Package Scripts
- [x] 3.1 Add `build:server` script to compile server code
- [x] 3.2 Add `serve` script to run production server
- [x] 3.3 Add `start` script for build + serve combined

## 4. Validation
- [x] 4.1 Run `npm run build` successfully
- [x] 4.2 Run `npm run build:server` successfully  
- [x] 4.3 Run `npm run serve` and verify all endpoints work
- [x] 4.4 Verify dev mode still works (`npm run dev`)

## 5. Production Build Fix
- [x] 5.1 Separate server-only code from client-compatible code
- [x] 5.2 Create `src/services/server/userServiceServer.ts` for Node.js-dependent logic
- [x] 5.3 Update `vite.config.ts` to import from server-only file
- [x] 5.4 Remove `rollupOptions.external` from `vite.config.ts`
- [x] 5.5 Rebuild and verify production server works without CORS errors
