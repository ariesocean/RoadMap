import sys
import argparse
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
        """Load existing tasks from roadmap.md"""
        try:
            content = self.file_manager.read_roadmap()
            if content:
                self.task_state_manager.tasks = self.markdown_formatter.parse_markdown_to_tasks(content)
        except Exception as e:
            # Silently fail on load - start with empty tasks
            self.task_state_manager.tasks = []

    def process_prompt(self, prompt: str) -> str:
        """
        Process user prompt and return response
        Returns response message to user
        """
        try:
            if not prompt.strip():
                return "Please provide a task description."
            
            if len(prompt) > 1000:
                return "Task description is too long. Please simplify."
            
            existing_tasks = self.task_state_manager.tasks
            intent_result = self.semantic_analyzer.analyze_intent(prompt, existing_tasks)
            
            if intent_result["confidence"] < 0.7:
                return intent_result["content"]
            
            action = intent_result["action"]
            response = ""
            
            if action == "create_main_task":
                title = prompt
                description = ""
                success = self.task_state_manager.create_main_task(title, description)
                if not success:
                    return "Error creating main task. Please try again."
                response = f"Created main task: '{title}'"
            
            elif action == "create_subtask":
                target_id = intent_result.get("target_task_id")
                if not target_id:
                    return "Could not find the parent task. Please specify which project this subtask belongs to."
                content = prompt
                success = self.task_state_manager.create_subtask(target_id, content)
                if not success:
                    return "Error creating subtask. Please try again."
                response = f"Added subtask to existing task: '{content}'"
            
            elif action == "mark_complete":
                target_id = intent_result.get("target_task_id")
                if not target_id:
                    return "Could not find the task to complete. Please specify which task is done."
                success = self.task_state_manager.mark_task_complete(target_id)
                if not success:
                    return "Error marking task as complete. Please try again."
                response = f"Marked task as complete"
            
            elif action == "archive":
                target_id = intent_result.get("target_task_id")
                if not target_id:
                    return "Could not find the task to archive. Please specify which completed task to archive."
                response = f"Would you like to archive this completed task? (Reply 'yes' to confirm)"
            
            markdown_content = self.markdown_formatter.format_tasks(self.task_state_manager.tasks)
            write_success = self.file_manager.write_roadmap(markdown_content)
            if not write_success:
                response += "\nWarning: Task created but roadmap file could not be saved."
            
            return response
        
        except Exception as e:
            return f"Error processing your request: {str(e)}. Please try again."


def main():
    """Main entry point for CLI usage"""
    parser = argparse.ArgumentParser(
        description="Navigate Skill - Personal task management with natural language"
    )
    parser.add_argument(
        "prompt",
        nargs="*",  # Allow multiple words as the prompt
        help="Natural language task description"
    )
    parser.add_argument(
        "--roadmap",
        default="roadmap.md",
        help="Path to roadmap file (default: roadmap.md)"
    )
    parser.add_argument(
        "--achievements",
        default="achievements.md",
        help="Path to achievements file (default: achievements.md)"
    )
    
    args = parser.parse_args()
    
    # Combine all prompt arguments into a single string
    prompt = " ".join(args.prompt) if args.prompt else ""
    
    if not prompt.strip():
        print("Error: Please provide a task description.")
        print("Usage: python main.py \"Build a new website\"")
        print("       python main.py \"Done with user authentication\"")
        sys.exit(1)
    
    # Initialize skill with specified paths
    skill = NavigateSkill(
        roadmap_path=args.roadmap,
        achievements_path=args.achievements
    )
    
    # Process the prompt
    response = skill.process_prompt(prompt)
    print(response)


if __name__ == "__main__":
    main()
