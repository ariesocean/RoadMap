from typing import List, Dict


class MarkdownFormatter:
    """Formats task data to markdown and parses markdown back to tasks."""

    def format_tasks(self, tasks: List[Dict]) -> str:
        """Format tasks list to markdown string."""
        if not tasks:
            return ""

        markdown_parts = []

        for task in tasks:
            created_at = task.get("created_at", "")
            markdown_parts.append(f"# {task['title']}")
            markdown_parts.append(f"Created: {created_at}")

            if task.get("description"):
                markdown_parts.append(f"{task['description']}")
            markdown_parts.append("")

            if task.get("subtasks"):
                markdown_parts.append("## Subtasks")
                for subtask in task["subtasks"]:
                    status = "[x]" if subtask["completed"] else "[ ]"
                    markdown_parts.append(f"* {status} {subtask['title']}")
                markdown_parts.append("")

            updated_at = task.get("updated_at", created_at)
            markdown_parts.append("---")
            markdown_parts.append(f"**Last Updated:** {updated_at}")
            markdown_parts.append("")

        return "\n".join(markdown_parts)

    def format_achievement(self, task: Dict) -> str:
        """Format a single archived task to achievement markdown."""
        if not task:
            return ""

        markdown_parts = []

        created_at = task.get("created_at", "")
        archived_at = task.get("archived_at", "")

        markdown_parts.append(f"# {task['title']}")
        markdown_parts.append(f"Created: {created_at}")
        markdown_parts.append(f"Archived: {archived_at}")

        if task.get("description"):
            markdown_parts.append(f"{task['description']}")
        markdown_parts.append("")

        if task.get("subtasks"):
            markdown_parts.append("## Completed Subtasks")
            for subtask in task["subtasks"]:
                status = "[x]" if subtask["completed"] else "[ ]"
                markdown_parts.append(f"* {status} {subtask['title']}")
            markdown_parts.append("")

        markdown_parts.append("---")
        markdown_parts.append(f"**Archived Date:** {archived_at}")

        return "\n".join(markdown_parts)

    def parse_markdown_to_tasks(self, markdown_content: str) -> List[Dict]:
        """Parse markdown content back to tasks structure with better error handling."""
        tasks = []
        if not markdown_content.strip():
            return tasks

        import re
        lines = markdown_content.strip().split('\n')
        current_task = None

        for line_num, line in enumerate(lines):
            line = line.rstrip()

            # Match main task heading: # Title
            task_match = re.match(r'^#\s+(.+)$', line)
            if task_match:
                if current_task:
                    tasks.append(current_task)
                current_task = {
                    "id": f"task_{len(tasks)}",
                    "title": task_match.group(1).strip(),
                    "created_at": "",
                    "updated_at": "",
                    "status": "active",
                    "subtasks": []
                }
                continue

            # Match created timestamp: Created: YYYY-MM-DD HH:MM
            created_match = re.match(r'^Created:\s+(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2})$', line)
            if created_match and current_task:
                current_task["created_at"] = created_match.group(1).strip()
                current_task["updated_at"] = created_match.group(1).strip()
                continue

            # Match archived timestamp: Archived: YYYY-MM-DD HH:MM
            archived_match = re.match(r'^Archived:\s+(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2})$', line)
            if archived_match and current_task:
                current_task["archived_at"] = archived_match.group(1).strip()
                continue

            # Match subtask: * [x] or [ ] Title
            subtask_match = re.match(r'^\*\s+(\[x\]|\[ \])\s+(.+)$', line)
            if subtask_match and current_task:
                completed = subtask_match.group(1) == '[x]'
                title = subtask_match.group(2).strip()
                subtask = {
                    "id": f"subtask_{len(current_task['subtasks'])}",
                    "title": title,
                    "completed": completed
                }
                current_task["subtasks"].append(subtask)
                continue

            # Match task description (plain paragraph)
            # Skip special lines: ---, **Last Updated:**, **Archived Date:**
            if current_task and not line.startswith("#") and not line.startswith("---") and not line.startswith("**") and not line.startswith("Created:") and not line.startswith("Archived:") and not line.startswith("##"):
                if line.strip() and not current_task.get("description"):
                    current_task["description"] = line.strip()
                    continue

        # Don't forget the last task
        if current_task:
            tasks.append(current_task)

        return tasks
