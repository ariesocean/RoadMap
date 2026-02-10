from typing import List, Dict

class MarkdownFormatter:
    def format_tasks(self, tasks: List[Dict]) -> str:
        """Format tasks list to markdown string"""
        if not tasks:
            return ""
        
        markdown_parts = []
        
        for task in tasks:
            created_at = task.get("created_at", "")
            markdown_parts.append(f"# {task['title']} [created: {created_at}]")
            
            if task.get("description"):
                markdown_parts.append(f"> {task['description']}")
            markdown_parts.append("")
            
            if task.get("subtasks"):
                markdown_parts.append("## Subtasks")
                for subtask in task["subtasks"]:
                    status = "[x]" if subtask["completed"] else "[ ]"
                    created = subtask.get("created_at", "")
                    markdown_parts.append(f"* {status} {subtask['title']} [created: {created}]")
                markdown_parts.append("")
            
            updated_at = task.get("updated_at", created_at)
            markdown_parts.append("---")
            markdown_parts.append(f"**Last Updated:** {updated_at}")
            markdown_parts.append("")
        
        return "\n".join(markdown_parts)
    
    def parse_markdown_to_tasks(self, markdown_content: str) -> List[Dict]:
        """Parse markdown content back to tasks structure"""
        tasks = []
        if not markdown_content.strip():
            return tasks
        
        import re
        lines = markdown_content.strip().split('\n')
        current_task = None
        
        for line in lines:
            line = line.rstrip()
            
            # Match main task heading: # Title [created: YYYY-MM-DD HH:MM]
            task_match = re.match(r'^#\s+(.+?)\s+\[created:\s+([^\]]+)\]', line)
            if task_match:
                if current_task:
                    tasks.append(current_task)
                current_task = {
                    "id": f"task_{len(tasks)}",
                    "title": task_match.group(1).strip(),
                    "created_at": task_match.group(2).strip(),
                    "updated_at": task_match.group(2).strip(),
                    "status": "active",
                    "subtasks": []
                }
                continue
            
            # Match subtask: * [x] or [ ] Title [created: YYYY-MM-DD HH:MM]
            subtask_match = re.match(r'^\*\s+(\[x\]|\[ \])\s+(.+?)(?:\s+\[created:\s+([^\]]+)\])?$', line)
            if subtask_match and current_task:
                completed = subtask_match.group(1) == '[x]'
                title = subtask_match.group(2).strip()
                created_at = subtask_match.group(3).strip() if subtask_match.group(3) else ""
                subtask = {
                    "id": f"subtask_{len(current_task['subtasks'])}",
                    "title": title,
                    "created_at": created_at,
                    "completed": completed
                }
                current_task["subtasks"].append(subtask)
                continue
            
            # Match task description: > Description
            desc_match = re.match(r'^>\s+(.+)', line)
            if desc_match and current_task and not current_task.get("description"):
                current_task["description"] = desc_match.group(1).strip()
                continue
        
        # Don't forget the last task
        if current_task:
            tasks.append(current_task)
        
        return tasks
