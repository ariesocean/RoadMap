# Skill: navigate

# Personal Task Management System

## Overview

Intelligent task management system that uses semantic analysis to manage `roadmap.md` and `achievements.md` files with natural language input.

## Core Components
- File Manager: Handles reading/writing markdown files
- Semantic Intent Analyzer: Determines action type and task hierarchy
- Task State Manager: Maintains current task structure
- Markdown Formatter: Converts tasks to proper markdown format

## Usage
Natural language prompts for task management:
- "Build a new website" → creates main task
- "Add login to website project" → creates subtask
- "Done with login feature" → marks as complete
- "Archive website project" → moves to achievements (with confirmation)
