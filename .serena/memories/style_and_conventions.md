# Code Style and Conventions

## Naming Conventions
- **Components**: PascalCase (e.g., `RoadmapBoard.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useRoadmapStore.ts`)
- **Store**: PascalCase with `Store` suffix (e.g., `roadmapStore.ts`)
- **Types**: PascalCase (e.g., `RoadmapItem.ts`)

## TypeScript
- Use explicit type annotations
- Define interfaces for data structures

## File Organization
- React components in `src/components/`
- Custom hooks in `src/hooks/`
- Services in `src/services/`
- State stores in `src/store/`
- Types in `src/types/`

## Best Practices
- Use Zustand for global state management
- Use @dnd-kit for drag-and-drop functionality
- Use Framer Motion for animations