import { parseMarkdownTasks, generateMarkdownFromTasks } from '@/utils/markdownUtils';
import type { Task, Achievement } from '@/store/types';

const ROADMAP_PATH = '/Users/SparkingAries/VibeProjects/RoadMap/roadmap.md';

export async function readRoadmapFile(): Promise<string> {
  try {
    if (typeof window !== 'undefined' && (window as any).__TAURI__) {
      const { readTextFile, writeTextFile, BaseDirectory } = await import('@tauri-apps/plugin-fs');
      const content = await readTextFile('roadmap.md', {
        baseDir: BaseDirectory.AppData,
      });
      return content;
    } else {
      const response = await fetch('/api/read-roadmap');
      if (response.ok) {
        return await response.text();
      }
    }
  } catch {
    console.warn('Could not read roadmap via Tauri API');
  }
  
  try {
    const response = await fetch('file:///Users/SparkingAries/VibeProjects/RoadMap/roadmap.md');
    if (response.ok) {
      return await response.text();
    }
  } catch {
    console.warn('Could not read roadmap via file:// protocol');
  }
  
  return '# Roadmap\n\n';
}

export async function writeRoadmapFile(content: string): Promise<void> {
  try {
    if (typeof window !== 'undefined' && (window as any).__TAURI__) {
      const { writeTextFile, BaseDirectory } = await import('@tauri-apps/plugin-fs');
      await writeTextFile('roadmap.md', content, {
        baseDir: BaseDirectory.AppData,
      });
    } else {
      await fetch('/api/write-roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
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
