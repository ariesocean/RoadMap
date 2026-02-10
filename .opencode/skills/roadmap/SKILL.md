---
name: roadmap
description: Personal task management using LLM-assisted semantic analysis to manage roadmap.md with natural language commands
license: MIT
metadata:
  category: task-management
  complexity: intermediate
  files:
    - roadmap.md
    - achievements.md
---

## Core Actions

| Action | Rules |
|--------|-------|
| **Create** | Extracts user prompt core intent as a task description for the title, preserving the original wording as much as possible. add `[created: YYYY-MM-DD HH:MM]` |
| **Complete** | `[ ]` → `[x]`, verify subtasks if main task |
| **Archive** | Confirm subtasks done, confirm with user to move to achievements.md with `[completed:]` |

> **Note**: Each prompt creates exactly ONE task (main or subtask) unless prompt explicitly says "add multiple tasks" or similar.

## Available Tools

- **Read**: Load roadmap.md, achievements.md (parallel)
- **Edit**: Modify sections in-place
- **Write**: Overwrite with new content
- **bash**: `date "+%Y-%m-%d %H:%M"` for timestamps

## Fast Workflow (5 Steps)

1. **Bash Timestamp** - Execute bash command first to get current time
2. **Parallel Read** - Load roadmap.md + achievements.md simultaneously
3. **One-Pass Parse** - Single LLM call determines action, hierarchy, and task content
4. **Direct Modify** - Update task state in memory
5. **Single Write** - Write back roadmap.md (and achievements.md if archiving)

## Intent Detection Rules

| Pattern | Action |
|---------|--------|
| "Create/add/build/start: {task}" | New main task |
| "Add subtask/step to {parent}: {task}" | Subtask under parent |
| "Done/finished/complete/marked: {task}" | Mark complete |
| "Archive/move to achievements: {task}" | Archive to achievements.md |

## Timestamp Command

```bash
date "+%Y-%m-%d %H:%M"
```

## File Operations

| Operation | Source Files | Target Files |
|-----------|--------------|--------------|
| Create task | roadmap.md | roadmap.md |
| Complete task | roadmap.md | roadmap.md |
| Archive task | roadmap.md | roadmap.md + achievements.md |

## Quick Formats

### Main Task
```
# {title} [created: YYYY-MM-DD HH:MM]
> {original_prompt}

## Subtasks
* [ ] {subtask}

---
**Last Updated:** YYYY-MM-DD HH:MM
```

### Subtask (no timestamp)
```
* [ ] {subtask}
```

### Archived (achievements.md)
```
# {title} [completed: YYYY-MM-DD HH:MM]
> {original_prompt}

* [x] {subtasks...}

**Archived:** YYYY-MM-DD HH:MM
```

## Examples

| User | Action |
|------|--------|
| "Build a website" | New main task with timestamp |
| "Add auth to website" | Subtask under website |
| "Done auth" | Mark subtask [x] |
| "Complete task #3" | Mark main task #3 [x] |
| "Archive website" | Confirm → move to achievements.md |
| "Update the thing" | Ask clarification (ambiguous) |

## Quick Validation

- `[created: YYYY-MM-DD HH:MM]` for main tasks (in title)
- `[x]` / `[ ]` for completion
- `#` for main, `##` for subtasks
- Archive = all subtasks done + user confirm
- Each main task has its own `**Last Updated:**` at section bottom

## Edge Cases

| Case | Action |
|------|--------|
| Missing roadmap.md | Create template |
| Ambiguous intent | Ask clarification |
| Archive incomplete | Prompt to finish first |
| Write fails | Retry once, report error |
