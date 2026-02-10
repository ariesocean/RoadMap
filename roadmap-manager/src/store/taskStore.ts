import { create } from 'zustand';
import type { TaskStore, Task, Achievement } from './types';
import { checkServerHealth, processPrompt, fetchTasks, toggleSubtaskCompletion } from '@/services/opencodeAPI';

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

  refreshTasks: async () => {
    const { setLoading, setTasks, setAchievements, setError, setConnected } = get();
    
    try {
      setLoading(true);
      setError(null);
      
      const health = await checkServerHealth();
      setConnected(health.status === 'healthy');
      
      if (health.status === 'healthy') {
        const data = await fetchTasks();
        setTasks(data.tasks);
        setAchievements(data.achievements);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh tasks');
      setConnected(false);
    } finally {
      setLoading(false);
    }
  },

  submitPrompt: async (prompt: string) => {
    const { setProcessing, setCurrentPrompt, refreshTasks, setError } = get();
    
    try {
      setProcessing(true);
      setError(null);
      setCurrentPrompt(prompt);
      
      await processPrompt(prompt);
      await refreshTasks();
      setCurrentPrompt('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process prompt');
    } finally {
      setProcessing(false);
    }
  },

  toggleSubtask: async (taskId: string, subtaskId: string) => {
    const { refreshTasks, setError, tasks, setTasks } = get();
    
    try {
      setError(null);
      
      const updatedTasks = tasks.map(task => {
        if (task.id === taskId) {
          const updatedSubtasks = task.subtasks.map(subtask => {
            if (subtask.id === subtaskId) {
              return { ...subtask, completed: !subtask.completed };
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
      
      await toggleSubtaskCompletion(taskId, subtaskId);
      await refreshTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle subtask');
      await refreshTasks();
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
}));