import { useCallback, useEffect } from 'react';
import { useSessionStore } from '@/store/sessionStore';
import { useModelStore } from '@/store/modelStore';
import { getOpenCodeClient, subscribeToEvents } from '@/services/opencodeClient';

export function useSession() {
  const {
    sessions,
    activeSessionId,
    currentSession,
    initializeSession,
    createNewSession,
    switchToSession,
    clearCurrentSession,
    deleteSession,
    addMessage,
    updateSessionTitle,
    getAllSessions,
    cleanupAllSessions,
    createOrUpdateSessionFromAPI,
    loadServerSessions,
    refreshSessions,
    startBackgroundRefresh,
    stopBackgroundRefresh,
    selectDefaultSession,
    serverSessions,
    isLoadingServerSessions,
  } = useSessionStore();

  useEffect(() => {
    initializeSession();
    
    const loadAndStart = async () => {
      await loadServerSessions();
      startBackgroundRefresh();
    };
    loadAndStart();
    
    return () => {
      stopBackgroundRefresh();
    };
  }, []);

  const handleCreateNewSession = useCallback((firstMessage?: string) => {
    return createNewSession(firstMessage);
  }, [createNewSession]);

  const handleSwitchToSession = useCallback((sessionId: string) => {
    switchToSession(sessionId);
  }, [switchToSession]);

  const handleDeleteSession = useCallback((sessionId: string) => {
    deleteSession(sessionId);
  }, [deleteSession]);

  const handleAddMessage = useCallback(
    (sessionId: string, role: 'user' | 'assistant', content: string) => {
      addMessage(sessionId, role, content);
    },
    [addMessage]
  );

  const handleUpdateSessionTitle = useCallback((sessionId: string, title: string) => {
    updateSessionTitle(sessionId, title);
  }, [updateSessionTitle]);

  const handleCreateOrUpdateSessionFromAPI = useCallback((apiSessionId: string, apiSessionName: string) => {
    return createOrUpdateSessionFromAPI(apiSessionId, apiSessionName);
  }, [createOrUpdateSessionFromAPI]);

  const handleSubmitWithSession = useCallback(
    async (prompt: string, onComplete?: () => void) => {
      if (!activeSessionId || !currentSession) {
        console.error('No active session');
        return;
      }

      if (!prompt || !prompt.trim()) {
        console.error('Prompt cannot be empty');
        return;
      }

      addMessage(activeSessionId, 'user', prompt);

      try {
        const client = getOpenCodeClient();
        const { selectedModel } = useModelStore.getState();
        const modelInfo = selectedModel ? {
          providerID: selectedModel.providerID,
          modelID: selectedModel.modelID
        } : undefined;

      const payload = {
        parts: [{ type: 'text' as const, text: prompt }],
      };
      if (modelInfo) {
        (payload as any).model = modelInfo;
      }

      const eventsPromise = subscribeToEvents(activeSessionId);
      const promptPromise = client.session.promptAsync({ path: { id: activeSessionId }, body: payload });

      await Promise.all([eventsPromise, promptPromise]);

      const events = await eventsPromise;
        let resultContent = '';
        let isFinished = false;

        for await (const event of events) {
          if (isFinished) break;

          if (!event || !event.type) continue;

          if (event.type === 'text') {
            resultContent += event.content || '';
          } else if (event.type === 'done' || event.type === 'success') {
            if (!isFinished) {
              isFinished = true;
              if (resultContent) {
                addMessage(activeSessionId, 'assistant', resultContent);
              }
              if (currentSession.title === 'New Conversation' && resultContent) {
                const title = resultContent.length > 50
                  ? resultContent.substring(0, 50) + '...'
                  : resultContent;
                updateSessionTitle(activeSessionId, title);
              }
              onComplete?.();
            }
          }
        }

        if (!isFinished && resultContent) {
          addMessage(activeSessionId, 'assistant', resultContent);
          onComplete?.();
        }
      } catch (error) {
        console.error('Failed to execute prompt with session:', error);
        throw error;
      }
    },
    [activeSessionId, currentSession, addMessage, updateSessionTitle]
  );

  return {
    sessions,
    activeSessionId,
    currentSession,
    serverSessions,
    isLoadingServerSessions,
    initializeSession,
    createNewSession: handleCreateNewSession,
    switchToSession: handleSwitchToSession,
    clearCurrentSession,
    deleteSession: handleDeleteSession,
    addMessage: handleAddMessage,
    updateSessionTitle: handleUpdateSessionTitle,
    getAllSessions,
    cleanupAllSessions,
    submitWithSession: handleSubmitWithSession,
    createOrUpdateSessionFromAPI: handleCreateOrUpdateSessionFromAPI,
    loadServerSessions,
    refreshSessions,
    selectDefaultSession,
  };
}
