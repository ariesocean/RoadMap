# Change: OpenCode Server Auto Start

## Why
Simplify development workflow by automatically starting OpenCode Server when Vite dev server starts.

## What Changes
- Vite automatically detects if OpenCode Server is running on port 51432
- If not running, automatically starts OpenCode Server
- Uses fallback ports 51466, 51434 if needed
- Fails Vite startup if OpenCode Server cannot be started

## Impact
- Affected specs: None (dev tool only)
- Affected code:
  - `vite.config.ts` - Add auto-detection and startup logic
