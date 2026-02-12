import { create } from 'zustand';
import type { Session, Message } from './types';
import { fetchSessionsFromServer, convertServerSessionToLocal, showToastNotification } from '@/services/opencodeAPI';
import { generateUUID, generateMessageId } from '@/utils/idGenerator';
import { getCurrentISOString } from '@/utils/timestamp';
import { saveToLocalStorage, loadFromLocalStorage, removeFromLocalStorage } from '@/utils/storage';

const SESSIONS_STORAGE_KEY = 'roadmap-sessions';
const ACTIVE_SESSION_KEY = 'roadmap-active-session';

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
    const stored = loadFromLocalStorage(SESSIONS_STORAGE_KEY);
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
    saveToLocalStorage(SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
  } catch {
    console.warn('Failed to save sessions to storage');
  }
}

function getActiveSessionId(): string | null {
  if (typeof window === 'undefined') return null;

  try {
    return loadFromLocalStorage(ACTIVE_SESSION_KEY);
  } catch {
    return null;
  }
}

function setActiveSessionId(sessionId: string): void {
  if (typeof window === 'undefined') return;

  try {
    saveToLocalStorage(ACTIVE_SESSION_KEY, sessionId);
  } catch {
    console.warn('Failed to save active session ID');
  }
}

function clearActiveSessionId(): void {
  if (typeof window === 'undefined') return;

  try {
    removeFromLocalStorage(ACTIVE_SESSION_KEY);
  } catch {
    console.warn('Failed to clear active session ID');
  }
}

function createNewSession(firstMessage?: string): Session {
  const now = getCurrentISOString();
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
  serverSessions: ServerSession[];
  isLoadingServerSessions: boolean;
  lastServerFetchTime: number | null;

  initializeSession: (firstMessage?: string) => Session;
  createNewSession: (firstMessage?: string) => Session;
  switchToSession: (sessionId: string) => void;
  deleteSession: (sessionId: string) => void;
  addMessage: (sessionId: string, role: 'user' | 'assistant', content: string) => void;
  updateSessionTitle: (sessionId: string, title: string) => void;
  getSession: (sessionId: string) => Session | null;
  getAllSessions: () => Session[];
  cleanupAllSessions: () => void;
  createOrUpdateSessionFromAPI: (apiSessionId: string, apiSessionName: string) => Session;
  fetchServerSessions: () => Promise<void>;
  loadServerSessions: () => Promise<void>;
  refreshSessions: () => Promise<void>;
  startBackgroundRefresh: () => void;
  stopBackgroundRefresh: () => void;
  selectDefaultSession: () => void;
  isLocalSession: (sessionId: string) => boolean;
  cleanupLocalSessions: () => void;
  syncSessionToServer: (sessionId: string) => Promise<void>;
}

export const useSessionStore = create<SessionStore>((set, get) => {
  let sessions = loadSessionsFromStorage();
  let activeSessionId = getActiveSessionId();
  let currentSession: Session | null = null;
  let serverSessions: ServerSession[] = [];
  let isLoadingServerSessions = false;
  let lastServerFetchTime: number | null = null;
  let backgroundRefreshInterval: ReturnType<typeof setInterval> | null = null;

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
    serverSessions,
    isLoadingServerSessions,
    lastServerFetchTime,

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

    createOrUpdateSessionFromAPI: (apiSessionId: string, apiSessionName: string) => {
      const existingSession = sessions[apiSessionId];

      if (existingSession) {
        existingSession.title = apiSessionName;
        existingSession.lastUsedAt = new Date().toISOString();
        persistSessions(sessions);

        if (activeSessionId === apiSessionId) {
          currentSession = existingSession;
          set({ sessions, activeSessionId, currentSession });
        } else {
          set({ sessions });
        }

        return existingSession;
      }

      const now = new Date().toISOString();
      const newSession: Session = {
        id: apiSessionId,
        title: apiSessionName,
        createdAt: now,
        lastUsedAt: now,
        messages: [],
      };

      const newSessions = { ...sessions, [apiSessionId]: newSession };
      persistSessions(newSessions);

      activeSessionId = apiSessionId;
      currentSession = newSession;
      setActiveSessionId(apiSessionId);

      set({ sessions: newSessions, activeSessionId, currentSession });
      return newSession;
    },
    fetchServerSessions: async () => {
      if (isLoadingServerSessions) return;
      
      isLoadingServerSessions = true;
      set({ isLoadingServerSessions: true });
      
      try {
        const fetchedSessions = await fetchSessionsFromServer();
        serverSessions = fetchedSessions;
        lastServerFetchTime = Date.now();
        
        const localFromServer: Record<string, Session> = {};
        for (const serverSession of fetchedSessions) {
          const converted = convertServerSessionToLocal(serverSession);
          localFromServer[serverSession.id] = {
            ...converted,
            messages: sessions[serverSession.id]?.messages || [],
          };
        }
        
        const mergedSessions = { ...localFromServer };
        for (const [id, session] of Object.entries(sessions)) {
          if (!localFromServer[id]) {
            mergedSessions[id] = session;
          }
        }
        
        sessions = mergedSessions;
        saveSessionsToStorage(sessions);
        set({ sessions, serverSessions, lastServerFetchTime });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        if (errorMessage.includes('Authentication') || errorMessage.includes('401') || errorMessage.includes('403')) {
          showToastNotification('Authentication failed - using local sessions only', 'warning');
        } else if (errorMessage.includes('Unable to connect') || errorMessage.includes('network')) {
          showToastNotification('Server unavailable - using local sessions only', 'warning');
        } else if (errorMessage.includes('Server error') || errorMessage.includes('500')) {
          showToastNotification('Server error - using local sessions only', 'error');
        }
      } finally {
        isLoadingServerSessions = false;
        set({ isLoadingServerSessions: false });
      }
    },
    
    loadServerSessions: async () => {
      await get().fetchServerSessions();
      get().selectDefaultSession();
    },
    
    refreshSessions: async () => {
      await get().fetchServerSessions();
    },
    
    startBackgroundRefresh: () => {
      if (backgroundRefreshInterval) return;
      
      backgroundRefreshInterval = setInterval(() => {
        get().fetchServerSessions();
      }, 30000);
    },
    
    stopBackgroundRefresh: () => {
      if (backgroundRefreshInterval) {
        clearInterval(backgroundRefreshInterval);
        backgroundRefreshInterval = null;
      }
    },
    
    selectDefaultSession: () => {
      const allSessions = Object.values(sessions);
      if (allSessions.length === 0) return;

      const sorted = allSessions.sort((a, b) => {
        const aIsNavigate = /navigate:/i.test(a.title);
        const bIsNavigate = /navigate:/i.test(b.title);

        if (aIsNavigate && !bIsNavigate) return -1;
        if (!aIsNavigate && bIsNavigate) return 1;

        const timeA = new Date(a.lastUsedAt).getTime();
        const timeB = new Date(b.lastUsedAt).getTime();
        if (timeA !== timeB) return timeB - timeA;

        const createdA = new Date(a.createdAt).getTime();
        const createdB = new Date(b.createdAt).getTime();
        if (createdA !== createdB) return createdB - createdA;

        return a.title.localeCompare(b.title);
      });

      if (sorted.length > 0 && sorted[0].id !== activeSessionId) {
        get().switchToSession(sorted[0].id);
      }
    },
    
    isLocalSession: (sessionId: string) => {
      const session = sessions[sessionId];
      if (!session) return false;
      const isFromServer = serverSessions.some(s => s.id === sessionId);
      return !isFromServer;
    },
    
    cleanupLocalSessions: () => {
      const localSessionIds = Object.keys(sessions).filter(id => {
        const session = sessions[id];
        if (!session.serverId) return true;
        const existsOnServer = serverSessions.some(s => s.id === session.serverId);
        return !existsOnServer;
      });
      
      const newSessions: Record<string, Session> = {};
      for (const [id, session] of Object.entries(sessions)) {
        if (!localSessionIds.includes(id)) {
          newSessions[id] = session;
        }
      }
      
      sessions = newSessions;
      saveSessionsToStorage(sessions);
      set({ sessions });
      
      if (activeSessionId && !sessions[activeSessionId]) {
        const remaining = Object.keys(sessions);
        if (remaining.length > 0) {
          get().switchToSession(remaining[0]);
        }
      }
    },
    
    syncSessionToServer: async (sessionId: string) => {
      const session = sessions[sessionId];
      if (!session) return;
      
      try {
        const response = await fetch('/session', {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${btoa('opencode:')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: session.title,
            created_at: session.createdAt,
            last_used_at: session.lastUsedAt,
          }),
        });
        
        if (!response.ok) return;
        
        const data = await response.json();
        if (data.id) {
          session.serverId = data.id;
          session.id = data.id;
          delete sessions[sessionId];
          sessions[data.id] = session;
          
          if (activeSessionId === sessionId) {
            activeSessionId = data.id;
            currentSession = session;
            setActiveSessionId(data.id);
          }
          
          saveSessionsToStorage(sessions);
          set({ sessions, activeSessionId, currentSession });
        }
      } catch (error) {
        console.error('Failed to sync session to server:', error);
      }
    },
  };
});
