# RoadMap Project

A roadmap management application for tracking and organizing project roadmaps.

## Tech Stack
- React 18 + TypeScript with Vite
- Tailwind CSS for styling
- Zustand for state management
- @dnd-kit for drag-and-drop
- Framer Motion for animations

## Project Structure
```
roadmap-manager/
├── src/
│   ├── components/      # React components (PascalCase)
│   ├── hooks/          # Custom hooks (use*.ts)
│   ├── services/       # API/file services + OpenCode SDK integration
│   ├── store/         # Zustand stores (*Store.ts)
│   ├── types/         # TypeScript definitions
│   └── utils/         # Utilities
```

## Key Integration Points
- **File operations**: Custom Vite plugin handles `/api/read-roadmap` and `/api/write-roadmap`
- **OpenCode AI**: SDK integrated in `services/` for session management and AI prompts
- **State**: Single Zustand store in `store/` manages all roadmap/task state