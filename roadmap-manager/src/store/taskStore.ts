import { create } from 'zustand';
import type { TaskStore, Task, Achievement } from './types';
import { loadTasksFromFile, readRoadmapFile, writeRoadmapFile } from '@/services/fileService';
import { updateCheckboxInMarkdown, updateSubtaskContentInMarkdown } from '@/utils/markdownUtils';
import { useResultModalStore } from './resultModalStore';

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
    const { setProcessing, setCurrentPrompt, refreshTasks, setError } = get();
    const { openModal, setContent, appendContent, setStreaming } = useResultModalStore.getState();

    try {
      setProcessing(true);
      setError(null);
      setCurrentPrompt(prompt);

      openModal('执行中', `正在启动 OpenCode Server...\n\n`);

      const response = await fetch('/api/execute-navigate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
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

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        const lines = text.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              const eventType = data.type;

              if (eventType === 'start' || eventType === 'started') {
                appendContent(data.message || '');
              } else if (eventType === 'text') {
                const content = data.content || '';
                resultContent += content;
                appendContent(content);
              } else if (eventType === 'tool-call') {
                const toolInfo = `\n🔧 使用工具: ${data.name || 'unknown'}\n`;
                resultContent += toolInfo;
                appendContent(toolInfo);
              } else if (eventType === 'tool-result') {
                const toolResult = `✓ ${data.name || 'tool'} 完成\n`;
                resultContent += toolResult;
                appendContent(toolResult);
              } else if (eventType === 'step-start') {
                const stepInfo = `\n📋 ${data.snapshot || '步骤'}\n`;
                resultContent += stepInfo;
                appendContent(stepInfo);
              } else if (eventType === 'step-end') {
                appendContent('\n');
              } else if (eventType === 'reasoning') {
                const reasoning = data.content || '';
                resultContent += reasoning;
                appendContent(reasoning);
              } else if (eventType === 'message-complete') {
                appendContent('\n');
              } else if (eventType === 'done' || eventType === 'success') {
                appendContent(data.message || '\n✅ 完成!\n');
                setStreaming(false);
                setTimeout(async () => {
                  await refreshTasks();
                  setCurrentPrompt('');
                }, 500);
              } else if (eventType === 'error' || eventType === 'failed') {
                appendContent(data.message || '错误');
                setError(data.message || 'Command failed');
                setStreaming(false);
              } else if (eventType === 'session') {
              } else if (eventType === 'timeout') {
                appendContent(data.message || '\n⏱️ 超时\n');
                setStreaming(false);
              } else if (eventType === 'message.updated') {
                const info = data.properties?.info || {};
                if (info.role === 'assistant' && info.completed) {
                  appendContent('\n');
                }
              }
            } finally {
              if (done) {
                setStreaming(false);
              }
            }
          }
        }
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
}));
