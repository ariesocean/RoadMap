---
name: roadmap
description: Personal task management system using LLM-assisted semantic analysis to intelligently manage a hierarchical roadmap.md file with natural language commands
license: MIT
metadata:
  category: task-management
  complexity: intermediate
  files:
    - roadmap.md
    - achievements.md
---

## What I do

The Roadmap skill manages a personal task management system through intelligent semantic analysis. It handles:

- **Intelligent Intent Recognition**: Automatically determines whether prompts should create main tasks, subtasks, or mark completion using LLM understanding
- **Hierarchical Task Management**: Maintains nested task structures with proper markdown formatting and creation sequence ordering
- **Natural Language Interface**: Accepts task inputs without special syntax; recognizes completion phrases like "done", "finished", "complete"
- **Smart Completion Tracking**: Detects completion indicators and maintains proper markdown completion markers
- **Controlled Archiving**: Moves completed main tasks to achievements.md only with explicit user confirmation, verifying all subtasks are done
- **Data Safety**: Maintains file integrity with backup handling and graceful edge case management

## When to use me

Use this skill when you need to:

- Create and manage personal tasks using natural language without special syntax
- Build hierarchical task structures with main tasks and nested subtasks
- Track task completion through conversational commands
- Automatically archive completed projects to a separate achievements file
- Maintain an organized, human-readable roadmap of ongoing work
- Convert task ideas into structured markdown task lists

## Prerequisites

- The skill creates and manages `roadmap.md` and `achievements.md` files in the project root
- Files follow specific markdown formats documented below
- User confirmation is required for irreversible archive operations

## File Structure

### roadmap.md Format

```
# Main Task Title [created: YYYY-MM-DD HH:MM]
> Main task short description

## Subtask Level 1
* [ ] Subtask 1 [created: YYYY-MM-DD HH:MM]
* [ ] Subtask 2 [created: YYYY-MM-DD HH:MM]

### Subtask Level 2
* [ ] Nested subtask 2.1 [created: YYYY-MM-DD HH:MM]

---

**Last Updated:** YYYY-MM-DD HH:MM
```

### achievements.md Format

```
# Archived Main Task [completed: YYYY-MM-DD HH:MM]
> Main task short description

## Completed Subtasks
* [x] Subtask 1 [created: YYYY-MM-DD HH:MM]
* [x] Subtask 2 [created: YYYY-MM-DD HH:MM]

---

**Archived Date:** YYYY-MM-DD HH:MM
```

## Usage

### Creating Tasks

1. **Analyze the prompt** using semantic understanding to determine if this should be a main task or subtask
2. **Identify parent context** by examining existing tasks in roadmap.md
3. **Insert at appropriate hierarchy level** with proper markdown formatting
4. **Add timestamp** in `YYYY-MM-DD HH:MM` format
5. **Update the "Last Updated" timestamp** at the bottom of roadmap.md

### Completing Tasks

1. **Detect completion intent** from phrases like "done", "finished", "complete", "marked off"
2. **Match to existing task** using semantic similarity to find the referenced task
3. **Update completion marker** from `[ ]` to `[x]`
4. **If main task completed**, verify all subtasks are also complete
5. **Update timestamps** appropriately

### Archiving Tasks

1. **Identify completed main task** to archive
2. **Verify all subtasks are complete** before proceeding
3. **Ask for explicit user confirmation** before archiving
4. **Move task to achievements.md** with completion timestamp
5. **Remove from roadmap.md** after successful archive

## Workflow Pipeline

1. **Receive natural language prompt**
2. **Analyze semantic intent**: Determine action type (create/complete/archive), task hierarchy level, and task content
3. **Confidence check**: If intent is ambiguous (< 80% confidence), ask clarification question
4. **Update task state**: Modify in-memory task representation
5. **Format to markdown**: Convert task data to proper markdown with timestamps and markers
6. **Save files**: Write roadmap.md and optionally achievements.md
7. **Confirm to user**: Report the action taken

## Core Components

1. **File Manager**: Handles reading/writing roadmap.md and achievements.md with backup safety
2. **Semantic Intent Analyzer**: Uses LLM to determine action type, hierarchy level, and task content from natural language
3. **Task State Manager**: Maintains current task structure and handles updates
4. **Markdown Formatter**: Converts task data to properly formatted markdown with timestamps and completion markers

## Available Tools

- **Read**: Read roadmap.md and achievements.md files
- **Write**: Create or overwrite roadmap.md and achievements.md with properly formatted content
- **Edit**: Modify specific sections within roadmap.md or achievements.md
- **glob**: Find roadmap.md and achievements.md files in project
- **bash**: Get current timestamp using `date "+%Y-%m-%d %H:%M"` command

## Timestamp Format

Use `YYYY-MM-DD HH:MM` format (e.g., `2026-02-10 14:30`). Obtain via:

```bash
date "+%Y-%m-%d %H:%M"
```

## Examples

### Creating Main Tasks

```
User: "Build a new website"
Action: Creates new main task "# Build a new website [created: 2026-02-10 14:30]"
```

```
User: "Research React frameworks"
Action: Creates new main task "# Research React frameworks [created: 2026-02-10 14:31]"
```

### Creating Subtasks

```
User: "Add user authentication to the website project"
Action: Creates subtask under "website" main task with proper nesting
```

```
User: "Set up CI/CD pipeline for the API"
Action: Creates subtask under "API" or creates new main task if no parent found
```

### Completing Tasks

```
User: "Done with user authentication"
Action: Marks corresponding subtask "[ ]" → "[x]" and updates timestamp
```

```
User: "Finished the website!"
Action: Marks main task and all subtasks as complete
```

```
User: "Complete task #3"
Action: Marks the third main task as complete
```

### Archiving

```
User: "Archive the website project"
Action: Verifies all subtasks complete, asks confirmation, moves to achievements.md
```

### Clarification

```
User: "Update the thing"
Action: "I found multiple matches - did you mean: (1) User authentication, (2) Website design, (3) API setup? Please clarify."
```

## Validation Checklist

Before completing any operation:

- [ ] All timestamps follow `YYYY-MM-DD HH:MM` format
- [ ] Markdown structure maintains proper heading hierarchy (# for main, ## for subtasks)
- [ ] Completion markers use `[x]` for complete, `[ ]` for incomplete
- [ ] Task ordering preserved by creation sequence
- [ ] Subtasks properly nested under parent tasks
- [ ] Archive operations verified: all subtasks complete, user confirmed
- [ ] File integrity maintained with backup before write operations
- [ ] "Last Updated" timestamp refreshed on roadmap.md changes
- [ ] Archived tasks include "Archived Date" in achievements.md

## Error Handling

- **File not found**: Create roadmap.md with default template if missing
- **Malformed content**: Attempt to parse valid sections, report issues to user
- **Ambiguous intent**: Ask clarification question with confidence < 80%
- **Archive without completion**: Prompt user to complete subtasks first
- **Write failures**: Restore from backup, retry, report error

## Design Decisions

- **Single roadmap file**: All active tasks in one central roadmap.md for simplicity
- **LLM-assisted semantic analysis**: Leverages AI capabilities for intelligent parsing rather than complex regex rules
- **User confirmation for archiving**: Ensures user control over irreversible archive operations
- **Natural language first**: Prioritizes intuitive user experience over technical constraints
- **Timestamps on everything**: Tracks creation and update times for audit trail
