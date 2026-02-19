import { create } from 'zustand';
import type { Session, Message } from './types';
import { fetchSessionsFromServer, convertServerSessionToLocal, showToastNotification, type ServerSession } from '@/services/opencodeAPI';
import { createSession, deleteSession as deleteSessionFromSDK } from '@/services/opencodeClient';
import { generateUUID, generateMessageId } from '@/utils/idGenerator';
import { getCurrentISOString } from '@/utils/timestamp';
import { saveToLocalStorage, loadFromLocalStorage, removeFromLocalStorage } from '@/utils/storage';

const ACTIVE_SESSION_KEY = 'roadmap-active-session';

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
  createNewSession: (firstMessage?: string) => Promise<void>;
  switchToSession: (sessionId: string) => void;
  clearCurrentSession: () => void;
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
}

export const useSessionStore = create<SessionStore>((set, get) => {
  let sessions: Record<string, Session> = {};
  let activeSessionId = getActiveSessionId();
  let currentSession: Session | null = null;
  let serverSessions: ServerSession[] = [];
  let isLoadingServerSessions = false;
  let lastServerFetchTime: number | null = null;
  let backgroundRefreshInterval: ReturnType<typeof setInterval> | null = null;

  if (activeSessionId && sessions[activeSessionId]) {
    currentSession = sessions[activeSessionId];
  } else {
    const newSession = createNewSession();
    sessions = { [newSession.id]: newSession };
    activeSessionId = newSession.id;
    currentSession = newSession;
    setActiveSessionId(newSession.id);
  }

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
        sessions = { ...sessions, [session.id]: session };
        activeSessionId = session.id;
        setActiveSessionId(session.id);
      }

      currentSession = session;
      set({ sessions, activeSessionId, currentSession });
      return session;
    },

    createNewSession: async (firstMessage?: string) => {
      try {
        const serverTitle = firstMessage
          ? `navigate: ${firstMessage}`
          : 'navigate:';
        
        await createSession(serverTitle);
        
        await get().fetchServerSessions();
        
        const allSessions = Object.values(sessions);
        if (allSessions.length > 0) {
          const latestSession = allSessions.sort((a, b) => 
            new Date(b.lastUsedAt).getTime() - new Date(a.lastUsedAt).getTime()
          )[0];
          get().switchToSession(latestSession.id);
        }
      } catch (error) {
        console.error('Failed to create new session:', error);
      }
    },

    switchToSession: (sessionId: string) => {
      if (!sessions[sessionId]) return;

      const session = sessions[sessionId];
      session.lastUsedAt = new Date().toISOString();

      activeSessionId = sessionId;
      currentSession = session;
      setActiveSessionId(sessionId);

      set({ sessions, activeSessionId, currentSession });
    },

    clearCurrentSession: () => {
      activeSessionId = null;
      currentSession = null;
      clearActiveSessionId();

      set({ activeSessionId, currentSession });
    },

    deleteSession: async (sessionId: string) => {
      try {
        await deleteSessionFromSDK(sessionId);
      } catch (error) {
        console.warn('Failed to delete session from server:', error);
      }

      const newSessions = { ...sessions };
      delete newSessions[sessionId];

      if (activeSessionId === sessionId) {
        clearActiveSessionId();
        if (Object.keys(newSessions).length > 0) {
          const firstSessionId = Object.keys(newSessions)[0];
          const session = newSessions[firstSessionId];
          session.lastUsedAt = new Date().toISOString();

          activeSessionId = firstSessionId;
          currentSession = session;
          setActiveSessionId(firstSessionId);
          set({ sessions: newSessions, activeSessionId, currentSession });
        } else {
          const newSession = createNewSession();
          sessions = { [newSession.id]: newSession };

          activeSessionId = newSession.id;
          currentSession = newSession;
          setActiveSessionId(newSession.id);
          set({ sessions, activeSessionId, currentSession });
        }
      } else {
        sessions = newSessions;
        set({ sessions });
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
      sessions = {};
      clearActiveSessionId();
      set({ sessions: {}, activeSessionId: null, currentSession: null });
    },

    createOrUpdateSessionFromAPI: (apiSessionId: string, apiSessionName: string) => {
      const existingSession = sessions[apiSessionId];

      if (existingSession) {
        existingSession.title = apiSessionName;
        existingSession.lastUsedAt = new Date().toISOString();

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

      sessions = { ...sessions, [apiSessionId]: newSession };

      activeSessionId = apiSessionId;
      currentSession = newSession;
      setActiveSessionId(apiSessionId);

      set({ sessions, activeSessionId, currentSession });
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
        
        sessions = localFromServer;
        set({ sessions, serverSessions, lastServerFetchTime });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        if (errorMessage.includes('Authentication') || errorMessage.includes('401') || errorMessage.includes('403')) {
          showToastNotification('Authentication failed', 'warning');
        } else if (errorMessage.includes('Unable to connect') || errorMessage.includes('network')) {
          showToastNotification('Server unavailable', 'warning');
        } else if (errorMessage.includes('Server error') || errorMessage.includes('500')) {
          showToastNotification('Server error', 'error');
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
  };
});
