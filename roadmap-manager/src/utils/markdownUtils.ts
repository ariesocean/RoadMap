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
      
      const title = taskMatch[1].trim();
      if (inAchievements) {
        currentAchievement = {
          id: generateTaskId(),
          title,
          originalPrompt: '',
          completedAt: getCurrentISOString(),
          subtasks: [],
        };
      } else {
        currentTask = {
          id: generateTaskId(),
          title,
          originalPrompt: '',
          createdAt: getCurrentISOString(),
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
      const content = subtaskMatch[3].trim();
      const nestedLevel = Math.floor(indent / 2);
      
      const subtask: Subtask = {
        id: generateSubtaskId(),
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
  let markdown = '# Roadmap\n\n';
  
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

function getCurrentISOString(): string {
  return new Date().toISOString();
}