import type { Task, Subtask, Achievement } from '@/store/types';
import { generateTaskId as generateTaskIdUtil, generateSubtaskId as generateSubtaskIdUtil } from '@/utils/idGenerator';
import { getCurrentISOString } from '@/utils/timestamp';

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

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('## Achievements')) {
      inAchievements = true;
      if (currentTask) {
        tasks.push(currentTask);
        currentTask = null;
      }
      continue;
    }

    const taskMatch = line.match(/^# (.+)$/);
    if (taskMatch) {
      if (currentTask && !inAchievements) {
        tasks.push(currentTask);
      }
      if (currentAchievement && inAchievements) {
        achievements.push(currentAchievement);
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
    }
  }
  
  if (currentTask && !inAchievements) {
    tasks.push(currentTask);
  }
  if (currentAchievement && inAchievements) {
    achievements.push(currentAchievement);
  }
  
  return { tasks, achievements };
}

export function generateMarkdownFromTasks(tasks: Task[], achievements: Achievement[]): string {
  let markdown = '';

  tasks.forEach(task => {
    markdown += `# ${task.title}\n`;
    if (task.originalPrompt) {
      markdown += `> ${task.originalPrompt}\n`;
    }
    markdown += '\n';

    task.subtasks.forEach(subtask => {
      const indent = '  '.repeat(subtask.nestedLevel);
      const checkbox = subtask.completed ? '[x]' : '[ ]';
      markdown += `${indent}- ${checkbox} ${subtask.content}\n`;
    });

    markdown += '\n';
  });

  if (achievements.length > 0) {
    markdown += '## Achievements\n\n';

    achievements.forEach(achievement => {
      markdown += `# ${achievement.title}\n`;
      if (achievement.originalPrompt) {
        markdown += `> ${achievement.originalPrompt}\n`;
      }
      markdown += '\n';

        achievement.subtasks.forEach(subtask => {
          const indent = '  '.repeat(subtask.nestedLevel);
          const checkbox = subtask.completed ? '[x]' : '[ ]';
          markdown += `${indent}- ${checkbox} ${subtask.content}\n`;
        });

      markdown += '\n';
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
  let taskStartIndex = -1;
  let taskEndIndex = -1;
  let originalTitleLine = '';
  let originalPrompt = '';
  let hasSubtasksHeader = false;
  let lastUpdatedLine = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('## Achievements')) {
      inAchievements = true;
      if (inTargetTask) {
        taskEndIndex = i;
        break;
      }
      continue;
    }

    const taskMatch = line.match(/^# (.+)$/);
    if (taskMatch) {
      const title = taskMatch[1].trim();
      const { title: cleanTitle } = extractCreatedDate(title);

      if (cleanTitle === taskTitle) {
        inTargetTask = true;
        taskStartIndex = i;
        originalTitleLine = line;
      } else if (inTargetTask && !inAchievements) {
        taskEndIndex = i;
        break;
      }
      continue;
    }

    if (inTargetTask && !inAchievements) {
      const promptMatch = line.match(/^> (.+)$/);
      if (promptMatch) {
        originalPrompt = line;
        continue;
      }

      if (line.match(/^##\s+Subtasks?$/i)) {
        hasSubtasksHeader = true;
        continue;
      }

      const subtaskMatch = line.match(/^(\s*)[-*] (\[[ x]\])(.+)$/);
      if (subtaskMatch) {
        const nextLine = lines[i + 1];
        if (!nextLine || (!nextLine.match(/^(\s*)[-*] (\[[ x]\])(.+)$/) && !nextLine.startsWith('#'))) {
          taskEndIndex = i + 1;
        }
        continue;
      }

      if (line.startsWith('**Last Updated:**')) {
        lastUpdatedLine = line;
        continue;
      }

      if (line.startsWith('# ') && !line.startsWith('##')) {
        taskEndIndex = i;
        break;
      }
    }
  }

  if (taskStartIndex === -1 || !originalTitleLine) {
    return markdown;
  }

  if (taskEndIndex === -1) {
    taskEndIndex = lines.length;
  }

  const subtasksMd = reorderedSubtasks.map(subtask => {
    const indent = '  '.repeat(Math.min(subtask.nestedLevel, 6));
    const checkbox = subtask.completed ? '[x]' : '[ ]';
    return `${indent}* ${checkbox} ${subtask.content}`;
  }).join('\n');

  const newTaskSectionParts: string[] = [];
  newTaskSectionParts.push(originalTitleLine);
  if (originalPrompt) {
    newTaskSectionParts.push('');
    newTaskSectionParts.push(originalPrompt);
  }
  newTaskSectionParts.push('');
  if (hasSubtasksHeader) {
    newTaskSectionParts.push('## Subtasks');
  }
  newTaskSectionParts.push(subtasksMd);
  if (lastUpdatedLine) {
    newTaskSectionParts.push('');
    newTaskSectionParts.push(lastUpdatedLine);
  }

  const newTaskSection = newTaskSectionParts.join('\n');

  const beforeTask = lines.slice(0, taskStartIndex);
  const afterTask = lines.slice(taskEndIndex);

  return [...beforeTask, newTaskSection, ...afterTask].join('\n');
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
