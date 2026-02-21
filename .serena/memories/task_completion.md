# Task Completion Checklist

When a task is completed:

1. **Verify the implementation** - Run the dev server and test the feature
2. **Check for errors** - Ensure no TypeScript or lint errors
3. **Test build** - Run `npm run build` to ensure production build works
4. **Git commit** - Create a commit with conventional commit message

## Build Verification
```bash
cd roadmap-manager
npm run build
npm run preview
```

## Conventional Commits
- `feat:` - New feature
- `fix:` - Bug fix
- `refactor:` - Code refactoring
- `docs:` - Documentation
- `UI:` - UI changes