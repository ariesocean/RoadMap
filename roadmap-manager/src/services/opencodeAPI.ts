import type { OpenCodeHealthResponse, OpenCodePromptResponse } from '@/store/types';
import { loadTasksFromFile } from '@/services/fileService';

export async function checkServerHealth(): Promise<OpenCodeHealthResponse> {
  try {
    await loadTasksFromFile();
    return { status: 'healthy' };
  } catch {
    return { status: 'unhealthy' };
  }
}

export async function processPrompt(_prompt: string): Promise<OpenCodePromptResponse> {
  try {
    return { success: true, message: 'Command executed' };
  } catch (error) {
    return { success: false, message: String(error) };
  }
}

export async function fetchTasks() {
  return loadTasksFromFile();
}

export async function toggleSubtaskCompletion(_taskId: string, subtaskId: string): Promise<void> {
  const { tasks, achievements } = await loadTasksFromFile();
  let found = false;

  for (const task of tasks) {
    for (const subtask of task.subtasks) {
      if (subtask.id === subtaskId) {
        subtask.completed = !subtask.completed;
        found = true;
        break;
      }
    }
  }

  if (!found) {
    for (const achievement of achievements) {
      for (const subtask of achievement.subtasks) {
        if (subtask.id === subtaskId) {
          subtask.completed = !subtask.completed;
          found = true;
          break;
        }
      }
    }
  }
}
