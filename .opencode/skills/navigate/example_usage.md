# Example Usage Scenarios

## Basic Workflow

**User:** "Build a new mobile app"
**→ Creates main task:** "Build a new mobile app"

**User:** "Add user login to the mobile app"
**→ Creates subtask:** "Add user login"

**User:** "Implement push notifications"
**→ Creates subtask:** "Implement push notifications"

**User:** "Done with user login"
**→ Marks "Add user login" as complete**

**User:** "Archive the mobile app project"
**→ Confirms and moves to achievements.md**

## Advanced Features

### Clarification Prompts

When the system isn't sure what you mean, it will ask for clarification:

**User:** "Done"
**→ System:** "Which task are you referring to when you say 'Done'?"

### Error Handling

The skill handles various edge cases:

- Empty prompts are rejected
- Very long descriptions are flagged
- Invalid task references are caught
- File write failures are logged with backup recovery

### Task Hierarchy

The system automatically detects when a new task should be a subtask based on context:

**User:** "Build a new website"
**→ Creates main task**

**User:** "Add login to the website"
**→ Creates subtask under "Build a new website"**

## Sample roadmap.md Output

```markdown
# Build a new mobile app [created: 2026-02-10 14:30]
> Create an iOS and Android app

## Subtasks
* [x] Add user login [created: 2026-02-10 14:31]
* [ ] Implement push notifications [created: 2026-02-10 14:32]

---
**Last Updated:** 2026-02-10 14:32
```
