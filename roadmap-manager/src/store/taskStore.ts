import { create } from 'zustand';
import type { TaskStore, Task, Achievement, Subtask } from './types';
import { loadTasksFromFile, readRoadmapFile, writeRoadmapFile } from '@/services/fileService';
import { updateCheckboxInMarkdown, updateSubtaskContentInMarkdown, updateSubtasksOrderInMarkdown } from '@/utils/markdownUtils';
import { useResultModalStore } from './resultModalStore';
import { useSessionStore } from './sessionStore';
import { useModelStore } from './modelStore';
import { toggleSubtaskCompletion } from '@/services/opencodeAPI';

const INTENT_CONFIGS = [
  { keywords: ['create', '新增', '新建', '添加', '增加'], emoji: '📝', action: 'Creating new task' },
  { keywords: ['update', '修改', '更新', '改变'], emoji: '✏️', action: 'Updating task' },
  { keywords: ['delete', '删除', '移除', 'remove'], emoji: '🗑️', action: 'Removing task' },
  { keywords: ['complete', '完成', 'done', 'mark'], emoji: '✅', action: 'Completing task' },
] as const;

function getInitialModalMessage(prompt: string): string {
  const promptLower = prompt.toLowerCase();

  for (const config of INTENT_CONFIGS) {
    if (config.keywords.some(keyword => promptLower.includes(keyword))) {
      return `${config.emoji} ${config.action}\nAnalyzing your request...\n\n`;
    }
  }

  return `🔄 Processing request\nAnalyzing your request...\n\n`;
}

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
    const { openModal, setContent, appendContent, setStreaming } = useResultModalStore.getState();
    const { createOrUpdateSessionFromAPI, currentSession } = useSessionStore.getState();
    const { selectedModel } = useModelStore.getState();

    try {
      setProcessing(true);
      setError(null);
      setCurrentPrompt(prompt);

      openModal('Processing', getInitialModalMessage(prompt));

      const body: any = currentSession
        ? { prompt, sessionId: currentSession.id }
        : { prompt };

      // Include model if selected
      if (selectedModel) {
        body.model = {
          providerID: selectedModel.providerID,
          modelID: selectedModel.modelID
        };
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
      setStreaming(true);
      let resultContent = '';
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
              processEvent(eventId, () => appendContent(data.message || ''));
            } else if (eventType === 'text') {
              processEvent(eventId, () => {
                const content = data.content || '';
                resultContent += content;
                appendContent(content);
              });
            } else if (eventType === 'tool-call') {
              processEvent(eventId, () => {
                const toolInfo = `\n🔧 Using tool: ${data.name || 'unknown'}\n`;
                resultContent += toolInfo;
                appendContent(toolInfo);
              });
            } else if (eventType === 'tool-result') {
              processEvent(eventId, () => {
                const toolResult = `✓ ${data.name || 'tool'} completed\n`;
                resultContent += toolResult;
                appendContent(toolResult);
              });
            } else if (eventType === 'step-start') {
              processEvent(eventId, () => {
                const stepInfo = `\n📋 ${data.snapshot || 'Step'}\n`;
                resultContent += stepInfo;
                appendContent(stepInfo);
              });
            } else if (eventType === 'step-end') {
              processEvent(eventId, () => appendContent('\n'));
            } else if (eventType === 'reasoning') {
              processEvent(eventId, () => {
                const reasoning = data.content || '';
                resultContent += reasoning;
                appendContent(reasoning);
              });
            } else if (eventType === 'message-complete') {
              processEvent(eventId, () => appendContent('\n'));
            } else if (eventType === 'done' || eventType === 'success') {
              if (!isFinished) {
                isFinished = true;
                appendContent(data.message || '\n✅ Completed!\n');
                setStreaming(false);
                setTimeout(async () => {
                  await refreshTasks();
                  setCurrentPrompt('');
                }, 500);
              }
            } else if (eventType === 'error' || eventType === 'failed') {
              if (!isFinished) {
                isFinished = true;
                appendContent(data.message || 'Error');
                setError(data.message || 'Command failed');
                setStreaming(false);
              }
            } else if (eventType === 'timeout') {
              if (!isFinished) {
                isFinished = true;
                appendContent(data.message || '\n⏱️ Timeout\n');
                setStreaming(false);
              }
            } else if (eventType === 'message.updated') {
              const info = data.properties?.info || {};
              if (info.role === 'assistant' && info.completed) {
                processEvent(eventId, () => appendContent('\n'));
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

      setContent(resultContent);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to process prompt';
      setError(errorMsg);
      appendContent(`\n\n❌ 错误: ${errorMsg}`);
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
}));
