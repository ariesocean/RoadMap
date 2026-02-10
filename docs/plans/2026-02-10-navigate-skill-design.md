# Roadmap Skill Design Document

## Overview

The "Roadmap" skill is a personal task management system that uses LLM-assisted semantic analysis to intelligently manage a hierarchical `roadmap.md` file. It allows users to manage tasks using natural language without requiring special syntax or commands.

## Core Capabilities

### Intelligent Intent Recognition
- Automatically determines whether prompts should create main tasks, subtasks, or mark completion
- Uses semantic analysis to understand context and relationships between tasks
- Handles ambiguous inputs by asking for clarification

### Hierarchical Task Management
- Supports nested task structures with proper markdown formatting
- Maintains task ordering by creation sequence
- Automatically assigns appropriate hierarchy levels based on context

### Natural Language Interface
- Users can express tasks in natural language without special syntax
- Recognizes various completion phrases ("done", "finished", "complete", etc.)
- Provides helpful clarification questions when intent is unclear

### Smart Completion Tracking
- Automatically detects completion indicators in prompts
- Supports manual completion commands for explicit control
- Maintains proper completion status in markdown format

### Controlled Archiving
- Moves completed main tasks to `achievements.md` only with explicit user permission
- Verifies all subtasks are completed before allowing archive
- Maintains archived project history with completion dates

### Data Safety
- Maintains file integrity with proper backup and error handling
- Validates file structure before saving
- Handles edge cases gracefully (missing files, malformed content, etc.)

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

## Architecture

### Core Components
1. **File Manager**: Handles reading/writing `roadmap.md` and `achievements.md`
2. **Semantic Intent Analyzer**: Single component that uses AI's natural language understanding to determine action type, task hierarchy, and content
3. **Task State Manager**: Maintains current task structure and handles updates
4. **Markdown Formatter**: Converts task data to properly formatted markdown with timestamps and completion markers

### Workflow Pipeline
1. Receive prompt → Analyze semantic intent → Update task state → Format to markdown → Save files
2. Confidence check triggers clarification questions for ambiguous inputs
3. Archive operations require explicit user confirmation

## Implementation Details

### Core Functions
- `analyzeIntent(prompt, currentTasks)`: Determines action type with confidence score
- `updateTaskState(action, currentTasks)`: Updates task hierarchy and status
- `formatToMarkdown(tasks, fileName)`: Converts to proper markdown format
- `handleArchiving(mainTask, userConfirmation)`: Manages archive workflow with safety checks

### Error Handling
- File operation failures handled with retry logic and backup restoration
- Semantic analysis failures trigger clarification questions
- Data integrity maintained through validation and atomic operations

## Testing Strategy

### Test Categories
1. **Semantic Analysis Tests**: Intent recognition, hierarchy detection, completion detection
2. **File Operations Tests**: File creation, read/write integrity, backup safety
3. **Workflow Integration Tests**: End-to-end scenarios, edge cases, recovery
4. **User Experience Tests**: Clarification prompts, error messages, confirmation workflows

### Validation Checklist
- All timestamps follow `YYYY-MM-DD HH:MM` format
- Markdown structure maintains proper heading hierarchy
- Completion markers `[x]` vs `[ ]` work correctly
- Task ordering preserved by creation sequence
- Archive operations require user confirmation
- Data integrity maintained across all operations

## User Interaction Examples

### Creating Tasks
- "Build a new website" → Creates new main task
- "Add user authentication to the website project" → Creates subtask under "website" main task
- "Research React frameworks" → Creates new main task (no clear parent)

### Completing Tasks
- "Done with user authentication" → Marks corresponding subtask as complete
- "Finished the website!" → Marks main task and all subtasks as complete
- "Complete task #3" → Allows explicit reference

### Archiving
- "Archive the website project" → Moves completed main task to achievements.md (with user confirmation)

## Design Decisions

- **Single roadmap file**: All tasks managed in one central `roadmap.md` for simplicity
- **LLM-assisted semantic analysis**: Leverages AI capabilities for intelligent parsing rather than complex rule-based systems
- **User confirmation for archiving**: Ensures user control over irreversible actions
- **Natural language first**: Prioritizes intuitive user experience over technical constraints