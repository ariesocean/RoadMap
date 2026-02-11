import { create } from 'zustand';
import type { Session, Message } from './types';

const SESSIONS_STORAGE_KEY = 'roadmap-sessions';
const ACTIVE_SESSION_KEY = 'roadmap-active-session';

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function generateMessageId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function validateSession(session: unknown): session is Session {
  if (!session || typeof session !== 'object') return false;
  const s = session as Session;
  return (
    typeof s.id === 'string' &&
    typeof s.title === 'string' &&
    typeof s.createdAt === 'string' &&
    typeof s.lastUsedAt === 'string' &&
    Array.isArray(s.messages) &&
    s.messages.every(
      (m) =>
        typeof m.id === 'string' &&
        (m.role === 'user' || m.role === 'assistant') &&
        typeof m.content === 'string' &&
        typeof m.timestamp === 'string'
    )
  );
}

function loadSessionsFromStorage(): Record<string, Session> {
  if (typeof window === 'undefined') return {};

  try {
    const stored = localStorage.getItem(SESSIONS_STORAGE_KEY);
    if (!stored) return {};

    const parsed = JSON.parse(stored);
    if (typeof parsed !== 'object' || parsed === null) return {};

    const sessions: Record<string, Session> = {};
    for (const [id, session] of Object.entries(parsed)) {
      if (validateSession(session)) {
        sessions[id] = session;
      }
    }

    return sessions;
  } catch {
    console.warn('Failed to load sessions from storage, starting fresh');
    return {};
  }
}

function saveSessionsToStorage(sessions: Record<string, Session>): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
  } catch {
    console.warn('Failed to save sessions to storage');
  }
}

function getActiveSessionId(): string | null {
  if (typeof window === 'undefined') return null;

  try {
    return localStorage.getItem(ACTIVE_SESSION_KEY);
  } catch {
    return null;
  }
}

function setActiveSessionId(sessionId: string): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(ACTIVE_SESSION_KEY, sessionId);
  } catch {
    console.warn('Failed to save active session ID');
  }
}

function clearActiveSessionId(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(ACTIVE_SESSION_KEY);
  } catch {
    console.warn('Failed to clear active session ID');
  }
}

function createNewSession(firstMessage?: string): Session {
  const now = new Date().toISOString();
  const title = firstMessage
    ? firstMessage.length > 50
      ? firstMessage.substring(0, 50) + '...'
      : firstMessage
    : 'New Conversation';

  return {
    id: generateUUID(),
    title,
    createdAt: now,
    lastUsedAt: now,
    messages: [],
  };
}

export interface SessionStore {
  sessions: Record<string, Session>;
  activeSessionId: string | null;
  currentSession: Session | null;

  initializeSession: (firstMessage?: string) => Session;
  createNewSession: (firstMessage?: string) => Session;
  switchToSession: (sessionId: string) => void;
  deleteSession: (sessionId: string) => void;
  addMessage: (sessionId: string, role: 'user' | 'assistant', content: string) => void;
  updateSessionTitle: (sessionId: string, title: string) => void;
  getSession: (sessionId: string) => Session | null;
  getAllSessions: () => Session[];
  cleanupAllSessions: () => void;
}

export const useSessionStore = create<SessionStore>((set, get) => {
  let sessions = loadSessionsFromStorage();
  let activeSessionId = getActiveSessionId();
  let currentSession: Session | null = null;

  if (activeSessionId && sessions[activeSessionId]) {
    currentSession = sessions[activeSessionId];
  } else if (Object.keys(sessions).length > 0) {
    const firstSessionId = Object.keys(sessions)[0];
    activeSessionId = firstSessionId;
    currentSession = sessions[firstSessionId];
    setActiveSessionId(firstSessionId);
  } else {
    const newSession = createNewSession();
    sessions = { [newSession.id]: newSession };
    activeSessionId = newSession.id;
    currentSession = newSession;
    setActiveSessionId(newSession.id);
    saveSessionsToStorage(sessions);
  }

  const persistSessions = (newSessions: Record<string, Session>) => {
    sessions = newSessions;
    saveSessionsToStorage(sessions);
  };

  return {
    sessions,
    activeSessionId,
    currentSession,

    initializeSession: (firstMessage?: string) => {
      const existingSession = get().currentSession;
      if (existingSession) {
        return existingSession;
      }

      let session: Session;
      if (activeSessionId && sessions[activeSessionId]) {
        session = sessions[activeSessionId];
      } else {
        session = createNewSession(firstMessage);
        const newSessions = { ...sessions, [session.id]: session };
        persistSessions(newSessions);
        activeSessionId = session.id;
        setActiveSessionId(session.id);
      }

      currentSession = session;
      set({ sessions, activeSessionId, currentSession });
      return session;
    },

    createNewSession: (firstMessage?: string) => {
      const session = createNewSession(firstMessage);
      const newSessions = { ...sessions, [session.id]: session };
      persistSessions(newSessions);

      activeSessionId = session.id;
      currentSession = session;
      setActiveSessionId(session.id);

      set({ sessions: newSessions, activeSessionId, currentSession });
      return session;
    },

    switchToSession: (sessionId: string) => {
      if (!sessions[sessionId]) return;

      const session = sessions[sessionId];
      session.lastUsedAt = new Date().toISOString();
      persistSessions(sessions);

      activeSessionId = sessionId;
      currentSession = session;
      setActiveSessionId(sessionId);

      set({ sessions, activeSessionId, currentSession });
    },

    deleteSession: (sessionId: string) => {
      const newSessions = { ...sessions };
      delete newSessions[sessionId];
      persistSessions(newSessions);

      if (activeSessionId === sessionId) {
        clearActiveSessionId();
        if (Object.keys(newSessions).length > 0) {
          const firstSessionId = Object.keys(newSessions)[0];
          const session = newSessions[firstSessionId];
          session.lastUsedAt = new Date().toISOString();
          persistSessions(newSessions);

          activeSessionId = firstSessionId;
          currentSession = session;
          setActiveSessionId(firstSessionId);
          set({ sessions: newSessions, activeSessionId, currentSession });
        } else {
          const newSession = createNewSession();
          const finalSessions = { ...newSessions, [newSession.id]: newSession };
          persistSessions(finalSessions);

          activeSessionId = newSession.id;
          currentSession = newSession;
          setActiveSessionId(newSession.id);
          set({ sessions: finalSessions, activeSessionId, currentSession });
        }
      } else {
        set({ sessions: newSessions });
      }
    },

    addMessage: (sessionId: string, role: 'user' | 'assistant', content: string) => {
      const session = sessions[sessionId];
      if (!session) return;

      const message: Message = {
        id: generateMessageId(),
        role,
        content,
        timestamp: new Date().toISOString(),
      };

      const maxMessages = 50;
      const messages = [...session.messages, message];
      if (messages.length > maxMessages) {
        messages.splice(0, messages.length - maxMessages);
      }

      session.messages = messages;
      session.lastUsedAt = new Date().toISOString();
      persistSessions(sessions);

      if (activeSessionId === sessionId) {
        currentSession = session;
        set({ sessions, currentSession });
      } else {
        set({ sessions });
      }
    },

    updateSessionTitle: (sessionId: string, title: string) => {
      const session = sessions[sessionId];
      if (!session) return;

      session.title = title;
      persistSessions(sessions);

      if (activeSessionId === sessionId) {
        currentSession = session;
        set({ sessions, currentSession });
      } else {
        set({ sessions });
      }
    },

    getSession: (sessionId: string) => {
      return sessions[sessionId] || null;
    },

    getAllSessions: () => {
      return Object.values(sessions).sort(
        (a, b) => new Date(b.lastUsedAt).getTime() - new Date(a.lastUsedAt).getTime()
      );
    },

    cleanupAllSessions: () => {
      const sessionIds = Object.keys(sessions);
      const newSessions: Record<string, Session> = {};
      sessionIds.forEach((id) => {
        newSessions[id] = sessions[id];
      });
      persistSessions({});
      clearActiveSessionId();
      set({ sessions: {}, activeSessionId: null, currentSession: null });
    },
  };
});
