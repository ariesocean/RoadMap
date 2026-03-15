# Design: Achievements (成就集) Feature

## Overview

在 Sidebar 下方添加 Achievements 容器，允许用户将主任务归档到成就集，并可以随时恢复到 Map 中。

## Storage Approach

### 存储方式: 独立 achievements.md 文件

每个用户的成就数据存储在独立的 `achievements.md` 文件中：
```
users/{userId}/
├── roadmap.md
├── achievements.md    ← 独立文件存储成就
├── map-*.md
└── ...
```

**原因**:
- 与 Map 文件解耦，一个成就可以恢复到任意 Map
- 用户可能在多个 Map 之间切换成就
- 避免重复存储

### 数据格式 (achievements.md)

实际文件格式示例：
```markdown
# 春节前后行程 [created: 2026-02-21 19:28]
> 2月13日到2月21日的日程安排

* [x] 做大扫除（2月14日）
  * [x] 深度清洗扫地机器人
* [x] 13 号 抵达第一天
  * [x] 13 号上午到武汉后先去搞一碗牛肉粉，去雪松路看看

**Archived:** 2026-02-21 19:28

---
# 预约看办公室 [created: 2026-02-25 20:54]
> 预约看办公室

* [x] 新梅联合广场（重点商圈中心位置，人流量大）
  * [x] 95㎡

**Archived:** 2026-03-15 00:46
```

**格式说明**:
- 每个成就以 `#` 标题开始，标题包含任务标题和创建时间 `[created: YYYY-MM-DD HH:mm]`
- `>` 引用块是 originalPrompt（可选）
- `* [ ]` 或 `* [x]` 是子任务（支持嵌套缩进）
- `**Archived:**` 行记录归档时间
- 用 `---` 分隔不同的成就

### Sidebar Layout
```
┌─────────────────────────┐
│ ☰                       │  ← Toggle Button
│ [+ New Map]             │  ← Create Map Button
│ ─────────────────────── │
│ 📁 Map 1                │  ← Maps List
│ 📁 Map 2                │
│ 📁 Map 3                │
│ ─────────────────────── │
│ 🏆 Achievements         │  ← Achievements Button (独立按钮)
└─────────────────────────┘
```

### Main Content - Achievements View
```
┌─────────────────────────────────────┐
│  🏆 Achievements                    │  ← View Header
│  ─────────────────────────────────  │
│                                      │
│  ┌─────────────────────────────┐   │
│  │ Task Title                  │   │  ← Readonly TaskCard
│  │ "Original prompt..."        │   │
│  │ ─────────────────────────   │   │
│  │   ✓ Subtask 1              │   │  ← 无 checkbox，仅展示
│  │   ✓ Subtask 2              │   │
│  │   → Subtask 2.1            │   │
│  │                             │   │
│  │ Created: 2024-01-01        │   │
│  │ Archived: 2024-01-15       │   │  ← 显示归档时间
│  └─────────────────────────────┘   │
│                                      │
└─────────────────────────────────────┘
```

### TaskCard Readonly Mode

| Feature | Normal Mode | Readonly Mode |
|---------|-------------|---------------|
| 展开/折叠 | ✅ | ✅ |
| 主任务拖拽排序 | ✅ | ✅ |
| 子任务拖拽排序 | ✅ | ❌ |
| 标题编辑 (双击) | ✅ | ❌ |
| 描述编辑 (双击) | ✅ | ❌ |
| 子任务 checkbox | ✅ | ❌ (仅展示) |
| 子任务删除线 (checked) | ✅ | ❌ (始终无删除线) |
| Created 时间 | ✅ | ✅ |
| Archived 时间 | ❌ | ✅ |
| Add Subtask 按钮 | ✅ | ❌ |
| 归档按钮 | ✅ | ❌ |

### Map Selector Modal
```
┌─────────────────────────────────────┐
│  Select Target Map                  │
│  ─────────────────────────────────  │
│  📁 Map 1                    [选择] │
│  📁 Map 2                    [选择] │
│  📁 Map 3                    [选择] │
│                                     │
│                              [取消] │
└─────────────────────────────────────┘
```

## Data Structure

### Achievement Type (更新 types.ts 中的定义)
```typescript
interface Achievement {
  id: string;
  title: string;
  originalPrompt: string;
  createdAt: string;      // 从标题中提取: [created: YYYY-MM-DD HH:mm]
  archivedAt: string;     // 从 **Archived:** 行提取
  subtasks: Subtask[];
}
```

## Interactions

### Flow 1: Archive Task to Achievements
1. 用户点击 TaskCard 上的"归档"图标按钮
2. 弹出确认对话框: "确定要将此任务移至成就集吗？"
3. 用户确认后:
   - 从当前 Map 移除任务
   - 调用 `/api/save-achievement` 保存到 achievements.md
4. UI 更新，显示成就数量 +1

### Flow 2: View Achievements
1. 用户点击 Sidebar 底部的 "🏆 Achievements" 按钮
2. Sidebar 高亮显示 Achievements
3. Main Content 切换到 Achievements 视图
4. 调用 `/api/read-achievements` 获取成就列表
5. 显示所有成就的只读卡片列表

### Flow 3: Restore Achievement to Map
1. 用户在 Achievements 视图中点击任务卡片上的"恢复"图标
2. 弹出 Map 选择器 modal
3. 用户选择目标 Map
4. 调用 `/api/delete-achievement` 删除成就
5. 调用 `/api/write-map` 添加任务到目标 Map
6. UI 更新

### Edge Cases

1. **目标 Map 已删除**
   - 在 Map 选择器中过滤掉已删除的 Map
   - 如果所有 Map 都已删除，显示提示"请先创建一个 Map"

2. **achievements.md 不存在**
   - 自动创建空的 achievements.md 文件

3. **归档时当前 Map 未保存**
   - 先保存当前 Map，再执行归档操作

## Components

### New Components

1. **AchievementList.tsx**
   - 展示成就列表
   - 使用 TaskCard readonly 模式
   - 包含"恢复"按钮

2. **MapSelectorModal.tsx**
   - 显示可用 Maps 列表
   - 选择后触发 restore 回调

### Modified Components

1. **MapsSidebar.tsx**
   - 添加 Achievements 按钮区域
   - 支持点击切换到 Achievements 视图

2. **TaskCard.tsx**
   - 添加 `readonly` 属性
   - 当 `readonly={true}` 时:
     - 隐藏编辑相关 UI
     - 隐藏 checkbox
     - 隐藏删除线效果
     - 显示 archivedAt 时间
     - 显示"恢复"按钮（可选，通过 `showRestore` 属性控制）

3. **App.tsx**
   - 添加 `viewMode` 状态: `'map' | 'achievements'`
   - 根据 viewMode 渲染不同内容

### Store Changes (taskStore.ts)

```typescript
interface TaskStore {
  // Existing
  tasks: Task[];
  achievements: Achievement[];
  viewMode: 'map' | 'achievements';  // 新增视图模式

  // New Actions
  setViewMode: (mode: 'map' | 'achievements') => void;
  loadAchievements: () => Promise<void>;
  moveToAchievements: (taskId: string) => Promise<void>;
  restoreFromAchievements: (achievementId: string, targetMapId: string) => Promise<void>;
}
```

### File Service Changes (fileService.ts)

```typescript
// 新增 API
export async function loadAchievements(): Promise<Achievement[]> {
  const response = await fetch('/api/read-achievements');
  if (response.ok) {
    const data = await response.json();
    return data.achievements || [];
  }
  return [];
}

export async function saveAchievement(achievement: Achievement): Promise<boolean> {
  const response = await fetch('/api/save-achievement', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ achievement }),
  });
  return response.ok;
}

export async function deleteAchievement(achievementId: string): Promise<boolean> {
  const response = await fetch('/api/delete-achievement', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ achievementId }),
  });
  return response.ok;
}
```

## API Changes

### New Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/read-achievements` | GET | 读取 achievements.md，返回成就列表 |
| `/api/save-achievement` | POST | 保存单个成就到 achievements.md |
| `/api/delete-achievement` | POST | 从 achievements.md 删除指定成就 |

### Request/Response Formats

#### GET /api/read-achievements
Response:
```json
{
  "achievements": [
    {
      "id": "task-uuid",
      "title": "Task Title",
      "originalPrompt": "prompt text",
      "createdAt": "2024-01-15T10:00:00Z",
      "archivedAt": "2024-01-15T10:00:00Z",
      "subtasks": [...]
    }
  ]
}
```

#### POST /api/save-achievement
Request:
```json
{
  "achievement": {
    "id": "task-uuid",
    "title": "Task Title",
    "originalPrompt": "prompt text",
    "createdAt": "2024-01-15T10:00:00Z",
    "archivedAt": "2024-01-15T10:00:00Z",
    "subtasks": [...]
  }
}
```

#### POST /api/delete-achievement
Request:
```json
{
  "achievementId": "task-uuid"
}
```

### Backend Changes (server/index.ts)

1. 添加 `/api/read-achievements` 端点
   - 读取 `{userDir}/achievements.md`
   - 解析现有的 markdown 格式（`# Title [created: ...]`, `> prompt`, `* [ ] subtasks`, `**Archived:**`）
   - 转换为 Achievement 对象数组返回

2. 添加 `/api/save-achievement` 端点
   - 追加新成就到 achievements.md
   - 格式: `# {title} [created: {createdAt}]\n> {prompt}\n\n{subtasks}\n\n**Archived:** {archivedAt}\n\n---`

3. 添加 `/api/delete-achievement` 端点
   - 从 achievements.md 中移除指定成就
   - 通过标题或 ID 匹配要删除的成就

**注意**: 后端复用现有的 markdown 解析逻辑（参考 `utils/markdownUtils.ts` 中的 `parseMarkdownTasks`）

## i18n Translations

需要添加的翻译 key:
```json
{
  "achievements": "Achievements",
  "achievementsCount": "{count} Achievements",
  "archiveTask": "Archive to Achievements",
  "confirmArchive": "Are you sure you want to move this task to achievements?",
  "restoreTask": "Restore to Map",
  "selectTargetMap": "Select Target Map",
  "archived": "Archived",
  "cancel": "Cancel",
  "confirm": "Confirm",
  "noAchievements": "No achievements yet",
  "achievementsEmpty": "Tasks you archive will appear here"
}
```

## Dev/Server Mode Compatibility

- 所有 UI 组件使用同一套代码，不区分 dev/serve mode
- 数据层通过相同的 store 和 API service 获取
- 无论 `npm run dev` 还是 `npm run preview` 运行，UI 组件保持一致

## Acceptance Criteria

1. ✅ Sidebar 底部显示独立的 Achievements 按钮
2. ✅ 点击 Achievements 按钮，Main Content 显示成就列表
3. ✅ TaskCard 支持 readonly 模式渲染
4. ✅ 用户可以将任务归档到成就集
5. ✅ 用户可以将成就恢复到指定 Map
6. ✅ 成就数据持久化到独立的 achievements.md 文件
7. ✅ Dev/Server mode 共享同一套 UI 代码
8. ✅ i18n 翻译完整
