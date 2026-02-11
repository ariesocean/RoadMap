import type { Task, Subtask, Achievement } from '@/store/types';

export function generateTaskId(): string {
  return `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function generateSubtaskId(): string {
  return `sub-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
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

function getCurrentISOString(): string {
  return new Date().toISOString();
}