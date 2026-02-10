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
        
        if not existing_tasks:
            existing_tasks = []
        
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
        
        if existing_tasks and self._should_be_subtask(prompt, existing_tasks):
            target_task = self._find_best_parent_task(prompt, existing_tasks)
            if target_task:
                return {
                    "action": "create_subtask",
                    "content": prompt,
                    "target_task_id": target_task["id"],
                    "confidence": 0.8
                }
        
        return {
            "action": "create_main_task",
            "content": prompt,
            "confidence": 0.85
        }
    
    def _find_target_task(self, prompt: str, existing_tasks: List[Dict]) -> Dict:
        if not existing_tasks:
            return None

        prompt_words = set(prompt.lower().split())
        best_match = None
        best_score = 0

        for task in existing_tasks:
            task_words = set(task["title"].lower().split())
            score = len(prompt_words & task_words)
            if score > best_score:
                best_score = score
                best_match = task

            if task.get("subtasks"):
                for subtask in task["subtasks"]:
                    subtask_words = set(subtask["title"].lower().split())
                    subtask_score = len(prompt_words & subtask_words)
                    if subtask_score > best_score:
                        best_score = subtask_score
                        best_match = subtask

        return best_match if best_score > 0 else None
    
    def _should_be_subtask(self, prompt: str, existing_tasks: List[Dict]) -> bool:
        prompt_lower = prompt.lower()
        for task in existing_tasks:
            task_words = set(task["title"].lower().split())
            prompt_words = set(prompt_lower.split())
            overlap = len(task_words & prompt_words)
            if overlap > 0:
                return True
            if "project" in prompt_lower and task["title"].lower() in prompt_lower:
                return True
        return False
    
    def _find_best_parent_task(self, prompt: str, existing_tasks: List[Dict]) -> Dict:
        return self._find_target_task(prompt, existing_tasks)
