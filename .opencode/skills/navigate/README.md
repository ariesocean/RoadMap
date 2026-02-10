# Navigate Skill

Personal task management system that uses natural language to manage your `roadmap.md` file.

## Installation

The skill is located in your project's `.opencode/skills/navigate/` directory.

## Quick Start

```bash
# Navigate to your project directory
cd /path/to/your/project

# Create a new task
python -m opencode.skills.navigate.main "Build a new website"

# Add a subtask
python -m opencode.skills.navigate.main "Add user login to the website"

# Mark task as complete
python -m opencode.skills.navigate.main "Done with user login"

# View current roadmap
cat roadmap.md
```

## CLI Usage

```bash
python -m opencode.skills.navigate.main "<your natural language request>"
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
python -m opencode.skills.navigate.main "Build a new mobile app"

# Add subtask (auto-detected from context)
python -m opencode.skills.navigate.main "Add push notifications to the mobile app"

# Complete a task
python -m opencode.skills.navigate.main "Done with push notifications"

# View current roadmap
python -m opencode.skills.navigate.main --view
```

## Workflow Examples

### Creating Tasks

```bash
$ python -m opencode.skills.navigate.main "Build a new website"
Created main task: 'Build a new website'

$ python -m opencode.skills.navigate.main "Add user authentication to the website"
Added subtask to existing task: 'Add user authentication to the website'
```

### Viewing Results

```bash
$ cat roadmap.md
# Build a new website [created: 2026-02-10 14:30]

## Subtasks
* [ ] Add user authentication [created: 2026-02-10 14:31]

---
**Last Updated:** 2026-02-10 14:31
```

## Features

- Natural language understanding
- Automatic task hierarchy detection
- Smart completion tracking
- Controlled archiving with confirmation
- Data safety with automatic backups

## File Structure

- `roadmap.md`: Your active tasks with hierarchical structure
- `achievements.md`: Your completed and archived projects

## Architecture

- **File Manager**: Handles reading/writing markdown files
- **Semantic Intent Analyzer**: Determines action type and task hierarchy
- **Task State Manager**: Maintains current task structure
- **Markdown Formatter**: Converts tasks to proper markdown format

## License

MIT
