# OpenCode Project: Roadmap

## Overview

Personal task management system using LLM-assisted semantic analysis to manage `roadmap.md` with natural language commands. Part of the OpenCode AI coding toolkit.

## Tech Stack

- **Runtime**: Node.js
- **Language**: TypeScript/JavaScript
- **Dependencies**: Zod (validation)
- **Framework**: OpenCode Skills Framework

## Project Structure

```
RoadMap/
├── .opencode/
│   ├── skills/
│   │   └── roadmap/          # Roadmap skill implementation
│   │       └── SKILL.md       # Roadmap skill definition
│   ├── node_modules/
│   └── ...
├── openspec/                  # OpenSpec documentation
├── roadmap.md                 # Main task roadmap
└── roadmap.md.bak             # Backup
```

## Capabilities

### Roadmap Skill
- Natural language task creation and management
- Hierarchical task structures with subtasks
- Semantic intent recognition
- Automatic completion tracking
- Archive to achievements.md

## Conventions

### Task Format
```
# Task Title [created: YYYY-MM-DD HH:MM]
> Short description

## Subtasks
* [ ] Subtask 1
* [ ] Subtask 2
```

### Skill Structure
Each skill contains:
- `SKILL.md` - Skill definition and usage
- Implementation code (if applicable)

## Dependencies

See `package.json` (if exists) for current dependencies.

## Status

Active development of task management skills.
