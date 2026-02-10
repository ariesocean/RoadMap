"""
Comprehensive test suite for Navigate Skill.
Tests all major functionality including intent analysis, task management, and formatting.
"""

import pytest
import os
import tempfile
from datetime import datetime
from skills.navigate.semantic_analyzer import SemanticIntentAnalyzer
from skills.navigate.task_state_manager import TaskStateManager
from skills.navigate.markdown_formatter import MarkdownFormatter
from skills.navigate.file_manager import FileManager
from skills.navigate.main import NavigateSkill


class TestSemanticIntentAnalyzer:
    """Tests for SemanticIntentAnalyzer class."""

    def setup_method(self):
        """Set up test fixtures."""
        self.analyzer = SemanticIntentAnalyzer()

    def test_create_main_task_intent(self):
        """Test detection of main task creation intent."""
        result = self.analyzer.analyze_intent("Build a new website")

        assert result["action"] == "create_main_task"
        assert result["confidence"] == 0.85
        assert result["content"] == "Build a new website"

    def test_create_subtask_intent_with_existing_tasks(self):
        """Test detection of subtask creation intent."""
        existing_tasks = [
            {
                "id": "task_0",
                "title": "Build a new website",
                "subtasks": []
            }
        ]
        result = self.analyzer.analyze_intent("Add user login to the website", existing_tasks)

        assert result["action"] == "create_subtask"
        assert result["target_task_id"] == "task_0"
        assert result["confidence"] == 0.80

    def test_mark_complete_intent(self):
        """Test detection of task completion intent."""
        existing_tasks = [
            {
                "id": "task_0",
                "title": "User login",
                "subtasks": []
            }
        ]
        result = self.analyzer.analyze_intent("Done with user login", existing_tasks)

        assert result["action"] == "mark_complete"
        assert result["target_task_id"] == "task_0"
        assert result["confidence"] == 0.90

    def test_mark_complete_clarification(self):
        """Test clarification request when task not found."""
        result = self.analyzer.analyze_intent("Done", [])

        assert result["action"] == "clarify"
        assert result["confidence"] == 0.40
        assert "Which task" in result["content"]

    def test_archive_intent(self):
        """Test detection of archive intent."""
        existing_tasks = [
            {
                "id": "task_0",
                "title": "Old project",
                "status": "completed",
                "subtasks": []
            }
        ]
        result = self.analyzer.analyze_intent("Archive the old project", existing_tasks)

        assert result["action"] == "archive"
        assert result["target_task_id"] == "task_0"
        assert result["confidence"] == 0.85

    def test_archive_multiword_keywords(self):
        """Test archive detection with multi-word keywords."""
        existing_tasks = [
            {
                "id": "task_0",
                "title": "Project Alpha",
                "status": "completed",
                "subtasks": []
            }
        ]
        result = self.analyzer.analyze_intent("Move to achievements Project Alpha", existing_tasks)

        assert result["action"] == "archive"
        assert result["target_task_id"] == "task_0"

    def test_no_duplicate_keywords(self):
        """Test that keywords don't contain duplicates."""
        analyzer = SemanticIntentAnalyzer()

        # Check for duplicates in subtask_keywords
        assert len(analyzer.subtask_keywords) == len(set(analyzer.subtask_keywords))

        # Check for duplicates in completion_keywords
        assert len(analyzer.completion_keywords) == len(set(analyzer.completion_keywords))

    def test_custom_confidence_thresholds(self):
        """Test custom confidence thresholds."""
        custom_thresholds = {
            "create_main_task": 0.90,
            "create_subtask": 0.75,
            "mark_complete": 0.95,
            "archive": 0.80,
            "clarify": 0.50
        }
        analyzer = SemanticIntentAnalyzer(custom_thresholds)

        result = analyzer.analyze_intent("Build a new website")

        assert result["confidence"] == 0.90


class TestTaskStateManager:
    """Tests for TaskStateManager class."""

    def setup_method(self):
        """Set up test fixtures."""
        self.manager = TaskStateManager()

    def test_create_main_task(self):
        """Test creating a main task."""
        success = self.manager.create_main_task("Build a website")

        assert success is True
        assert len(self.manager.tasks) == 1
        assert self.manager.tasks[0]["title"] == "Build a website"
        assert self.manager.tasks[0]["status"] == "active"

    def test_create_main_task_empty_title(self):
        """Test that empty titles are rejected."""
        success = self.manager.create_main_task("")

        assert success is False
        assert len(self.manager.tasks) == 0

    def test_create_subtask(self):
        """Test creating a subtask."""
        self.manager.create_main_task("Build a website")
        success = self.manager.create_subtask("task_0", "Add user login")

        assert success is True
        assert len(self.manager.tasks[0]["subtasks"]) == 1
        assert self.manager.tasks[0]["subtasks"][0]["title"] == "Add user login"
        assert self.manager.tasks[0]["subtasks"][0]["completed"] is False

    def test_mark_subtask_complete(self):
        """Test marking a subtask as complete."""
        self.manager.create_main_task("Build a website")
        self.manager.create_subtask("task_0", "Add user login")
        success, status = self.manager.mark_task_complete("subtask_0")

        assert success is True
        assert self.manager.tasks[0]["subtasks"][0]["completed"] is True

    def test_mark_main_task_complete_updates_status(self):
        """Test that marking main task complete updates status."""
        self.manager.create_main_task("Build a website")
        success, status = self.manager.mark_task_complete("task_0")

        assert success is True
        assert status == "completed"
        assert self.manager.tasks[0]["status"] == "completed"

    def test_mark_task_complete_invalid_id(self):
        """Test that invalid task IDs are rejected."""
        success, status = self.manager.mark_task_complete("invalid_id")

        assert success is False
        assert status is None

    def test_archive_completed_task(self):
        """Test archiving a completed task."""
        self.manager.create_main_task("Old project")
        self.manager.mark_task_complete("task_0")
        success, archived = self.manager.archive_task("task_0")

        assert success is True
        assert archived is not None
        assert len(self.manager.tasks) == 0
        assert len(self.manager.archived_tasks) == 1
        assert self.manager.archived_tasks[0]["status"] == "archived"

    def test_archive_incomplete_task_fails(self):
        """Test that incomplete tasks cannot be archived."""
        self.manager.create_main_task("Old project")
        success, archived = self.manager.archive_task("task_0")

        assert success is False
        assert archived is None

    def test_get_completion_percentage(self):
        """Test completion percentage calculation."""
        self.manager.create_main_task("Build a website")
        self.manager.create_subtask("task_0", "Task 1")
        self.manager.create_subtask("task_0", "Task 2")
        self.manager.mark_task_complete("subtask_0")

        percentage = self.manager.get_completion_percentage("task_0")

        assert percentage == 50

    def test_get_completion_percentage_no_subtasks(self):
        """Test completion percentage for task without subtasks."""
        self.manager.create_main_task("Build a website")

        percentage = self.manager.get_completion_percentage("task_0")

        assert percentage == 0


class TestMarkdownFormatter:
    """Tests for MarkdownFormatter class."""

    def setup_method(self):
        """Set up test fixtures."""
        self.formatter = MarkdownFormatter()

    def test_format_tasks_empty(self):
        """Test formatting empty task list."""
        result = self.formatter.format_tasks([])

        assert result == ""

    def test_format_tasks_single_task(self):
        """Test formatting a single task."""
        tasks = [
            {
                "id": "task_0",
                "title": "Build a website",
                "description": "Create a new website",
                "created_at": "2026-02-10 14:30",
                "updated_at": "2026-02-10 14:30",
                "status": "active",
                "subtasks": []
            }
        ]
        result = self.formatter.format_tasks(tasks)

        assert "# Build a website [created: 2026-02-10 14:30]" in result
        assert "> Create a new website" in result
        assert "**Last Updated:** 2026-02-10 14:30" in result

    def test_format_tasks_with_subtasks(self):
        """Test formatting task with subtasks."""
        tasks = [
            {
                "id": "task_0",
                "title": "Build a website",
                "created_at": "2026-02-10 14:30",
                "updated_at": "2026-02-10 14:30",
                "status": "active",
                "subtasks": [
                    {
                        "id": "subtask_0",
                        "title": "Add login",
                        "created_at": "2026-02-10 14:31",
                        "completed": True
                    },
                    {
                        "id": "subtask_1",
                        "title": "Add payments",
                        "created_at": "2026-02-10 14:32",
                        "completed": False
                    }
                ]
            }
        ]
        result = self.formatter.format_tasks(tasks)

        assert "## Subtasks" in result
        assert "* [x] Add login" in result
        assert "* [ ] Add payments" in result

    def test_format_achievement(self):
        """Test formatting archived task as achievement."""
        task = {
            "id": "task_0",
            "title": "Old project",
            "description": "A completed project",
            "created_at": "2026-02-10 14:30",
            "archived_at": "2026-02-11 10:00",
            "status": "archived",
            "subtasks": [
                {
                    "id": "subtask_0",
                    "title": "Subtask 1",
                    "created_at": "2026-02-10 14:31",
                    "completed": True
                }
            ]
        }
        result = self.formatter.format_achievement(task)

        assert "# Old project [created: 2026-02-10 14:30] [archived: 2026-02-11 10:00]" in result
        assert "## Completed Subtasks" in result
        assert "**Archived Date:** 2026-02-11 10:00" in result

    def test_parse_markdown_to_tasks(self):
        """Test parsing markdown back to tasks."""
        markdown = """# Build a website [created: 2026-02-10 14:30]

> Create a new website

## Subtasks
* [x] Add login [created: 2026-02-10 14:31]
* [ ] Add payments [created: 2026-02-10 14:32]

---
**Last Updated:** 2026-02-10 14:32
"""
        tasks = self.formatter.parse_markdown_to_tasks(markdown)

        assert len(tasks) == 1
        assert tasks[0]["title"] == "Build a website"
        assert len(tasks[0]["subtasks"]) == 2
        assert tasks[0]["subtasks"][0]["completed"] is True
        assert tasks[0]["subtasks"][1]["completed"] is False

    def test_parse_empty_markdown(self):
        """Test parsing empty markdown returns empty list."""
        tasks = self.formatter.parse_markdown_to_tasks("")

        assert tasks == []


class TestFileManager:
    """Tests for FileManager class."""

    def setup_method(self):
        """Set up test fixtures with temporary directory."""
        self.temp_dir = tempfile.mkdtemp()
        self.roadmap_path = os.path.join(self.temp_dir, "roadmap.md")
        self.achievements_path = os.path.join(self.temp_dir, "achievements.md")
        self.manager = FileManager(self.roadmap_path, self.achievements_path)

    def teardown_method(self):
        """Clean up temporary files."""
        import shutil
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def test_write_and_read_roadmap(self):
        """Test writing and reading roadmap file."""
        content = "# Test Task [created: 2026-02-10 14:30]"
        success = self.manager.write_roadmap(content)

        assert success is True
        read_content = self.manager.read_roadmap()
        assert content in read_content

    def test_write_roadmap_creates_backup(self):
        """Test that writing roadmap creates backup."""
        original_content = "# Original [created: 2026-02-10 14:30]"
        new_content = "# Updated [created: 2026-02-10 14:31]"

        self.manager.write_roadmap(original_content)
        self.manager.write_roadmap(new_content)

        backup_path = self.roadmap_path + ".bak"
        assert os.path.exists(backup_path)

        with open(backup_path, 'r') as f:
            backup_content = f.read()
        assert "# Original" in backup_content

    def test_write_achievements(self):
        """Test writing to achievements file."""
        content = "# Archived Task [created: 2026-02-10 14:30] [archived: 2026-02-11 10:00]"
        success = self.manager.write_achievements(content)

        assert success is True
        read_content = self.manager.read_achievements()
        assert content in read_content


class TestNavigateSkill:
    """Integration tests for NavigateSkill class."""

    def setup_method(self):
        """Set up test fixtures with temporary directory."""
        self.temp_dir = tempfile.mkdtemp()
        self.roadmap_path = os.path.join(self.temp_dir, "roadmap.md")
        self.achievements_path = os.path.join(self.temp_dir, "achievements.md")
        self.skill = NavigateSkill(self.roadmap_path, self.achievements_path)

    def teardown_method(self):
        """Clean up temporary files."""
        import shutil
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def test_create_main_task(self):
        """Test creating a main task through the skill."""
        response = self.skill.process_prompt("Build a new website")

        assert "Created main task" in response
        assert "Build a new website" in response

    def test_create_subtask(self):
        """Test creating a subtask through the skill."""
        self.skill.process_prompt("Build a new website")
        response = self.skill.process_prompt("Add user login to the website")

        assert "Added subtask" in response

    def test_mark_task_complete(self):
        """Test marking a task complete through the skill."""
        self.skill.process_prompt("Build a new website")
        response = self.skill.process_prompt("Done with Build a new website")

        assert "Marked task as complete" in response

    def test_archive_task(self):
        """Test archiving a completed task through the skill."""
        self.skill.process_prompt("Build a new website")
        self.skill.process_prompt("Done with Build a new website")
        response = self.skill.process_prompt("Archive Build a new website")

        assert "Archived task" in response

        # Verify it was written to achievements
        achievements_content = self.skill.file_manager.read_achievements()
        assert "Build a new website" in achievements_content

    def test_empty_prompt_rejected(self):
        """Test that empty prompts are rejected."""
        response = self.skill.process_prompt("")

        assert "Please provide a task description" in response

    def test_too_long_prompt_rejected(self):
        """Test that too long prompts are rejected."""
        long_prompt = "a" * 1001
        response = self.skill.process_prompt(long_prompt)

        assert "too long" in response

    def test_clarification_for_ambiguous_complete(self):
        """Test clarification request for ambiguous completion."""
        # Add a task first
        self.skill.process_prompt("Build a website")
        # Now try to complete without specifying which task
        response = self.skill.process_prompt("Done")

        assert "Which task" in response


class TestEdgeCases:
    """Tests for edge cases and error handling."""

    def setup_method(self):
        """Set up test fixtures."""
        self.temp_dir = tempfile.mkdtemp()
        self.roadmap_path = os.path.join(self.temp_dir, "roadmap.md")
        self.achievements_path = os.path.join(self.temp_dir, "achievements.md")
        self.skill = NavigateSkill(self.roadmap_path, self.achievements_path)

    def teardown_method(self):
        """Clean up temporary files."""
        import shutil
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def test_task_id_not_found(self):
        """Test handling of non-existent task ID."""
        self.skill.process_prompt("Build a website")
        response = self.skill.process_prompt("Done with nonexistent task")

        # Should trigger clarification since task not found
        assert "Which task" in response or "Could not find" in response

    def test_subtask_creation_without_parent(self):
        """Test subtask creation when parent task not found."""
        # Try to create subtask without existing parent
        result = self.skill.semantic_analyzer.analyze_intent(
            "Add user login",
            []  # No existing tasks
        )

        # Should create as main task instead
        assert result["action"] == "create_main_task"

    def test_archive_incomplete_task(self):
        """Test that incomplete tasks cannot be archived."""
        self.skill.process_prompt("Build a website")
        response = self.skill.process_prompt("Archive Build a website")

        # Should fail because task is not complete
        assert "completed" in response.lower() or "Could not find" in response


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
