export interface ModelConfig {
  providerID: string;
  modelID: string;
  displayName: string;
}

export interface Subtask {
  id: string;
  content: string;
  completed: boolean;
  nestedLevel: number;
}

export interface Task {
  id: string;
  title: string;
  originalPrompt: string;
  createdAt: string;
  updatedAt: string;
  subtasks: Subtask[];
  completedSubtasks: number;
  totalSubtasks: number;
  isExpanded?: boolean;
}

export interface Achievement {
  id: string;
  title: string;
  originalPrompt: string;
  completedAt: string;
  subtasks: Subtask[];
}

export interface OpenCodeHealthResponse {
  status: 'healthy' | 'unhealthy';
  version?: string;
}

export interface OpenCodePromptResponse {
  success: boolean;
  message: string;
  taskId?: string;
}

export interface OpenCodeTasksResponse {
  tasks: Task[];
  achievements: Achievement[];
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface Session {
  id: string;
  title: string;
  createdAt: string;
  lastUsedAt: string;
  messages: Message[];
  serverId?: string;
}

export interface UIState {
  searchQuery: string;
  isLoading: boolean;
  isProcessing: boolean;
  currentPrompt: string;
  error: string | null;
  isConnected: boolean;
}

export interface TaskStore extends UIState {
  tasks: Task[];
  achievements: Achievement[];
  
  setTasks: (tasks: Task[]) => void;
  setAchievements: (achievements: Achievement[]) => void;
  setSearchQuery: (query: string) => void;
  setLoading: (loading: boolean) => void;
  setProcessing: (processing: boolean) => void;
  setCurrentPrompt: (prompt: string) => void;
  setError: (error: string | null) => void;
  setConnected: (connected: boolean) => void;
  
  refreshTasks: () => Promise<void>;
  submitPrompt: (prompt: string) => Promise<void>;
  toggleSubtask: (taskId: string, subtaskId: string) => Promise<void>;
  toggleTaskExpanded: (taskId: string) => void;
  updateSubtaskContent: (taskId: string, subtaskId: string, newContent: string) => Promise<void>;
  reorderSubtasks: (taskId: string, newOrder: { id: string; nestedLevel: number }[]) => Promise<void>;
  changeSubtaskNestedLevel: (taskId: string, subtaskId: string, newNestedLevel: number) => Promise<void>;
}