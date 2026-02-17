import { parseMarkdownTasks, generateMarkdownFromTasks } from '@/utils/markdownUtils';
import type { Task, Achievement } from '@/store/types';

const isTauri = typeof window !== 'undefined' && (window as any).__TAURI__;

async function invoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  if (isTauri) {
    const { invoke } = await import('@tauri-apps/api/core');
    return invoke<T>(cmd, args);
  }
  throw new Error('Not running in Tauri');
}

export async function readRoadmapFile(): Promise<string> {
  if (isTauri) {
    try {
      return await invoke<string>('read_roadmap');
    } catch (error) {
      console.warn('Could not read roadmap via Tauri API:', error);
    }
  }

  try {
    const response = await fetch('/api/read-roadmap');
    if (response.ok) {
      return await response.text();
    }
  } catch {
    console.warn('Could not read roadmap via API');
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
  if (isTauri) {
    try {
      await invoke('write_roadmap', { content });
      return;
    } catch (error) {
      console.warn('Could not write roadmap via Tauri API:', error);
    }
  }

  try {
    await fetch('/api/write-roadmap', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
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
