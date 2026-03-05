import { parseMarkdownTasks, generateMarkdownFromTasks } from '@/utils/markdownUtils';
import type { Task, Achievement } from '@/store/types';
import { showToastNotification } from './opencodeAPI';
import { useAuthStore } from '@/store/authStore';

export async function readRoadmapFile(): Promise<string> {
  try {
    const userId = useAuthStore.getState().userId;
    const url = userId ? `/api/read-roadmap?userId=${encodeURIComponent(userId)}` : '/api/read-roadmap';
    const response = await fetch(url);
    if (response.ok) {
      return await response.text();
    }
  } catch {
    console.warn('Could not read roadmap via API');
  }

  return '# Roadmap\n\n';
}

export async function writeRoadmapFile(content: string, currentMap?: MapInfo | null): Promise<void> {
  try {
    const userId = useAuthStore.getState().userId;
    const url = userId ? `/api/write-roadmap?userId=${encodeURIComponent(userId)}` : '/api/write-roadmap';
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });

    if (currentMap) {
      const mapWriteSuccess = await writeMapFile(currentMap, content);
      if (!mapWriteSuccess) {
        console.warn(`[ImmediateSave] Failed to save to map file: ${currentMap.filename}`);
        showToastNotification(`自动保存到 ${currentMap.name} 失败`, 'warning');
      } else {
        console.log(`[ImmediateSave] Saved roadmap to currentMap: ${currentMap.filename}`);
      }
    }
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to write roadmap file');
  }
}

export async function loadTasksFromFile(): Promise<{ tasks: Task[]; achievements: Achievement[] }> {
  try {
    const content = await readRoadmapFile();
    return parseMarkdownTasks(content);
  } catch (error) {
    console.error('Error loading tasks:', error);
    return { tasks: [], achievements: [] };
  }
}

export async function saveTasksToFile(tasks: Task[], achievements: Achievement[]): Promise<void> {
  try {
    const markdown = generateMarkdownFromTasks(tasks, achievements);
    await writeRoadmapFile(markdown);
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to save tasks');
  }
}

// ========== Map File Operations ==========

export interface MapInfo {
  id: string;
  name: string;
  filename: string;
}

export async function listMaps(): Promise<MapInfo[]> {
  try {
    const userId = useAuthStore.getState().userId;
    const url = userId ? `/api/list-maps?userId=${encodeURIComponent(userId)}` : '/api/list-maps';
    const response = await fetch(url);
    if (response.ok) {
      return await response.json();
    }
    throw new Error('Failed to list maps');
  } catch (error) {
    console.error('Error listing maps:', error);
    return [];
  }
}

export async function createMap(name: string): Promise<MapInfo | null> {
  try {
    const userId = useAuthStore.getState().userId;
    const url = userId ? `/api/create-map?userId=${encodeURIComponent(userId)}` : '/api/create-map';
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    if (response.ok) {
      return await response.json();
    }
    const error = await response.json();
    throw new Error(error.error || 'Failed to create map');
  } catch (error) {
    console.error('Error creating map:', error);
    return null;
  }
}

export async function deleteMap(map: MapInfo): Promise<boolean> {
  try {
    const userId = useAuthStore.getState().userId;
    const url = userId ? `/api/delete-map?userId=${encodeURIComponent(userId)}` : '/api/delete-map';
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: map.name, filename: map.filename }),
    });
    return response.ok;
  } catch (error) {
    console.error('Error deleting map:', error);
    return false;
  }
}

export async function renameMap(oldMap: MapInfo, newName: string): Promise<MapInfo | null> {
  try {
    const userId = useAuthStore.getState().userId;
    const url = userId ? `/api/rename-map?userId=${encodeURIComponent(userId)}` : '/api/rename-map';
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        oldName: oldMap.name,
        oldFilename: oldMap.filename,
        newName,
      }),
    });
    if (response.ok) {
      return await response.json();
    }
    const error = await response.json();
    throw new Error(error.error || 'Failed to rename map');
  } catch (error) {
    console.error('Error renaming map:', error);
    return null;
  }
}

export async function readMapFile(map: MapInfo): Promise<string> {
  try {
    const userId = useAuthStore.getState().userId;
    const url = userId ? `/api/read-map?userId=${encodeURIComponent(userId)}` : '/api/read-map';
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: map.name, filename: map.filename }),
    });
    if (response.ok) {
      return await response.text();
    }
    throw new Error('Failed to read map file');
  } catch (error) {
    console.error('Error reading map file:', error);
    return '';
  }
}

export async function writeMapFile(map: MapInfo, content: string): Promise<boolean> {
  try {
    const userId = useAuthStore.getState().userId;
    const url = userId ? `/api/write-map?userId=${encodeURIComponent(userId)}` : '/api/write-map';
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: map.name, filename: map.filename, content }),
    });
    return response.ok;
  } catch (error) {
    console.error('Error writing map file:', error);
    return false;
  }
}

// ========== Config Operations ==========

export interface RoadmapConfig {
  lastEditedMapId: string | null;
}

export async function loadConfig(): Promise<RoadmapConfig> {
  try {
    const userId = useAuthStore.getState().userId;
    const url = userId ? `/api/config?userId=${encodeURIComponent(userId)}` : '/api/config';
    const response = await fetch(url);
    if (response.ok) {
      return await response.json();
    }
    return { lastEditedMapId: null };
  } catch (error) {
    console.error('Error loading config:', error);
    return { lastEditedMapId: null };
  }
}

export async function saveConfig(config: RoadmapConfig): Promise<boolean> {
  try {
    const userId = useAuthStore.getState().userId;
    const url = userId ? `/api/config?userId=${encodeURIComponent(userId)}` : '/api/config';
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    return response.ok;
  } catch (error) {
    console.error('Error saving config:', error);
    return false;
  }
}
