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

export async function executeModalPrompt(
  prompt: string,
  onText: (text: string) => void,
  onToolCall: (name: string) => void,
  onToolResult: (name: string) => void,
  onDone: () => void,
  onError: (error: string) => void
): Promise<void> {
  try {
    const response = await fetch('/api/execute-modal-prompt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Failed to execute modal prompt');
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let isFinished = false;
    const processedEvents = new Set<string>();

    const processEvent = (eventId: string, handler: () => void) => {
      if (processedEvents.has(eventId)) return;
      processedEvents.add(eventId);
      handler();
    };

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const text = decoder.decode(value);
      const lines = text.split('\n');

      for (const line of lines) {
        if (!line.trim() || !line.startsWith('data: ')) continue;

        try {
          const data = JSON.parse(line.slice(6));
          const eventId = data.id || `${data.type}-${data.sessionId}-${Date.now()}`;

          if (data.type === 'text') {
            processEvent(eventId, () => onText(data.content || ''));
          } else if (data.type === 'tool-call') {
            processEvent(eventId, () => onToolCall(data.name || 'unknown'));
          } else if (data.type === 'tool-result') {
            processEvent(eventId, () => onToolResult(data.name || 'tool'));
          } else if (data.type === 'done' || data.type === 'success') {
            if (!isFinished) {
              isFinished = true;
              onDone();
              return;
            }
          } else if (data.type === 'error' || data.type === 'failed') {
            throw new Error(data.message || 'Command failed');
          }
        } catch {
          // Skip invalid JSON lines
        }
      }
    }

    if (!isFinished) {
      isFinished = true;
      onDone();
    }
  } catch (error) {
    onError(error instanceof Error ? error.message : 'Failed to process prompt');
    throw error;
  }
}
