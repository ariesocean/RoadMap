import re
from typing import Dict, List

class SemanticIntentAnalyzer:
    def __init__(self):
        self.completion_keywords = [
            "done", "finished", "complete", "completed", "all set", 
            "ready", "accomplished", "achieved", "wrapped up"
        ]
        self.archive_keywords = ["archive", "move to achievements", "save to archive"]
        self.subtask_keywords = [
            "add", "create", "implement", "create", "build", "write",
            "setup", "configure", "install", "design", "create"
        ]
        self.subtask_indicators = [
            "feature", "component", "module", "page", "screen",
            "login", "signup", "auth", "api", "endpoint",
            "button", "form", "menu", "setting", "view"
        ]
    
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

        prompt_lower = prompt.lower()
        prompt_words = set(prompt_lower.split())
        significant_prompt_words = [w for w in prompt_words if len(w) > 2 and w not in ['done', 'with', 'the', 'and', 'for', 'that', 'this', 'add', 'create', 'implement']]
        
        best_match = None
        best_score = -1

        for task in existing_tasks:
            task_title_lower = task["title"].lower()
            
            # Direct match
            if task_title_lower in prompt_lower:
                return task
            
            task_words = set(task_title_lower.split())
            significant_task_words = [w for w in task_words if len(w) > 2]
            
            task_overlap = len(set(significant_prompt_words) & set(significant_task_words))
            
            # Check subtasks first (more specific)
            if task.get("subtasks"):
                for subtask in task["subtasks"]:
                    subtask_title_lower = subtask["title"].lower()
                    
                    if subtask_title_lower in prompt_lower:
                        return subtask
                    
                    subtask_words = set(subtask_title_lower.split())
                    subtask_significant = [w for w in subtask_words if len(w) > 2]
                    
                    subtask_overlap = len(set(significant_prompt_words) & set(subtask_significant))
                    
                    if subtask_overlap > best_score:
                        best_score = subtask_overlap
                        best_match = subtask
            
            # Check main task
            if task_overlap > best_score:
                best_score = task_overlap
                best_match = task

        return best_match
    
    def _should_be_subtask(self, prompt: str, existing_tasks: List[Dict]) -> bool:
        prompt_lower = prompt.lower()
        prompt_words = set(prompt_lower.split())
        
        # Check if prompt starts with subtask action verbs
        prompt_first_word = next(iter(prompt_words), "") if prompt_words else ""
        
        for verb in self.subtask_keywords:
            if prompt_lower.startswith(verb + " ") or prompt_lower.startswith('"' + verb + " "):
                # If there are existing tasks and this looks like a subtask action
                if existing_tasks and any(ind in prompt_lower for ind in self.subtask_indicators):
                    return True
                if existing_tasks and len(existing_tasks) > 0:
                    return True
        
        for task in existing_tasks:
            task_title_lower = task["title"].lower()
            task_words = set(task_title_lower.split())
            
            # Check for word overlap
            overlap = len(task_words & prompt_words)
            if overlap > 0:
                return True
            
            # Check if task title appears in prompt (with or without "the")
            if task_title_lower in prompt_lower:
                return True
            
            # Check for "the X" pattern where X is part of task title
            for word in task_words:
                if len(word) > 3 and word in prompt_lower:
                    return True
            
            # Check for "project" or "task" references
            if ("project" in prompt_lower or "task" in prompt_lower) and any(word in prompt_lower for word in task_words if len(word) > 3):
                return True
        
        return False
    
    def _find_best_parent_task(self, prompt: str, existing_tasks: List[Dict]) -> Dict:
        """Find the best parent task for a subtask"""
        if not existing_tasks:
            return None
        
        prompt_lower = prompt.lower()
        
        # First try exact matching
        for task in existing_tasks:
            if task["title"].lower() in prompt_lower:
                return task
        
        # Then try keyword matching
        prompt_words = set(prompt_lower.split())
        for task in existing_tasks:
            task_words = set(task["title"].lower().split())
            if len(task_words & prompt_words) > 0:
                return task
        
        # If no match found but we know it's a subtask, return the first/most recent task
        if existing_tasks:
            return existing_tasks[-1]
        
        return None
