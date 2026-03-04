# Design: Add Login Page

## Architecture

### 设计原则
- **代码复用**: 从 `roadmap-manager-login` 移植登录/注册 UI 代码，不重新设计
- **状态复用**: 复用现有的 `isConnected` 状态，登录=Connected，登出=Disconnected

### File Structure
```
src/
├── stores/
│   └── authStore.ts          # NEW - 用户名管理 (复用 isConnected 作为登录状态)
├── pages/
│   └── LoginPage.tsx         # NEW - 登录页面 (从 roadmap-manager-login 移植)
├── components/
│   ├── App.tsx               # MODIFIED - 头部修改
│   └── AccountPopup.tsx      # NEW - 账户管理弹窗
└── main.tsx                  # MODIFIED - 入口条件渲染
```

### State Management

**复用现有状态**:
- 使用 `useTaskStore` 中的 `isConnected` 作为登录状态
- `isConnected = true` → 已登录
- `isConnected = false` → 未登录

**新增用户名管理**:
```typescript
interface AuthState {
  username: string | null;
  setUsername: (username: string) => void;
  updateUsername: (username: string) => void;
  clearUsername: () => void;
}
```

**localStorage Keys**
- 复用现有: `isLoggedIn` (通过 `isConnected` 状态)
- 新增: `username`: 用户名字符串

## Component Design

### LoginPage

**从 `roadmap-manager-login/src/App.tsx` 移植**:
- 登录表单（用户名、密码）
- 注册弹窗（用户名、邮箱、密码）
- 主题切换（暗色/亮色）
- 登录成功时:
  1. 调用 `useTaskStore.getState().toggleConnected()` 设为 Connected
  2. 设置用户名到 authStore
  3. 跳转到主界面

### AccountPopup

位置：头部右侧用户名区域点击弹出

功能：
- 显示当前用户名
- 修改用户名输入框 + 确认按钮
- 修改密码输入框 + 确认按钮
- 登出按钮

样式：
- 弹窗使用 absolute 定位
- 点击外部关闭
- 包含修改密码、修改用户名、登出三个区域

### App.tsx Header Modification

原代码：
```tsx
<div onClick={toggleConnected}>
  <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
  <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
</div>
```

新代码：
```tsx
<AccountPopup />
```

## Acceptance Criteria

1. 用户打开应用首先显示登录页面
2. 登录页面包含登录表单和注册入口
3. 点击注册按钮弹出注册弹窗
4. 登录成功后自动进入主界面
5. 主界面头部右侧显示用户名（不再显示 Connected/Disconnected）
6. 点击用户名弹出账户管理面板
7. 账户面板可修改用户名、修改密码、登出
8. 登出后返回登录页面
9. 刷新页面保持登录状态（localStorage）
