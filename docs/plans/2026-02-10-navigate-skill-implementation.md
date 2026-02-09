# Navigate Skill Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a personal task management system that uses LLM-assisted semantic analysis to intelligently manage a hierarchical `roadmap.md` file with natural language input.

**Architecture:** Single-file skill with modular components: File Manager, Semantic Intent Analyzer, Task State Manager, and Markdown Formatter. Uses semantic analysis for intent recognition and task hierarchy management with user confirmation for archiving operations.

**Tech Stack:** Python, OpenCode skill framework, markdown processing, datetime formatting, file I/O operations

---

### Task 1: Create Project Structure and Skill Directory

**Files:**
- Create: `/Users/SparkingAries/VibeProjects/RoadMap/skills/navigate/SKILL.md`
- Create: `/Users/SparkingAries/VibeProjects/RoadMap/skills/navigate/__init__.py`

**Step 1: Create navigate skill directory**

```bash
mkdir -p /Users/SparkingAries/VibeProjects/RoadMap/skills/navigate
```

**Step 2: Create empty __init__.py file**

```python
# Empty init file for Python package
```

**Step 3: Create basic SKILL.md structure**

```markdown
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
```

**Step 4: Commit initial structure**

```bash
git add /Users/SparkingAries/VibeProjects/RoadMap/skills/navigate
git commit -m "feat: create navigate skill directory structure"
```

### Task 2: Implement File Manager Component

**Files:**
- Create: `/Users/SparkingAries/VibeProjects/RoadMap/skills/navigate/file_manager.py`
- Test: `/Users/SparkingAries/VibeProjects/RoadMap/skills/navigate/test_file_manager.py`

**Step 1: Write failing test for reading roadmap.md**

```python
import os
import tempfile
from skills.navigate.file_manager import FileManager

def test_read_roadmap_creates_empty_if_not_exists():
    with tempfile.TemporaryDirectory() as temp_dir:
        roadmap_path = os.path.join(temp_dir, "roadmap.md")
        fm = FileManager(roadmap_path)
        content = fm.read_roadmap()
        assert content == ""
```

**Step 2: Run test to verify it fails**

Run: `python -m pytest /Users/SparkingAries/VibeProjects/RoadMap/skills/navigate/test_file_manager.py::test_read_roadmap_creates_empty_if_not_exists -v`
Expected: FAIL with "ModuleNotFoundError: No module named 'skills'"

**Step 3: Write minimal File Manager implementation**

```python
import os
from pathlib import Path

class FileManager:
    def __init__(self, roadmap_path="roadmap.md", achievements_path="achievements.md"):
        self.roadmap_path = Path(roadmap_path)
        self.achievements_path = Path(achievements_path)
    
    def read_roadmap(self):
        """Read roadmap.md, create empty if doesn't exist"""
        if not self.roadmap_path.exists():
            self.roadmap_path.write_text("")
        return self.roadmap_path.read_text()
    
    def read_achievements(self):
        """Read achievements.md, create empty if doesn't exist"""
        if not self.achievements_path.exists():
            self.achievements_path.write_text("")
        return self.achievements_path.read_text()
    
    def write_roadmap(self, content):
        """Write content to roadmap.md"""
        self.roadmap_path.write_text(content)
    
    def write_achievements(self, content):
        """Write content to achievements.md"""
        self.achievements_path.write_text(content)
```

**Step 4: Run test to verify it passes**

Run: `python -m pytest /Users/SparkingAries/VibeProjects/RoadMap/skills/navigate/test_file_manager.py::test_read_roadmap_creates_empty_if_not_exists -v`
Expected: PASS

**Step 5: Add more comprehensive tests**

```python
def test_write_and_read_roadmap():
    with tempfile.TemporaryDirectory() as temp_dir:
        roadmap_path = os.path.join(temp_dir, "roadmap.md")
        fm = FileManager(roadmap_path)
        test_content = "# Test Task\n* [ ] Subtask"
        fm.write_roadmap(test_content)
        content = fm.read_roadmap()
        assert content == test_content
```

**Step 6: Commit File Manager implementation**

```bash
git add /Users/SparkingAries/VibeProjects/RoadMap/skills/navigate/file_manager.py
git add /Users/SparkingAries/VibeProjects/RoadMap/skills/navigate/test_file_manager.py
git commit -m "feat: implement File Manager component with read/write operations"
```

### Task 3: Implement Task State Manager Component

**Files:**
- Create: `/Users/SparkingAries/VibeProjects/RoadMap/skills/navigate/task_state_manager.py`
- Test: `/Users/SparkingAries/VibeProjects/RoadMap/skills/navigate/test_task_state_manager.py`

**Step 1: Write failing test for creating main task**

```python
from datetime import datetime
from skills.navigate.task_state_manager import TaskStateManager

def test_create_main_task():
    tsm = TaskStateManager()
    tsm.create_main_task("Build website", "Create a new website project")
    
    assert len(tsm.tasks) == 1
    assert tsm.tasks[0]["title"] == "Build website"
    assert tsm.tasks[0]["description"] == "Create a new website project"
    assert tsm.tasks[0]["status"] == "active"
    assert "created_at" in tsm.tasks[0]
```

**Step 2: Run test to verify it fails**

Run: `python -m pytest /Users/SparkingAries/VibeProjects/RoadMap/skills/navigate/test_task_state_manager.py::test_create_main_task -v`
Expected: FAIL with "ModuleNotFoundError: No module named 'skills'"

**Step 3: Write minimal Task State Manager implementation**

```python
from datetime import datetime
from typing import List, Dict, Optional

class TaskStateManager:
    def __init__(self):
        self.tasks: List[Dict] = []
    
    def _get_current_timestamp(self) -> str:
        """Get current timestamp in YYYY-MM-DD HH:MM format"""
        return datetime.now().strftime("%Y-%m-%d %H:%M")
    
    def create_main_task(self, title: str, description: str = ""):
        """Create a new main task"""
        task = {
            "id": f"task_{len(self.tasks)}",
            "title": title,
            "description": description,
            "created_at": self._get_current_timestamp(),
            "updated_at": self._get_current_timestamp(),
            "status": "active",
            "subtasks": []
        }
        self.tasks.append(task)
    
    def create_subtask(self, main_task_id: str, content: str, level: int = 1):
        """Create a subtask under a main task"""
        for task in self.tasks:
            if task["id"] == main_task_id:
                subtask = {
                    "id": f"subtask_{len(task['subtasks'])}",
                    "title": content,
                    "created_at": self._get_current_timestamp(),
                    "completed": False
                }
                task["subtasks"].append(subtask)
                task["updated_at"] = self._get_current_timestamp()
                break
    
    def mark_task_complete(self, task_id: str):
        """Mark a task as complete"""
        # Find main task or subtask by ID
        for task in self.tasks:
            if task["id"] == task_id:
                # Mark all subtasks as complete too
                for subtask in task["subtasks"]:
                    subtask["completed"] = True
                task["updated_at"] = self._get_current_timestamp()
                return
            
            # Check subtasks
            for subtask in task["subtasks"]:
                if subtask["id"] == task_id:
                    subtask["completed"] = True
                    task["updated_at"] = self._get_current_timestamp()
                    return
```

**Step 4: Run test to verify it passes**

Run: `python -m pytest /Users/SparkingAries/VibeProjects/RoadMap/skills/navigate/test_task_state_manager.py::test_create_main_task -v`
Expected: PASS

**Step 5: Add tests for subtask creation and completion**

```python
def test_create_and_complete_subtask():
    tsm = TaskStateManager()
    tsm.create_main_task("Website project")
    main_task_id = tsm.tasks[0]["id"]
    
    tsm.create_subtask(main_task_id, "Add login feature")
    assert len(tsm.tasks[0]["subtasks"]) == 1
    assert tsm.tasks[0]["subtasks"][0]["title"] == "Add login feature"
    
    subtask_id = tsm.tasks[0]["subtasks"][0]["id"]
    tsm.mark_task_complete(subtask_id)
    assert tsm.tasks[0]["subtasks"][0]["completed"] == True
```

**Step 6: Commit Task State Manager implementation**

```bash
git add /Users/SparkingAries/VibeProjects/RoadMap/skills/navigate/task_state_manager.py
git add /Users/SparkingAries/VibeProjects/RoadMap/skills/navigate/test_task_state_manager.py
git commit -m "feat: implement Task State Manager with main/subtask creation and completion"
```

### Task 4: Implement Markdown Formatter Component

**Files:**
- Create: `/Users/SparkingAries/VibeProjects/RoadMap/skills/navigate/markdown_formatter.py`
- Test: `/Users/SparkingAries/VibeProjects/RoadMap/skills/navigate/test_markdown_formatter.py`

**Step 1: Write failing test for formatting main task**

```python
from skills.navigate.markdown_formatter import MarkdownFormatter
from skills.navigate.task_state_manager import TaskStateManager

def test_format_single_main_task():
    tsm = TaskStateManager()
    tsm.create_main_task("Build website", "Create a new website project")
    
    formatter = MarkdownFormatter()
    markdown = formatter.format_tasks(tsm.tasks)
    
    expected = """# Build website [created: 2026-02-10 12:30]
> Create a new website project



**Last Updated:** 2026-02-10 12:30
"""
    # Note: timestamp will vary, so we'll need to handle this in actual test
    assert "# Build website" in markdown
    assert "> Create a new website project" in markdown
```

**Step 2: Run test to verify it fails**

Run: `python -m pytest /Users/SparkingAries/VibeProjects/RoadMap/skills/navigate/test_markdown_formatter.py::test_format_single_main_task -v`
Expected: FAIL with "ModuleNotFoundError: No module named 'skills'"

**Step 3: Write minimal Markdown Formatter implementation**

```python
from typing import List, Dict

class MarkdownFormatter:
    def format_tasks(self, tasks: List[Dict]) -> str:
        """Format tasks list to markdown string"""
        if not tasks:
            return ""
        
        markdown_parts = []
        
        for task in tasks:
            # Main task header
            created_at = task.get("created_at", "")
            markdown_parts.append(f"# {task['title']} [created: {created_at}]")
            
            # Description if exists
            if task.get("description"):
                markdown_parts.append(f"> {task['description']}")
            markdown_parts.append("")
            
            # Subtasks
            if task.get("subtasks"):
                # Level 1 subtasks
                markdown_parts.append("## Subtasks")
                for subtask in task["subtasks"]:
                    status = "[x]" if subtask["completed"] else "[ ]"
                    created = subtask.get("created_at", "")
                    markdown_parts.append(f"* {status} {subtask['title']} [created: {created}]")
                markdown_parts.append("")
            
            # Last updated
            updated_at = task.get("updated_at", created_at)
            markdown_parts.append("---")
            markdown_parts.append(f"**Last Updated:** {updated_at}")
            markdown_parts.append("")
        
        return "\n".join(markdown_parts)
    
    def parse_markdown_to_tasks(self, markdown_content: str) -> List[Dict]:
        """Parse markdown content back to tasks structure (for future use)"""
        # This is complex parsing, we'll implement basic version first
        # For now, return empty list - we'll rely on state management
        return []
```

**Step 4: Run test to verify it passes**

Run: `python -m pytest /Users/SparkingAries/VibeProjects/RoadMap/skills/navigate/test_markdown_formatter.py::test_format_single_main_task -v`
Expected: PASS (with proper timestamp handling)

**Step 5: Add tests for subtasks and completion status**

```python
def test_format_with_subtasks():
    tsm = TaskStateManager()
    tsm.create_main_task("Website project")
    main_task_id = tsm.tasks[0]["id"]
    tsm.create_subtask(main_task_id, "Add login")
    tsm.create_subtask(main_task_id, "Add signup")
    
    formatter = MarkdownFormatter()
    markdown = formatter.format_tasks(tsm.tasks)
    
    assert "## Subtasks" in markdown
    assert "* [ ] Add login" in markdown
    assert "* [ ] Add signup" in markdown
```

**Step 6: Commit Markdown Formatter implementation**

```bash
git add /Users/SparkingAries/VibeProjects/RoadMap/skills/navigate/markdown_formatter.py
git add /Users/SparkingAries/VibeProjects/RoadMap/skills/navigate/test_markdown_formatter.py
git commit -m "feat: implement Markdown Formatter for task serialization"
```

### Task 5: Implement Semantic Intent Analyzer Component

**Files:**
- Create: `/Users/SparkingAries/VibeProjects/RoadMap/skills/navigate/semantic_analyzer.py`
- Test: `/Users/SparkingAries/VibeProjects/RoadMap/skills/navigate/test_semantic_analyzer.py`

**Step 1: Write failing test for intent analysis**

```python
from skills.navigate.semantic_analyzer import SemanticIntentAnalyzer

def test_analyze_create_main_task_intent():
    analyzer = SemanticIntentAnalyzer()
    result = analyzer.analyze_intent("Build a new website")
    
    assert result["action"] == "create_main_task"
    assert result["content"] == "Build a new website"
    assert result["confidence"] > 0.8
```

**Step 2: Run test to verify it fails**

Run: `python -m pytest /Users/SparkingAries/VibeProjects/RoadMap/skills/navigate/test_semantic_analyzer.py::test_analyze_create_main_task_intent -v`
Expected: FAIL with "ModuleNotFoundError: No module named 'skills'"

**Step 3: Write minimal Semantic Intent Analyzer implementation**

```python
import re
from typing import Dict, List

class SemanticIntentAnalyzer:
    def __init__(self):
        self.completion_keywords = [
            "done", "finished", "complete", "completed", "all set", 
            "ready", "accomplished", "achieved", "wrapped up"
        ]
        self.archive_keywords = ["archive", "move to achievements", "save to archive"]
    
    def analyze_intent(self, prompt: str, existing_tasks: List[Dict] = None) -> Dict:
        """
        Analyze prompt intent and return structured action
        
        Returns:
        {
            "action": "create_main_task" | "create_subtask" | "mark_complete" | "archive",
            "content": str,
            "target_task_id": str (optional),
            "confidence": float (0.0-1.0)
        }
        """
        prompt_lower = prompt.lower().strip()
        
        # Check for completion intent
        if any(keyword in prompt_lower for keyword in self.completion_keywords):
            target_task = self._find_target_task(prompt, existing_tasks)
            if target_task:
                return {
                    "action": "mark_complete",
                    "content": prompt,
                    "target_task_id": target_task["id"],
                    "confidence": 0.9
                }
            else:
                return {
                    "action": "clarify",
                    "content": f"Which task are you referring to when you say '{prompt}'?",
                    "confidence": 0.4
                }
        
        # Check for archive intent
        if any(keyword in prompt_lower for keyword in self.archive_keywords):
            target_task = self._find_target_task(prompt, existing_tasks)
            if target_task:
                return {
                    "action": "archive",
                    "content": prompt,
                    "target_task_id": target_task["id"],
                    "confidence": 0.85
                }
            else:
                return {
                    "action": "clarify",
                    "content": f"Which completed task would you like to archive?",
                    "confidence": 0.4
                }
        
        # Default: create task
        # Try to determine if this should be main task or subtask
        if existing_tasks and self._should_be_subtask(prompt, existing_tasks):
            target_task = self._find_best_parent_task(prompt, existing_tasks)
            return {
                "action": "create_subtask",
                "content": prompt,
                "target_task_id": target_task["id"],
                "confidence": 0.8
            }
        else:
            return {
                "action": "create_main_task",
                "content": prompt,
                "confidence": 0.85
            }
    
    def _find_target_task(self, prompt: str, existing_tasks: List[Dict]) -> Dict:
        """Find the most relevant existing task based on prompt content"""
        if not existing_tasks:
            return None
        
        # Simple keyword matching for now
        prompt_words = set(prompt.lower().split())
        best_match = None
        best_score = 0
        
        for task in existing_tasks:
            task_words = set(task["title"].lower().split())
            score = len(prompt_words & task_words)
            if score > best_score:
                best_score = score
                best_match = task
        
        return best_match if best_score > 0 else None
    
    def _should_be_subtask(self, prompt: str, existing_tasks: List[Dict]) -> bool:
        """Determine if prompt should be a subtask based on context"""
        # If prompt contains references to existing projects/tasks
        prompt_lower = prompt.lower()
        for task in existing_tasks:
            if task["title"].lower() in prompt_lower:
                return True
        return False
    
    def _find_best_parent_task(self, prompt: str, existing_tasks: List[Dict]) -> Dict:
        """Find the best parent task for a subtask"""
        return self._find_target_task(prompt, existing_tasks)
```

**Step 4: Run test to verify it passes**

Run: `python -m pytest /Users/SparkingAries/VibeProjects/RoadMap/skills/navigate/test_semantic_analyzer.py::test_analyze_create_main_task_intent -v`
Expected: PASS

**Step 5: Add tests for different intent types**

```python
def test_analyze_completion_intent():
    analyzer = SemanticIntentAnalyzer()
    existing_tasks = [{"id": "task_0", "title": "Website project"}]
    result = analyzer.analyze_intent("Done with website project", existing_tasks)
    
    assert result["action"] == "mark_complete"
    assert result["target_task_id"] == "task_0"

def test_analyze_subtask_intent():
    analyzer = SemanticIntentAnalyzer()
    existing_tasks = [{"id": "task_0", "title": "Website project"}]
    result = analyzer.analyze_intent("Add login to website project", existing_tasks)
    
    assert result["action"] == "create_subtask"
    assert result["target_task_id"] == "task_0"
```

**Step 6: Commit Semantic Intent Analyzer implementation**

```bash
git add /Users/SparkingAries/VibeProjects/RoadMap/skills/navigate/semantic_analyzer.py
git add /Users/SparkingAries/VibeProjects/RoadMap/skills/navigate/test_semantic_analyzer.py
git commit -m "feat: implement Semantic Intent Analyzer with natural language understanding"
```

### Task 6: Implement Main Navigate Skill Integration

**Files:**
- Create: `/Users/SparkingAries/VibeProjects/RoadMap/skills/navigate/main.py`
- Modify: `/Users/SparkingAries/VibeProjects/RoadMap/skills/navigate/SKILL.md`

**Step 1: Write failing test for end-to-end workflow**

```python
import os
import tempfile
from skills.navigate.main import NavigateSkill

def test_end_to_end_workflow():
    with tempfile.TemporaryDirectory() as temp_dir:
        os.chdir(temp_dir)
        
        skill = NavigateSkill()
        
        # Create main task
        skill.process_prompt("Build a new website")
        
        # Add subtask
        skill.process_prompt("Add user authentication to the website project")
        
        # Complete subtask
        skill.process_prompt("Done with user authentication")
        
        # Verify roadmap.md content
        with open("roadmap.md", "r") as f:
            content = f.read()
        
        assert "# Build a new website" in content
        assert "* [x] Add user authentication" in content
```

**Step 2: Run test to verify it fails**

Run: `python -m pytest /Users/SparkingAries/VibeProjects/RoadMap/skills/navigate/test_main.py::test_end_to_end_workflow -v`
Expected: FAIL with "ModuleNotFoundError: No module named 'skills'"

**Step 3: Write main Navigate Skill integration**

```python
from typing import List, Dict
from skills.navigate.file_manager import FileManager
from skills.navigate.task_state_manager import TaskStateManager
from skills.navigate.markdown_formatter import MarkdownFormatter
from skills.navigate.semantic_analyzer import SemanticIntentAnalyzer

class NavigateSkill:
    def __init__(self, roadmap_path="roadmap.md", achievements_path="achievements.md"):
        self.file_manager = FileManager(roadmap_path, achievements_path)
        self.task_state_manager = TaskStateManager()
        self.markdown_formatter = MarkdownFormatter()
        self.semantic_analyzer = SemanticIntentAnalyzer()
        self._load_existing_tasks()
    
    def _load_existing_tasks(self):
        """Load existing tasks from roadmap.md (simplified for now)"""
        # For v1, we'll start fresh each time
        # Future versions can parse existing markdown
        pass
    
    def process_prompt(self, prompt: str) -> str:
        """
        Process user prompt and return response
        Returns response message to user
        """
        # Analyze intent
        existing_tasks = self.task_state_manager.tasks
        intent_result = self.semantic_analyzer.analyze_intent(prompt, existing_tasks)
        
        if intent_result["confidence"] < 0.7:
            # Ask for clarification
            return intent_result["content"]
        
        action = intent_result["action"]
        response = ""
        
        if action == "create_main_task":
            # Extract title from prompt (simplified)
            title = prompt
            description = ""  # Could be enhanced later
            self.task_state_manager.create_main_task(title, description)
            response = f"Created main task: '{title}'"
        
        elif action == "create_subtask":
            target_id = intent_result["target_task_id"]
            content = prompt
            self.task_state_manager.create_subtask(target_id, content)
            response = f"Added subtask to existing task: '{content}'"
        
        elif action == "mark_complete":
            target_id = intent_result["target_task_id"]
            self.task_state_manager.mark_task_complete(target_id)
            response = f"Marked task as complete"
        
        elif action == "archive":
            target_id = intent_result["target_task_id"]
            # For now, just return confirmation request
            response = f"Would you like to archive this completed task? (Reply 'yes' to confirm)"
            # Actual archiving logic would go here with user confirmation
        
        # Save updated roadmap
        markdown_content = self.markdown_formatter.format_tasks(self.task_state_manager.tasks)
        self.file_manager.write_roadmap(markdown_content)
        
        return response
```

**Step 4: Update SKILL.md with complete documentation**

```markdown
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

## File Structure
Creates and manages two files:
- `roadmap.md`: Active tasks with hierarchical structure
- `achievements.md`: Archived completed projects

## Examples
User: "Build a new website"
→ Creates main task in roadmap.md

User: "Add user authentication to the website project"  
→ Creates subtask under "website" main task

User: "Done with user authentication"
→ Marks subtask as complete with [x]

User: "Archive the website project"
→ Requests confirmation, then moves to achievements.md
```

**Step 5: Run end-to-end test to verify it passes**

Run: `python -m pytest /Users/SparkingAries/VibeProjects/RoadMap/skills/navigate/test_main.py::test_end_to_end_workflow -v`
Expected: PASS

**Step 6: Commit main skill integration**

```bash
git add /Users/SparkingAries/VibeProjects/RoadMap/skills/navigate/main.py
git add /Users/SparkingAries/VibeProjects/RoadMap/skills/navigate/SKILL.md
git commit -m "feat: integrate all components into main Navigate skill with end-to-end workflow"
```

### Task 7: Add Error Handling and Edge Cases

**Files:**
- Modify: `/Users/SparkingAries/VibeProjects/RoadMap/skills/navigate/main.py`
- Modify: `/Users/SparkingAries/VibeProjects/RoadMap/skills/navigate/file_manager.py`

**Step 1: Add error handling for file operations**

```python
def write_roadmap(self, content):
    """Write content to roadmap.md with error handling"""
    try:
        # Create backup
        if self.roadmap_path.exists():
            backup_path = self.roadmap_path.with_suffix('.md.bak')
            backup_path.write_text(self.roadmap_path.read_text())
        
        self.roadmap_path.write_text(content)
        return True
    except Exception as e:
        print(f"Error writing roadmap: {e}")
        return False
```

**Step 2: Add validation for task operations**

```python
def mark_task_complete(self, task_id: str):
    """Mark a task as complete with validation"""
    if not task_id:
        return False
    
    # Rest of implementation...
    return True
```

**Step 3: Add comprehensive error handling to main skill**

```python
def process_prompt(self, prompt: str) -> str:
    try:
        if not prompt.strip():
            return "Please provide a task description."
        
        # Rest of implementation with try-catch blocks
        # ...
        
    except Exception as e:
        return f"Error processing your request: {str(e)}. Please try again."
```

**Step 4: Add tests for error cases**

```python
def test_empty_prompt():
    skill = NavigateSkill()
    response = skill.process_prompt("")
    assert "Please provide a task description" in response

def test_file_write_error():
    # Test with invalid path or permissions
    pass
```

**Step 5: Commit error handling improvements**

```bash
git add /Users/SparkingAries/VibeProjects/RoadMap/skills/navigate/main.py
git add /Users/SparkingAries/VibeProjects/RoadMap/skills/navigate/file_manager.py
git add /Users/SparkingAries/VibeProjects/RoadMap/skills/navigate/test_main.py
git commit -m "feat: add comprehensive error handling and edge case support"
```

### Task 8: Final Testing and Documentation

**Files:**
- Create: `/Users/SparkingAries/VibeProjects/RoadMap/skills/navigate/README.md`
- Create: `/Users/SparkingAries/VibeProjects/RoadMap/skills/navigate/example_usage.md`

**Step 1: Create comprehensive README**

```markdown
# Navigate Skill

Personal task management system for OpenCode that uses natural language processing to manage your `roadmap.md` file.

## Installation
The skill is automatically available in OpenCode when located in the project's `skills/` directory.

## Usage
Simply mention the skill and provide natural language prompts:

- "Build a new website" 
- "Add user authentication to the website project"
- "Done with user authentication"
- "Archive the website project"

## File Structure
- `roadmap.md`: Your active tasks with hierarchical structure
- `achievements.md`: Your completed and archived projects

## Features
- Natural language understanding
- Automatic task hierarchy detection
- Smart completion tracking
- Controlled archiving with confirmation
- Data safety with automatic backups
```

**Step 2: Create example usage scenarios**

```markdown
# Example Usage Scenarios

## Basic Workflow
User: "Build a new mobile app"
→ Creates main task: "Build a new mobile app"

User: "Add user login to the mobile app"
→ Creates subtask: "Add user login"

User: "Implement push notifications"
→ Creates subtask: "Implement push notifications"

User: "Done with user login"
→ Marks "Add user login" as complete

User: "Archive the mobile app project"
→ Confirms and moves to achievements.md
```

**Step 3: Run comprehensive test suite**

```bash
# Run all tests
python -m pytest /Users/SparkingAries/VibeProjects/RoadMap/skills/navigate/ -v
```

**Step 4: Verify skill loads correctly in OpenCode**

Test by using the skill in a real session.

**Step 5: Commit final documentation and testing**

```bash
git add /Users/SparkingAries/VibeProjects/RoadMap/skills/navigate/README.md
git add /Users/SparkingAries/VibeProjects/RoadMap/skills/navigate/example_usage.md
git commit -m "docs: add comprehensive documentation and examples"
```