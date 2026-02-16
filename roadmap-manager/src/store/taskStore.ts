import { create } from 'zustand';
import type { TaskStore, Task, Achievement, Subtask } from './types';
import { loadTasksFromFile, readRoadmapFile, writeRoadmapFile } from '@/services/fileService';
import { updateCheckboxInMarkdown, updateSubtaskContentInMarkdown, updateSubtasksOrderInMarkdown, reorderTasksInMarkdown, updateTaskDescriptionInMarkdown, deleteSubtaskFromMarkdown } from '@/utils/markdownUtils';
import { useResultModalStore, type ContentSegment } from './resultModalStore';
import { useSessionStore } from './sessionStore';
import { useModelStore } from './modelStore';
import { toggleSubtaskCompletion } from '@/services/opencodeAPI';

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
        ? { prompt, sessionId: currentSession.id }
        : { prompt };

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
      setStreaming(true);
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

            if (eventType === 'start' || eventType === 'started') {
              // SKIP - internal backend messages, not actual AI output
            } else if (eventType === 'text') {
              processEvent(eventId, () => appendSegment(createSegment('text', data.content || '')));
            } else if (eventType === 'tool-call') {
              // SKIP - don't display
            } else if (eventType === 'tool-result') {
              processEvent(eventId, () => appendSegment(createSegment('tool-result', '', { tool: data.name || 'unknown' })));
            } else if (eventType === 'step-start') {
              // SKIP - don't display
            } else if (eventType === 'step-end') {
              // SKIP - don't display
            } else if (eventType === 'reasoning') {
              processEvent(eventId, () => appendSegment(createSegment('reasoning', data.content || '')));
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
      appendSegment(createSegment('error', `\n\n❌ 错误: ${errorMsg}`));
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
}));
