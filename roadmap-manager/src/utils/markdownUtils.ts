import type { Task, Subtask, Achievement } from '@/store/types';
import { generateTaskId as generateTaskIdUtil, generateSubtaskId as generateSubtaskIdUtil } from '@/utils/idGenerator';
import { getCurrentISOString, formatDate } from '@/utils/timestamp';

export function generateTaskId(): string {
  return generateTaskIdUtil();
}

export function generateSubtaskId(): string {
  return generateSubtaskIdUtil();
}

export function extractIdFromTitle(title: string): { title: string; id: string | null } {
  const match = title.match(/\[id:([^\]]+)\]$/);
  if (match) {
    return { title: title.slice(0, -match[0].length).trim(), id: match[1] };
  }
  return { title, id: null };
}

export function extractCreatedDate(title: string): { title: string; createdAt: string | null } {
  const match = title.match(/\[created: ([^\]]+)\]$/);
  if (match) {
    return { title: title.slice(0, -match[0].length - 1).trim(), createdAt: match[1] };
  }
  return { title, createdAt: null };
}

export function extractUpdatedDate(line: string): string | null {
  const match = line.match(/^\*\*Last Updated:\*\* (.+)$/);
  if (match) {
    return match[1];
  }
  return null;
}

export function extractArchivedDate(line: string): string | null {
  const match = line.match(/^\*\*Archived:\*\* (.+)$/);
  if (match) {
    return match[1];
  }
  return null;
}

export function appendCreatedDate(title: string, createdAt: string): string {
  const date = new Date(createdAt);
  const formattedDate = date.toLocaleString('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).replace(/\//g, '-');
  return `${title} [created: ${formattedDate}]`;
}

function extractIdFromSubtask(content: string): { content: string; id: string | null } {
  const match = content.match(/\[id:([^\]]+)\]$/);
  if (match) {
    return { content: content.slice(0, -match[0].length).trim(), id: match[1] };
  }
  return { content, id: null };
}

export function appendIdToTitle(title: string, id: string): string {
  return `${title} [id:${id}]`;
}

export function parseMarkdownTasks(markdown: string): { tasks: Task[]; achievements: Achievement[] } {
  const tasks: Task[] = [];
  const achievements: Achievement[] = [];

  const lines = markdown.split('\n');
  let currentTask: Task | null = null;
  let currentAchievement: Achievement | null = null;
  let inAchievements = false;
  let lastUpdatedDate: string | null = null;
  let archivedDate: string | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('## Achievements')) {
      inAchievements = true;
      if (currentTask) {
        if (lastUpdatedDate) {
          currentTask.updatedAt = new Date(lastUpdatedDate).toISOString();
        }
        tasks.push(currentTask);
        currentTask = null;
        lastUpdatedDate = null;
      }
      continue;
    }

    const taskMatch = line.match(/^# (.+)$/);
    if (taskMatch) {
      if (currentTask && !inAchievements) {
        if (lastUpdatedDate) {
          currentTask.updatedAt = new Date(lastUpdatedDate).toISOString();
        }
        tasks.push(currentTask);
        currentTask = null;
        lastUpdatedDate = null;
      }
      if (currentAchievement && inAchievements) {
        if (archivedDate) {
          currentAchievement.completedAt = new Date(archivedDate).toISOString();
        }
        achievements.push(currentAchievement);
        currentAchievement = null;
        archivedDate = null;
      }

      const rawTitle = taskMatch[1].trim();
      const { title: cleanTitle, createdAt } = extractCreatedDate(rawTitle);

      if (cleanTitle === 'Roadmap' || cleanTitle === 'roadmap') {
        continue;
      }

      if (inAchievements) {
        currentAchievement = {
          id: generateTaskId(),
          title: cleanTitle,
          originalPrompt: '',
          completedAt: getCurrentISOString(),
          subtasks: [],
        };
      } else {
        currentTask = {
          id: generateTaskId(),
          title: cleanTitle,
          originalPrompt: '',
          createdAt: createdAt ? new Date(createdAt).toISOString() : getCurrentISOString(),
          updatedAt: getCurrentISOString(),
          subtasks: [],
          completedSubtasks: 0,
          totalSubtasks: 0,
          isExpanded: false,
        };
      }
      continue;
    }
    
    const promptMatch = line.match(/^> (.+)$/);
    if (promptMatch) {
      const prompt = promptMatch[1].trim();
      if (currentTask) {
        currentTask.originalPrompt = prompt;
      } else if (currentAchievement) {
        currentAchievement.originalPrompt = prompt;
      }
      continue;
    }

    const subtaskMatch = line.match(/^(\s*)[-*] \[([ x])\] (.+)$/);
    if (subtaskMatch) {
      const indent = subtaskMatch[1].length;
      const completed = subtaskMatch[2].toLowerCase() === 'x';
      const rawContent = subtaskMatch[3].trim();
      const { content, id } = extractIdFromSubtask(rawContent);
      const nestedLevel = Math.floor(indent / 2);

      const subtask: Subtask = {
        id: id || generateSubtaskId(),
        content,
        completed,
        nestedLevel,
      };
      
      if (currentTask) {
        currentTask.subtasks.push(subtask);
        currentTask.totalSubtasks++;
        if (completed) {
          currentTask.completedSubtasks++;
        }
      } else if (currentAchievement) {
        currentAchievement.subtasks.push(subtask);
      }
      continue;
    }

    const updatedMatch = extractUpdatedDate(line);
    if (updatedMatch) {
      lastUpdatedDate = updatedMatch;
      continue;
    }

    const archivedMatch = extractArchivedDate(line);
    if (archivedMatch) {
      archivedDate = archivedMatch;
      continue;
    }
  }
  
  if (currentTask && !inAchievements) {
    if (lastUpdatedDate) {
      currentTask.updatedAt = new Date(lastUpdatedDate).toISOString();
    }
    tasks.push(currentTask);
  }
  if (currentAchievement && inAchievements) {
    if (archivedDate) {
      currentAchievement.completedAt = new Date(archivedDate).toISOString();
    }
    achievements.push(currentAchievement);
  }
  
  return { tasks, achievements };
}

export function generateMarkdownFromTasks(tasks: Task[], achievements: Achievement[]): string {
  let markdown = '';

  tasks.forEach((task, index) => {
    const titleWithCreated = appendCreatedDate(task.title, task.createdAt);
    markdown += `# ${titleWithCreated}\n`;
    if (task.originalPrompt) {
      markdown += `> ${task.originalPrompt}\n`;
    }
    markdown += '\n';

    markdown += '## Subtasks\n';
    if (task.subtasks.length > 0) {
      task.subtasks.forEach(subtask => {
        const indent = '  '.repeat(subtask.nestedLevel);
        const checkbox = subtask.completed ? '[x]' : '[ ]';
        markdown += `${indent}* ${checkbox} ${subtask.content}\n`;
      });
      markdown += '\n';
    }

    markdown += `**Last Updated:** ${formatDate(task.updatedAt)}\n`;

    if (index < tasks.length - 1) {
      markdown += '\n---\n';
    }
  });

  if (achievements.length > 0) {
    markdown += '\n## Achievements\n\n';

    achievements.forEach((achievement, index) => {
      markdown += `# ${achievement.title} [completed: ${formatDate(achievement.completedAt)}]\n`;
      if (achievement.originalPrompt) {
        markdown += `> ${achievement.originalPrompt}\n`;
      }
      markdown += '\n';

      if (achievement.subtasks.length > 0) {
        achievement.subtasks.forEach(subtask => {
          const indent = '  '.repeat(subtask.nestedLevel);
          const checkbox = subtask.completed ? '[x]' : '[ ]';
          markdown += `${indent}* ${checkbox} ${subtask.content}\n`;
        });
      }

      markdown += `\n**Archived:** ${formatDate(achievement.completedAt)}\n`;

      if (index < achievements.length - 1) {
        markdown += '\n---\n';
      }
    });
  }

  return markdown.trim();
}

export function updateSubtaskContentInMarkdown(
  markdown: string,
  oldContent: string,
  newContent: string
): string {
  const lines = markdown.split('\n');

  const updatedLines = lines.map(line => {
    const subtaskMatch = line.match(/^(\s*)[-*] (\[[ x]\])(.+)$/);
    if (subtaskMatch) {
      const indent = subtaskMatch[1];
      const checkbox = subtaskMatch[2];
      const content = subtaskMatch[3].trim();
      if (content === oldContent) {
        return `${indent}- ${checkbox} ${newContent}`;
      }
    }
    return line;
  });

  return updatedLines.join('\n');
}

export function updateCheckboxInMarkdown(
  markdown: string,
  subtaskContent: string,
  completed: boolean
): string {
  const lines = markdown.split('\n');
  const newCheckbox = completed ? '[x]' : '[ ]';

  const updatedLines = lines.map(line => {
    const subtaskMatch = line.match(/^(\s*)[-*] (\[[ x]\])(.+)$/);
    if (subtaskMatch) {
      const indent = subtaskMatch[1];
      const content = subtaskMatch[3].trim();
      if (content === subtaskContent) {
        return `${indent}- ${newCheckbox} ${content}`;
      }
    }
    return line;
  });

  return updatedLines.join('\n');
}

export function updateSubtasksOrderInMarkdown(
  markdown: string,
  taskTitle: string,
  reorderedSubtasks: Subtask[]
): string {
  const lines = markdown.split('\n');
  let inTargetTask = false;
  let inAchievements = false;
  let subtaskStartIndex = -1;
  let subtaskEndIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('## Achievements')) {
      inAchievements = true;
      continue;
    }

    const taskMatch = line.match(/^# (.+)$/);
    if (taskMatch) {
      const title = taskMatch[1].trim();
      const { title: cleanTitle } = extractCreatedDate(title);

      if (cleanTitle === taskTitle) {
        inTargetTask = true;
      } else if (inTargetTask && !inAchievements) {
        inTargetTask = false;
      }
      continue;
    }

    if (inTargetTask && !inAchievements) {
      const subtaskMatch = line.match(/^(\s*)[-*] (\[[ x]\])(.+)$/);
      if (subtaskMatch) {
        if (subtaskStartIndex === -1) {
          subtaskStartIndex = i;
        }
        subtaskEndIndex = i;
      }
    }
  }

  if (subtaskStartIndex === -1) {
    return markdown;
  }

  const subtasksMd = reorderedSubtasks.map(subtask => {
    const indent = '  '.repeat(Math.min(subtask.nestedLevel, 6));
    const checkbox = subtask.completed ? '[x]' : '[ ]';
    return `${indent}* ${checkbox} ${subtask.content}`;
  });

  const beforeSubtasks = lines.slice(0, subtaskStartIndex);
  const afterSubtasks = lines.slice(subtaskEndIndex + 1);

  return [...beforeSubtasks, ...subtasksMd, ...afterSubtasks].join('\n');
}

export function reorderTasksInMarkdown(
  markdown: string,
  newOrder: Task[]
): string {
  const { achievements } = parseMarkdownTasks(markdown);
  return generateMarkdownFromTasks(newOrder, achievements);
}

export function updateTaskDescriptionInMarkdown(
  markdown: string,
  taskTitle: string,
  newDescription: string
): string {
  const PROMPT_PREFIX = '> ';
  const sanitizedDescription = newDescription.replace(/[\n\r]/g, ' ');
  const lines = markdown.split('\n');
  let inTargetTask = false;
  let descriptionUpdated = false;
  let taskStartIndex = -1;
  let promptLineIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.trim().startsWith('## Achievements')) {
      if (inTargetTask) break;
      continue;
    }

    const taskMatch = line.match(/^# (.+)$/);
    if (taskMatch) {
      const title = taskMatch[1].trim();
      const { title: cleanTitle } = extractCreatedDate(title);

      if (cleanTitle === taskTitle) {
        inTargetTask = true;
        taskStartIndex = i;
      } else if (inTargetTask) {
        break;
      }
      continue;
    }

    if (inTargetTask) {
      const promptMatch = line.match(/^> (.+)$/);
      if (promptMatch) {
        promptLineIndex = i;
        if (sanitizedDescription) {
          lines[i] = `${PROMPT_PREFIX}${sanitizedDescription}`;
        } else {
          lines[i] = '';
        }
        descriptionUpdated = true;
        continue;
      }

      const subtaskMatch = line.match(/^(\s*)[-*] (\[[ x]\])(.+)$/);
      if (subtaskMatch || line.match(/^##\s+Subtasks?$/i)) {
        if (sanitizedDescription && promptLineIndex === -1) {
          const insertIndex = lines.slice(0, i).filter(l => l.trim()).length > taskStartIndex + 1 ? i : taskStartIndex + 1;
          lines.splice(insertIndex, 0, `${PROMPT_PREFIX}${sanitizedDescription}`);
          descriptionUpdated = true;
        }
        break;
      }
    }
  }

  if (!descriptionUpdated && sanitizedDescription && taskStartIndex !== -1) {
    lines.splice(taskStartIndex + 1, 0, `${PROMPT_PREFIX}${sanitizedDescription}`);
  }

  return lines.join('\n') + '\n';
}

export function deleteSubtaskFromMarkdown(
  markdown: string,
  subtaskContent: string
): string {
  const lines = markdown.split('\n');

  const updatedLines = lines.filter(line => {
    const subtaskMatch = line.match(/^(\s*)[-*] (\[[ x]\])(.+)$/);
    if (subtaskMatch) {
      const content = subtaskMatch[3].trim();
      return content !== subtaskContent;
    }
    return true;
  });

  return updatedLines.join('\n');
}

export function appendSubtaskToMarkdown(
  markdown: string,
  taskTitle: string,
  newSubtask: Subtask
): string {
  const lines = markdown.split('\n');
  let inTargetTask = false;
  let inAchievements = false;
  let taskStartIndex = -1;
  let lastSubtaskIndex = -1;
  let hasSubtasksHeader = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('## Achievements')) {
      inAchievements = true;
      if (inTargetTask) break;
      continue;
    }

    const taskMatch = line.match(/^# (.+)$/);
    if (taskMatch) {
      const title = taskMatch[1].trim();
      const { title: cleanTitle } = extractCreatedDate(title);

      if (cleanTitle === taskTitle) {
        inTargetTask = true;
        taskStartIndex = i;
      } else if (inTargetTask && !inAchievements) {
        break;
      }
      continue;
    }

    if (inTargetTask && !inAchievements) {
      // Check for Subtasks header
      if (line.match(/^##\s+Subtasks?$/i)) {
        hasSubtasksHeader = true;
        continue;
      }

      // Track last subtask position
      const subtaskMatch = line.match(/^(\s*)[-*] (\[[ x]\])(.+)$/);
      if (subtaskMatch) {
        lastSubtaskIndex = i;
        continue;
      }
    }
  }

  if (taskStartIndex === -1) {
    return markdown;
  }

  // Build new subtask line
  const indent = '  '.repeat(Math.min(newSubtask.nestedLevel, 6));
  const newSubtaskLine = `${indent}* [ ] ${newSubtask.content}`;

  // Determine insert position
  let insertIndex;
  if (lastSubtaskIndex !== -1) {
    // Insert after last subtask
    insertIndex = lastSubtaskIndex + 1;
  } else if (hasSubtasksHeader) {
    // Insert after Subtasks header
    const subtasksHeaderIndex = lines.findIndex((line, idx) =>
      idx > taskStartIndex && line.match(/^##\s+Subtasks?$/i)
    );
    insertIndex = subtasksHeaderIndex + 1;
  } else {
    // No Subtasks header yet, need to add it
    let insertPos = taskStartIndex + 1;
    while (insertPos < lines.length &&
           (lines[insertPos].trim() === '' || lines[insertPos].startsWith('>'))) {
      insertPos++;
    }

    // Insert Subtasks header
    lines.splice(insertPos, 0, '', '## Subtasks');
    insertIndex = insertPos + 2;
  }

  // Insert new subtask
  lines.splice(insertIndex, 0, newSubtaskLine);

  return lines.join('\n');
}
