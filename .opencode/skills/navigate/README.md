# Navigate Skill

Personal task management system for OpenCode that uses natural language processing to manage your `roadmap.md` file.

## Installation

The skill is automatically available in OpenCode when located in the project's `.opencode/skills/` directory.

## Usage

Simply mention the skill and provide natural language prompts:

- "Build a new website"
- "Add user authentication to the website project"
- "Done with user authentication"
- "Archive the website project"

## File Structure

- `roadmap.md`: Your active tasks with hierarchical structure
- `achievements.md`: Your completed and archived projects

## Features

- Natural language understanding
- Automatic task hierarchy detection
- Smart completion tracking
- Controlled archiving with confirmation
- Data safety with automatic backups

## Architecture

- **File Manager**: Handles reading/writing markdown files
- **Semantic Intent Analyzer**: Determines action type and task hierarchy
- **Task State Manager**: Maintains current task structure
- **Markdown Formatter**: Converts tasks to proper markdown format

## Development

```bash
# Run tests
python -m pytest .opencode/skills/navigate/ -v
```

## License

MIT
