import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', '..'))

from skills.navigate.markdown_formatter import MarkdownFormatter
from skills.navigate.task_state_manager import TaskStateManager

def test_format_single_main_task():
    tsm = TaskStateManager()
    tsm.create_main_task("Build website", "Create a new website project")
    
    formatter = MarkdownFormatter()
    markdown = formatter.format_tasks(tsm.tasks)
    
    assert "# Build website" in markdown
    assert "> Create a new website project" in markdown


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


def test_subtask_completion_status():
    tsm = TaskStateManager()
    tsm.create_main_task("Test project")
    main_task_id = tsm.tasks[0]["id"]
    tsm.create_subtask(main_task_id, "Task 1")
    tsm.create_subtask(main_task_id, "Task 2")
    
    subtask_id = tsm.tasks[0]["subtasks"][0]["id"]
    tsm.mark_task_complete(subtask_id)
    
    formatter = MarkdownFormatter()
    markdown = formatter.format_tasks(tsm.tasks)
    
    assert "* [x] Task 1" in markdown
    assert "* [ ] Task 2" in markdown


def test_empty_tasks():
    formatter = MarkdownFormatter()
    markdown = formatter.format_tasks([])
    
    assert markdown == ""
