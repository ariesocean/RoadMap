from datetime import datetime
from typing import List, Dict, Optional, Tuple


class TaskStateManager:
    """Manages task state with support for nested subtasks (up to 3 levels)."""

    MAX_LEVEL = 3

    def __init__(self):
        self.tasks: List[Dict] = []
        self.archived_tasks: List[Dict] = []

    def _get_current_timestamp(self) -> str:
        """Get current local timestamp in YYYY-MM-DD HH:MM format."""
        return datetime.now().strftime("%Y-%m-%d %H:%M")

    def _generate_id(self, parent_id: Optional[str], parent_subtasks: List[Dict]) -> str:
        """Generate unique ID based on parent and subtask count."""
        if parent_id is None:
            return f"task_{len(self.tasks)}"
        else:
            subtask_num = len(parent_subtasks)
            return f"{parent_id}_subtask_{subtask_num}"

    def _get_parent_container(self, parent_id: Optional[str]) -> Optional[List[Dict]]:
        """Get the container list where the subtask should be added."""
        if parent_id is None:
            return self.tasks

        for task in self.tasks:
            if task["id"] == parent_id:
                return task["subtasks"]
            for subtask in task.get("subtasks", []):
                if subtask["id"] == parent_id:
                    return subtask["subtasks"]
                for subsubtask in subtask.get("subtasks", []):
                    if subsubtask["id"] == parent_id:
                        return subsubtask["subtasks"]
        return None

    def _find_task_recursive(self, task_id: str, tasks: List[Dict]) -> Optional[Dict]:
        """Recursively find a task by ID."""
        for task in tasks:
            if task["id"] == task_id:
                return task
            for subtask in task.get("subtasks", []):
                if subtask["id"] == task_id:
                    return subtask
                for subsubtask in subtask.get("subtasks", []):
                    if subsubtask["id"] == task_id:
                        return subsubtask
                    for subsubsubtask in subsubtask.get("subtasks", []):
                        if subsubsubtask["id"] == task_id:
                            return subsubsubtask
        return None

    def _get_parent_task(self, task_id: str) -> Optional[Dict]:
        """Get the parent task of a given task."""
        for task in self.tasks:
            if task["id"] == task_id:
                return None  # Main task has no parent
            for subtask in task.get("subtasks", []):
                if subtask["id"] == task_id:
                    return task
                for subsubtask in subtask.get("subtasks", []):
                    if subsubtask["id"] == task_id:
                        return subtask
                    for subsubsubtask in subsubtask.get("subtasks", []):
                        if subsubsubtask["id"] == task_id:
                            return subsubtask
        return None

    def create_main_task(self, title: str, description: str = "") -> bool:
        """Create a new main task."""
        if not title or not title.strip():
            return False

        task = {
            "id": f"task_{len(self.tasks)}",
            "parent_id": None,
            "level": 0,
            "title": title,
            "description": description,
            "created_at": self._get_current_timestamp(),
            "updated_at": self._get_current_timestamp(),
            "status": "active",
            "subtasks": []
        }
        self.tasks.append(task)
        return True

    def create_subtask(self, parent_id: str, content: str) -> bool:
        """Create a subtask under a parent task (up to 3 levels)."""
        if not parent_id or not content:
            return False

        parent = self._find_task_recursive(parent_id, self.tasks)
        if not parent:
            return False

        if parent.get("level", 0) >= self.MAX_LEVEL:
            return False  # Max level reached

        subtask = {
            "id": self._generate_id(parent_id, parent.get("subtasks", [])),
            "parent_id": parent_id,
            "level": parent.get("level", 0) + 1,
            "title": content,
            "created_at": self._get_current_timestamp(),
            "completed": False,
            "subtasks": []
        }
        parent["subtasks"].append(subtask)
        self._update_timestamp_recursive(parent)
        return True

    def _update_timestamp_recursive(self, task: Dict) -> None:
        """Update timestamp for task and all ancestors."""
        task["updated_at"] = self._get_current_timestamp()
        if task["parent_id"]:
            parent = self._get_parent_task(task["id"])
            if parent:
                self._update_timestamp_recursive(parent)

    def mark_task_complete(self, task_id: str) -> Tuple[bool, Optional[str]]:
        """Mark a task as complete with validation."""
        if not task_id:
            return False, None

        task = self._find_task_recursive(task_id, self.tasks)
        if not task:
            return False, None

        task["completed"] = True
        task["status"] = "completed"
        self._update_timestamp_recursive(task)

        parent = self._get_parent_task(task_id)
        if parent:
            status_msg = self._check_parent_completion(parent)
            return True, status_msg

        return True, "completed"

    def _check_parent_completion(self, parent: Dict) -> str:
        """Check if all children of a parent are complete."""
        all_subtasks = parent.get("subtasks", [])
        if not all_subtasks:
            return "completed"

        all_complete = all(s.get("completed", False) for s in all_subtasks)
        if all_complete:
            parent["completed"] = True
            parent["status"] = "completed"
            parent_parent = self._get_parent_task(parent["id"])
            if parent_parent:
                return self._check_parent_completion(parent_parent)
            return "completed"

        completed_count = sum(1 for s in all_subtasks if s.get("completed", False))
        total_count = len(all_subtasks)
        percentage = int((completed_count / total_count) * 100) if total_count > 0 else 100
        return f"{percentage}%"

    def archive_task(self, task_id: str) -> Tuple[bool, Optional[Dict]]:
        """Archive a completed task."""
        if not task_id:
            return False, None

        for i, task in enumerate(self.tasks):
            if task["id"] == task_id:
                if task.get("status") != "completed":
                    return False, None

                task["archived_at"] = self._get_current_timestamp()
                task["status"] = "archived"

                archived = self.tasks.pop(i)
                self.archived_tasks.append(archived)
                return True, archived

        return False, None

    def get_task_by_id(self, task_id: str) -> Optional[Dict]:
        """Get a task by its ID."""
        return self._find_task_recursive(task_id, self.tasks)

    def get_all_tasks(self) -> List[Dict]:
        """Return all active tasks."""
        return self.tasks

    def get_completion_percentage(self, task_id: str) -> Optional[int]:
        """Get completion percentage for a task."""
        task = self._find_task_recursive(task_id, self.tasks)
        if not task:
            return None

        all_subtasks = task.get("subtasks", [])
        if not all_subtasks:
            return 100 if task.get("completed") else 0

        completed = sum(1 for s in all_subtasks if s.get("completed", False))
        total = len(all_subtasks)
        return int((completed / total) * 100) if total > 0 else 0
