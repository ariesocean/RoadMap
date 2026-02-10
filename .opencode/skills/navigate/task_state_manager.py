from datetime import datetime, timezone
from typing import List, Dict, Optional, Tuple
import os


class TaskStateManager:
    """Manages task state including creation, completion, and archiving."""

    def __init__(self):
        self.tasks: List[Dict] = []
        self.archived_tasks: List[Dict] = []

    def _get_current_timestamp(self) -> str:
        """Get current local timestamp in YYYY-MM-DD HH:MM format."""
        local_time = datetime.now()
        return local_time.strftime("%Y-%m-%d %H:%M")

    def get_local_datetime(self) -> datetime:
        """Get current local datetime object."""
        return datetime.now()

    def get_local_timezone_info(self) -> str:
        """Get local timezone information."""
        local_tz = datetime.now().astimezone().tzinfo
        return str(local_tz)

    def create_main_task(self, title: str, description: str = "") -> bool:
        """Create a new main task with validation."""
        if not title or not title.strip():
            return False

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
        return True

    def create_subtask(self, main_task_id: str, content: str, level: int = 1) -> bool:
        """Create a subtask under a main task with validation."""
        if not main_task_id or not content:
            return False

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
                return True

        return False

    def mark_task_complete(self, task_id: str) -> Tuple[bool, Optional[str]]:
        """
        Mark a task as complete with validation.
        Returns tuple of (success, status_message).
        """
        if not task_id:
            return False, None

        for task in self.tasks:
            if task["id"] == task_id:
                # Mark all subtasks as complete
                for subtask in task["subtasks"]:
                    subtask["completed"] = True
                task["status"] = "completed"
                task["updated_at"] = self._get_current_timestamp()
                return True, "completed"

            for subtask in task["subtasks"]:
                if subtask["id"] == task_id:
                    subtask["completed"] = True
                    task["updated_at"] = self._get_current_timestamp()
                    # Check if all subtasks are now complete
                    all_complete = all(s["completed"] for s in task["subtasks"])
                    if all_complete:
                        task["status"] = "completed"
                        return True, "completed"
                    # Calculate completion percentage
                    completed_count = sum(1 for s in task["subtasks"] if s["completed"])
                    total_count = len(task["subtasks"])
                    percentage = int((completed_count / total_count) * 100) if total_count > 0 else 100
                    return True, f"{percentage}%"

        return False, None

    def archive_task(self, task_id: str) -> Tuple[bool, Optional[Dict]]:
        """
        Archive a completed task.
        Returns tuple of (success, archived_task).
        """
        if not task_id:
            return False, None

        for i, task in enumerate(self.tasks):
            if task["id"] == task_id:
                # Only archive completed tasks
                if task.get("status") != "completed":
                    return False, None

                # Add archived timestamp
                task["archived_at"] = self._get_current_timestamp()
                task["status"] = "archived"

                # Remove from active tasks and add to archived
                archived = self.tasks.pop(i)
                self.archived_tasks.append(archived)
                return True, archived

        return False, None

    def get_task_by_id(self, task_id: str) -> Optional[Dict]:
        """Get a task by its ID from active tasks."""
        for task in self.tasks:
            if task["id"] == task_id:
                return task
            for subtask in task.get("subtasks", []):
                if subtask["id"] == task_id:
                    return subtask
        return None

    def get_all_tasks(self) -> List[Dict]:
        """Return all active tasks."""
        return self.tasks

    def get_completion_percentage(self, task_id: str) -> Optional[int]:
        """Get completion percentage for a task."""
        for task in self.tasks:
            if task["id"] == task_id:
                if not task.get("subtasks"):
                    return 100 if task.get("status") == "completed" else 0
                completed = sum(1 for s in task["subtasks"] if s["completed"])
                total = len(task["subtasks"])
                return int((completed / total) * 100) if total > 0 else 0
        return None
