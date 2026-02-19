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

macOS native desktop application for managing `roadmap.md` with Microsoft To Do-style UI. Part of the OpenCode AI coding toolkit.

- **Tech Stack**: React 18 + TypeScript, Vite, Tailwind CSS, Zustand, Framer Motion, @dnd-kit
- **Main Directory**: `roadmap-manager/`

## Build & Development Commands

```bash
# Navigate to project directory
cd roadmap-manager

# Development server (port 1430)
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Start OpenCode server (used by the app)
npm run opencode:server
```

**No separate lint/test commands** - TypeScript strict mode and build validation are the primary checks.

## Code Style Guidelines

### TypeScript Configuration

- **Strict mode enabled** (`tsconfig.json`)
- **Path alias**: `@/*` maps to `src/*`
- **No unused locals/parameters** - always enabled

### Imports

- Use path aliases: `import { something } from '@/store/taskStore'`
- Group imports: external libs → internal → types
- Use `type` keyword for type-only imports: `import type { Task } from '@/store/types'`

### Naming Conventions

- **Files**: camelCase for utilities/hooks, PascalCase for components (`taskStore.ts`, `TaskCard.tsx`)
- **Components**: PascalCase, export as named export
- **Functions**: camelCase
- **Types/Interfaces**: PascalCase
- **Constants**: camelCase or UPPER_SNAKE_CASE for config

### React Patterns

- Use functional components with hooks
- Use `useTaskStore`, `useSessionStore` etc. for Zustand stores
- Prefer inline handlers or custom hooks over separate functions
- Use `motion` from framer-motion for animations

### Error Handling

- Use try/catch with async/await
- Always set error state: `setError(err instanceof Error ? err.message : 'Failed to...')`
- Provide user-friendly error messages in Chinese for UI
- Catch blocks should handle both Error objects and strings

### State Management (Zustand)

```typescript
export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  
  setTasks: (tasks: Task[]) => set({ tasks }),
  
  refreshTasks: async () => {
    const { setLoading, setTasks, setError } = get();
    try {
      setLoading(true);
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

### CSS/Tailwind

- Use Tailwind utility classes
- Custom colors defined in `tailwind.config.js`
- Support dark mode with `dark:` prefix
- Use `className` with proper spacing: `className="flex items-center gap-2"`

### Component Structure

```typescript
import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { Task } from '@/store/types';
import { useTaskStore } from '@/store/taskStore';
import { SubtaskList } from './SubtaskList';

interface TaskCardProps {
  task: Task;
  index: number;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, index }) => {
  // State and refs
  const [isEditing, setIsEditing] = useState(false);
  
  // Store access
  const { toggleTaskExpanded, updateTaskDescription } = useTaskStore();
  
  // Effects
  useEffect(() => {
    // cleanup logic
  }, [dependency]);
  
  // Handlers
  const handleClick = () => { /* ... */ };
  
  // Render
  return (
    <motion.div>
      {/* content */}
    </motion.div>
  );
};
```

### File Organization

```
src/
├── components/     # React components (PascalCase)
├── hooks/          # Custom hooks (use*.ts)
├── services/       # API clients, file services
├── store/          # Zustand stores (*Store.ts)
├── utils/          # Utility functions
└── constants/      # App constants
```

### OpenSpec Workflow

For new features or changes:
1. Check `openspec list` and `openspec list --specs` for context
2. Create change proposal in `openspec/changes/<change-id>/`
3. Write `proposal.md`, `tasks.md`, and spec deltas
4. Run `openspec validate <change-id> --strict` before implementation
5. Implement tasks from `tasks.md` sequentially
6. After deployment, archive with `openspec archive <change-id> --yes`

Skip proposal for bug fixes, typos, or dependency updates.

### Key Commands Reference

```bash
# OpenSpec
openspec list                              # Active changes
openspec list --specs                      # All capabilities
openspec show <item>                       # View details
openspec validate <item> --strict          # Validate
openspec archive <change-id> --yes         # Archive complete

# Project
npm run dev                                # Start dev server
npm run build                              # Production build
```
