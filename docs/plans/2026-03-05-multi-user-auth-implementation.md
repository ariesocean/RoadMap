# Multi-User Authentication Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement multi-user registration, login, and auto-login with per-user data isolation and dedicated OpenCode server ports.

**Architecture:** Extend vite.config.ts with auth APIs, create user directory structure, manage per-user OpenCode server instances.

**Tech Stack:** TypeScript, Vite middleware, localStorage, SHA-256 for password hashing

---

## Phase 1: Backend - User Management Infrastructure

### Task 1: Create User Management Service

**Files:**
- Create: `roadmap-manager/src/services/userService.ts`

**Step 1: Create userService.ts with port management and user directory logic**

```typescript
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const PROJECT_DIR = path.resolve(process.cwd(), '..');
const USERS_DIR = path.join(PROJECT_DIR, 'users');
const PORTS_FILE = path.join(USERS_DIR, 'ports.json');

interface PortMapping {
  users: Record<string, number>;
  nextPort: number;
}

interface Device {
  deviceId: string;
  name: string;
  registeredAt: string;
  lastLoginAt: string;
}

interface LoginRecord {
  deviceId: string;
  loginAt: string;
  deviceInfo: string;
}

function ensureUsersDir(): void {
  if (!fs.existsSync(USERS_DIR)) {
    fs.mkdirSync(USERS_DIR, { recursive: true });
  }
}

function getPorts(): PortMapping {
  ensureUsersDir();
  if (!fs.existsSync(PORTS_FILE)) {
    return { users: {}, nextPort: 51000 };
  }
  return JSON.parse(fs.readFileSync(PORTS_FILE, 'utf-8'));
}

function savePorts(ports: PortMapping): void {
  fs.writeFileSync(PORTS_FILE, JSON.stringify(ports, null, 2));
}

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function generateUserId(username: string): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const shortName = username.slice(0, 6);
  return `${shortName}_${dateStr}`;
}

export async function registerUser(username: string, email: string, password: string, deviceId: string): Promise<{ userId: string; token: string }> {
  ensureUsersDir();
  
  const ports = getPorts();
  
  // Check username not exists
  const existingUsers = fs.readdirSync(USERS_DIR).filter(f => f !== 'ports.json');
  const userExists = existingUsers.some(f => f.startsWith(username + '_'));
  if (userExists) {
    throw new Error('Username already exists');
  }
  
  // Generate userId
  const userId = generateUserId(username);
  const userDir = path.join(USERS_DIR, userId);
  
  if (fs.existsSync(userDir)) {
    throw new Error('User already exists');
  }
  
  // Create user directory
  fs.mkdirSync(userDir, { recursive: true });
  
  // Allocate port
  const port = ports.nextPort;
  if (port > 51099) {
    throw new Error('No available ports');
  }
  ports.users[userId] = port;
  ports.nextPort = port + 1;
  savePorts(ports);
  
  // Initialize files
  fs.writeFileSync(path.join(userDir, 'roadmap.md'), '# Roadmap\n\n');
  fs.writeFileSync(path.join(userDir, 'roadmap-config.json'), JSON.stringify({ lastEditedMapId: null }));
  fs.writeFileSync(path.join(userDir, 'devices.json'), JSON.stringify({
    devices: [{ deviceId, name: 'Current Device', registeredAt: new Date().toISOString(), lastLoginAt: new Date().toISOString() }]
  }));
  fs.writeFileSync(path.join(userDir, 'login-history.json'), JSON.stringify({ history: [] }));
  
  // Create token
  const token = crypto.randomUUID();
  
  return { userId, token };
}

export async function loginUser(username: string, password: string, deviceId: string): Promise<{ userId: string; token: string }> {
  ensureUsersDir();
  
  const ports = getPorts();
  
  // Find user by username prefix
  const existingUsers = fs.readdirSync(USERS_DIR).filter(f => f !== 'ports.json');
  const userDir = existingUsers.find(f => f.startsWith(username + '_'));
  
  if (!userDir) {
    throw new Error('Invalid credentials');
  }
  
  const userId = userDir;
  
  // Check device authorized
  const devicesPath = path.join(USERS_DIR, userId, 'devices.json');
  const devices = JSON.parse(fs.readFileSync(devicesPath, 'utf-8'));
  const device = devices.devices.find((d: Device) => d.deviceId === deviceId);
  
  if (!device) {
    throw new Error('Device not authorized');
  }
  
  // Update last login
  device.lastLoginAt = new Date().toISOString();
  fs.writeFileSync(devicesPath, JSON.stringify(devices, null, 2));
  
  // Record login history
  const historyPath = path.join(USERS_DIR, userId, 'login-history.json');
  const history = JSON.parse(fs.readFileSync(historyPath, 'utf-8'));
  history.history.unshift({ deviceId, loginAt: new Date().toISOString(), deviceInfo: navigator.userAgent });
  fs.writeFileSync(historyPath, JSON.stringify(history, null, 2));
  
  // Create token
  const token = crypto.randomUUID();
  
  return { userId, token };
}

export async function autoLogin(deviceId: string): Promise<{ userId: string; token: string } | null> {
  ensureUsersDir();
  
  const ports = getPorts();
  const existingUsers = fs.readdirSync(USERS_DIR).filter(f => f !== 'ports.json');
  
  for (const userId of existingUsers) {
    const devicesPath = path.join(USERS_DIR, userId, 'devices.json');
    if (!fs.existsSync(devicesPath)) continue;
    
    const devices = JSON.parse(fs.readFileSync(devicesPath, 'utf-8'));
    const device = devices.devices.find((d: Device) => d.deviceId === deviceId);
    
    if (device) {
      // Update last login
      device.lastLoginAt = new Date().toISOString();
      fs.writeFileSync(devicesPath, JSON.stringify(devices, null, 2));
      
      const token = crypto.randomUUID();
      return { userId, token };
    }
  }
  
  return null;
}

export function getUserPort(userId: string): number | null {
  const ports = getPorts();
  return ports.users[userId] || null;
}

export function getUserDir(userId: string): string {
  return path.join(USERS_DIR, userId);
}

export async function addDevice(userId: string, deviceId: string, deviceName: string): Promise<void> {
  const devicesPath = path.join(USERS_DIR, userId, 'devices.json');
  const devices = JSON.parse(fs.readFileSync(devicesPath, 'utf-8'));
  
  const exists = devices.devices.some((d: Device) => d.deviceId === deviceId);
  if (exists) return;
  
  devices.devices.push({
    deviceId,
    name: deviceName,
    registeredAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString()
  });
  
  fs.writeFileSync(devicesPath, JSON.stringify(devices, null, 2));
}

export async function removeDevice(userId: string, deviceId: string): Promise<void> {
  const devicesPath = path.join(USERS_DIR, userId, 'devices.json');
  const devices = JSON.parse(fs.readFileSync(devicesPath, 'utf-8'));
  
  devices.devices = devices.devices.filter((d: Device) => d.deviceId !== deviceId);
  
  fs.writeFileSync(devicesPath, JSON.stringify(devices, null, 2));
}

export function getDevices(userId: string): Device[] {
  const devicesPath = path.join(USERS_DIR, userId, 'devices.json');
  const devices = JSON.parse(fs.readFileSync(devicesPath, 'utf-8'));
  return devices.devices;
}
```

**Step 2: Commit**

```bash
cd roadmap-manager && git add src/services/userService.ts && git commit -m "feat: add user management service with port allocation"
```

---

### Task 2: Add Auth API Endpoints to vite.config.ts

**Files:**
- Modify: `roadmap-manager/vite.config.ts`

**Step 1: Add auth middleware to roadmapPlugin**

Find the line `server.middlewares.use('/api/config'` and add after it:

```typescript
// Auth endpoints
server.middlewares.use('/api/auth/register', async (req: any, res: any, next: any) => {
  if (req.method === 'POST') {
    try {
      const chunks: Buffer[] = [];
      for await (const chunk of req) chunks.push(chunk);
      const body = JSON.parse(Buffer.concat(chunks).toString());
      
      const { username, email, password, deviceId } = body;
      
      if (!username || !email || !password || !deviceId) {
        res.status(400).end(JSON.stringify({ error: 'Missing required fields' }));
        return;
      }
      
      if (username.length > 6) {
        res.status(400).end(JSON.stringify({ error: 'Username must be 6 characters or less' }));
        return;
      }
      
      const result = await registerUser(username, email, password, deviceId);
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(result));
    } catch (error) {
      res.status(400).end(JSON.stringify({ error: error instanceof Error ? error.message : 'Registration failed' }));
    }
  } else {
    next();
  }
});

server.middlewares.use('/api/auth/login', async (req: any, res: any, next: any) => {
  if (req.method === 'POST') {
    try {
      const chunks: Buffer[] = [];
      for await (const chunk of req) chunks.push(chunk);
      const body = JSON.parse(Buffer.concat(chunks).toString());
      
      const { username, password, deviceId } = body;
      
      if (!username || !password || !deviceId) {
        res.status(400).end(JSON.stringify({ error: 'Missing required fields' }));
        return;
      }
      
      const result = await loginUser(username, password, deviceId);
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(result));
    } catch (error) {
      res.status(401).end(JSON.stringify({ error: error instanceof Error ? error.message : 'Login failed' }));
    }
  } else {
    next();
  }
});

server.middlewares.use('/api/auth/auto-login', async (req: any, res: any, next: any) => {
  if (req.method === 'POST') {
    try {
      const chunks: Buffer[] = [];
      for await (const chunk of req) chunks.push(chunk);
      const body = JSON.parse(Buffer.concat(chunks).toString());
      
      const { deviceId } = body;
      
      if (!deviceId) {
        res.status(400).end(JSON.stringify({ error: 'Missing deviceId' }));
        return;
      }
      
      const result = await autoLogin(deviceId);
      
      if (!result) {
        res.status(401).end(JSON.stringify({ error: 'Device not authorized' }));
        return;
      }
      
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(result));
    } catch (error) {
      res.status(500).end(JSON.stringify({ error: 'Auto-login failed' }));
    }
  } else {
    next();
  }
});

server.middlewares.use('/api/auth/user-info', async (req: any, res: any, next: any) => {
  if (req.method === 'GET') {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        res.status(401).end(JSON.stringify({ error: 'No token' }));
        return;
      }
      
      const userId = (req as any).userId;
      if (!userId) {
        res.status(401).end(JSON.stringify({ error: 'Invalid token' }));
        return;
      }
      
      const port = getUserPort(userId);
      const devices = getDevices(userId);
      
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ userId, port, devices }));
    } catch (error) {
      res.status(500).end(JSON.stringify({ error: 'Failed to get user info' }));
    }
  } else {
    next();
  }
});
```

**Step 2: Import userService at top of vite.config.ts**

Add after existing imports:
```typescript
import { registerUser, loginUser, autoLogin, getUserPort, getDevices } from './src/services/userService';
```

**Step 3: Commit**

```bash
git add vite.config.ts && git commit -m "feat: add auth API endpoints"
```

---

### Task 3: Add OpenCode Server Management

**Files:**
- Modify: `roadmap-manager/vite.config.ts`

**Step 1: Add OpenCode server management functions**

Add these functions after the existing `startOpenCodeServer` function:

```typescript
// User-specific OpenCode server management
const userOpenCodeProcesses: Map<number, any> = new Map();

async function startUserOpenCodeServer(userId: string): Promise<number> {
  const port = getUserPort(userId);
  if (!port) throw new Error('User not found');
  
  // Check if already running
  if (await checkPort(port)) {
    console.log(`[User ${userId}] OpenCode Server already running on port ${port}`);
    return port;
  }
  
  const userDir = getUserDir(userId);
  
  return new Promise((resolve, reject) => {
    const env = { ...process.env, OPENCODE_SERVER_PASSWORD: '' };
    const proc = spawn('opencode', ['serve', '--port', String(port)], {
      cwd: userDir,
      env,
      detached: true,
      stdio: 'ignore'
    });
    
    proc.unref();
    userOpenCodeProcesses.set(port, proc);
    
    let attempts = 0;
    const maxAttempts = 30;
    
    const checkInterval = setInterval(async () => {
      attempts++;
      if (await checkPort(port)) {
        clearInterval(checkInterval);
        console.log(`[User ${userId}] OpenCode Server started on port ${port}`);
        resolve(port);
      } else if (attempts >= maxAttempts) {
        clearInterval(checkInterval);
        reject(new Error('OpenCode Server 启动超时'));
      }
    }, 1000);
  });
}

async function stopUserOpenCodeServer(userId: string): Promise<void> {
  const port = getUserPort(userId);
  if (!port) return;
  
  if (!await checkPort(port)) {
    console.log(`[User ${userId}] OpenCode Server not running on port ${port}`);
    return;
  }
  
  return new Promise((resolve) => {
    const req = http.request({
      hostname: '127.0.0.1',
      port,
      path: '/global/shutdown',
      method: 'POST'
    }, (res) => {
      console.log(`[User ${userId}] OpenCode Server stopped on port ${port}`);
      resolve();
    });
    
    req.on('error', () => {
      // Force kill if graceful shutdown fails
      const proc = userOpenCodeProcesses.get(port);
      if (proc) {
        try {
          process.kill(-proc.pid);
        } catch {}
        userOpenCodeProcesses.delete(port);
      }
      resolve();
    });
    
    req.end();
    
    setTimeout(() => resolve(), 5000);
  });
}
```

**Step 2: Add logout endpoint**

Add after auth middleware:

```typescript
server.middlewares.use('/api/auth/logout', async (req: any, res: any, next: any) => {
  if (req.method === 'POST') {
    try {
      const chunks: Buffer[] = [];
      for await (const chunk of req) chunks.push(chunk);
      const body = JSON.parse(Buffer.concat(chunks).toString());
      
      const { userId } = body;
      
      if (userId) {
        await stopUserOpenCodeServer(userId);
      }
      
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: true }));
    } catch (error) {
      res.status(500).end(JSON.stringify({ error: 'Logout failed' }));
    }
  } else {
    next();
  }
});
```

**Step 3: Commit**

```bash
git add vite.config.ts && git commit -m "feat: add OpenCode server management per user"
```

---

### Task 4: Modify File Operations to Use User Directory

**Files:**
- Modify: `roadmap-manager/vite.config.ts:99-365`

**Step 1: Add current user context**

Add at the top of roadmapPlugin, after `name: 'roadmap-api'`:

```typescript
let currentUserId: string | null = null;

function setCurrentUser(userId: string | null) {
  currentUserId = userId;
}

function getCurrentUserDir(): string {
  if (!currentUserId) {
    return PROJECT_DIR;
  }
  return path.join(PROJECT_DIR, 'users', currentUserId);
}
```

**Step 2: Modify PROJECT_DIR usage to getCurrentUserDir()**

Replace all instances of `PROJECT_DIR` in file operations (read-roadmap, write-roadmap, list-maps, config, etc.) with `getCurrentUserDir()`.

For example:
- `path.resolve(PROJECT_DIR, 'roadmap.md')` → `path.resolve(getCurrentUserDir(), 'roadmap.md')`

**Step 3: Add middleware to set current user from token**

Add before auth endpoints:

```typescript
server.middlewares.use('/api', async (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    // In real implementation, verify token and set userId
    // For now, we rely on frontend passing userId in body/params
  }
  
  // Check for userId in query or body for multi-user endpoints
  const url = new URL(req.url, 'http://localhost');
  const userId = url.searchParams.get('userId') || (req as any).body?.userId;
  if (userId) {
    setCurrentUser(userId);
  }
  
  next();
});
```

**Step 4: Commit**

```bash
git add vite.config.ts && git commit -m "feat: modify file operations to support user directories"
```

---

## Phase 2: Frontend - Auth Store and Login

### Task 5: Update authStore with Multi-User Support

**Files:**
- Modify: `roadmap-manager/src/store/authStore.ts`

**Step 1: Add new state and actions**

```typescript
import { create } from 'zustand';
import { loadFromLocalStorage, saveToLocalStorage, removeFromLocalStorage } from '@/utils/storage';

const USERNAME_STORAGE_KEY = 'username';
const USER_ID_KEY = 'userId';
const TOKEN_KEY = 'authToken';
const DEVICE_ID_KEY = 'deviceId';

function getOrCreateDeviceId(): string {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
}

export interface AuthState {
  username: string | null;
  userId: string | null;
  token: string | null;
  deviceId: string;
  isAuthenticated: boolean;
  userPort: number | null;
  
  setUsername: (username: string) => void;
  setUserId: (userId: string) => void;
  setToken: (token: string) => void;
  setUserPort: (port: number) => void;
  login: (username: string, userId: string, token: string) => void;
  logout: () => void;
  initAuth: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  username: null,
  userId: null,
  token: null,
  deviceId: getOrCreateDeviceId(),
  isAuthenticated: false,
  userPort: null,

  setUsername: (username: string) => {
    set({ username });
    saveToLocalStorage(USERNAME_STORAGE_KEY, username);
  },

  setUserId: (userId: string) => {
    set({ userId });
    saveToLocalStorage(USER_ID_KEY, userId);
  },

  setToken: (token: string) => {
    set({ token });
    saveToLocalStorage(TOKEN_KEY, token);
  },

  setUserPort: (port: number) => {
    set({ userPort: port });
  },

  login: (username: string, userId: string, token: string) => {
    set({ username, userId, token, isAuthenticated: true });
    saveToLocalStorage(USERNAME_STORAGE_KEY, username);
    saveToLocalStorage(USER_ID_KEY, userId);
    saveToLocalStorage(TOKEN_KEY, token);
  },

  logout: () => {
    set({ username: null, userId: null, token: null, isAuthenticated: false, userPort: null });
    removeFromLocalStorage(USERNAME_STORAGE_KEY);
    removeFromLocalStorage(USER_ID_KEY);
    removeFromLocalStorage(TOKEN_KEY);
  },

  initAuth: () => {
    const savedUsername = loadFromLocalStorage(USERNAME_STORAGE_KEY);
    const savedUserId = loadFromLocalStorage(USER_ID_KEY);
    const savedToken = loadFromLocalStorage(TOKEN_KEY);
    const deviceId = getOrCreateDeviceId();
    
    set({ 
      username: savedUsername, 
      userId: savedUserId, 
      token: savedToken,
      deviceId,
      isAuthenticated: !!(savedUserId && savedToken)
    });
  },
}));
```

**Step 2: Commit**

```bash
git add src/store/authStore.ts && git commit -m "feat: update authStore with multi-user support"
```

---

### Task 6: Update LoginPage to Use Real API

**Files:**
- Modify: `roadmap-manager/src/pages/LoginPage.tsx`

**Step 1: Replace mock login with API calls**

Replace handleLogin:

```typescript
const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoginError(null);

  if (!loginUsername.trim() || !loginPassword.trim()) {
    setLoginError('Please check your username or password');
    return;
  }

  try {
    const deviceId = useAuthStore.getState().deviceId;
    
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: loginUsername,
        password: loginPassword,
        deviceId
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      setLoginError(error.error || 'Login failed');
      return;
    }

    const { userId, token } = await response.json();
    
    useAuthStore.getState().login(loginUsername, userId, token);
    
    await initializeMapsOnLogin();
    toggleConnected();
    saveToLocalStorage('isConnected', 'true');

    setLoginUsername('');
    setLoginPassword('');
  } catch (err) {
    setLoginError('Login failed. Please try again.');
  }
};
```

Replace handleRegister:

```typescript
const handleRegister = async (e: React.FormEvent) => {
  e.preventDefault();
  setRegisterError(null);

  if (!registerUsername.trim() || !registerEmail.trim() || !registerPassword.trim()) {
    setRegisterError('Please fill in all fields');
    return;
  }

  if (registerUsername.length > 6) {
    setRegisterError('Username must be 6 characters or less');
    return;
  }

  try {
    const deviceId = useAuthStore.getState().deviceId;
    
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: registerUsername,
        email: registerEmail,
        password: registerPassword,
        deviceId
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      setRegisterError(error.error || 'Registration failed');
      return;
    }

    const { userId, token } = await response.json();
    
    useAuthStore.getState().login(registerUsername, userId, token);
    
    await initializeMapsOnLogin();
    toggleConnected();
    saveToLocalStorage('isConnected', 'true');

    setRegisterUsername('');
    setRegisterEmail('');
    setRegisterPassword('');
    setShowRegister(false);
  } catch (err) {
    setRegisterError('Registration failed. Please try again.');
  }
};
```

**Step 2: Add auto-login check on mount**

Add to useEffect:

```typescript
useEffect(() => {
  // Try auto-login first
  const tryAutoLogin = async () => {
    const deviceId = useAuthStore.getState().deviceId;
    
    try {
      const response = await fetch('/api/auth/auto-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId }),
      });

      if (response.ok) {
        const { userId, token } = await response.json();
        
        // Get username from userId (first part before _)
        const username = userId.split('_')[0];
        
        useAuthStore.getState().login(username, userId, token);
        
        await initializeMapsOnLogin();
        toggleConnected();
        saveToLocalStorage('isConnected', 'true');
      }
    } catch (err) {
      // Auto-login failed, show login page
    }
  };

  tryAutoLogin();
  
  // Sync theme
  setIsDarkMode(theme === 'dark');
}, []);
```

**Step 3: Commit**

```bash
git add src/pages/LoginPage.tsx && git commit -m "feat: connect LoginPage to real auth API"
```

---

### Task 7: Add Auto-Login on App Mount

**Files:**
- Modify: `roadmap-manager/src/main.tsx` or `src/App.tsx`

**Step 1: Add auto-login logic before rendering**

In main.tsx or App.tsx, add:

```typescript
// Before rendering App, try auto-login
const initApp = async () => {
  const { isAuthenticated, deviceId } = useAuthStore.getState();
  
  if (!isAuthenticated) {
    try {
      const response = await fetch('/api/auth/auto-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId }),
      });

      if (response.ok) {
        const { userId, token } = await response.json();
        const username = userId.split('_')[0];
        useAuthStore.getState().login(username, userId, token);
        useTaskStore.getState().toggleConnected();
        saveToLocalStorage('isConnected', 'true');
        
        // Initialize maps
        const { setLoadingEnabled, setAvailableMaps, setCurrentMap, loadLastEditedMapId } = useMapsStore.getState();
        setLoadingEnabled(true);
        const maps = await listMaps();
        setAvailableMaps(maps);
        const lastEditedMapId = await loadLastEditedMapId();
        if (lastEditedMapId && maps.length > 0) {
          const targetMap = maps.find((m: MapInfo) => m.id === lastEditedMapId);
          if (targetMap) setCurrentMap(targetMap);
        }
        await useTaskStore.getState().refreshTasks();
      }
    } catch (err) {
      // Auto-login failed, show login page
    }
  }
};

initApp();
```

**Step 2: Commit**

```bash
git add src/main.tsx && git commit -m "feat: add auto-login on app mount"
```

---

### Task 8: Handle Logout with Server Cleanup

**Files:**
- Modify: `roadmap-manager/src/components/AccountPopup.tsx` or similar

**Step 1: Update logout handler**

```typescript
const handleLogout = async () => {
  const { userId, logout } = useAuthStore.getState();
  
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
  } catch (err) {
    // Continue with local logout
  }
  
  logout();
  useTaskStore.getState().toggleConnected();
  removeFromLocalStorage('isConnected');
};
```

**Step 2: Commit**

```bash
git add src/components/AccountPopup.tsx && git commit -m "feat: add logout with server cleanup"
```

---

## Phase 3: Testing

### Task 9: Manual Testing

**Step 1: Start dev server**

```bash
cd roadmap-manager && npm run dev
```

**Step 2: Test registration**
- Open http://localhost:1430
- Click Sign Up
- Enter username (max 6 chars), email, password
- Submit and verify user directory created

**Step 3: Test login**
- Logout
- Login with credentials
- Verify data in user directory

**Step 4: Test auto-login**
- Refresh page
- Should auto-login without credentials

**Step 5: Test logout**
- Click logout
- Verify OpenCode server stopped
- Verify page returns to login

**Step 6: Test multi-user**
- Register second user
- Verify separate directory and port
- Switch users, verify data isolation

---

## Summary

| Task | Description |
|------|-------------|
| 1 | Create userService.ts with port management |
| 2 | Add auth API endpoints |
| 3 | Add OpenCode server management |
| 4 | Modify file operations for user directories |
| 5 | Update authStore |
| 6 | Update LoginPage |
| 7 | Add auto-login on app mount |
| 8 | Handle logout cleanup |
| 9 | Manual testing |
