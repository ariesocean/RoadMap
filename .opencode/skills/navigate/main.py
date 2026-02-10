import sys
import argparse
from typing import List, Dict, Optional
from skills.navigate.file_manager import FileManager
from skills.navigate.task_state_manager import TaskStateManager
from skills.navigate.markdown_formatter import MarkdownFormatter
from skills.navigate.semantic_analyzer import SemanticIntentAnalyzer


class NavigateSkill:
    """Personal task management skill with semantic intent analysis."""

    # Configurable confidence thresholds
    CONFIDENCE_THRESHOLDS = {
        "create_main_task": 0.85,
        "create_subtask": 0.80,
        "mark_complete": 0.70,
        "archive": 0.85,
        "clarify": 0.70
    }

    def __init__(self, roadmap_path="roadmap.md", achievements_path="achievements.md",
                 confidence_thresholds: Optional[Dict[str, float]] = None):
        self.file_manager = FileManager(roadmap_path, achievements_path)
        self.task_state_manager = TaskStateManager()
        self.markdown_formatter = MarkdownFormatter()
        # Allow custom confidence thresholds
        if confidence_thresholds:
            self.CONFIDENCE_THRESHOLDS.update(confidence_thresholds)
        self.semantic_analyzer = SemanticIntentAnalyzer(self.CONFIDENCE_THRESHOLDS)
        self._load_existing_tasks()

    def _load_existing_tasks(self):
        """Load existing tasks from roadmap.md with proper error handling."""
        try:
            content = self.file_manager.read_roadmap()
            if content:
                parsed_tasks = self.markdown_formatter.parse_markdown_to_tasks(content)
                if parsed_tasks is not None:
                    self.task_state_manager.tasks = parsed_tasks
                else:
                    # Parsing returned None, use empty tasks
                    self.task_state_manager.tasks = []
        except Exception as e:
            # Log error but don't silently fail - inform user
            print(f"Warning: Could not load existing roadmap: {e}")
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
            
            if intent_result["confidence"] < self.semantic_analyzer.thresholds.get("clarify", 0.70):
                return intent_result["content"]

            action = intent_result["action"]
            response = ""

            # Handle clarification action explicitly
            if action == "clarify":
                return intent_result["content"]
            
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
                success, status_msg = self.task_state_manager.mark_task_complete(target_id)
                if not success:
                    return "Error marking task as complete. Please try again."
                if status_msg and status_msg != "completed":
                    response = f"Marked task as complete ({status_msg} progress)"
                else:
                    response = f"Marked task as complete"

            elif action == "archive":
                target_id = intent_result.get("target_task_id")
                if not target_id:
                    return "Could not find the task to archive. Please specify which completed task to archive."

                # Get the task to verify it's completed
                task = self.task_state_manager.get_task_by_id(target_id)
                if not task:
                    return "Could not find the specified task."

                if task.get("status") != "completed":
                    return "Only completed tasks can be archived. Please mark the task as complete first."

                # Perform the archive
                success, archived_task = self.task_state_manager.archive_task(target_id)
                if not success:
                    return "Error archiving task. Please try again."

                # Format and write to achievements file
                achievement_content = ""
                if archived_task:
                    achievement_content = self.markdown_formatter.format_achievement(archived_task)
                write_achievements = self.file_manager.write_achievements(achievement_content)

                if archived_task:
                    response = f"Archived task: '{archived_task['title']}'"
                    if not write_achievements:
                        response += "\nWarning: Task archived but achievements file could not be saved."
                else:
                    response = "Error archiving task. Please try again."
            
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
