import { createOpencodeClient, type Session } from '@opencode-ai/sdk';

const OPENCODE_PORT = 51432;
const BASE_URL = `http://localhost:${OPENCODE_PORT}`;

let clientInstance: ReturnType<typeof createOpencodeClient> | null = null;

export interface ServerEvent {
  id?: string;
  type: string;
  sessionId?: string;
  content?: string;
  name?: string;
  message?: string;
  properties?: Record<string, unknown>;
}

function getClient() {
  if (!clientInstance) {
    clientInstance = createOpencodeClient({
      baseUrl: BASE_URL,
    });
  }
  return clientInstance;
}

export function getOpenCodeClient() {
  return getClient();
}

export async function checkServerHealth(): Promise<{ healthy: boolean; version: string }> {
  try {
    const client = getClient();
    await client.session.list();
    return { healthy: true, version: '' };
  } catch {
    return { healthy: false, version: '' };
  }
}

export async function fetchSessions(): Promise<Session[]> {
  const client = getClient();
  const response = await client.session.list();
  return response.data ?? [];
}

export async function createSession(title: string): Promise<Session> {
  const client = getClient();
  const response = await client.session.create({ body: { title } });
  return response.data!;
}

export async function deleteSession(id: string): Promise<boolean> {
  const client = getClient();
  const response = await client.session.delete({ path: { id } });
  return response.data ?? false;
}

export async function sendPrompt(
  sessionId: string,
  prompt: string,
  model?: { providerID: string; modelID: string }
): Promise<void> {
  const client = getClient();
  const payload: any = {
    parts: [{ type: 'text', text: prompt }],
  };
  if (model) {
    payload.model = model;
  }
  await client.session.prompt({ path: { id: sessionId }, body: payload });
}

export async function sendPromptAsync(
  sessionId: string,
  prompt: string,
  model?: { providerID: string; modelID: string }
): Promise<void> {
  const client = getClient();
  const payload: any = {
    parts: [{ type: 'text', text: prompt }],
  };
  if (model) {
    payload.model = model;
  }
  await client.session.promptAsync({ path: { id: sessionId }, body: payload });
}

export async function subscribeToEvents(
  sessionId?: string
): Promise<AsyncIterable<ServerEvent>> {
  const client = getClient();
  const events = await client.global.event();
  const stream = events.stream as AsyncGenerator<Record<string, unknown>>;
  
  // Track part types by partID to properly handle deltas
  const partTypes = new Map<string, string>();

  return {
    [Symbol.asyncIterator]: () => {
      const iterator = stream[Symbol.asyncIterator]();
      return {
        next: async (): Promise<IteratorResult<ServerEvent>> => {
          try {
            const result = await iterator.next();
            if (result.done) {
              return { value: undefined as any, done: true };
            }
            const mapped = mapServerEvent(result.value, sessionId, partTypes);
            if (mapped) {
              return { value: mapped, done: false };
            }
            return { value: undefined as any, done: false };
          } catch (error) {
            console.warn('Event stream error:', error);
            return { value: undefined as any, done: true };
          }
        },
        return: async () => {
          return { value: undefined as any, done: true };
        },
        throw: async () => {
          return { value: undefined as any, done: true };
        },
      };
    },
  };
}

function mapServerEvent(event: any, filterSessionId?: string, partTypes?: Map<string, string>): ServerEvent | null {
  const wrapper = event.payload || event;
  const props = wrapper.properties || {};
  const part = props.part || {};
  // Note: sessionID is capitalized in the actual events
  const sessionId = props.sessionID || wrapper.sessionID || event.sessionID;
  const eventType = wrapper.type;

  if (filterSessionId && sessionId && sessionId !== filterSessionId) {
    return null;
  }

  if (eventType === 'session' && sessionId) {
    return { type: 'session', sessionId };
  }

  if (eventType === 'session.status') {
    const status = props.status?.type;
    if (status === 'idle') {
      return { type: 'done', sessionId, message: '\nDone!' };
    }
  }

  // Handle session.idle as done signal
  if (eventType === 'session.idle' && sessionId) {
    return { type: 'done', sessionId, message: '\nDone!' };
  }

  if (eventType === 'message.part.updated') {
    const partType = part.type;
    const partId = part.id;
    
    // Track part type for delta handling (only for text/reasoning which have deltas)
    if (partId && partType && partTypes && (partType === 'text' || partType === 'reasoning')) {
      partTypes.set(partId, partType);
    }

    if (partType === 'text' && part.text) {
      // Skip text updated events - we already show them via deltas
      // Only show the final version if we haven't seen deltas for this part
      if (partId && partTypes && partTypes.has(partId)) {
        return null;
      }
      return { type: 'text', sessionId, content: part.text };
    }
    if (partType === 'tool' && part.state?.status === 'completed') {
      return { type: 'tool', sessionId, name: part.tool || part.name || 'tool' };
    }
    if (partType === 'step-start') {
      return { type: 'step-start', sessionId };
    }
    if (partType === 'step-end' || partType === 'step-finish') {
      return { type: 'step-end', sessionId };
    }
    if (partType === 'reasoning') {
      // Skip reasoning updated events - we already show them via deltas
      // Only show the final version if we haven't seen deltas for this part
      const partId = part.id;
      if (partId && partTypes && partTypes.has(partId)) {
        // We've seen deltas for this part, skip the final update
        return null;
      }
      const content = part.text || part.summary || part.thought || '';
      return { type: 'reasoning', sessionId, content };
    }
    if (partType === 'tool-result') {
      return { type: 'tool-result', sessionId, name: part.name || 'tool' };
    }
  }

  // Handle message.part.delta - text streaming
  if (eventType === 'message.part.delta') {
    if (props.field === 'text' && props.delta) {
      // Check if this delta is for a reasoning part
      const partId = props.partID;
      const partType = partId && partTypes ? partTypes.get(partId) : undefined;
      
      if (partType === 'reasoning') {
        return { type: 'reasoning', sessionId, content: props.delta };
      }
      return { type: 'text', sessionId, content: props.delta };
    }
  }

  if (eventType === 'message.updated') {
    const info = props.info || {};
    if (info.role === 'assistant' && info.completed) {
      return { type: 'message-complete', sessionId };
    }
  }

  return null;
}

export type { Session };
