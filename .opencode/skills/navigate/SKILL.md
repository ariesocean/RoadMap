---
name: navigate
description: Personal task management system using semantic analysis to manage roadmap.md with natural language input
license: MIT
compatibility: opencode
---

## Quick Start

```bash
# Navigate to your project directory
cd /path/to/your/project

# Run via Python module (recommended)
PYTHONPATH=.opencode python -m skills.navigate.main "Build a new website"

# Or run directly
PYTHONPATH=.opencode python .opencode/skills/navigate/main.py "Add login feature"
```

## CLI Usage

```bash
# Set PYTHONPATH to your project root
PYTHONPATH=.opencode python .opencode/skills/navigate/main.py "<your natural language request>"
```

### Command Line Options

| Flag | Description |
|------|-------------|
| `--roadmap FILE` | Specify roadmap file path (default: roadmap.md) |
| `--achievements FILE` | Specify achievements file path (default: achievements.md) |
| `--help` | Show help message |

**Note:** The `--view` flag mentioned in examples requires manual file viewing via `cat roadmap.md`.

## Input/Output Format

### Input

Natural language prompts with intelligent intent detection:

| Prompt Pattern | Action | Example |
|----------------|--------|---------|
| Task description (no existing context) | Creates main task | `"Build a new website"` |
| Contains subtask action verbs | Creates subtask | `"Add user authentication to the website"` |
| Contains completion keywords | Marks complete | `"Done with user authentication"` |
| Contains archive keywords | Archives task | `"Archive the website project"` |

### Keywords Recognized

**Completion Keywords:**
`done`, `finished`, `complete`, `completed`, `all set`, `ready`, `accomplished`, `achieved`, `wrapped up`

**Archive Keywords:**
`archive`, `move to achievements`, `save to archive`

**Subtask Keywords:**
`add`, `create`, `implement`, `build`, `write`, `setup`, `configure`, `install`, `design`

### Output

Responses are printed to stdout:

```
Created main task: 'Build a new website'
```

Or for clarification (confidence < 0.7):
```
Which task are you referring to when you say 'Done'?
```

## Architecture

### Core Components

1. **File Manager** (`.opencode/skills/navigate/file_manager.py`)
   - Handles reading/writing `roadmap.md` and `achievements.md`
   - Creates automatic backups before writes
   - Error handling for file operations

2. **Semantic Intent Analyzer** (`.opencode/skills/navigate/semantic_analyzer.py`)
   - Determines action type with confidence score (0.0-1.0)
   - Matches keywords to detect intent
   - Finds target tasks via word overlap and exact matching
   - Uses confidence threshold of 0.7 for clarification

3. **Task State Manager** (`.opencode/skills/navigate/task_state_manager.py`)
   - Maintains current task structure in memory
   - Creates and manages main tasks and subtasks
   - Tracks completion status and timestamps
   - Stores tasks with IDs, titles, descriptions, and subtask lists

4. **Markdown Formatter** (`.opencode/skills/navigate/markdown_formatter.py`)
   - Converts task data to properly formatted markdown
   - Generates timestamps in `YYYY-MM-DD HH:MM` format
   - Creates completion markers `[x]` and `[ ]`
   - Formats hierarchical structure with headings

### Workflow Pipeline

```
1. Receive prompt
2. Validate input (non-empty, <1000 chars)
3. **Intelligent Intent Recognition** - LLM analyzes prompt to determine action type, target task, and confidence score
4. If confidence < 0.7, return clarification question
5. Execute action (create/main, create/subtask, mark_complete, archive)
6. Format tasks to markdown
7. Write to file with backup
8. Return response message
```

## File Structure

### roadmap.md Format

```markdown
# Main Task Title [created: YYYY-MM-DD HH:MM]

> Main task short description

## Subtasks
* [ ] Subtask 1 [created: YYYY-MM-DD HH:MM]
* [x] Subtask 2 [created: YYYY-MM-DD HH:MM]

---
**Last Updated:** YYYY-MM-DD HH:MM
```

### achievements.md Format

```markdown
# Archived Main Task [created: YYYY-MM-DD HH:MM] [archived: YYYY-MM-DD HH:MM]

## Completed Subtasks
* [x] Subtask 1 [created: YYYY-MM-DD HH:MM]
* [x] Subtask 2 [created: YYYY-MM-DD HH:MM]

---
**Archived Date:** YYYY-MM-DD HH:MM
```

## Workflow Examples

### Creating Main Tasks

```bash
$ PYTHONPATH=.opencode python .opencode/skills/navigate/main.py "Build a new website"
Created main task: 'Build a new website'

$ PYTHONPATH=.opencode python .opencode/skills/navigate/main.py "Research React frameworks"
Created main task: 'Research React frameworks'
```

### Creating Subtasks

```bash
$ PYTHONPATH=.opencode python .opencode/skills/navigate/main.py "Add user authentication to the website"
Added subtask to existing task: 'Add user authentication to the website'

$ PYTHONPATH=.opencode python .opencode/skills/navigate/main.py "Implement payment gateway"
Added subtask to existing task: 'Implement payment gateway'
```

### Completing Tasks

```bash
$ PYTHONPATH=.opencode python .opencode/skills/navigate/main.py "Done with user authentication"
Marked task as complete
```

### Clarification (Ambiguous Input)

```bash
$ PYTHONPATH=.opencode python .opencode/skills/navigate/main.py "Done"
Which task are you referring to when you say 'Done'?
```

### Viewing Roadmap

```bash
$ cat roadmap.md
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
| `roadmap.md.bak` | Automatic backup before each write |

## Error Handling

- Empty prompts are rejected with: "Please provide a task description."
- Prompts exceeding 1000 characters are rejected
- Invalid task references are caught with clarification requests
- File write failures are logged with backup recovery
- All exceptions are caught with user-friendly error messages

## API Reference

### NavigateSkill Class

```python
from skills.navigate.main import NavigateSkill

# Initialize with custom paths
skill = NavigateSkill(roadmap_path="roadmap.md", achievements_path="achievements.md")

# Process a natural language prompt
response = skill.process_prompt("Build a new website")
print(response)
```

### Process Prompt Return Values

| Action | Success Response | Failure Response |
|--------|------------------|------------------|
| create_main_task | "Created main task: 'title'" | "Error creating main task. Please try again." |
| create_subtask | "Added subtask to existing task: 'content'" | "Error creating subtask. Please try again." |
| mark_complete | "Marked task as complete" | "Error marking task as complete. Please try again." |
| archive | "Would you like to archive this completed task? (Reply 'yes' to confirm)" | Task not found error |
| clarify | Clarification question | N/A |

### Semantic Intent Analyzer

```python
from skills.navigate.semantic_analyzer import SemanticIntentAnalyzer

analyzer = SemanticIntentAnalyzer()
result = analyzer.analyze_intent("Done with login feature", existing_tasks)

# Returns:
{
    "action": "mark_complete",
    "content": "Done with login feature",
    "target_task_id": "task_1",
    "confidence": 0.9
}
```

## Implementation Details

### Core Functions

| Function | File | Description |
|----------|------|-------------|
| `analyze_intent()` | semantic_analyzer.py | Determines action type with confidence score |
| `_find_target_task()` | semantic_analyzer.py | Finds matching task via word overlap |
| `_should_be_subtask()` | semantic_analyzer.py | Determines if prompt should be subtask |
| `_find_best_parent_task()` | semantic_analyzer.py | Finds best parent task for subtask |
| `create_main_task()` | task_state_manager.py | Creates new main task |
| `create_subtask()` | task_state_manager.py | Creates subtask under parent |
| `mark_task_complete()` | task_state_manager.py | Marks task and subtasks complete |
| `format_tasks()` | markdown_formatter.py | Converts tasks to markdown |
| `write_roadmap()` | file_manager.py | Writes with backup creation |

### Confidence Scoring

- **0.85+**: High confidence (create_main_task)
- **0.80-0.84**: Good confidence (create_subtask)
- **0.70-0.79**: Moderate confidence (may require clarification)
- **< 0.70**: Triggers clarification question

### Task ID Structure

- Main tasks: `task_0`, `task_1`, `task_2`, ...
- Subtasks: `subtask_0`, `subtask_1`, ... (nested under parent)

## Limitations & Future Enhancements

Current limitations being addressed:
- No subtask-to-subtask nesting (flat subtask structure)
- Manual confirmation flow for archiving not fully implemented
- Task loading from existing files not yet active
- No project/task number reference support ("task #3")

Planned features:
- Hierarchical subtask levels (subtask of subtask)
- Automatic archive confirmation handling
- Rich task descriptions and longer notes
- Task search and filtering
- Export to other formats
