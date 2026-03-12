## 1. Implementation

### 1.1 Create config file
- [x] 1.1.1 Create `roadmap-manager/src/config.cjs` - CommonJS config file
- [x] 1.1.2 Add `usersDir` with absolute path

### 1.2 Create example config file for reference
- [x] 1.2.1 Create `roadmap-manager/src/config.example.cjs` as a template
- [x] 1.2.2 Add comment explaining that usersDir must be an absolute path
- [x] 1.2.3 Document that this file should be copied to `config.cjs` and customized per machine

### 1.3 Update .gitignore
- [x] 1.3.1 Add `src/config.cjs` to `.gitignore` (machine-specific)
- [x] 1.3.2 Keep `src/config.example.cjs` in git (as template)

### 1.4 Modify userServiceServer.ts
- [x] 1.4.1 Import config from `../../config.cjs`
- [x] 1.4.2 Use `config.usersDir` for USERS_DIR
- [x] 1.4.3 Use PROJECT_DIR derived from process.cwd()

### 1.5 Modify server/index.ts
- [x] 1.5.1 Import config from `../src/config.cjs`
- [x] 1.5.2 Use `config.usersDir` for USERS_DIR
- [x] 1.5.3 Use PROJECT_DIR derived from __dirname

### 1.6 Modify vite.config.ts
- [x] 1.6.1 Import config from `./src/config.cjs`
- [x] 1.6.2 Use `config.usersDir` and PROJECT_DIR
- [x] 1.6.3 Update getCurrentUserDir() to use USERS_DIR

### 1.7 Build and verify
- [x] 1.7.1 Run `npm run build` to rebuild frontend
- [x] 1.7.2 Run `npm run build:server` to rebuild server
- [x] 1.7.3 Test with `npm run serve` - loads users from configured directory
- [x] 1.7.4 Test with `npm run dev` - loads users from configured directory
- [x] 1.7.5 Verify both modes point to the same users directory

## 2. Migration (if needed)
- Existing users in old location need to be migrated to new directory manually
- Document the migration steps in release notes
