import { readTextFile, writeTextFile, BaseDirectory } from '@tauri-apps/plugin-fs';
import { parseMarkdownTasks, generateMarkdownFromTasks } from '@/utils/markdownUtils';
import type { Task, Achievement } from '@/store/types';

const ROADMAP_FILENAME = 'roadmap.md';

export async function readRoadmapFile(): Promise<string> {
  try {
    const content = await readTextFile(ROADMAP_FILENAME, {
      baseDir: BaseDirectory.AppData,
    });
    return content;
  } catch (error) {
    console.warn('Roadmap file not found, creating empty content');
    return '# Roadmap\n\n';
  }
}

export async function writeRoadmapFile(content: string): Promise<void> {
  try {
    await writeTextFile(ROADMAP_FILENAME, content, {
      baseDir: BaseDirectory.AppData,
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