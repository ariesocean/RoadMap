from typing import List, Dict
import re


class MarkdownFormatter:
    """Formats task data to markdown and parses markdown back to tasks."""

    SUBTASK_MARKERS = ["## Subtasks", "### Subtasks", "#### Subtasks"]
    INDENT = "  "  # 2 spaces per level

    def _format_subtasks_recursive(self, subtasks: List[Dict], level: int) -> List[str]:
        """Recursively format subtasks with proper indentation."""
        if not subtasks:
            return []

        lines = []
        marker = self.SUBTASK_MARKERS[min(level, len(self.SUBTASK_MARKERS) - 1)]
        lines.append(marker)

        for subtask in subtasks:
            indent = self.INDENT * (level + 1)
            status = "[x]" if subtask.get("completed") else "[ ]"
            lines.append(f"{indent}* {status} {subtask['title']}")

            # Recursively add nested subtasks
            if subtask.get("subtasks"):
                lines.extend(self._format_subtasks_recursive(subtask["subtasks"], level + 1))

        return lines

    def format_tasks(self, tasks: List[Dict]) -> str:
        """Format tasks list to markdown string with nested subtasks."""
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
                markdown_parts.extend(self._format_subtasks_recursive(task["subtasks"], 0))
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
            markdown_parts.extend(self._format_subtasks_recursive(task["subtasks"], 0))
            markdown_parts.append("")

        markdown_parts.append("---")
        markdown_parts.append(f"**Archived Date:** {archived_at}")

        return "\n".join(markdown_parts)

    def parse_markdown_to_tasks(self, markdown_content: str) -> List[Dict]:
        """Parse markdown content back to tasks with nested subtasks."""
        tasks = []
        if not markdown_content.strip():
            return tasks

        lines = markdown_content.strip().split('\n')
        current_task = None
        parent_stack = []  # Stack of (parent_dict, level)

        for line in lines:
            line = line.rstrip()

            # Match main task heading: # Title
            task_match = re.match(r'^#\s+(.+)$', line)
            if task_match:
                if current_task:
                    tasks.append(current_task)
                current_task = {
                    "id": f"task_{len(tasks)}",
                    "parent_id": None,
                    "level": 0,
                    "title": task_match.group(1).strip(),
                    "created_at": "",
                    "updated_at": "",
                    "status": "active",
                    "subtasks": []
                }
                parent_stack = [(current_task, 0)]
                continue

            # Match created timestamp
            created_match = re.match(r'^Created:\s+(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2})$', line)
            if created_match and current_task:
                current_task["created_at"] = created_match.group(1).strip()
                current_task["updated_at"] = created_match.group(1).strip()
                continue

            # Match archived timestamp
            archived_match = re.match(r'^Archived:\s+(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2})$', line)
            if archived_match and current_task:
                current_task["archived_at"] = archived_match.group(1).strip()
                continue

            # Match subtask with indentation: * [x] or [ ] Title
            subtask_match = re.match(r'^(\s*)\*\s+(\[x\]|\[ \])\s+(.+)$', line)
            if subtask_match and current_task:
                indent = len(subtask_match.group(1))
                completed = subtask_match.group(2) == '[x]'
                title = subtask_match.group(3).strip()

                # Calculate level based on indentation (2 spaces per level)
                level = min(indent // 2, 3)

                # Find parent based on level
                parent_task = current_task
                while parent_stack and parent_stack[-1][1] >= level:
                    parent_stack.pop()

                if parent_stack:
                    parent_task = parent_stack[-1][0]
                else:
                    parent_task = current_task

                # Create the subtask
                subtask_num = len(parent_task.get("subtasks", []))
                subtask = {
                    "id": f"{parent_task['id']}_subtask_{subtask_num}",
                    "parent_id": parent_task["id"],
                    "level": level,
                    "title": title,
                    "completed": completed,
                    "subtasks": []
                }
                parent_task["subtasks"].append(subtask)
                parent_stack.append((subtask, level))

                continue

            # Match subtask section header: ## Subtasks, ### Subtasks, etc.
            section_match = re.match(r'^(#{2,4})\s+Subtasks$', line)
            if section_match:
                continue  # Skip section headers

            # Match task description (plain paragraph)
            if current_task and not line.startswith("#") and not line.startswith("---") and not line.startswith("**") and not line.startswith("Created:") and not line.startswith("Archived:"):
                if line.strip() and not current_task.get("description"):
                    current_task["description"] = line.strip()
                    continue

        if current_task:
            tasks.append(current_task)

        return tasks
