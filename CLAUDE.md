<!-- OPENSPEC:START -->
# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

# Commands

```bash
cd roadmap-manager

# Development
npm run dev              # Start Vite dev server (port 1430)
npm run build            # TypeScript compile + Vite build
npm run preview          # Preview production build
tsc --noEmit             # Type check without emitting files

# Testing & Linting
npm test                 # Run tests (if configured)
npm run lint             # Lint code (if configured)
npm run lint:fix         # Auto-fix lint errors (if configured)

# OpenCode integration (AI assistant server)
npm run opencode:server  # Start OpenCode server on port 51432
```

# Architecture

## Tech Stack
- React 18 + TypeScript with Vite
- Tailwind CSS for styling
- Zustand for state management
- @dnd-kit for drag-and-drop
- Framer Motion for animations

## Directory Structure
```
roadmap-manager/
├── src/
│   ├── components/      # React components (PascalCase)
│   ├── hooks/           # Custom hooks (use*.ts)
│   ├── services/        # API/file services + OpenCode SDK integration
│   ├── store/           # Zustand stores (*Store.ts)
│   ├── types/           # TypeScript definitions
│   └── utils/           # Utilities
```

## Key Integration Points
- **File operations**: Custom Vite plugin handles `/api/read-roadmap` and `/api/write-roadmap`
- **OpenCode AI**: SDK integrated in `services/` for session management and AI prompts
- **State**: Single Zustand store in `store/` manages all roadmap/task state

## Custom Vite Plugin Endpoints

The `roadmapPlugin` in `vite.config.ts` provides these endpoints:

### Map Management
- `GET /api/list-maps` - List all `map-*.md` files
- `POST /api/create-map` - Create new map file (validates name: Chinese/English letters, numbers, hyphens)
- `POST /api/delete-map` - Delete map file
- `POST /api/rename-map` - Rename map file
- `POST /api/read-map` - Read specific map file content
- `POST /api/write-map` - Write to specific map file (archiving)

### OpenCode Integration
- `GET /session` - List filtered sessions (roadmap directory only, excludes subagents and modal-prompt sessions)
- `POST /api/execute-navigate` - Execute navigate commands via OpenCode Server with SSE streaming
- `POST /api/execute-modal-prompt` - Execute modal prompts via OpenCode Server with SSE streaming

### Legacy
- `GET /api/read-roadmap` - Read `roadmap.md` (original file)
- `POST /api/write-roadmap` - Write to `roadmap.md`

## Entry Points & Key Files
- App entry: `roadmap-manager/src/main.tsx`
- Main App component: `roadmap-manager/src/components/App.tsx`
- Map file operations: `roadmap-manager/src/hooks/useMaps.ts`
- File service: `roadmap-manager/src/services/fileService.ts`
- OpenCode SDK integration: `roadmap-manager/src/services/opencodeSDK.ts`
- Task store: `roadmap-manager/src/store/taskStore.ts`
- Map store: `roadmap-manager/src/store/mapsStore.ts`

## Environment Setup
- OpenCode server password is configured in `opencode:server` script
- Server ports checked: 51432, 51466, 51434 (in order)
- Local storage keys: `lastEditedMapId`, `mapIdToConnect` (see useMaps.ts)

## Notes
- The `npm run opencode:server` command contains an absolute path to project root
- Update the path if moving the project to a different location
- Alternatively, start OpenCode server manually from project root: `opencode serve --port 51432`

## OpenCode Server Management

- Auto-starts during `npm run dev` if not already running
- Checks ports: 51432, 51466, 51434 (in order)
- Falls back to starting on first port (51432) if none found
- `npm run opencode:server` - Manually start server (runs in background)
- Server health checked before all OpenCode API calls
- Port selection: `openCodePort` is determined at Vite server startup

## Store Structure

### Stores
- `taskStore.ts` - Manages tasks, subtasks, CRUD operations (largest store)
- `mapsStore.ts` - Maps list and current map metadata
- `sessionStore.ts` - OpenCode sessions management
- `modelStore.ts` - AI model selection state
- `resultModalStore.ts` - Result modal visibility and content
- `themeStore.ts` - Theme settings

### Types
- `types.ts` - Shared TypeScript definitions for tasks, maps, sessions

### State Persistence
- Tasks persist in local state even when disconnected from map file
- Map connection state managed separately from task data

## Session Filtering

Sessions shown in SessionList are filtered to include only:
- Sessions in `/Users/SparkingAries/VibeProjects/RoadMap` directory
- Top-level sessions (no parentID)
- Exclude subagent sessions (regex: `(@.*subagent)`)
- Exclude modal-prompt sessions (title starts with "modal-prompt:")
- Sorted by creation time (newest first)

# Development Patterns

## File Operations
- Maps are stored as markdown files in the root directory (e.g., `map-*.md`)
- `fileService.ts` handles roadmap read/write via `/api/read-roadmap` and `/api/write-roadmap` endpoints
- Maps sidebar (`MapsSidebar.tsx`) provides multi-map management with validation

## State Management
- `useMaps.ts` manages map file operations and connection state
- Connection state includes: connected (loading map), disconnected (ready to edit), failed (error)
- `mapsStore.ts` stores maps list and current map metadata
- Tasks stored in `taskStore.ts` can persist locally even when disconnected from map file

## Responsive Design
- 4-level responsive breakpoint system for UI scaling
- Theme-adaptive colors applied to Header and Sidebar components
- Maps sidebar can be hidden/shown based on viewport and connection state

## Common Operations
- Create map: saves empty markdown file, triggers disconnected state
- Disconnect action: saves current roadmap to map file, clears editor, hides sidebar
- Manual connection toggle: allows user control over auto-loading from map file

## Map Lifecycle Workflow
1. Create map → empty md file created → disconnected state → sidebar hidden
2. Edit content → tasks persist in local state
3. Disconnect action → save to map file → clear content → hide sidebar
4. Reopen map → load from file → connection toggle controls auto-load behavior

# Connection Behavior
- Always preserve `lastEditedMapId` in localStorage and restore it on app reload
- Never auto-connect on reload - connection must be user-initiated via toggle
- Distinguish between "remembering state" (localStorage) vs "auto-reconnecting" (manual action required)

# Common Pitfalls
- Drag direction logic: Use `(newPos - oldPos)` not `(oldPos - newPos)` to avoid inverted behavior
- Connection state confusion: `connected` = loading map, `disconnected` = ready to edit, `failed` = error

# Commit Conventions
- All commits must be atomic, conventional, and scoped to a single logical change
- Example: `feat(map): sync lastEditedMapId to backend`
- Use `/commit` for automated conventional commit messages

# Working Style
- Prefer minimal, targeted edits over broad refactors
- For new features: Start with single-file implementation, expand only if necessary
- For bug fixes: Make the smallest possible change to achieve the fix
- Clarify when needed: Use explicit prompts like "Remember state but never auto-connect on reload"