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
        pass

    def process_prompt(self, prompt: str) -> str:
        """
        Process user prompt and return response
        Returns response message to user
        """
        existing_tasks = self.task_state_manager.tasks
        intent_result = self.semantic_analyzer.analyze_intent(prompt, existing_tasks)

        if intent_result["confidence"] < 0.7:
            return intent_result["content"]

        action = intent_result["action"]
        response = ""

        if action == "create_main_task":
            title = prompt
            description = ""
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
            response = f"Would you like to archive this completed task? (Reply 'yes' to confirm)"

        markdown_content = self.markdown_formatter.format_tasks(self.task_state_manager.tasks)
        self.file_manager.write_roadmap(markdown_content)

        return response
