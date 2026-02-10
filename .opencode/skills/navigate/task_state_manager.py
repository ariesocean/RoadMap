from datetime import datetime
from typing import List, Dict, Optional

class TaskStateManager:
    def __init__(self):
        self.tasks: List[Dict] = []
    
    def _get_current_timestamp(self) -> str:
        """Get current timestamp in YYYY-MM-DD HH:MM format"""
        return datetime.now().strftime("%Y-%m-%d %H:%M")
    
    def create_main_task(self, title: str, description: str = ""):
        """Create a new main task with validation"""
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
    
    def create_subtask(self, main_task_id: str, content: str, level: int = 1):
        """Create a subtask under a main task with validation"""
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
    
    def mark_task_complete(self, task_id: str):
        """Mark a task as complete with validation"""
        if not task_id:
            return False
        
        for task in self.tasks:
            if task["id"] == task_id:
                for subtask in task["subtasks"]:
                    subtask["completed"] = True
                task["updated_at"] = self._get_current_timestamp()
                return True
            
            for subtask in task["subtasks"]:
                if subtask["id"] == task_id:
                    subtask["completed"] = True
                    task["updated_at"] = self._get_current_timestamp()
                    return True
        
        return False
