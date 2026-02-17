import { create } from 'zustand';
import type { TaskStore, Task, Achievement, Subtask } from './types';
import { loadTasksFromFile, readRoadmapFile, writeRoadmapFile } from '@/services/fileService';
import { updateCheckboxInMarkdown, updateSubtaskContentInMarkdown, updateSubtasksOrderInMarkdown, reorderTasksInMarkdown, updateTaskDescriptionInMarkdown, deleteSubtaskFromMarkdown, appendSubtaskToMarkdown } from '@/utils/markdownUtils';
import { generateSubtaskId } from '@/utils/idGenerator';
import { getCurrentISOString } from '@/utils/timestamp';
import { useResultModalStore, type ContentSegment } from './resultModalStore';
import { useSessionStore } from './sessionStore';
import { useModelStore } from './modelStore';
import { toggleSubtaskCompletion } from '@/services/opencodeAPI';
import { isTauri } from '@tauri-apps/api/core';

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  achievements: [],
  searchQuery: '',
  isLoading: false,
  isProcessing: false,
  currentPrompt: '',
  error: null,
  isConnected: true,

  setTasks: (tasks: Task[]) => set({ tasks }),
  
  setAchievements: (achievements: Achievement[]) => set({ achievements }),
  
  setSearchQuery: (searchQuery: string) => set({ searchQuery }),
  
  setLoading: (isLoading: boolean) => set({ isLoading }),
  
  setProcessing: (isProcessing: boolean) => set({ isProcessing }),
  
  setCurrentPrompt: (currentPrompt: string) => set({ currentPrompt }),
  
  setError: (error: string | null) => set({ error }),
  
  setConnected: (isConnected: boolean) => set({ isConnected }),

  refreshTasks: async () => {
    const { setLoading, setTasks, setAchievements, setError } = get();
    
    try {
      setLoading(true);
      setError(null);
      
      const data = await loadTasksFromFile();
      setTasks(data.tasks);
      setAchievements(data.achievements);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh tasks');
    } finally {
      setLoading(false);
    }
  },

  submitPrompt: async (prompt: string) => {
    const { isProcessing } = get();
    if (isProcessing) return;

    const { setProcessing, setCurrentPrompt, refreshTasks, setError } = get();
    setProcessing(true);
    const { openModal, appendSegment, setStreaming } = useResultModalStore.getState();
    const { createOrUpdateSessionFromAPI, currentSession } = useSessionStore.getState();
    const { selectedModel } = useModelStore.getState();

    let sessionInfo: { title: string; prompt: string } | undefined = undefined;
    if (currentSession) {
      sessionInfo = {
        title: currentSession.title,
        prompt: prompt,
      };
    }

    let modelInfo: { providerID: string; modelID: string } | undefined = undefined;
    if (selectedModel) {
      modelInfo = {
        providerID: selectedModel.providerID,
        modelID: selectedModel.modelID,
      };
    }

    openModal('Processing', sessionInfo, modelInfo);

    const createSegment = (type: ContentSegment['type'], content: string, metadata?: ContentSegment['metadata']): ContentSegment => ({
      id: `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      content,
      timestamp: Date.now(),
      metadata,
    });

    try {
      const body: any = currentSession
        ? { prompt, sessionId: currentSession.id, model: modelInfo }
        : { prompt, model: modelInfo };

      setStreaming(true);

      if (isTauri()) {
        // Tauri 模式：直接调用 OpenCode 原生 API，不需要 Vite 服务器
        const { fetch: tauriFetch } = await import('@tauri-apps/plugin-http');
        const OPENCODE_PORT = 51466;
        const baseUrl = `http://127.0.0.1:${OPENCODE_PORT}`;

        // 如果没有 session，先创建
        let actualSessionId = currentSession?.id;
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

        // 发送消息到 OpenCode
        const navigatePrompt = `use navigate: ${prompt}`;
        const payload: any = {
          parts: [{ type: 'text', text: navigatePrompt }]
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

        // 监听事件流
        const response = await tauriFetch(`${baseUrl}/event?session=${actualSessionId}`, {
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

              if (data.sessionId && data.sessionName) {
                createOrUpdateSessionFromAPI(data.sessionId, data.sessionName);
              }

              if (eventType === 'session' && data.sessionId) {
                const { setCurrentSessionId } = useResultModalStore.getState();
                setCurrentSessionId(data.sessionId);
              } else if (eventType === 'start' || eventType === 'started') {
                // SKIP
              } else if (eventType === 'text') {
                processEvent(eventId, () => appendSegment(createSegment('text', data.content || '')));
              } else if (eventType === 'tool-call') {
                // SKIP
              } else if (eventType === 'tool') {
                processEvent(eventId, () => appendSegment(createSegment('tool', '', { tool: data.name || 'unknown' })));
              } else if (eventType === 'tool-result') {
                processEvent(eventId, () => appendSegment(createSegment('tool-result', '', { tool: data.name || 'unknown' })));
              } else if (eventType === 'reasoning') {
                if (data.content && data.content.trim()) {
                  processEvent(eventId, () => appendSegment(createSegment('reasoning', data.content || '')));
                }
              } else if (eventType === 'done' || eventType === 'success') {
                if (!isFinished) {
                  isFinished = true;
                  appendSegment(createSegment('done', data.message || ''));
                  setStreaming(false);
                  setTimeout(async () => {
                    await refreshTasks();
                    setCurrentPrompt('');
                  }, 500);
                }
              } else if (eventType === 'error' || eventType === 'failed') {
                if (!isFinished) {
                  isFinished = true;
                  appendSegment(createSegment('error', data.message || 'Error'));
                  setError(data.message || 'Command failed');
                  setStreaming(false);
                }
              } else if (eventType === 'timeout') {
                if (!isFinished) {
                  isFinished = true;
                  appendSegment(createSegment('timeout', data.message || ''));
                  setStreaming(false);
                }
              }
            } catch (e) {
              console.error('Failed to parse event:', e);
            }
          }
        }

        return;
      }

      const response = await fetch('/api/execute-navigate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error('Failed to start command');
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
          if (!line.trim() || !line.startsWith('data: ')) continue;

          try {
            const data = JSON.parse(line.slice(6));
            const eventId = data.id || `${data.type}-${data.sessionId}-${eventCounter++}`;
            const eventType = data.type;

            if (data.sessionId && data.sessionName) {
              createOrUpdateSessionFromAPI(data.sessionId, data.sessionName);
            }

            if (eventType === 'session' && data.sessionId) {
              const { setCurrentSessionId } = useResultModalStore.getState();
              setCurrentSessionId(data.sessionId);
            } else if (eventType === 'start' || eventType === 'started') {
              // SKIP - internal backend messages, not actual AI output
            } else if (eventType === 'text') {
              processEvent(eventId, () => appendSegment(createSegment('text', data.content || '')));
            } else if (eventType === 'tool-call') {
              // SKIP - don't display
            } else if (eventType === 'tool') {
              processEvent(eventId, () => appendSegment(createSegment('tool', '', { tool: data.name || 'unknown' })));
            } else if (eventType === 'tool-result') {
              processEvent(eventId, () => appendSegment(createSegment('tool-result', '', { tool: data.name || 'unknown' })));
            } else if (eventType === 'step-start') {
              // SKIP - don't display
            } else if (eventType === 'step-end') {
              // SKIP - don't display
            } else if (eventType === 'reasoning') {
              if (data.content && data.content.trim()) {
                processEvent(eventId, () => appendSegment(createSegment('reasoning', data.content || '')));
              }
            } else if (eventType === 'message-complete') {
              // SKIP - don't display
            } else if (eventType === 'done' || eventType === 'success') {
              if (!isFinished) {
                isFinished = true;
                appendSegment(createSegment('done', data.message || ''));
                setStreaming(false);
                setTimeout(async () => {
                  await refreshTasks();
                  setCurrentPrompt('');
                }, 500);
              }
            } else if (eventType === 'error' || eventType === 'failed') {
              if (!isFinished) {
                isFinished = true;
                appendSegment(createSegment('error', data.message || 'Error'));
                setError(data.message || 'Command failed');
                setStreaming(false);
              }
            } else if (eventType === 'timeout') {
              if (!isFinished) {
                isFinished = true;
                appendSegment(createSegment('timeout', data.message || ''));
                setStreaming(false);
              }
            }
          } catch {
            // Skip invalid JSON lines
          }
        }
      }

      if (!isFinished) {
        isFinished = true;
        setStreaming(false);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to process prompt';
      setError(errorMsg);
      appendSegment(createSegment('error', `\n\n错误: ${errorMsg}`));
      setStreaming(false);
    } finally {
      setProcessing(false);
    }
  },

  toggleSubtask: async (taskId: string, subtaskId: string) => {
    const { setError, tasks, setTasks } = get();

    try {
      setError(null);

      const targetSubtask = tasks
        .find(t => t.id === taskId)
        ?.subtasks.find(s => s.id === subtaskId);

      if (!targetSubtask) return;

      const newCompletedState = !targetSubtask.completed;

      const updatedTasks = tasks.map(task => {
        if (task.id === taskId) {
          const updatedSubtasks = task.subtasks.map(subtask => {
            if (subtask.id === subtaskId) {
              return { ...subtask, completed: newCompletedState };
            }
            return subtask;
          });

          const completedSubtasks = updatedSubtasks.filter(s => s.completed).length;

          return {
            ...task,
            subtasks: updatedSubtasks,
            completedSubtasks,
          };
        }
        return task;
      });

      setTasks(updatedTasks);

      const content = await readRoadmapFile();
      const updatedMarkdown = updateCheckboxInMarkdown(content, targetSubtask.content, newCompletedState);
      await writeRoadmapFile(updatedMarkdown);
      
      // Call the API function
      await toggleSubtaskCompletion(subtaskId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle subtask');
    }
  },

  toggleTaskExpanded: (taskId: string) => {
    const { tasks, setTasks } = get();
    
    const updatedTasks = tasks.map(task => {
      if (task.id === taskId) {
        return { ...task, isExpanded: !task.isExpanded };
      }
      return task;
    });
    
    setTasks(updatedTasks);
  },

  updateSubtaskContent: async (taskId: string, subtaskId: string, newContent: string) => {
    const { setError, tasks, setTasks } = get();

    try {
      setError(null);

      const targetSubtask = tasks
        .find(t => t.id === taskId)
        ?.subtasks.find(s => s.id === subtaskId);

      if (!targetSubtask) return;
      if (targetSubtask.content === newContent) return;

      const updatedTasks = tasks.map(task => {
        if (task.id === taskId) {
          const updatedSubtasks = task.subtasks.map(subtask => {
            if (subtask.id === subtaskId) {
              return { ...subtask, content: newContent };
            }
            return subtask;
          });

          return {
            ...task,
            subtasks: updatedSubtasks,
          };
        }
        return task;
      });

      setTasks(updatedTasks);

      const content = await readRoadmapFile();
      const updatedMarkdown = updateSubtaskContentInMarkdown(content, targetSubtask.content, newContent);
      await writeRoadmapFile(updatedMarkdown);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update subtask');
    }
  },

  reorderSubtasks: async (taskId: string, newOrder: { id: string; nestedLevel: number }[]) => {
    const { setError, tasks, setTasks } = get();

    try {
      setError(null);

      const targetTask = tasks.find(t => t.id === taskId);
      if (!targetTask) return;

      const subtaskMap = new Map(targetTask.subtasks.map(s => [s.id, s]));

      const reorderedSubtasks = newOrder
        .map(({ id, nestedLevel }) => {
          const subtask = subtaskMap.get(id);
          if (subtask) {
            return { ...subtask, nestedLevel };
          }
          return null;
        })
        .filter((s): s is Subtask => s !== null);

      const completedSubtasks = reorderedSubtasks.filter(s => s.completed).length;

      const updatedTasks = tasks.map(task => {
        if (task.id === taskId) {
          return {
            ...task,
            subtasks: reorderedSubtasks,
            completedSubtasks,
          };
        }
        return task;
      });

      setTasks(updatedTasks);

      const content = await readRoadmapFile();
      const updatedMarkdown = updateSubtasksOrderInMarkdown(content, targetTask.title, reorderedSubtasks);
      await writeRoadmapFile(updatedMarkdown);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reorder subtasks');
    }
  },

  changeSubtaskNestedLevel: async (
    taskId: string,
    subtaskId: string,
    newNestedLevel: number
  ): Promise<void> => {
    const { setError, tasks, setTasks } = get();

    try {
      setError(null);

      const clampedLevel = Math.max(0, Math.min(newNestedLevel, 6));

      const updatedTasks = tasks.map(task => {
        if (task.id === taskId) {
          const updatedSubtasks = task.subtasks.map(subtask => {
            if (subtask.id === subtaskId) {
              return { ...subtask, nestedLevel: clampedLevel };
            }
            return subtask;
          });

          return {
            ...task,
            subtasks: updatedSubtasks,
          };
        }
        return task;
      });

      setTasks(updatedTasks);

      const targetTask = tasks.find(t => t.id === taskId);
      if (targetTask) {
        const content = await readRoadmapFile();
        const updatedMarkdown = updateSubtasksOrderInMarkdown(content, targetTask.title, updatedTasks.find(t => t.id === taskId)!.subtasks);
        await writeRoadmapFile(updatedMarkdown);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change subtask nested level');
    }
  },

  updateTaskDescription: async (taskId: string, description: string) => {
    const { setError, tasks, setTasks } = get();

    try {
      setError(null);

      const targetTask = tasks.find(t => t.id === taskId);
      if (!targetTask) return;
      if (targetTask.originalPrompt === description) return;

      const updatedTasks = tasks.map(task => {
        if (task.id === taskId) {
          return { ...task, originalPrompt: description };
        }
        return task;
      });

      setTasks(updatedTasks);

      const content = await readRoadmapFile();
      const updatedMarkdown = updateTaskDescriptionInMarkdown(content, targetTask.title, description);
      await writeRoadmapFile(updatedMarkdown);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update task description');
    }
  },

  reorderTasks: async (newOrder: Task[]) => {
    const { setTasks, setError } = get();
    
    try {
      setError(null);
      setTasks(newOrder);
      
      const content = await readRoadmapFile();
      const updatedMarkdown = reorderTasksInMarkdown(content, newOrder);
      await writeRoadmapFile(updatedMarkdown);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reorder tasks');
    }
  },

  deleteSubtask: async (taskId: string, subtaskId: string) => {
    const { setError, tasks, setTasks } = get();

    try {
      setError(null);

      const targetTask = tasks.find(t => t.id === taskId);
      if (!targetTask) return;

      const targetSubtask = targetTask.subtasks.find(s => s.id === subtaskId);
      if (!targetSubtask) return;

      const updatedSubtasks = targetTask.subtasks.filter(s => s.id !== subtaskId);
      const completedSubtasks = updatedSubtasks.filter(s => s.completed).length;

      const updatedTasks = tasks.map(task => {
        if (task.id === taskId) {
          return {
            ...task,
            subtasks: updatedSubtasks,
            totalSubtasks: updatedSubtasks.length,
            completedSubtasks,
          };
        }
        return task;
      });

      setTasks(updatedTasks);

      const content = await readRoadmapFile();
      const updatedMarkdown = deleteSubtaskFromMarkdown(content, targetSubtask.content);
      await writeRoadmapFile(updatedMarkdown);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete subtask');
    }
  },

  addSubtask: async (taskId: string, content: string, nestedLevel: number = 0) => {
    const { setError, tasks, setTasks } = get();

    try {
      setError(null);

      // Generate new subtask ID
      const newSubtaskId = generateSubtaskId();

      const newSubtask: Subtask = {
        id: newSubtaskId,
        content,
        completed: false,
        nestedLevel: Math.max(0, Math.min(nestedLevel, 6)),
      };

      // Update local state
      const updatedTasks = tasks.map(task => {
        if (task.id === taskId) {
          return {
            ...task,
            subtasks: [...task.subtasks, newSubtask],
            totalSubtasks: task.totalSubtasks + 1,
            updatedAt: getCurrentISOString(),
          };
        }
        return task;
      });

      setTasks(updatedTasks);

      // Update Markdown file
      const targetTask = tasks.find(t => t.id === taskId);
      if (targetTask) {
        const markdownContent = await readRoadmapFile();
        const updatedMarkdown = appendSubtaskToMarkdown(
          markdownContent,
          targetTask.title,
          newSubtask
        );
        await writeRoadmapFile(updatedMarkdown);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add subtask');
    }
  },
}));
