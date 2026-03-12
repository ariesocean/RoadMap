# Change: configure-users-dir-via-config

## Why
Currently, the users directory path is hardcoded using relative paths based on the project directory:
- `npm run dev`: users/ in project parent (RoadMap/users/)
- `npm run serve`: users/ in roadmap-manager (RoadMap/roadmap-manager/users/)

This causes:
1. User data isolation issue between dev and serve modes
2. Difficulty in migrating data across environments
3. Users directory is coupled to project directory - not portable

**Important**: The users directory is NOT necessarily related to the project directory. It can be placed anywhere on the system (e.g., `/data/roadmap-users/`, `~/Library/Application Support/RoadMap/users/`). This separation allows:
- Sharing user data across multiple project clones
- Placing user data on a different drive or network location
- Easier backup and migration

## What Changes
- Add a TypeScript config file `src/config/index.ts` that exports configuration values
- **Config location**: `roadmap-manager/src/config/index.ts`
- **Config format**: TypeScript module exporting paths (not .env)
- Remove fallback logic - app MUST fail if config is not properly set
- Modify 3 source files to import from config:
  - `src/services/server/userServiceServer.ts`
  - `server/index.ts`
  - `vite.config.ts`
- Re-build the project

## Config File Design
```typescript
// src/config/index.ts
export const config = {
  usersDir: '/absolute/path/to/users',  // Required: absolute path
  projectDir: '/path/to/project',       // Optional: defaults to process.cwd()
};
```

**Key points**:
- `usersDir` MUST be an absolute path - relative paths are not allowed
- `usersDir` is completely independent from `projectDir`
- Config file is a regular TypeScript file that can be easily modified per-machine

## Impact
- Affected specs: auth (data storage location changes, but behavior unchanged)
- Affected code:
  - `src/config/index.ts` (NEW)
  - `src/services/server/userServiceServer.ts`
  - `server/index.ts`
  - `vite.config.ts`
