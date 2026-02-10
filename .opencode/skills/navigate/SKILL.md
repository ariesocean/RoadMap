---
name: navigate
description: Personal task management system using semantic analysis to manage roadmap.md with natural language input
license: MIT
compatibility: opencode
---

# Navigate Skill

## Quick Start

```bash
# Navigate to your project
cd /path/to/your/project

# Set PYTHONPATH and run
PYTHONPATH=.opencode python -m skills.navigate.main "Build a new website"

# Or run directly with python
PYTHONPATH=.opencode python .opencode/skills/navigate/main.py "Add login feature"
```

## CLI Usage

```bash
# Set PYTHONPATH to your project root
PYTHONPATH=.opencode python .opencode/skills/navigate/main.py "<your natural language request>"
```

### Options

| Flag | Description |
|------|-------------|
| `--roadmap FILE` | Specify roadmap file path (default: roadmap.md) |
| `--achievements FILE` | Specify achievements file path (default: achievements.md) |
| `--view` | Display current roadmap without making changes |
| `--help` | Show help message |

### Examples

```bash
# Create main task
PYTHONPATH=.opencode python .opencode/skills/navigate/main.py "Build a new mobile app"

# Add subtask (auto-detected from context)
PYTHONPATH=.opencode python .opencode/skills/navigate/main.py "Add push notifications"

# Complete a task
PYTHONPATH=.opencode python .opencode/skills/navigate/main.py "Done with push notifications"

# View current roadmap
cat roadmap.md
```

## Input/Output Format

### Input

Natural language prompts:
- `"Build a new website"` - creates main task
- `"Add login to website project"` - creates subtask
- `"Done with login feature"` - marks as complete
- `"Archive website project"` - archives completed task

### Output

Responses are printed to stdout:
```
Created main task: 'Build a new website'
```

Or for clarification:
```
Which task are you referring to when you say 'Done'?
```

## Workflow Examples

### Creating Tasks

```bash
$ python -m opencode.skills.navigate.main "Build a new website"
Created main task: 'Build a new website'

$ python -m opencode.skills.navigate.main "Add user authentication to the website"
Added subtask to existing task: 'Add user authentication to the website'

$ python -m opencode.skills.navigate.main "Implement payment gateway"
Added subtask to existing task: 'Implement payment gateway'
```

### Completing Tasks

```bash
$ python -m opencode.skills/navigate/main "Done with user authentication"
Marked task as complete
```

### Viewing Roadmap

```bash
$ python -m opencode.skills.navigate.main --view
# Build a new website [created: 2026-02-10 14:30]

## Subtasks
* [x] Add user authentication [created: 2026-02-10 14:31]
* [ ] Implement payment gateway [created: 2026-02-10 14:32]

---
**Last Updated:** 2026-02-10 14:32
```

## Output Files

Creates and manages two files in your project directory:

| File | Purpose |
|------|---------|
| `roadmap.md` | Active tasks with hierarchical structure |
| `achievements.md` | Archived completed projects |

## Sample Output Files

### roadmap.md

```markdown
# Build a new website [created: 2026-02-10 14:30]

## Subtasks
* [x] Add user authentication [created: 2026-02-10 14:31]
* [ ] Implement payment gateway [created: 2026-02-10 14:32]

---
**Last Updated:** 2026-02-10 14:32
```

### achievements.md

```markdown
# Mobile App Project [created: 2026-02-01 10:00] [archived: 2026-02-10 16:00]

## Subtasks
* [x] Design UI/UX
* [x] Build core features
* [x] Launch app

---
**Last Updated:** 2026-02-10 16:00
```

## Core Components

- **File Manager**: Handles reading/writing markdown files
- **Semantic Intent Analyzer**: Determines action type and task hierarchy
- **Task State Manager**: Maintains current task structure
- **Markdown Formatter**: Converts tasks to proper markdown format

## Error Handling

- Empty prompts are rejected
- Very long descriptions are flagged
- Invalid task references are caught
- File write failures are logged with backup recovery
