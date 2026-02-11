import type { OpenCodeHealthResponse, OpenCodePromptResponse, Session } from '@/store/types';
import { loadTasksFromFile } from '@/services/fileService';

export interface ServerSessionResponse {
  sessions: ServerSession[];
}

export interface FetchSessionsError {
  type: 'network' | 'auth' | 'server';
  message: string;
}

export interface ServerSessionTime {
  created: number;
  updated: number;
}

export interface ServerSession {
  id: string;
  slug?: string;
  version?: string;
  projectID?: string;
  directory?: string;
  title: string;
  time: ServerSessionTime;
  summary?: {
    additions: number;
    deletions: number;
    files: number;
  };
  [key: string]: unknown;
}

function getAuthHeader(): string {
  const password = import.meta.env?.VITE_OPENCODE_SERVER_PASSWORD || '';
  const username = 'opencode';
  const credentials = btoa(`${username}:${password}`);
  return `Basic ${credentials}`;
}

export async function fetchSessionsFromServer(): Promise<ServerSession[]> {
  try {
    const response = await fetch('/session', {
      method: 'GET',
      headers: {
        'Authorization': getAuthHeader(),
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error('Authentication failed - check server credentials');
      } else if (response.status >= 500) {
        throw new Error('Server error - please try again later');
      } else {
        throw new Error(`Failed to fetch sessions: ${response.statusText}`);
      }
    }

    const data = await response.json();
    
    if (Array.isArray(data)) {
      return data;
    } else if (data && Array.isArray(data.sessions)) {
      return data.sessions;
    }
    
    return [];
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Unable to connect to server - check your connection');
    }
    throw error;
  }
}

export function convertServerSessionToLocal(serverSession: ServerSession): Omit<Session, 'messages'> {
  return {
    id: serverSession.id,
    title: serverSession.title,
    createdAt: new Date(serverSession.time.created).toISOString(),
    lastUsedAt: new Date(serverSession.time.updated).toISOString(),
  };
}

export function showToastNotification(message: string, type: 'info' | 'error' | 'warning'): void {
  if (typeof window !== 'undefined' && (window as any).showToast) {
    (window as any).showToast(message, type);
  } else {
    console.log(`[Toast ${type}]: ${message}`);
  }
}

export async function syncLocalSessionToServer(session: Session): Promise<string | null> {
  try {
    const response = await fetch('/session', {
      method: 'POST',
      headers: {
        'Authorization': getAuthHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: session.title,
        created_at: session.createdAt,
        last_used_at: session.lastUsedAt,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to sync session to server');
    }

    const data = await response.json();
    return data.id || null;
  } catch (error) {
    console.error('Failed to sync session to server:', error);
    return null;
  }
}

export async function checkServerHealth(): Promise<OpenCodeHealthResponse> {
  try {
    await loadTasksFromFile();
    return { status: 'healthy' };
  } catch {
    return { status: 'unhealthy' };
  }
}

export async function processPrompt(
  prompt: string,
  sessionId?: string
): Promise<OpenCodePromptResponse> {
  try {
    const body = sessionId ? { prompt, sessionId } : { prompt };
    const response = await fetch('/api/execute-navigate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Failed to execute prompt');
    }

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
