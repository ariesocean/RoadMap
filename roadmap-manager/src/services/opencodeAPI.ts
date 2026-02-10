import type { OpenCodeHealthResponse, OpenCodePromptResponse, OpenCodeTasksResponse } from '@/store/types';

const OPENCODE_API_URL = 'http://localhost:3000';

export async function checkServerHealth(): Promise<OpenCodeHealthResponse> {
  try {
    const response = await fetch(`${OPENCODE_API_URL}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    return { status: 'unhealthy' };
  }
}

export async function startOpenCodeServer(): Promise<boolean> {
  try {
    const response = await fetch(`${OPENCODE_API_URL}/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    return response.ok;
  } catch (error) {
    return false;
  }
}

export async function processPrompt(prompt: string): Promise<OpenCodePromptResponse> {
  try {
    const response = await fetch(`${OPENCODE_API_URL}/navigate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to process prompt: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to process prompt');
  }
}

export async function fetchTasks(): Promise<OpenCodeTasksResponse> {
  try {
    const response = await fetch(`${OPENCODE_API_URL}/tasks`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch tasks: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch tasks');
  }
}

export async function toggleSubtaskCompletion(taskId: string, subtaskId: string): Promise<void> {
  try {
    const response = await fetch(`${OPENCODE_API_URL}/tasks/${taskId}/subtasks/${subtaskId}/toggle`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to toggle subtask: ${response.statusText}`);
    }
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to toggle subtask');
  }
}