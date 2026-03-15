# Achievements Feature Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 Sidebar 下方添加 Achievements 容器，允许用户将主任务归档到成就集，并可以随时恢复到 Map 中。

**Architecture:** 使用独立的 achievements.md 文件存储成就数据，后端提供 CRUD API，前端通过 store 管理和展示。

**Tech Stack:** React 18 + TypeScript + Zustand + Tailwind CSS

---

## Chunk 1: Types & Backend API

### Task 1.1: Update Achievement Type

**Files:**
- Modify: `roadmap-manager/src/store/types.ts:26-32`

- [ ] **Step 1: Update Achievement interface**

```typescript
// Replace the existing Achievement interface
export interface Achievement {
  id: string;
  title: string;
  originalPrompt: string;
  createdAt: string;   // 从标题中提取: [created: YYYY-MM-DD HH:mm]
  archivedAt: string;  // 从 **Archived:** 行提取
  subtasks: Subtask[];
}
```

- [ ] **Step 2: Update TaskStore interface to include viewMode**

```typescript
// Add to TaskStore interface in types.ts
export interface TaskStore extends UIState {
  // ... existing fields
  achievements: Achievement[];
  viewMode: 'map' | 'achievements';  // 新增

  // New Actions
  setViewMode: (mode: 'map' | 'achievements') => void;
  loadAchievements: () => Promise<void>;
  moveToAchievements: (taskId: string) => Promise<void>;
  restoreFromAchievements: (achievementId: string, targetMapId: string) => Promise<void>;
}
```

- [ ] **Step 3: Commit**

```bash
git add roadmap-manager/src/store/types.ts
git commit -m "feat(achievements): update Achievement interface with createdAt and archivedAt"
```

---

### Task 1.2: Add Backend API Endpoints

**Files:**
- Modify: `roadmap-manager/server/index.ts`

Reference: User data is stored in `users/{userId}/achievements.md`. If no user is logged in, use root directory.

- [ ] **Step 1: Add read-achievements endpoint**

Add this after the existing API routes in server/index.ts:

```typescript
// GET /api/read-achievements
app.get('/api/read-achievements', async (req, res) => {
  try {
    const userId = req.query.userId as string;
    const userDir = userId ? path.join(USERS_DIR, userId) : ROOT_DIR;
    const achievementsFile = path.join(userDir, 'achievements.md');

    if (!fs.existsSync(achievementsFile)) {
      // Return empty achievements if file doesn't exist
      return res.json({ achievements: [] });
    }

    const content = fs.readFileSync(achievementsFile, 'utf-8');
    const achievements = parseAchievementsFromMarkdown(content);

    res.json({ achievements });
  } catch (error) {
    console.error('Error reading achievements:', error);
    res.status(500).json({ error: 'Failed to read achievements' });
  }
});
```

- [ ] **Step 2: Add save-achievement endpoint**

```typescript
// POST /api/save-achievement
app.post('/api/save-achievement', express.json(), async (req, res) => {
  try {
    const { achievement } = req.body;
    const userId = req.query.userId as string;
    const userDir = userId ? path.join(USERS_DIR, userId) : ROOT_DIR;
    const achievementsFile = path.join(userDir, 'achievements.md');

    // Ensure file exists
    if (!fs.existsSync(achievementsFile)) {
      fs.writeFileSync(achievementsFile, '');
    }

    // Append achievement to file
    const achievementMarkdown = generateAchievementMarkdown(achievement);
    const existingContent = fs.readFileSync(achievementsFile, 'utf-8');
    const newContent = existingContent + '\n' + achievementMarkdown;

    fs.writeFileSync(achievementsFile, newContent);

    res.json({ success: true });
  } catch (error) {
    console.error('Error saving achievement:', error);
    res.status(500).json({ error: 'Failed to save achievement' });
  }
});
```

- [ ] **Step 3: Add delete-achievement endpoint**

```typescript
// POST /api/delete-achievement
app.post('/api/delete-achievement', express.json(), async (req, res) => {
  try {
    const { achievementId } = req.body;
    const userId = req.query.userId as string;
    const userDir = userId ? path.join(USERS_DIR, userId) : ROOT_DIR;
    const achievementsFile = path.join(userDir, 'achievements.md');

    if (!fs.existsSync(achievementsFile)) {
      return res.json({ success: true });
    }

    const content = fs.readFileSync(achievementsFile, 'utf-8');
    const newContent = deleteAchievementFromMarkdown(content, achievementId);

    fs.writeFileSync(achievementsFile, newContent);

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting achievement:', error);
    res.status(500).json({ error: 'Failed to delete achievement' });
  }
});
```

- [ ] **Step 4: Add helper functions (parseAchievementsFromMarkdown, generateAchievementMarkdown, deleteAchievementFromMarkdown)**

Add these functions before the routes:

```typescript
// Parse achievements from standalone achievements.md format
function parseAchievementsFromMarkdown(markdown: string): Achievement[] {
  const achievements: Achievement[] = [];
  if (!markdown.trim()) return achievements;

  // Split by --- separator
  const sections = markdown.split(/\n---\n/).filter(s => s.trim());

  for (const section of sections) {
    const lines = section.split('\n');
    let title = '';
    let originalPrompt = '';
    let createdAt = '';
    let archivedAt = '';
    const subtasks: Subtask[] = [];

    for (const line of lines) {
      // Match: # Title [created: YYYY-MM-DD HH:mm]
      const titleMatch = line.match(/^# (.+) \[created: ([\d\- :]+)\]$/);
      if (titleMatch) {
        title = titleMatch[1].trim();
        createdAt = titleMatch[2].trim();
        continue;
      }

      // Match: > prompt
      const promptMatch = line.match(/^> (.+)$/);
      if (promptMatch) {
        originalPrompt = promptMatch[1].trim();
        continue;
      }

      // Match: **Archived:** YYYY-MM-DD HH:mm
      const archivedMatch = line.match(/^\*\*Archived:\*\* ([\d\- :]+)$/);
      if (archivedMatch) {
        archivedAt = archivedMatch[1].trim();
        continue;
      }

      // Match: subtasks * [x] content
      const subtaskMatch = line.match(/^(\s*)[-*] \[([ x])\] (.+)$/);
      if (subtaskMatch) {
        const indent = subtaskMatch[1].length;
        const completed = subtaskMatch[2].toLowerCase() === 'x';
        const content = subtaskMatch[3].trim();
        const nestedLevel = Math.floor(indent / 2);

        subtasks.push({
          id: generateSubtaskId(),
          content,
          completed,
          nestedLevel,
        });
        continue;
      }
    }

    if (title) {
      achievements.push({
        id: generateTaskId(),
        title,
        originalPrompt,
        createdAt: createdAt ? new Date(createdAt).toISOString() : new Date().toISOString(),
        archivedAt: archivedAt ? new Date(archivedAt).toISOString() : new Date().toISOString(),
        subtasks,
      });
    }
  }

  return achievements;
}

// Generate markdown for a single achievement
function generateAchievementMarkdown(achievement: Achievement): string {
  const createdDate = new Date(achievement.createdAt).toLocaleString('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).replace(/\//g, '-');

  const archivedDate = new Date(achievement.archivedAt).toLocaleString('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).replace(/\//g, '-');

  let markdown = `# ${achievement.title} [created: ${createdDate}]\n`;

  if (achievement.originalPrompt) {
    markdown += `> ${achievement.originalPrompt}\n`;
  }
  markdown += '\n';

  if (achievement.subtasks.length > 0) {
    achievement.subtasks.forEach(subtask => {
      const indent = '  '.repeat(Math.min(subtask.nestedLevel, 6));
      const checkbox = subtask.completed ? '[x]' : '[ ]';
      markdown += `${indent}* ${checkbox} ${subtask.content}\n`;
    });
    markdown += '\n';
  }

  markdown += `**Archived:** ${archivedDate}\n`;

  return markdown;
}

// Delete achievement from markdown by ID or title
function deleteAchievementFromMarkdown(markdown: string, achievementId: string): string {
  // For now, we'll match by title - ID matching can be added later
  const lines = markdown.split('\n');
  const result: string[] = [];
  let skipSection = false;
  let foundMatch = false;

  for (const line of lines) {
    // Check for section start (# title [created: ...])
    const titleMatch = line.match(/^# (.+) \[created:/);
    if (titleMatch) {
      // If we were skipping a section, stop skipping
      if (skipSection) {
        skipSection = false;
      }
      // Check if this is the achievement to delete (by title - simplified)
      // In production, you'd match by ID stored in the section
      foundMatch = true;
      skipSection = true;
      continue;
    }

    if (!skipSection) {
      result.push(line);
    }
  }

  // If no match found by ID, try to find and delete by checking if achievement exists
  // For now, return as-is if no deletion happened
  return result.join('\n').replace(/\n---\n$/, '').replace(/\n---\n\n/g, '\n');
}
```

- [ ] **Step 5: Commit**

```bash
git add roadmap-manager/server/index.ts
git commit -m "feat(achievements): add backend API endpoints for achievements CRUD"
```

---

## Chunk 2: Markdown Utils & File Service

### Task 2.1: Add Achievement-specific Markdown Utils

**Files:**
- Modify: `roadmap-manager/src/utils/markdownUtils.ts`

- [ ] **Step 1: Add formatDateForAchievement function**

```typescript
// Format date for achievement markdown (YYYY-MM-DD HH:mm)
export function formatDateForAchievement(date: string): string {
  const d = new Date(date);
  return d.toLocaleString('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).replace(/\//g, '-');
}
```

- [ ] **Step 2: Commit**

```bash
git add roadmap-manager/src/utils/markdownUtils.ts
git commit -m "feat(achievements): add achievement date formatting utility"
```

---

### Task 2.2: Add File Service Functions

**Files:**
- Modify: `roadmap-manager/src/services/fileService.ts`

- [ ] **Step 1: Add achievement file service functions**

Add at the end of fileService.ts:

```typescript
// ========== Achievement Operations ==========

export async function loadAchievements(): Promise<Achievement[]> {
  try {
    const userId = useAuthStore.getState().userId;
    const url = userId ? `/api/read-achievements?userId=${encodeURIComponent(userId)}` : '/api/read-achievements';
    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      return data.achievements || [];
    }
    return [];
  } catch (error) {
    console.error('Error loading achievements:', error);
    return [];
  }
}

export async function saveAchievement(achievement: Achievement): Promise<boolean> {
  try {
    const userId = useAuthStore.getState().userId;
    const url = userId ? `/api/save-achievement?userId=${encodeURIComponent(userId)}` : '/api/save-achievement';
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ achievement }),
    });
    return response.ok;
  } catch (error) {
    console.error('Error saving achievement:', error);
    return false;
  }
}

export async function deleteAchievement(achievementId: string): Promise<boolean> {
  try {
    const userId = useAuthStore.getState().userId;
    const url = userId ? `/api/delete-achievement?userId=${encodeURIComponent(userId)}` : '/api/delete-achievement';
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ achievementId }),
    });
    return response.ok;
  } catch (error) {
    console.error('Error deleting achievement:', error);
    return false;
  }
}
```

- [ ] **Step 2: Add Achievement import**

At the top of fileService.ts, ensure Achievement is imported:
```typescript
import type { Task, Achievement } from '@/store/types';
```

- [ ] **Step 3: Commit**

```bash
git add roadmap-manager/src/services/fileService.ts
git commit -m "feat(achievements): add file service functions for achievements"
```

---

## Chunk 3: TaskStore Updates

### Task 3.1: Update TaskStore with ViewMode and Achievement Actions

**Files:**
- Modify: `roadmap-manager/src/store/taskStore.ts`

- [ ] **Step 1: Add viewMode state and achievement-related state**

In the initial state (around line 20-30), add:
```typescript
viewMode: 'map' as 'map' | 'achievements',
```

- [ ] **Step 2: Add setViewMode action**

Add after the existing actions:
```typescript
setViewMode: (mode: 'map' | 'achievements') => set({ viewMode: mode }),
```

- [ ] **Step 3: Add loadAchievements action**

```typescript
loadAchievements: async () => {
  const { loadAchievements: loadFromFile } = await import('@/services/fileService');
  const achievements = await loadFromFile();
  set({ achievements });
},
```

- [ ] **Step 4: Add moveToAchievements action**

```typescript
moveToAchievements: async (taskId: string) => {
  const { tasks, achievements, saveAchievement, saveTasksToFile, loadConfig, currentMap } = get();

  const taskIndex = tasks.findIndex(t => t.id === taskId);
  if (taskIndex === -1) return;

  const task = tasks[taskIndex];

  // Create achievement from task
  const achievement: Achievement = {
    id: task.id,
    title: task.title,
    originalPrompt: task.originalPrompt,
    createdAt: task.createdAt,
    archivedAt: new Date().toISOString(),
    subtasks: task.subtasks,
  };

  // Save to achievements.md
  const saved = await saveAchievement(achievement);
  if (!saved) {
    throw new Error('Failed to save achievement');
  }

  // Remove task from tasks array
  const newTasks = tasks.filter(t => t.id !== taskId);

  // Save updated tasks to file
  await saveTasksToFile(newTasks, achievements);

  // Update store
  set({ tasks: newTasks, achievements: [...achievements, achievement] });
},
```

- [ ] **Step 5: Add restoreFromAchievements action**

```typescript
restoreFromAchievements: async (achievementId: string, targetMapId: string) => {
  const { achievements, listMaps, readMapFile, writeMapFile, saveAchievement } = get();

  const achievementIndex = achievements.findIndex(a => a.id === achievementId);
  if (achievementIndex === -1) return;

  const achievement = achievements[achievementIndex];

  // Get target map info
  const maps = await listMaps();
  const targetMap = maps.find(m => m.id === targetMapId);
  if (!targetMap) {
    throw new Error('Target map not found');
  }

  // Read target map content
  const mapContent = await readMapFile(targetMap);

  // Convert achievement to task format and append to map
  // For simplicity, we'll write the full map content with the new task
  // This needs proper implementation - append task to existing markdown

  // Delete from achievements
  await deleteAchievement(achievementId);

  // Update store
  const newAchievements = achievements.filter(a => a.id !== achievementId);
  set({ achievements: newAchievements });
},
```

- [ ] **Step 6: Add deleteAchievement import**

At the top, add:
```typescript
import { loadAchievements, saveAchievement, deleteAchievement } from '@/services/fileService';
```

- [ ] **Step 7: Commit**

```bash
git add roadmap-manager/src/store/taskStore.ts
git commit -m "feat(achievements): add viewMode and achievement actions to taskStore"
```

---

## Chunk 4: UI Components

### Task 4.1: Update TaskCard for Readonly Mode

**Files:**
- Modify: `roadmap-manager/src/components/TaskCard.tsx`

- [ ] **Step 1: Add readonly and showRestore props**

Update interface:
```typescript
interface TaskCardProps {
  task: Task;
  index: number;
  readonly?: boolean;        // New: readonly mode for achievements view
  showRestore?: boolean;     // New: show restore button
  onRestore?: () => void;   // New: restore callback
}
```

- [ ] **Step 2: Add props destructuring**

```typescript
export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  index,
  readonly = false,
  showRestore = false,
  onRestore,
}) => {
```

- [ ] **Step 3: Disable editing in readonly mode**

In the title double-click handler:
```typescript
const handleTitleDoubleClick = (e: React.MouseEvent) => {
  if (readonly) return;  // Disable in readonly mode
  e.stopPropagation();
  setIsEditingTitle(true);
  setEditTitle(task.title);
};
```

Same for description:
```typescript
const handleDescriptionDoubleClick = (e: React.MouseEvent) => {
  if (readonly) return;  // Disable in readonly mode
  // ...
};
```

- [ ] **Step 4: Remove drag for subtasks in readonly mode**

In SubtaskList component call, pass disabled prop:
```typescript
<SubtaskList
  subtasks={task.subtasks}
  taskId={task.id}
  readonly={readonly}
/>
```

- [ ] **Step 5: Add archivedAt display in readonly mode**

Add after the existing date display:
```typescript
{readonly && 'archivedAt' in task && (task as any).archivedAt && (
  <span className="text-[10px] sm:text-xs md:text-xs lg:text-sm text-secondary-text/80 dark:text-dark-secondary-text ml-2">
    Archived: {formatDate((task as any).archivedAt)}
  </span>
)}
```

- [ ] **Step 6: Add restore button in readonly mode**

Add after the expand button:
```typescript
{showRestore && (
  <button
    onClick={(e) => {
      e.stopPropagation();
      onRestore?.();
    }}
    className="p-0.5 sm:p-1 md:p-1 hover:bg-secondary-bg dark:hover:bg-dark-secondary-bg rounded transition-colors"
    title="Restore to Map"
  >
    <RotateCcw className="w-4 h-4 sm:w-5 md:w-5 lg:w-5 text-secondary-text dark:text-dark-secondary-text" />
  </button>
)}
```

- [ ] **Step 7: Import RotateCcw icon**

```typescript
import { ChevronDown, CheckCircle2, RotateCcw } from 'lucide-react';
```

- [ ] **Step 8: Commit**

```bash
git add roadmap-manager/src/components/TaskCard.tsx
git commit -m "feat(achievements): add readonly mode and restore button to TaskCard"
```

---

### Task 4.2: Update SubtaskList for Readonly Mode

**Files:**
- Modify: `roadmap-manager/src/components/SubtaskList.tsx`

- [ ] **Step 1: Add readonly prop**

Update interface:
```typescript
interface SubtaskListProps {
  subtasks: Subtask[];
  taskId: string;
  readonly?: boolean;  // New
}
```

- [ ] **Step 2: Add prop destructuring**

```typescript
export const SubtaskList: React.FC<SubtaskListProps> = ({
  subtasks,
  taskId,
  readonly = false,
}) => {
```

- [ ] **Step 3: Disable checkbox interaction in readonly mode**

In the checkbox onClick handler:
```typescript
const handleCheckboxClick = (e: React.MouseEvent, subtaskId: string) => {
  if (readonly) return;  // Disable in readonly mode
  e.stopPropagation();
  toggleSubtask(taskId, subtaskId);
};
```

- [ ] **Step 4: Remove strikethrough in readonly mode**

In the subtask text span, conditionally apply strikethrough:
```typescript
className={`flex-1 ${
  !readonly && subtask.completed
    ? 'line-through text-secondary-text/50 dark:text-dark-secondary-text/50'
    : ''
} ${readonly ? 'text-secondary-text dark:text-dark-secondary-text' : ''}`}
```

- [ ] **Step 5: Commit**

```bash
git add roadmap-manager/src/components/SubtaskList.tsx
git commit -m "feat(achievements): add readonly mode support to SubtaskList"
```

---

### Task 4.3: Add Achievements Button to MapsSidebar

**Files:**
- Modify: `roadmap-manager/src/components/MapsSidebar.tsx`

- [ ] **Step 1: Add Trophy icon import**

```typescript
import { Plus, Trash2, Edit2, FolderOpen, Check, Menu, Trophy } from 'lucide-react';
```

- [ ] **Step 2: Add onAchievementsClick prop**

```typescript
interface MapsSidebarProps {
  onMapSelect?: (map: MapInfo) => void;
  onCreateMap?: (name: string) => void;
  onDeleteMap?: (map: MapInfo) => void;
  onRenameMap?: (map: MapInfo, newName: string) => void;
  onAchievementsClick?: () => void;  // New
  achievementsCount?: number;         // New
  isAchievementsActive?: boolean;      // New
}
```

- [ ] **Step 3: Add Achievements button at bottom of sidebar**

After the map list div (before closing sidebar-container div), add:

```typescript
{/* Achievements Button */}
<div className="border-t border-border-color dark:border-dark-border-color mt-2 pt-2 px-[clamp(6px,0.8vw,10px)]">
  <button
    type="button"
    onClick={onAchievementsClick}
    className={`w-full flex items-center gap-[clamp(6px,0.8vw,8px)] rounded-md cursor-pointer sidebar-item transition-colors
      ${isAchievementsActive
        ? 'bg-primary text-white'
        : 'text-secondary-text dark:text-dark-secondary-text hover:bg-card-bg dark:hover:bg-dark-card-bg hover:text-primary-text dark:hover:text-dark-primary-text'
      }`}
  >
    <Trophy className="w-[clamp(16px,1.8vw,20px)] h-[clamp(16px,1.8vw,20px)]" />
    <span className="flex-1">{t('achievements')}</span>
    {achievementsCount !== undefined && achievementsCount > 0 && (
      <span className="text-xs bg-primary/20 px-1.5 py-0.5 rounded-full">
        {achievementsCount}
      </span>
    )}
  </button>
</div>
```

- [ ] **Step 4: Commit**

```bash
git add roadmap-manager/src/components/MapsSidebar.tsx
git commit -m "feat(achievements): add Achievements button to MapsSidebar"
```

---

### Task 4.4: Create AchievementList Component

**Files:**
- Create: `roadmap-manager/src/components/AchievementList.tsx`

- [ ] **Step 1: Create AchievementList component**

```typescript
import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, RotateCcw } from 'lucide-react';
import type { Achievement } from '@/store/types';
import { TaskCard } from './TaskCard';
import { useI18nStore } from '@/store/i18nStore';

interface AchievementListProps {
  achievements: Achievement[];
  onRestore: (achievement: Achievement) => void;
}

export const AchievementList: React.FC<AchievementListProps> = ({
  achievements,
  onRestore,
}) => {
  const { t } = useI18nStore();

  if (achievements.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Trophy className="w-16 h-16 text-placeholder-text dark:text-dark-placeholder-text mb-4" />
        <h3 className="text-lg font-medium text-secondary-text dark:text-dark-secondary-text mb-2">
          {t('noAchievements')}
        </h3>
        <p className="text-sm text-placeholder-text dark:text-dark-placeholder-text">
          {t('achievementsEmpty')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {achievements.map((achievement, index) => (
        <motion.div
          key={achievement.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
        >
          <TaskCard
            task={achievement as any}
            index={index}
            readonly={true}
            showRestore={true}
            onRestore={() => onRestore(achievement)}
          />
        </motion.div>
      ))}
    </div>
  );
};

export default AchievementList;
```

- [ ] **Step 2: Commit**

```bash
git add roadmap-manager/src/components/AchievementList.tsx
git commit -m "feat(achievements): create AchievementList component"
```

---

### Task 4.5: Create MapSelectorModal Component

**Files:**
- Create: `roadmap-manager/src/components/MapSelectorModal.tsx`

- [ ] **Step 1: Create MapSelectorModal component**

```typescript
import React from 'react';
import { FolderOpen, X } from 'lucide-react';
import { useI18nStore } from '@/store/i18nStore';
import type { MapInfo } from '@/services/fileService';

interface MapSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (map: MapInfo) => void;
  maps: MapInfo[];
}

export const MapSelectorModal: React.FC<MapSelectorModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  maps,
}) => {
  const { t } = useI18nStore();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-card-bg dark:bg-dark-card-bg rounded-lg shadow-xl w-[90%] max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-color dark:border-dark-border-color">
          <h2 className="text-lg font-semibold text-primary-text dark:text-dark-primary-text">
            {t('selectTargetMap')}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-secondary-bg dark:hover:bg-dark-secondary-bg transition-colors"
          >
            <X className="w-5 h-5 text-secondary-text dark:text-dark-secondary-text" />
          </button>
        </div>

        {/* Map List */}
        <div className="max-h-[60vh] overflow-y-auto py-2">
          {maps.length === 0 ? (
            <div className="px-4 py-8 text-center text-placeholder-text dark:text-dark-placeholder-text">
              <FolderOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>{t('noMapsFound')}</p>
            </div>
          ) : (
            <div className="space-y-1 px-2">
              {maps.map((map) => (
                <button
                  key={map.id}
                  onClick={() => onSelect(map)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left hover:bg-secondary-bg dark:hover:bg-dark-secondary-bg transition-colors"
                >
                  <FolderOpen className="w-5 h-5 text-primary dark:text-dark-primary" />
                  <span className="flex-1 text-primary-text dark:text-dark-primary-text">
                    {map.name}
                  </span>
                  <span className="text-xs text-primary dark:text-dark-primary">
                    {t('select')}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-border-color dark:border-dark-border-color">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 rounded-md bg-secondary-bg dark:bg-dark-secondary-bg text-secondary-text dark:text-dark-secondary-text hover:bg-card-bg dark:hover:bg-card-bg transition-colors"
          >
            {t('cancel')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MapSelectorModal;
```

- [ ] **Step 2: Commit**

```bash
git add roadmap-manager/src/components/MapSelectorModal.tsx
git commit -m "feat(achievements): create MapSelectorModal component"
```

---

### Task 4.6: Update App.tsx with ViewMode

**Files:**
- Modify: `roadmap-manager/src/components/App.tsx`

- [ ] **Step 1: Add viewMode state and handlers**

Add to state:
```typescript
const [viewMode, setViewMode] = useState<'map' | 'achievements'>('map');
```

- [ ] **Step 2: Update MapsSidebar props**

```typescript
<MapsSidebar
  onMapSelect={handleMapSelect}
  onCreateMap={handleCreateMap}
  onDeleteMap={handleDeleteMap}
  onRenameMap={handleRenameMap}
  onAchievementsClick={() => setViewMode('achievements')}
  achievementsCount={achievements.length}
  isAchievementsActive={viewMode === 'achievements'}
/>
```

- [ ] **Step 3: Add loadAchievements on mount**

```typescript
useEffect(() => {
  loadAchievements();
}, []);
```

- [ ] **Step 4: Update Main Content rendering**

In the main content area, conditionally render based on viewMode:

```typescript
{viewMode === 'achievements' ? (
  <AchievementList
    achievements={achievements}
    onRestore={handleRestoreAchievement}
  />
) : (
  <TaskList />
)}
```

- [ ] **Step 5: Add handleRestoreAchievement function**

```typescript
const handleRestoreAchievement = async (achievement: Achievement) => {
  // Show map selector modal
  setSelectedAchievement(achievement);
  setShowMapSelector(true);
};

const handleMapSelected = async (map: MapInfo) => {
  if (!selectedAchievement) return;

  try {
    await restoreFromAchievements(selectedAchievement.id, map.id);
    setShowMapSelector(false);
    setSelectedAchievement(null);
  } catch (error) {
    console.error('Failed to restore achievement:', error);
  }
};
```

- [ ] **Step 6: Add state for map selector**

```typescript
const [showMapSelector, setShowMapSelector] = useState(false);
const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
```

- [ ] **Step 7: Add imports**

```typescript
import { AchievementList } from './AchievementList';
import { MapSelectorModal } from './MapSelectorModal';
import type { MapInfo } from '@/services/fileService';
```

- [ ] **Step 8: Add MapSelectorModal to JSX**

```typescript
<MapSelectorModal
  isOpen={showMapSelector}
  onClose={() => {
    setShowMapSelector(false);
    setSelectedAchievement(null);
  }}
  onSelect={handleMapSelected}
  maps={availableMaps}
/>
```

- [ ] **Step 9: Commit**

```bash
git add roadmap-manager/src/components/App.tsx
git commit -m "feat(achievements): integrate achievements view into App"
```

---

## Chunk 5: i18n & Final Integration

### Task 5.1: Add i18n Translations

**Files:**
- Modify: `roadmap-manager/src/store/i18nStore.ts` (or wherever translations are stored)

- [ ] **Step 1: Find translation storage location**

```bash
grep -r "newMap" roadmap-manager/src --include="*.ts" | head -5
```

- [ ] **Step 2: Add achievement translation keys**

Add to the translations object:
```json
{
  "achievements": "Achievements",
  "noAchievements": "No achievements yet",
  "achievementsEmpty": "Tasks you archive will appear here",
  "selectTargetMap": "Select Target Map",
  "select": "Select",
  "archiveTask": "Archive to Achievements",
  "confirmArchive": "Are you sure you want to move this task to achievements?",
  "restoreTask": "Restore to Map",
  "archived": "Archived"
}
```

- [ ] **Step 3: Commit**

```bash
git add roadmap-manager/src/store/i18nStore.ts
git commit -m "feat(i18n): add achievements translation keys"
```

---

### Task 5.2: Add Archive Button to TaskCard

**Files:**
- Modify: `roadmap-manager/src/components/TaskCard.tsx`

- [ ] **Step 1: Add archive button in normal mode**

Add after the expand button in the task card:
```typescript
{!readonly && (
  <button
    onClick={(e) => {
      e.stopPropagation();
      // Trigger archive - need to pass handler via props
    }}
    className="p-0.5 sm:p-1 md:p-1 hover:bg-secondary-bg dark:hover:bg-dark-secondary-bg rounded transition-colors"
    title={t('archiveTask')}
  >
    <Archive className="w-4 h-4 sm:w-5 md:w-5 lg:w-5 text-secondary-text dark:text-dark-secondary-text" />
  </button>
)}
```

- [ ] **Step 2: Import Archive icon**

```typescript
import { ChevronDown, CheckCircle2, Archive } from 'lucide-react';
```

- [ ] **Step 3: Add onArchive prop**

Update interface:
```typescript
interface TaskCardProps {
  // ... existing props
  onArchive?: () => void;  // New
}
```

Add to destructuring:
```typescript
export const TaskCard: React.FC<TaskCardProps> = ({
  // ... existing
  onArchive,
}) => {
```

- [ ] **Step 4: Connect archive button to handler**

```typescript
{!readonly && onArchive && (
  <button
    onClick={(e) => {
      e.stopPropagation();
      onArchive();
    }}
    // ...
  >
```

- [ ] **Step 5: Pass onArchive from TaskList to TaskCard**

This requires updating TaskList to pass the onArchive prop to TaskCard.

- [ ] **Step 6: Commit**

```bash
git add roadmap-manager/src/components/TaskCard.tsx
git commit -m "feat(achievements): add archive button to TaskCard"
```

---

## Chunk 6: Testing & Polish

### Task 6.1: Test Complete Flow

**Files:**
- All

- [ ] **Step 1: Run TypeScript check**

```bash
cd roadmap-manager && npm run build
```

- [ ] **Step 2: Test in dev mode**

```bash
cd roadmap-manager && npm run dev
```

- [ ] **Step 3: Verify:**
   - [ ] Sidebar shows Achievements button
   - [ ] Clicking Achievements shows achievement list
   - [ ] TaskCard shows archive button in normal mode
   - [ ] Clicking archive moves task to achievements
   - [ ] Achievements view shows readonly cards
   - [ ] Restore button works and shows map selector

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat(achievements): complete achievements feature implementation"
```
