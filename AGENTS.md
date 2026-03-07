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

# AGENTS.md - AI Coding Assistant Guidelines

## Project Overview

macOS native desktop application for managing `roadmap.md` with Microsoft To Do-style UI. Supports multi-user authentication with individual user sessions and isolated data storage.

- **Tech Stack**: React 18 + TypeScript, Vite, Tailwind CSS, Zustand, Framer Motion, @dnd-kit, OpenCode SDK
- **Main Directory**: `roadmap-manager/`
- **Features**: Multi-user login, session management, per-user roadmap data, OpenCode integration

## Build & Development Commands

```bash
# Navigate to project directory first
cd roadmap-manager

# Development server (port 1630)
npm run dev

# Type check only (no emit)
npx tsc --noEmit

# Type check specific file
npx tsc --noEmit src/components/TaskCard.tsx

# Production build (includes type checking)
npm run build

# Preview production build
npm run preview

# Start OpenCode server (required for app functionality)
npm run opencode:server

# Lint (not configured - use npx tsc --noEmit for type checking)
```

**Note**: No ESLint/Prettier configured. Use `npx tsc --noEmit` for type checking.

## Testing Commands

```bash
cd roadmap-manager

# Run all Playwright tests
npx playwright test

# Run specific test file
npx playwright test tests/login.spec.ts

# Run tests matching a pattern
npx playwright test --grep "login"

# Run a single test by name
npx playwright test --grep "should login successfully"

# Run tests in UI mode (debug)
npx playwright test --ui

# Run with trace viewer (on failure)
npx playwright test --trace on
```

**Note**: Tests require the dev server to be running (port 1630). The playwright.config.ts automatically starts the dev server via `webServer` option.

## Testing Guidelines

- Always stop running processes (e.g., dev server, vite) after testing is complete

## Project Directory Structure

The application expects the following directory structure:

```
RoadMap/                    # Project root (parent of roadmap-manager)
├── roadmap-manager/        # React application
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
├── roadmap.md              # Main roadmap file
└── map-*.md                # Individual map files
```

**Important**: All data files (`roadmap.md`, `map-*.md`) must be in the **parent directory** of `roadmap-manager/`. The app reads/writes to `../roadmap.md` and `../map-*.md`.

This design allows the project to be portable - clone to any machine and run `npm run dev` from `roadmap-manager/`.

## Code Style Guidelines

### TypeScript Configuration

- **Strict mode enabled** with `noUnusedLocals` and `noUnusedParameters`
- **Path alias**: `@/*` maps to `src/*`
- **Target**: ES2020 with ESNext modules

### Imports (Strict Order)

```typescript
// 1. External libraries
import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { create } from 'zustand';

// 2. Internal modules (using path aliases)
import { useTaskStore } from '@/store/taskStore';
import { formatDate } from '@/utils/dateUtils';

// 3. Type-only imports (always use `type` keyword)
import type { Task, Subtask } from '@/store/types';
```

### Naming Conventions

- **Components**: PascalCase files (`TaskCard.tsx`), named exports
- **Stores**: camelCase with `Store` suffix (`taskStore.ts`)
- **Hooks**: camelCase with `use` prefix (`useSession.ts`)
- **Utils**: camelCase (`markdownUtils.ts`)
- **Services**: camelCase (`fileService.ts`, `opencodeClient.ts`)
- **Types/Interfaces**: PascalCase
- **Constants**: camelCase for regular, UPPER_SNAKE_CASE for config

### React Patterns

- Functional components with hooks only
- Destructure store methods: `const { toggleTaskExpanded, updateTaskDescription } = useTaskStore()`
- Use `useCallback` for handlers passed to children
- Prefer inline handlers for simple cases
- Use `motion` from framer-motion for animations
- Use `@dnd-kit` for drag-and-drop

### Error Handling

```typescript
// Always use try/catch with async/await
try {
  await someAsyncOperation();
} catch (err) {
  // Handle both Error objects and strings
  setError(err instanceof Error ? err.message : 'Failed to perform operation');
}

// UI messages in Chinese
throw new Error('OpenCode Server 启动超时');
```

### State Management (Zustand Pattern)

```typescript
export const useTaskStore = create<TaskStore>((set, get) => ({
  // State
  tasks: [],
  isLoading: false,
  error: null,

  // Simple setters
  setTasks: (tasks: Task[]) => set({ tasks }),
  setLoading: (isLoading: boolean) => set({ isLoading }),
  setError: (error: string | null) => set({ error }),

  // Async actions with error handling
  refreshTasks: async () => {
    const { setLoading, setTasks, setError } = get();
    try {
      setLoading(true);
      setError(null);
      const data = await loadTasksFromFile();
      setTasks(data.tasks);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh tasks');
    } finally {
      setLoading(false);
    }
  },
}));
```

### Multi-User Session Patterns

For authentication and per-user data isolation:

```typescript
// Session store manages user sessions
// User data is isolated per-session in users/<username>_<timestamp>/

// Login flow: create session with username
const session = await createSession(username);

// Per-user data paths
const userDir = `../users/${username}_${timestamp}/`;
const roadmapPath = `${userDir}roadmap.md`;
const mapDir = `../map-${username}_${timestamp}/`;
```

- Sessions are stored in `users/<username>_<timestamp>/` directories
- Each user has isolated `roadmap.md` and `map-*.md` files
- Use `useSession()` hook to access current session
- Use `useSessionStore()` for session management (create, list, cleanup)

```
src/
├── components/     # React components (PascalCase.tsx)
├── hooks/          # Custom hooks (use*.ts)
├── services/       # API clients, external integrations
│   ├── opencodeClient.ts   # OpenCode SDK wrapper
│   ├── opencodeAPI.ts      # API functions
│   └── fileService.ts      # File operations
├── store/          # Zustand stores (*Store.ts)
│   ├── types.ts             # Type definitions
│   ├── taskStore.ts
│   └── sessionStore.ts
├── utils/          # Pure utility functions
└── constants/      # App constants
```

### CSS/Tailwind

- Use Tailwind utility classes exclusively
- Custom colors in `tailwind.config.js`: `primary`, `background`, `dark-background`, etc.
- Dark mode with `dark:` prefix
- Proper spacing: `className="flex items-center gap-2 p-4"`

### Component Template

```typescript
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { Task } from '@/store/types';
import { useTaskStore } from '@/store/taskStore';

interface TaskCardProps {
  task: Task;
  index: number;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, index }) => {
  const [isEditing, setIsEditing] = useState(false);
  const { toggleTaskExpanded, updateTaskDescription } = useTaskStore();

  useEffect(() => {
    // Effect logic
    return () => {
      // Cleanup
    };
  }, [dependency]);

  const handleClick = () => {
    // Handler logic
  };

  return (
    <motion.div className="...">
      {/* Component content */}
    </motion.div>
  );
};
```

### OpenSpec Workflow

For new features or significant changes:
1. Check `openspec list` and `openspec list --specs` for context
2. Create proposal in `openspec/changes/<change-id>/`
3. Write `proposal.md`, `tasks.md`, and spec deltas
4. Validate: `openspec validate <change-id> --strict`
5. Implement tasks from `tasks.md` sequentially
6. Archive: `openspec archive <change-id> --yes`

Skip proposal for bug fixes, typos, or dependency updates.

## Key Commands

```bash
# Development
npm run dev                    # Start dev server
npx tsc --noEmit              # Type check only

# OpenSpec
openspec list                  # Active changes
openspec list --specs          # All capabilities
openspec validate <id> --strict
```
