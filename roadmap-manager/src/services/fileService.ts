import { parseMarkdownTasks, generateMarkdownFromTasks } from '@/utils/markdownUtils';
import type { Task, Achievement } from '@/store/types';
import { showToastNotification } from './opencodeAPI';

export async function readRoadmapFile(): Promise<string> {
  try {
    const response = await fetch('/api/read-roadmap');
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
    await fetch('/api/write-roadmap', {
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

export async function readAchievementsFile(): Promise<Achievement[]> {
  try {
    const { achievements } = await loadTasksFromFile();
    return achievements;
  } catch (error) {
    console.error('Error loading achievements:', error);
    return [];
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
    const response = await fetch('/api/list-maps');
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
    const response = await fetch('/api/create-map', {
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
    const response = await fetch('/api/delete-map', {
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
    const response = await fetch('/api/rename-map', {
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
    const response = await fetch('/api/read-map', {
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
    const response = await fetch('/api/write-map', {
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

// Switch to a different map: archive current roadmap.md to the previous map file, then load new map
export async function switchToMap(
  newMap: MapInfo,
  currentContent: string,
  currentMap: MapInfo | null
): Promise<{ content: string; previousMap: MapInfo | null } | null> {
  try {
    // First, archive current content to the previous map file (if exists)
    if (currentMap) {
      await writeMapFile(currentMap, currentContent);
    }

    // Then load the new map content
    const newContent = await readMapFile(newMap);

    return {
      content: newContent,
      previousMap: currentMap,
    };
  } catch (error) {
    console.error('Error switching map:', error);
    return null;
  }
}
