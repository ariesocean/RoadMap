import type { OpenCodeHealthResponse, OpenCodePromptResponse, Session } from '@/store/types';
import { loadTasksFromFile, saveTasksToFile } from '@/services/fileService';
import { useModelStore } from '@/store/modelStore';
import { isTauri } from '@tauri-apps/api/core';

async function invoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  if (isTauri()) {
    const { invoke } = await import('@tauri-apps/api/core');
    return invoke<T>(cmd, args);
  }
  throw new Error('Not running in Tauri');
}

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
  const password = (import.meta.env as any)?.VITE_OPENCODE_SERVER_PASSWORD || '';
  const username = 'opencode';
  const credentials = btoa(`${username}:${password}`);
  return `Basic ${credentials}`;
}

export async function fetchSessionsFromServer(): Promise<ServerSession[]> {
  if (isTauri()) {
    try {
      const sessions = await invoke<ServerSession[]>('get_sessions');
      return sessions;
    } catch (error) {
      console.warn('Could not fetch sessions via Tauri API:', error);
    }
  }

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
    const { selectedModel } = useModelStore.getState();
    const modelInfo = selectedModel ? {
      providerID: selectedModel.providerID,
      modelID: selectedModel.modelID
    } : undefined;

    if (isTauri()) {
      // Tauri 模式：直接调用 OpenCode 原生 API，不需要 Vite 服务器
      const { fetch: tauriFetch } = await import('@tauri-apps/plugin-http');
      const baseUrl = `http://127.0.0.1:51466`;

      // 如果没有 session，先创建
      let actualSessionId = sessionId;
      if (!actualSessionId) {
        const createRes = await tauriFetch(`${baseUrl}/session`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: `navigate: ${prompt}` }),
        });
        if (createRes.ok) {
          const data = await createRes.json();
          actualSessionId = data.id;
        }
      }

      if (!actualSessionId) {
        return { success: false, message: 'Failed to create session' };
      }

      // 发送消息
      const payload: any = {
        parts: [{ type: 'text', text: `use navigate: ${prompt}` }]
      };
      if (modelInfo) {
        payload.model = modelInfo;
      }

      const sendRes = await tauriFetch(`${baseUrl}/session/${actualSessionId}/prompt_async`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!sendRes.ok) {
        return { success: false, message: 'Failed to send prompt' };
      }

      return { success: true, message: 'Command executed' };
    }
    
    const body = sessionId 
      ? { prompt, sessionId, model: modelInfo }
      : { prompt, model: modelInfo };
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

export async function toggleSubtaskCompletion(subtaskId: string): Promise<void> {
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

  if (found) {
    await saveTasksToFile(tasks, achievements);
  }
}

export async function executeModalPrompt(
  prompt: string,
  sessionId: string | undefined | null,
  onText: (text: string) => void,
  onToolCall: (name: string) => void,
  onToolResult: (name: string) => void,
  onDone: () => void,
  onError: (error: string) => void,
  onReasoning?: (text: string) => void,
  onSessionId?: (sessionId: string) => void
): Promise<void> {
  try {
    const { selectedModel } = useModelStore.getState();
    const modelInfo = selectedModel ? {
      providerID: selectedModel.providerID,
      modelID: selectedModel.modelID
    } : undefined;

    if (isTauri()) {
      // Tauri 模式：直接调用 OpenCode 原生 API
      const { fetch: tauriFetch } = await import('@tauri-apps/plugin-http');
      const baseUrl = `http://127.0.0.1:51466`;

      // 如果没有 session，先创建
      let actualSessionId = sessionId;
      if (!actualSessionId) {
        const createRes = await tauriFetch(`${baseUrl}/session`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: `modal-prompt: ${prompt}` }),
        });
        if (createRes.ok) {
          const data = await createRes.json();
          actualSessionId = data.id;
        }
      }

      if (!actualSessionId) {
        throw new Error('Failed to create session');
      }

      // 发送消息
      const payload: any = {
        parts: [{ type: 'text', text: prompt }]
      };
      if (modelInfo) {
        payload.model = modelInfo;
      }

      const sendRes = await tauriFetch(`${baseUrl}/session/${actualSessionId}/prompt_async`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!sendRes.ok) {
        throw new Error('Failed to send prompt');
      }

      // TODO: 处理事件流
      onDone();
      return;
    }

    // Vite 模式
    const body: any = sessionId
      ? { prompt, sessionId }
      : { prompt };

    if (selectedModel) {
      body.model = {
        providerID: selectedModel.providerID,
        modelID: selectedModel.modelID
      };
    }

    const response = await fetch('/api/execute-modal-prompt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
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
    let eventCounter = 0;
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
        if (!line.trim().startsWith('data: ')) continue;

        try {
          const data = JSON.parse(line.trim().slice(6));
          const eventId = data.id || `${data.type}-${data.sessionId}-${eventCounter++}`;

          const eventType = data.type;
          
          if (eventType === 'session' && data.sessionId) {
            if (onSessionId) {
              onSessionId(data.sessionId);
            }
          } else if (eventType === 'text') {
            processEvent(eventId, () => onText(data.content || ''));
          } else if (eventType === 'reasoning') {
            if (onReasoning && data.content && data.content.trim()) {
              processEvent(eventId, () => onReasoning(data.content));
            }
          } else if (eventType === 'tool-call') {
            processEvent(eventId, () => onToolCall(data.name || 'unknown'));
          } else if (eventType === 'tool') {
            processEvent(eventId, () => onToolCall(data.name || 'tool'));
          } else if (eventType === 'tool-result') {
            processEvent(eventId, () => onToolResult(data.name || 'tool'));
          } else if (eventType === 'done' || eventType === 'success') {
            if (!isFinished) {
              isFinished = true;
              onDone();
              return;
            }
          } else if (eventType === 'error' || eventType === 'failed') {
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
