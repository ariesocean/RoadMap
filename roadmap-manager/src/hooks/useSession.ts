import { useCallback, useEffect } from 'react';
import { useSessionStore } from '@/store/sessionStore';
import { useModelStore } from '@/store/modelStore';

const isTauri = typeof window !== 'undefined' && (window as any).__TAURI__;

export function useSession() {
  const {
    sessions,
    activeSessionId,
    currentSession,
    initializeSession,
    createNewSession,
    switchToSession,
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

      addMessage(activeSessionId, 'user', prompt);

      try {
        const { selectedModel } = useModelStore.getState();
        const modelInfo = selectedModel ? {
          providerID: selectedModel.providerID,
          modelID: selectedModel.modelID
        } : undefined;

        if (isTauri) {
          const { invoke } = await import('@tauri-apps/api/core');
          const { listen } = await import('@tauri-apps/api/event');

          let resultContent = '';
          let isFinished = false;

          const unlisten = await listen<any>('execute-navigate-event', (event) => {
            const data = event.payload;

            if (data.type === 'text') {
              resultContent += data.content || '';
            } else if (data.type === 'done' || data.type === 'success') {
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
          });

          await invoke('execute_navigate', {
            prompt,
            sessionId: activeSessionId,
            model: modelInfo,
          });

          setTimeout(() => {
            unlisten();
            if (!isFinished && resultContent) {
              addMessage(activeSessionId, 'assistant', resultContent);
              onComplete?.();
            }
          }, 2000);

          return;
        }
        
        const response = await fetch('/api/execute-navigate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt, sessionId: activeSessionId, model: modelInfo }),
        });

        if (!response.ok) {
          throw new Error('Failed to start command');
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('No response body');
        }

        const decoder = new TextDecoder();
        let resultContent = '';
        let isFinished = false;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const text = decoder.decode(value);
          const lines = text.split('\n');

          for (const line of lines) {
            if (!line.trim() || !line.startsWith('data: ')) continue;

            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === 'text') {
                resultContent += data.content || '';
              } else if (data.type === 'done' || data.type === 'success') {
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
            } catch {
              // Skip invalid JSON lines
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
