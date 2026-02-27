import { create } from 'zustand';
import type { TaskStore, Task, Achievement, Subtask } from './types';
import { loadTasksFromFile, readRoadmapFile, writeRoadmapFile } from '@/services/fileService';
import { updateCheckboxInMarkdown, updateSubtaskContentInMarkdown, updateSubtasksOrderInMarkdown, reorderTasksInMarkdown, updateTaskDescriptionInMarkdown, deleteSubtaskFromMarkdown, appendSubtaskToMarkdown } from '@/utils/markdownUtils';
import { generateSubtaskId } from '@/utils/idGenerator';
import { getCurrentISOString } from '@/utils/timestamp';
import { useResultModalStore, type ContentSegment } from './resultModalStore';
import { useSessionStore } from './sessionStore';
import { useModelStore } from './modelStore';
import { useMapsStore } from './mapsStore';
import { toggleSubtaskCompletion } from '@/services/opencodeAPI';
import { getOpenCodeClient, subscribeToEvents } from '@/services/opencodeClient';

async function writeRoadmapWithAutoSave(content: string): Promise<void> {
  const { currentMap, immediateSaveEnabled } = useMapsStore.getState();
  await writeRoadmapFile(content, immediateSaveEnabled ? currentMap : null);
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  achievements: [],
  searchQuery: '',
  isLoading: false,
  isProcessing: false,
  currentPrompt: '',
  error: null,
  isConnected: false,

  setTasks: (tasks: Task[]) => set({ tasks }),
  
  setAchievements: (achievements: Achievement[]) => set({ achievements }),
  
  setSearchQuery: (searchQuery: string) => set({ searchQuery }),
  
  setLoading: (isLoading: boolean) => set({ isLoading }),
  
  setProcessing: (isProcessing: boolean) => set({ isProcessing }),
  
  setCurrentPrompt: (currentPrompt: string) => set({ currentPrompt }),
  
  setError: (error: string | null) => set({ error }),
  
  setConnected: (isConnected: boolean) => set({ isConnected }),

  toggleConnected: () => set((state) => ({ isConnected: !state.isConnected })),

  refreshTasks: async () => {
    const { isConnected, setLoading, setTasks, setAchievements, setError } = get();
    
    if (!isConnected) {
      setTasks([]);
      setAchievements([]);
      return;
    }
    
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

    if (!prompt || !prompt.trim()) {
      get().setError('Prompt cannot be empty');
      return;
    }

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

    const createSegment = (type: ContentSegment['type'], content: string, metadata?: ContentSegment['metadata']): ContentSegment => ({
      id: `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      content,
      timestamp: Date.now(),
      metadata,
    });

    try {
      const client = getOpenCodeClient();
      
      let targetSessionId = currentSession?.id;
      let sessionName = currentSession?.title;
      let isNewSession = false;
      
      if (!targetSessionId) {
        const response = await client.session.create({ body: { title: `navigate: ${prompt}` } });
        const newSession = response.data;
        if (!newSession) throw new Error('Failed to create session');
        targetSessionId = newSession.id;
        sessionName = newSession.title;
        createOrUpdateSessionFromAPI(targetSessionId, sessionName);
        isNewSession = true;
      }

      if (isNewSession) {
        sessionInfo = {
          title: sessionName || `navigate: ${prompt}`,
          prompt: prompt,
        };
      }

      openModal('Processing', sessionInfo, modelInfo, undefined, targetSessionId);

      if (!targetSessionId) {
        throw new Error('No valid session ID available');
      }

      const payload = {
        parts: [{ type: 'text' as const, text: `use navigate: ${prompt}` }],
      };
      if (modelInfo) {
        (payload as any).model = modelInfo;
      }

      const eventsPromise = subscribeToEvents(targetSessionId);

      await client.session.promptAsync({ path: { id: targetSessionId }, body: payload });

      const events = await eventsPromise;
      setStreaming(true);
      let isFinished = false;
      let eventCounter = 0;
      const processedEvents = new Set<string>();
      // Track the last segment IDs to know when to create new segments
      let lastTextSegmentId: string | null = null;
      let lastReasoningSegmentId: string | null = null;

      for await (const event of events) {
        if (isFinished) break;

        if (!event || !event.type) continue;

        const eventId = event.id || `${event.type}-${targetSessionId}-${eventCounter++}`;
        const eventType = event.type;

        if (event.sessionId && event.sessionId !== targetSessionId) {
          createOrUpdateSessionFromAPI(event.sessionId, sessionName || 'Session');
        }

        const processEvent = (id: string, handler: () => void) => {
          if (processedEvents.has(id)) return;
          processedEvents.add(id);
          handler();
        };

        if (eventType === 'session') {
          const { setCurrentSessionId } = useResultModalStore.getState();
          setCurrentSessionId(event.sessionId || targetSessionId);
        } else if (eventType === 'start' || eventType === 'started') {
          // SKIP - internal backend messages
        } else if (eventType === 'text') {
          const content = event.content || '';
          const state = useResultModalStore.getState();
          const lastTextSegment = [...state.segments].reverse().find(s => s.type === 'text');
          // Only append to last text segment if it matches our tracked ID
          // This ensures we create new segments after tool calls
          if (lastTextSegment && lastTextSegment.id === lastTextSegmentId) {
            useResultModalStore.getState().appendToLastSegmentOfType('text', content);
          } else {
            const segment = createSegment('text', content);
            lastTextSegmentId = segment.id;
            appendSegment(segment);
          }
        } else if (eventType === 'tool-call') {
          // SKIP - don't display
          // Reset text/reasoning tracking since tool breaks the flow
          lastTextSegmentId = null;
          lastReasoningSegmentId = null;
        } else if (eventType === 'tool') {
          processEvent(eventId, () => {
            appendSegment(createSegment('tool', '', { tool: event.name || 'unknown' }));
            // Reset text/reasoning tracking since tool breaks the flow
            lastTextSegmentId = null;
            lastReasoningSegmentId = null;
          });
        } else if (eventType === 'tool-result') {
          processEvent(eventId, () => {
            appendSegment(createSegment('tool-result', '', { tool: event.name || 'unknown' }));
            // Reset text/reasoning tracking since tool breaks the flow
            lastTextSegmentId = null;
            lastReasoningSegmentId = null;
          });
        } else if (eventType === 'step-start') {
          // SKIP - don't display
        } else if (eventType === 'step-end') {
          // SKIP - don't display
        } else if (eventType === 'reasoning') {
          if (event.content && event.content.trim()) {
            const content = event.content || '';
            const state = useResultModalStore.getState();
            const lastReasoningSegment = [...state.segments].reverse().find(s => s.type === 'reasoning');
            // Only append to last reasoning segment if it matches our tracked ID
            // This ensures we create new segments after tool calls
            if (lastReasoningSegment && lastReasoningSegment.id === lastReasoningSegmentId) {
              useResultModalStore.getState().appendToLastSegmentOfType('reasoning', content);
            } else {
              const segment = createSegment('reasoning', content);
              lastReasoningSegmentId = segment.id;
              appendSegment(segment);
            }
          }
        } else if (eventType === 'message-complete') {
          // SKIP - don't display
        } else if (eventType === 'done' || eventType === 'success') {
          if (!isFinished) {
            isFinished = true;
            appendSegment(createSegment('done', event.message || ''));
            setStreaming(false);
            setTimeout(async () => {
              await refreshTasks();
              setCurrentPrompt('');
            }, 500);
          }
        } else if (eventType === 'error' || eventType === 'failed') {
          if (!isFinished) {
            isFinished = true;
            appendSegment(createSegment('error', event.message || 'Error'));
            setError(event.message || 'Command failed');
            setStreaming(false);
          }
        } else if (eventType === 'timeout') {
          if (!isFinished) {
            isFinished = true;
            appendSegment(createSegment('timeout', event.message || ''));
            setStreaming(false);
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
      await writeRoadmapWithAutoSave(updatedMarkdown);
      
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
      await writeRoadmapWithAutoSave(updatedMarkdown);
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
      await writeRoadmapWithAutoSave(updatedMarkdown);
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
        await writeRoadmapWithAutoSave(updatedMarkdown);
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
      await writeRoadmapWithAutoSave(updatedMarkdown);
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
      await writeRoadmapWithAutoSave(updatedMarkdown);
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
      await writeRoadmapWithAutoSave(updatedMarkdown);
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
        await writeRoadmapWithAutoSave(updatedMarkdown);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add subtask');
    }
  },
}));
