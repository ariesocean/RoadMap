# Change: Disconnect Other Clients on New Device Connect

## Why
Currently, roadmap manager allows multiple browser clients to connect simultaneously, which may lead to state inconsistency and data race issues. The user wants to automatically disconnect all other connected clients when a new device connects, ensuring single-device usage mode.

## What Changes
- Add client connection tracking mechanism in Vite server
- When a new client connects, disconnect all existing clients
- Only affects Vite page browser connections; does not affect opencode server and sessionList

## Impact
- Affected specs: None existing (new capability)
- Affected code: `roadmap-manager/vite.config.ts`
