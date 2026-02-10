import re
from typing import Dict, List, Optional


class SemanticIntentAnalyzer:
    """Analyzes natural language prompts to determine intended task actions."""

    # Default confidence thresholds (can be overridden via constructor)
    DEFAULT_THRESHOLDS = {
        "create_main_task": 0.85,
        "create_subtask": 0.80,
        "mark_complete": 0.90,
        "archive": 0.85,
        "clarify": 0.40
    }

    def __init__(self, confidence_thresholds: Optional[Dict[str, float]] = None):
        # Remove duplicate keywords
        self.completion_keywords = [
            "done", "finished", "complete", "completed", "all set",
            "ready", "accomplished", "achieved", "wrapped up"
        ]
        self.archive_keywords = ["archive", "move to achievements", "save to archive"]
        self.subtask_keywords = [
            "add", "create", "implement", "build", "write",
            "setup", "configure", "install", "design"
        ]
        self.subtask_indicators = [
            "feature", "component", "module", "page", "screen",
            "login", "signup", "auth", "api", "endpoint",
            "button", "form", "menu", "setting", "view"
        ]
        # Use custom thresholds if provided, otherwise use defaults
        self.thresholds = confidence_thresholds if confidence_thresholds else self.DEFAULT_THRESHOLDS
    
    def analyze_intent(self, prompt: str, existing_tasks: Optional[List[Dict]] = None) -> Dict:
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

        if existing_tasks is None:
            existing_tasks = []

        # Check for completion keywords
        if any(keyword in prompt_lower for keyword in self.completion_keywords):
            # Use strict matching for completion intents to avoid wrong task matches
            target_task = self._find_target_task(prompt, existing_tasks, require_strict_match=True)
            if target_task:
                return {
                    "action": "mark_complete",
                    "content": prompt,
                    "target_task_id": target_task["id"],
                    "confidence": self.thresholds.get("mark_complete", 0.90)
                }
            else:
                return {
                    "action": "clarify",
                    "content": f"Which task are you referring to when you say '{prompt}'?",
                    "confidence": self.thresholds.get("clarify", 0.40)
                }

        # Check for archive keywords (handle multi-word phrases)
        archive_match = self._check_archive_keywords(prompt_lower)
        if archive_match:
            target_task = self._find_target_task(prompt, existing_tasks)
            if target_task:
                return {
                    "action": "archive",
                    "content": prompt,
                    "target_task_id": target_task["id"],
                    "confidence": self.thresholds.get("archive", 0.85)
                }
            else:
                return {
                    "action": "clarify",
                    "content": f"Which completed task would you like to archive?",
                    "confidence": self.thresholds.get("clarify", 0.40)
                }

        if existing_tasks and self._should_be_subtask(prompt, existing_tasks):
            target_task = self._find_best_parent_task(prompt, existing_tasks)
            if target_task:
                return {
                    "action": "create_subtask",
                    "content": prompt,
                    "target_task_id": target_task["id"],
                    "confidence": self.thresholds.get("create_subtask", 0.80)
                }

        return {
            "action": "create_main_task",
            "content": prompt,
            "confidence": self.thresholds.get("create_main_task", 0.85)
        }

    def _check_archive_keywords(self, prompt_lower: str) -> bool:
        """Check for archive keywords, including multi-word phrases."""
        for keyword in self.archive_keywords:
            if keyword in prompt_lower:
                return True
        return False

    def _find_target_task(self, prompt: str, existing_tasks: List[Dict], require_strict_match: bool = False) -> Optional[Dict]:
        """
        Find the best matching task for a prompt.

        Args:
            prompt: The user prompt
            existing_tasks: List of existing tasks to search
            require_strict_match: If True, require more precise matching (for completion intents)
        """
        if not existing_tasks:
            return None

        prompt_lower = prompt.lower()
        prompt_words = set(prompt_lower.split())
        significant_prompt_words = [w for w in prompt_words if len(w) > 2 and w not in ['done', 'with', 'the', 'and', 'for', 'that', 'this', 'add', 'create', 'implement', 'about', 'nonexistent', 'unknown']]

        # For strict matching, require meaningful content in prompt
        if require_strict_match and len(significant_prompt_words) == 0:
            return None

        best_match = None
        best_score = -1

        for task in existing_tasks:
            task_title_lower = task["title"].lower()

            # Direct match (exact substring match)
            if task_title_lower in prompt_lower:
                return task

            task_words = set(task_title_lower.split())
            significant_task_words = [w for w in task_words if len(w) > 2]

            # Calculate word overlap
            task_overlap = len(set(significant_prompt_words) & set(significant_task_words))

            # Apply stricter matching if required
            if require_strict_match:
                # For strict matching, require meaningful word overlap
                # Skip task if overlap is too weak or non-existent
                if task_overlap == 0:
                    continue  # No overlap, skip this task
                overlap_ratio = task_overlap / len(significant_task_words) if significant_task_words else 0
                if overlap_ratio < 0.5 and task_overlap < 2:
                    continue  # Skip this task if match is too weak

            # Check subtasks first (more specific)
            if task.get("subtasks"):
                for subtask in task["subtasks"]:
                    subtask_title_lower = subtask["title"].lower()

                    if subtask_title_lower in prompt_lower:
                        return subtask

                    subtask_words = set(subtask_title_lower.split())
                    subtask_significant = [w for w in subtask_words if len(w) > 2]

                    subtask_overlap = len(set(significant_prompt_words) & set(subtask_significant))

                    if require_strict_match:
                        if subtask_overlap > 0:
                            overlap_ratio = subtask_overlap / len(subtask_significant) if subtask_significant else 0
                            if overlap_ratio < 0.5 and subtask_overlap < 2:
                                continue

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
    
    def _find_best_parent_task(self, prompt: str, existing_tasks: List[Dict]) -> Optional[Dict]:
        """
        Find the best parent task for a subtask.
        Searches through all levels (main tasks, subtasks, subsubtasks).
        Prefers deeper matches when there's ambiguity.
        """
        if not existing_tasks:
            return None

        prompt_lower = prompt.lower()
        prompt_words = set(prompt_lower.split())

        def collect_all_tasks(tasks: List[Dict]) -> List[Dict]:
            """Recursively collect all tasks including nested subtasks."""
            all_tasks = []
            for task in tasks:
                all_tasks.append(task)
                for subtask in task.get("subtasks", []):
                    all_tasks.append(subtask)
                    for subsubtask in subtask.get("subtasks", []):
                        all_tasks.append(subsubtask)
                        for subsubsubtask in subsubtask.get("subtasks", []):
                            all_tasks.append(subsubsubtask)
            return all_tasks

        all_available = collect_all_tasks(existing_tasks)

        # Priority 1: Exact match on task title
        for task in all_available:
            if task.get("level", 0) < 3:  # Can still have subtasks
                if task["title"].lower() in prompt_lower:
                    return task

        # Priority 2: Keyword overlap (prefer deeper levels)
        prompt_significant = [w for w in prompt_words if len(w) > 2 and w not in ['done', 'with', 'the', 'and', 'for', 'that', 'this', 'add', 'create', 'implement']]

        best_match = None
        best_level = -1
        best_score = -1

        for task in all_available:
            if task.get("level", 0) >= 3:  # Max level reached
                continue

            task_words = set(task["title"].lower().split())
            task_significant = [w for w in task_words if len(w) > 2]
            overlap = len(set(prompt_significant) & set(task_significant))

            if overlap > 0:
                # Prefer deeper levels for better context match
                level_bonus = task.get("level", 0) * 0.5
                total_score = overlap + level_bonus

                if total_score > best_score:
                    best_score = total_score
                    best_match = task
                    best_level = task.get("level", 0)

        if best_match:
            return best_match

        # Priority 3: Return the most recent main task if no match
        if existing_tasks:
            return existing_tasks[-1]

        return None
