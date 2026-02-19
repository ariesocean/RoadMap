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

# Build
npm run build            # TypeScript compile + Vite build
npm run preview          # Preview production build

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