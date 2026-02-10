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
        """Parse markdown content back to tasks structure (for future use)"""
        return []
