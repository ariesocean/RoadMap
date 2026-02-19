import type { OpenCodeHealthResponse, OpenCodePromptResponse, Session } from '@/store/types';
import { loadTasksFromFile, saveTasksToFile } from '@/services/fileService';
import { useModelStore } from '@/store/modelStore';
import { getOpenCodeClient, checkServerHealth as checkHealth, subscribeToEvents } from '@/services/opencodeClient';
import type { Session as SDKSession } from '@opencode-ai/sdk';

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

function convertSDKSessionToServerSession(sdkSession: SDKSession): ServerSession {
  return {
    id: sdkSession.id,
    version: sdkSession.version,
    projectID: sdkSession.projectID,
    directory: sdkSession.directory,
    title: sdkSession.title,
    time: {
      created: sdkSession.time?.created || Date.now(),
      updated: sdkSession.time?.updated || Date.now(),
    },
    summary: sdkSession.summary,
  };
}

export async function fetchSessionsFromServer(): Promise<ServerSession[]> {
  try {
    const client = getOpenCodeClient();
    const response = await client.session.list();
    const allSessions = response.data ?? [];
    
    const roadmapSessions = allSessions.filter((s: SDKSession) =>
      s.directory === '/Users/SparkingAries/VibeProjects/RoadMap' &&
      !s.parentID &&
      !/\(@.*subagent\)/i.test(s.title || '') &&
      !(s.title || '').startsWith('modal-prompt:')
    );
    
    return roadmapSessions.map(convertSDKSessionToServerSession);
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
    const client = getOpenCodeClient();
    const response = await client.session.create({ body: { title: session.title } });
    const newSession = response.data;
    if (!newSession) return null;
    return newSession.id;
  } catch (error) {
    console.error('Failed to sync session to server:', error);
    return null;
  }
}

export async function checkServerHealth(): Promise<OpenCodeHealthResponse> {
  try {
    const health = await checkHealth();
    return { status: health.healthy ? 'healthy' : 'unhealthy' };
  } catch {
    return { status: 'unhealthy' };
  }
}

export async function processPrompt(
  prompt: string,
  sessionId?: string
): Promise<OpenCodePromptResponse & { sessionId?: string }> {
  if (!prompt || !prompt.trim()) {
    return { success: false, message: 'Prompt cannot be empty' };
  }

  try {
    const { selectedModel } = useModelStore.getState();
    const modelInfo = selectedModel ? {
      providerID: selectedModel.providerID,
      modelID: selectedModel.modelID
    } : undefined;

    const client = getOpenCodeClient();
    
    let targetSessionId = sessionId;
    let isNewSession = false;
    
    if (!targetSessionId) {
      const response = await client.session.create({ body: { title: `navigate: ${prompt}` } });
      const newSession = response.data;
      if (!newSession) throw new Error('Failed to create session');
      targetSessionId = newSession.id;
      isNewSession = true;
    }

    const payload = {
      parts: [{ type: 'text' as const, text: `use navigate: ${prompt}` }],
    };
    if (modelInfo) {
      (payload as any).model = modelInfo;
    }
    
    await client.session.promptAsync({ path: { id: targetSessionId }, body: payload });
    
    return { 
      success: true, 
      message: 'Command executed',
      sessionId: isNewSession ? targetSessionId : undefined
    };
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
  onSessionId?: (sessionId: string) => void,
  onComplete?: () => void,
  onDiffContent?: (diffFiles: any[]) => void  // Added callback for diff content
): Promise<void> {
  if (!prompt || !prompt.trim()) {
    onError('Prompt cannot be empty');
    return;
  }

  try {
    const { selectedModel } = useModelStore.getState();
    const modelInfo = selectedModel ? {
      providerID: selectedModel.providerID,
      modelID: selectedModel.modelID
    } : undefined;

    const client = getOpenCodeClient();
    
    let targetSessionId = sessionId;
    
    if (!targetSessionId) {
      const response = await client.session.create({ body: { title: `modal-prompt: ${prompt}` } });
      const newSession = response.data;
      if (!newSession) throw new Error('Failed to create session');
      targetSessionId = newSession.id;
      if (onSessionId) {
        onSessionId(targetSessionId);
      }
    }

    const payload = {
      parts: [{ type: 'text' as const, text: prompt }],
    };
    if (modelInfo) {
      (payload as any).model = modelInfo;
    }

    const eventsPromise = subscribeToEvents(targetSessionId);

    await client.session.promptAsync({ path: { id: targetSessionId }, body: payload });

    const events = await eventsPromise;
    let isFinished = false;

    for await (const event of events) {
      if (isFinished) break;
      if (!event || !event.type) continue;

      if (event.type === 'text') {
        onText(event.content || '');
      } else if (event.type === 'reasoning') {
        if (onReasoning && event.content && event.content.trim()) {
          onReasoning(event.content);
        }
      } else if (event.type === 'tool-call') {
        onToolCall(event.name || 'unknown');
      } else if (event.type === 'tool') {
        onToolCall(event.name || 'tool');
      } else if (event.type === 'tool-result') {
        onToolResult(event.name || 'tool');
      } else if (event.type === 'diff') {
        // Handle diff events by passing the diff files to the callback
        console.log('[opencodeAPI] diff event received:', event);
        if (event.properties?.diffFiles && typeof onDiffContent === 'function') {
          console.log('[opencodeAPI] calling onDiffContent with:', event.properties.diffFiles);
          onDiffContent(Array.isArray(event.properties.diffFiles) ? event.properties.diffFiles : []);
        } else {
          console.log('[opencodeAPI] diff event missing properties or callback:', {
            hasProperties: !!event.properties?.diffFiles,
            hasCallback: typeof onDiffContent === 'function'
          });
        }
      } else if (event.type === 'done' || event.type === 'success') {
        if (!isFinished) {
          isFinished = true;
          onDone();
          if (onComplete) onComplete();
          return;
        }
      } else if (event.type === 'error' || event.type === 'failed') {
        throw new Error(event.message || 'Command failed');
      }
    }

    if (!isFinished) {
      isFinished = true;
      onDone();
      if (onComplete) onComplete();
    }
  } catch (error) {
    onError(error instanceof Error ? error.message : 'Failed to process prompt');
    if (onComplete) onComplete();
    throw error;
  }
}
