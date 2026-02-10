---
name: navigate
description: Personal task management system using semantic analysis to manage roadmap.md with natural language input
license: MIT
compatibility: opencode
---

# Personal Task Management System

## Overview

Intelligent task management system that uses semantic analysis to manage `roadmap.md` and `achievements.md` files with natural language input.

## Core Components
- **File Manager**: Handles reading/writing markdown files
- **Semantic Intent Analyzer**: Determines action type and task hierarchy
- **Task State Manager**: Maintains current task structure
- **Markdown Formatter**: Converts tasks to proper markdown format

## Usage

Natural language prompts for task management:
- `"Build a new website"` → creates main task
- `"Add login to website project"` → creates subtask
- `"Done with login feature"` → marks as complete
- `"Archive website project"` → moves to achievements (with confirmation)

## Examples

**Creating tasks:**
- `"Build a new website"` → Creates main task: "Build a new website"
- `"Add user login to the website project"` → Creates subtask: "Add user login"

**Completing tasks:**
- `"Done with user login"` → Marks "Add user login" as complete

**Archiving:**
- `"Archive the website project"` → Confirms and moves to achievements.md

## File Structure

Creates and manages two files:
- `roadmap.md`: Active tasks with hierarchical structure
- `achievements.md`: Archived completed projects
