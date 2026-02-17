import { useCallback, useEffect } from 'react';
import { useSessionStore } from '@/store/sessionStore';
import { useModelStore } from '@/store/modelStore';
import { isTauri } from '@tauri-apps/api/core';

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

        if (isTauri()) {
          // Tauri 模式：直接调用 OpenCode 原生 API，不需要 Vite 服务器
          const { fetch: tauriFetch } = await import('@tauri-apps/plugin-http');
          const baseUrl = `http://127.0.0.1:51466`;

          // 创建新会话
          const createRes = await tauriFetch(`${baseUrl}/session`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: `navigate: ${prompt}` }),
          });

          if (!createRes.ok) {
            throw new Error('Failed to create session');
          }

          const sessionData = await createRes.json();
          const sessionId = sessionData.id;

          // 发送消息
          const payload: any = {
            parts: [{ type: 'text', text: `use navigate: ${prompt}` }]
          };
          if (modelInfo) {
            payload.model = modelInfo;
          }

          const sendRes = await tauriFetch(`${baseUrl}/session/${sessionId}/prompt_async`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });

          if (!sendRes.ok) {
            throw new Error('Failed to send prompt');
          }

          // 监听事件
          const response = await tauriFetch(`${baseUrl}/event?session=${sessionId}`, {
            method: 'GET',
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
              if (!line.trim().startsWith('data: ')) continue;

              try {
                const data = JSON.parse(line.trim().slice(6));

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
              } catch (e) {
                console.error('Failed to parse event:', e);
              }
            }
          }

          if (!isFinished && resultContent) {
            addMessage(activeSessionId, 'assistant', resultContent);
            onComplete?.();
          }

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
