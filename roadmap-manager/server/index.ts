import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import * as http from 'http';
import { spawn, execSync } from 'child_process';

const app = express();
app.use(cors());
app.use(express.json());

const config = require('../src/config.cjs');
const PROJECT_DIR = process.env.PROJECT_DIR || config.projectDir;
const USERS_DIR = process.env.USERS_DIR || config.usersDir || path.join(PROJECT_DIR, 'users');

const PORTS_FILE = path.join(USERS_DIR, 'ports.json');

const DEFAULT_PORTS = [51432, 51466, 51434];
const OPENCODE_HOST = '127.0.0.1';
const openCodePort = DEFAULT_PORTS[0];

const ERRORS = {
  USER_NOT_FOUND: 'User not found',
  USER_ALREADY_EXISTS: 'User already exists',
  INVALID_CREDENTIALS: 'Invalid credentials',
  DEVICE_NOT_AUTHORIZED: 'Device not authorized',
  NO_AVAILABLE_PORTS: 'No available ports',
  INVALID_USERNAME: 'Invalid username',
  INVALID_EMAIL: 'Invalid email',
  CORRUPTED_FILE: 'Corrupted data file',
} as const;

interface UserCredentials {
  username: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}

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
  try {
    return JSON.parse(fs.readFileSync(PORTS_FILE, 'utf-8'));
  } catch {
    return { users: {}, nextPort: 51000 };
  }
}

function savePorts(ports: PortMapping): void {
  fs.writeFileSync(PORTS_FILE, JSON.stringify(ports, null, 2));
}

function validateUsername(username: string): void {
  if (!username || typeof username !== 'string') {
    throw new Error(ERRORS.INVALID_USERNAME);
  }
  const trimmed = username.trim();
  if (trimmed.length < 3 || trimmed.length > 32) {
    throw new Error(ERRORS.INVALID_USERNAME);
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
    throw new Error(ERRORS.INVALID_USERNAME);
  }
}

function validateEmail(email: string): void {
  if (!email || typeof email !== 'string') {
    throw new Error(ERRORS.INVALID_EMAIL);
  }
  const trimmed = email.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    throw new Error(ERRORS.INVALID_EMAIL);
  }
}

function validatePassword(password: string): void {
  if (!password || typeof password !== 'string') {
    throw new Error('Password is required');
  }
  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters');
  }
}

function userExists(userId: string): boolean {
  const userDir = path.join(USERS_DIR, userId);
  return fs.existsSync(userDir);
}

function hashPassword(_password: string): string {
  return crypto.createHash('sha256').update(_password).digest('hex');
}

function generateUserId(username: string): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const shortName = username.slice(0, 6);
  return `${shortName}_${dateStr}`;
}

async function registerUser(username: string, _email: string, _password: string, deviceId: string): Promise<{ userId: string; token: string }> {
  ensureUsersDir();

  validateUsername(username);
  validateEmail(_email);

  const ports = getPorts();

  const existingUsers = fs.readdirSync(USERS_DIR).filter(f => f !== 'ports.json');
  
  for (const dir of existingUsers) {
    const userPath = path.join(USERS_DIR, dir, 'user.json');
    if (!fs.existsSync(userPath)) continue;
    try {
      const userData = JSON.parse(fs.readFileSync(userPath, 'utf-8'));
      if (userData.username === username) {
        throw new Error(ERRORS.USER_ALREADY_EXISTS);
      }
    } catch (err) {
      if (err instanceof Error && err.message === ERRORS.USER_ALREADY_EXISTS) {
        throw err;
      }
      continue;
    }
  }

  const userId = generateUserId(username);
  const userDir = path.join(USERS_DIR, userId);

  if (fs.existsSync(userDir)) {
    throw new Error(ERRORS.USER_ALREADY_EXISTS);
  }

  fs.mkdirSync(userDir, { recursive: true });

  const userGuideSource = path.join(PROJECT_DIR, 'map-UserGuide.md');
  if (fs.existsSync(userGuideSource)) {
    fs.copyFileSync(userGuideSource, path.join(userDir, 'map-UserGuide.md'));
  }

  const port = ports.nextPort;
  if (port > 51099) {
    throw new Error(ERRORS.NO_AVAILABLE_PORTS);
  }
  ports.users[userId] = port;
  ports.nextPort = port + 1;
  savePorts(ports);

  fs.writeFileSync(path.join(userDir, 'roadmap.md'), '# Roadmap\n\n');
  fs.writeFileSync(path.join(userDir, 'roadmap-config.json'), JSON.stringify({ lastEditedMapId: 'UserGuide' }));
  fs.writeFileSync(path.join(userDir, 'devices.json'), JSON.stringify({
    devices: [{ deviceId, name: 'Current Device', registeredAt: new Date().toISOString(), lastLoginAt: new Date().toISOString() }]
  }));
  fs.writeFileSync(path.join(userDir, 'login-history.json'), JSON.stringify({ history: [] }));

  const passwordHash = hashPassword(_password);
  fs.writeFileSync(path.join(userDir, 'user.json'), JSON.stringify({
    username,
    email: _email,
    passwordHash,
    createdAt: new Date().toISOString()
  }, null, 2));

  const token = crypto.randomUUID();

  return { userId, token };
}

async function loginUser(username: string, _password: string, deviceId: string, deviceInfo: string): Promise<{ userId: string; token: string }> {
  ensureUsersDir();

  const existingUsers = fs.readdirSync(USERS_DIR).filter(f => f !== 'ports.json');
  
  let userId: string | null = null;
  for (const dir of existingUsers) {
    const userPath = path.join(USERS_DIR, dir, 'user.json');
    if (!fs.existsSync(userPath)) continue;
    try {
      const userData = JSON.parse(fs.readFileSync(userPath, 'utf-8'));
      if (userData.username === username || userData.email === username) {
        userId = dir;
        break;
      }
    } catch {
      continue;
    }
  }

  if (!userId) {
    throw new Error(ERRORS.INVALID_CREDENTIALS);
  }

  const userPath = path.join(USERS_DIR, userId, 'user.json');
  let credentials: UserCredentials;
  try {
    credentials = JSON.parse(fs.readFileSync(userPath, 'utf-8'));
  } catch {
    throw new Error(ERRORS.CORRUPTED_FILE);
  }
  const storedHash = Buffer.from(credentials.passwordHash, 'hex');
  const inputHash = Buffer.from(hashPassword(_password), 'hex');
  if (!crypto.timingSafeEqual(storedHash, inputHash)) {
    throw new Error(ERRORS.INVALID_CREDENTIALS);
  }

  const devicesPath = path.join(USERS_DIR, userId, 'devices.json');
  let devices;
  try {
    devices = JSON.parse(fs.readFileSync(devicesPath, 'utf-8'));
  } catch {
    throw new Error(ERRORS.CORRUPTED_FILE);
  }
  let device = devices.devices.find((d: Device) => d.deviceId === deviceId);

  if (!device) {
    devices.devices.push({
      deviceId,
      name: deviceInfo || 'New Device',
      registeredAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString()
    });
    fs.writeFileSync(devicesPath, JSON.stringify(devices, null, 2));
    device = devices.devices.find((d: Device) => d.deviceId === deviceId);
  } else {
    device.lastLoginAt = new Date().toISOString();
    fs.writeFileSync(devicesPath, JSON.stringify(devices, null, 2));
  }

  const historyPath = path.join(USERS_DIR, userId, 'login-history.json');
  let history;
  try {
    history = JSON.parse(fs.readFileSync(historyPath, 'utf-8'));
  } catch {
    history = { history: [] };
  }
  history.history.unshift({ deviceId, loginAt: new Date().toISOString(), deviceInfo });
  fs.writeFileSync(historyPath, JSON.stringify(history, null, 2));

  const token = crypto.randomUUID();

  return { userId, token };
}

async function autoLogin(deviceId: string): Promise<{ userId: string; token: string } | null> {
  ensureUsersDir();

  const existingUsers = fs.readdirSync(USERS_DIR).filter(f => f !== 'ports.json');

  for (const userId of existingUsers) {
    const devicesPath = path.join(USERS_DIR, userId, 'devices.json');
    if (!fs.existsSync(devicesPath)) continue;

    let devices;
    try {
      devices = JSON.parse(fs.readFileSync(devicesPath, 'utf-8'));
    } catch {
      continue;
    }
    const device = devices.devices.find((d: Device) => d.deviceId === deviceId);

    if (device) {
      device.lastLoginAt = new Date().toISOString();
      fs.writeFileSync(devicesPath, JSON.stringify(devices, null, 2));

      const token = crypto.randomUUID();
      return { userId, token };
    }
  }

  return null;
}

function getUserPort(userId: string): number | null {
  if (!userExists(userId)) {
    return null;
  }
  const ports = getPorts();
  return ports.users[userId] || null;
}

function getUserDir(userId: string): string {
  if (!userExists(userId)) {
    throw new Error(ERRORS.USER_NOT_FOUND);
  }
  return path.join(USERS_DIR, userId);
}

async function removeDevice(userId: string, deviceId: string): Promise<void> {
  if (!userExists(userId)) {
    throw new Error(ERRORS.USER_NOT_FOUND);
  }
  const devicesPath = path.join(USERS_DIR, userId, 'devices.json');
  let devices;
  try {
    devices = JSON.parse(fs.readFileSync(devicesPath, 'utf-8'));
  } catch {
    throw new Error(ERRORS.CORRUPTED_FILE);
  }

  devices.devices = devices.devices.filter((d: Device) => d.deviceId !== deviceId);

  fs.writeFileSync(devicesPath, JSON.stringify(devices, null, 2));
}

function getDevices(userId: string): Device[] {
  if (!userExists(userId)) {
    throw new Error(ERRORS.USER_NOT_FOUND);
  }
  const devicesPath = path.join(USERS_DIR, userId, 'devices.json');
  let devices;
  try {
    devices = JSON.parse(fs.readFileSync(devicesPath, 'utf-8'));
  } catch {
    throw new Error(ERRORS.CORRUPTED_FILE);
  }
  return devices.devices;
}

function getUserInfo(userId: string): { username: string; email: string } {
  if (!userExists(userId)) {
    throw new Error(ERRORS.USER_NOT_FOUND);
  }
  const userPath = path.join(USERS_DIR, userId, 'user.json');
  let userData: UserCredentials;
  try {
    userData = JSON.parse(fs.readFileSync(userPath, 'utf-8'));
  } catch {
    throw new Error(ERRORS.CORRUPTED_FILE);
  }
  return { username: userData.username, email: userData.email };
}

function updateUsername(userId: string, newUsername: string): void {
  if (!userExists(userId)) {
    throw new Error(ERRORS.USER_NOT_FOUND);
  }
  validateUsername(newUsername);
  
  const existingUsers = fs.readdirSync(USERS_DIR).filter(f => f !== 'ports.json');
  
  for (const dir of existingUsers) {
    if (dir === userId) continue;
    const userPath = path.join(USERS_DIR, dir, 'user.json');
    if (!fs.existsSync(userPath)) continue;
    try {
      const userData = JSON.parse(fs.readFileSync(userPath, 'utf-8'));
      if (userData.username === newUsername) {
        throw new Error(ERRORS.USER_ALREADY_EXISTS);
      }
    } catch (err) {
      if (err instanceof Error && err.message === ERRORS.USER_ALREADY_EXISTS) {
        throw err;
      }
      continue;
    }
  }
  
  const userPath = path.join(USERS_DIR, userId, 'user.json');
  let userData: UserCredentials;
  try {
    userData = JSON.parse(fs.readFileSync(userPath, 'utf-8'));
  } catch {
    throw new Error(ERRORS.CORRUPTED_FILE);
  }
  
  userData.username = newUsername.trim();
  fs.writeFileSync(userPath, JSON.stringify(userData, null, 2));

  const devicesPath = path.join(USERS_DIR, userId, 'devices.json');
  fs.writeFileSync(devicesPath, JSON.stringify({ devices: [] }));
}

function updatePassword(userId: string, currentPassword: string, newPassword: string): void {
  if (!userExists(userId)) {
    throw new Error(ERRORS.USER_NOT_FOUND);
  }
  
  validatePassword(newPassword);
  
  const userPath = path.join(USERS_DIR, userId, 'user.json');
  let userData: UserCredentials;
  try {
    userData = JSON.parse(fs.readFileSync(userPath, 'utf-8'));
  } catch {
    throw new Error(ERRORS.CORRUPTED_FILE);
  }
  
  const storedHash = Buffer.from(userData.passwordHash, 'hex');
  const inputHash = Buffer.from(hashPassword(currentPassword), 'hex');
  if (!crypto.timingSafeEqual(storedHash, inputHash)) {
    throw new Error('Current password is incorrect');
  }
  
  const newPasswordHash = hashPassword(newPassword);
  if (Buffer.from(newPasswordHash, 'hex').equals(storedHash)) {
    throw new Error('New password must be different from current password');
  }
  
  userData.passwordHash = newPasswordHash;
  fs.writeFileSync(userPath, JSON.stringify(userData, null, 2));

  const devicesPath = path.join(USERS_DIR, userId, 'devices.json');
  fs.writeFileSync(devicesPath, JSON.stringify({ devices: [] }));
}

async function checkPort(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:${port}/global/health`, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(2000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function findAvailablePort(): Promise<number | null> {
  for (const port of DEFAULT_PORTS) {
    if (await checkPort(port)) {
      return port;
    }
  }
  return null;
}

async function startOpenCodeServer(port: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const env = { ...process.env, OPENCODE_SERVER_PASSWORD: '' };
    const proc = spawn('opencode', ['serve', '--port', String(port)], {
      cwd: PROJECT_DIR,
      env,
      detached: true,
      stdio: 'ignore'
    });
    
    proc.unref();
    
    let attempts = 0;
    const maxAttempts = 30;
    
    const checkInterval = setInterval(async () => {
      attempts++;
      if (await checkPort(port)) {
        clearInterval(checkInterval);
        resolve();
      } else if (attempts >= maxAttempts) {
        clearInterval(checkInterval);
        reject(new Error('OpenCode Server 启动超时'));
      }
    }, 1000);
  });
}

async function startUserOpenCodeServer(userId: string): Promise<number> {
  const port = getUserPort(userId);
  if (!port) throw new Error('User not found');
  
  if (await checkPort(port)) {
    console.log(`[User ${userId}] OpenCode Server already running on port ${port}`);
    return port;
  }
  
  return new Promise((resolve, reject) => {
    const userDir = getUserDir(userId);
    const env = { ...process.env, OPENCODE_SERVER_PASSWORD: '' };
    const proc = spawn('opencode', ['serve', '--port', String(port)], {
      cwd: userDir,
      env,
      detached: true,
      stdio: 'ignore'
    });
    
    proc.unref();
    
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

function killOpenCodeProcess(port: number): void {
  try {
    const output = execSync(`pgrep -f "opencode.*serve.*--port ${port}"`, { encoding: 'utf-8' });
    if (output.trim()) {
      execSync(`kill ${output.trim()}`);
      console.log(`[Kill] Stopped opencode serve on port ${port}`);
    }
  } catch {
    // pgrep 没找到进程，忽略即可
  }
}

async function stopUserOpenCodeServer(userId: string): Promise<void> {
  const port = getUserPort(userId);
  if (!port) return;
  
  if (!await checkPort(port)) {
    console.log(`[User ${userId}] OpenCode Server not running on port ${port}`);
    return;
  }
  
  killOpenCodeProcess(port);
  console.log(`[User ${userId}] OpenCode Server stopped on port ${port}`);
}

async function checkServerHealth(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const req = http.get(`http://${OPENCODE_HOST}:${port}/global/health`, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(2000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function httpRequest(options: any, body?: string): Promise<{ status: number; data: any }> {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode || 0, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode || 0, data });
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    if (body) req.write(body);
    req.end();
  });
}

async function ensureOpenCodeServer(): Promise<number> {
  console.log('[Roadmap] 检测 OpenCode Server...');
  
  let port = await findAvailablePort();
  
  if (port) {
    console.log(`[Roadmap] 找到运行中的 OpenCode Server: 端口 ${port}`);
    return port;
  }
  
  console.log('[Roadmap] 未找到 OpenCode Server，尝试启动...');
  const targetPort = DEFAULT_PORTS[0];
  
  try {
    await startOpenCodeServer(targetPort);
    console.log(`[Roadmap] OpenCode Server 已启动: 端口 ${targetPort}`);
    return targetPort;
  } catch (error) {
    console.error('[Roadmap] 启动 OpenCode Server 失败:', error);
    process.exit(1);
  }
}

let currentUserId: string | null = null;

function setCurrentUser(userId: string | null): void {
  currentUserId = userId;
}

function getCurrentUserDir(): string {
  if (!currentUserId) {
    return PROJECT_DIR;
  }
  return path.join(USERS_DIR, currentUserId);
}

function extractUserId(req: Request): string | null {
  const userId = req.query.userId as string | undefined;
  return userId || null;
}

app.use('/api/', (req: Request, res: Response, next: NextFunction) => {
  const userId = extractUserId(req);
  if (userId) {
    setCurrentUser(userId);
  } else {
    setCurrentUser(null);
  }
  next();
});

app.get('/api/read-roadmap', (req: Request, res: Response) => {
  try {
    const content = fs.readFileSync(path.resolve(getCurrentUserDir(), 'roadmap.md'), 'utf-8');
    res.setHeader('Content-Type', 'text/plain');
    res.send(content);
  } catch (error) {
    res.status(500).send('Error reading roadmap.md');
  }
});

app.post('/api/write-roadmap', (req: Request, res: Response) => {
  try {
    const { content } = req.body;
    fs.writeFileSync(path.resolve(getCurrentUserDir(), 'roadmap.md'), content);
    res.setHeader('Content-Type', 'application/json');
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.get('/api/list-maps', (req: Request, res: Response) => {
  try {
    const mapsDir = getCurrentUserDir();
    const files = fs.readdirSync(mapsDir);
    const mapFiles = files
      .filter(f => f.startsWith('map-') && f.endsWith('.md'))
      .map(f => {
        const name = f.slice(4, -3);
        return {
          id: name,
          name: name,
          filename: f
        };
      });
    res.setHeader('Content-Type', 'application/json');
    res.json(mapFiles);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.post('/api/create-map', (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    const rawName = name?.trim();
    const validNameRegex = /^[\u4e00-\u9fa5a-zA-Z0-9][\u4e00-\u9fa5a-zA-Z0-9-]*$/;
    if (!rawName || !validNameRegex.test(rawName)) {
      res.status(400).json({ error: 'Invalid map name. Use letters (including Chinese), numbers, and hyphens. Must start with a letter, number, or Chinese character.' });
      return;
    }

    const mapName = rawName.replace(/\s+/g, '-');
    const filename = `map-${mapName}.md`;
    const filepath = path.resolve(getCurrentUserDir(), filename);

    if (fs.existsSync(filepath)) {
      res.status(400).json({ error: 'Map already exists' });
      return;
    }

    fs.writeFileSync(filepath, '');
    res.setHeader('Content-Type', 'application/json');
    res.json({
      id: mapName,
      name: mapName,
      filename: filename
    });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.post('/api/delete-map', (req: Request, res: Response) => {
  try {
    const { filename, name } = req.body;
    const mapFilename = filename || `map-${name}.md`;
    const filepath = path.resolve(getCurrentUserDir(), mapFilename);

    if (!fs.existsSync(filepath)) {
      res.status(404).json({ error: 'Map file not found' });
      return;
    }

    fs.unlinkSync(filepath);
    res.setHeader('Content-Type', 'application/json');
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.post('/api/rename-map', (req: Request, res: Response) => {
  try {
    const { oldFilename, oldName, newName } = req.body;
    const oldMapFilename = oldFilename || `map-${oldName}.md`;

    const rawNewName = newName?.trim();
    const validNameRegex = /^[\u4e00-\u9fa5a-zA-Z0-9][\u4e00-\u9fa5a-zA-Z0-9-]*$/;
    if (!rawNewName || !validNameRegex.test(rawNewName)) {
      res.status(400).json({ error: 'Invalid map name. Use letters (including Chinese), numbers, and hyphens. Must start with a letter, number, or Chinese character.' });
      return;
    }

    const newMapName = rawNewName.replace(/\s+/g, '-');
    const newFilename = `map-${newMapName}.md`;
    const oldPath = path.resolve(getCurrentUserDir(), oldMapFilename);
    const newPath = path.resolve(getCurrentUserDir(), newFilename);

    if (!fs.existsSync(oldPath)) {
      res.status(404).json({ error: 'Map file not found' });
      return;
    }

    if (fs.existsSync(newPath)) {
      res.status(400).json({ error: 'A map with that name already exists' });
      return;
    }

    fs.renameSync(oldPath, newPath);
    res.setHeader('Content-Type', 'application/json');
    res.json({
      id: newMapName,
      name: newMapName,
      filename: newFilename
    });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.post('/api/read-map', (req: Request, res: Response) => {
  try {
    const { filename, name } = req.body;
    const mapFilename = filename || `map-${name}.md`;
    const filepath = path.resolve(getCurrentUserDir(), mapFilename);

    if (!fs.existsSync(filepath)) {
      res.status(404).json({ error: 'Map file not found' });
      return;
    }

    const content = fs.readFileSync(filepath, 'utf-8');
    res.setHeader('Content-Type', 'text/plain');
    res.send(content);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.post('/api/write-map', (req: Request, res: Response) => {
  try {
    const { filename, name, content } = req.body;
    const mapFilename = filename || `map-${name}.md`;
    const filepath = path.resolve(getCurrentUserDir(), mapFilename);

    fs.writeFileSync(filepath, content);
    res.setHeader('Content-Type', 'application/json');
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.get('/api/config', (req: Request, res: Response) => {
  try {
    const configPath = path.resolve(getCurrentUserDir(), 'roadmap-config.json');
    if (fs.existsSync(configPath)) {
      const content = fs.readFileSync(configPath, 'utf-8');
      res.setHeader('Content-Type', 'application/json');
      res.send(content);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.json({ lastEditedMapId: null });
    }
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.post('/api/config', (req: Request, res: Response) => {
  try {
    const configPath = path.resolve(getCurrentUserDir(), 'roadmap-config.json');
    fs.writeFileSync(configPath, JSON.stringify(req.body, null, 2));
    res.setHeader('Content-Type', 'application/json');
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const { username, email, password, deviceId } = req.body;
    
    if (!username || !email || !password || !deviceId) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }
    
    const result = await registerUser(username, email, password, deviceId);
    const port = getUserPort(result.userId);
    res.setHeader('Content-Type', 'application/json');
    res.json({ ...result, port });
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { username, password, deviceId, deviceInfo } = req.body;
    
    if (!username || !password || !deviceId) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }
    
    const result = await loginUser(username, password, deviceId, deviceInfo || 'Unknown');
    
    await startUserOpenCodeServer(result.userId);
    
    const port = getUserPort(result.userId);
    const userInfo = getUserInfo(result.userId);
    
    res.setHeader('Content-Type', 'application/json');
    res.json({ ...result, port, username: userInfo.username });
  } catch (error) {
    res.status(401).json({ error: error instanceof Error ? error.message : 'Login failed' });
  }
});

app.post('/api/auth/auto-login', async (req: Request, res: Response) => {
  try {
    const { deviceId } = req.body;
    
    if (!deviceId) {
      res.status(400).json({ error: 'Missing deviceId' });
      return;
    }
    
    const result = await autoLogin(deviceId);
    
    if (!result) {
      res.status(401).json({ error: 'Device not authorized' });
      return;
    }
    
    await startUserOpenCodeServer(result.userId);
    
    const port = getUserPort(result.userId);
    const userInfo = getUserInfo(result.userId);
    
    res.setHeader('Content-Type', 'application/json');
    res.json({ ...result, port, username: userInfo.username });
  } catch (error) {
    res.status(500).json({ error: 'Auto-login failed' });
  }
});

app.get('/api/auth/user-info', (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string;
    
    if (!userId) {
      res.status(400).json({ error: 'Missing userId' });
      return;
    }
    
    const port = getUserPort(userId);
    const devices = getDevices(userId);
    const userInfo = getUserInfo(userId);
    
    res.setHeader('Content-Type', 'application/json');
    res.json({ userId, port, devices, username: userInfo.username, email: userInfo.email });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get user info' });
  }
});

app.get('/api/auth/devices', (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string;
    
    if (!userId) {
      res.status(400).json({ error: 'Missing userId' });
      return;
    }
    
    const devices = getDevices(userId);
    
    res.setHeader('Content-Type', 'application/json');
    res.json({ devices });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get devices' });
  }
});

app.delete('/api/auth/devices', async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string;
    const deviceId = req.query.deviceId as string;
    
    if (!userId || !deviceId) {
      res.status(400).json({ error: 'Missing userId or deviceId' });
      return;
    }
    
    await removeDevice(userId, deviceId);
    
    res.setHeader('Content-Type', 'application/json');
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove device' });
  }
});

app.post('/api/auth/logout', async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    
    if (userId) {
      await stopUserOpenCodeServer(userId);
    }
    
    res.setHeader('Content-Type', 'application/json');
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Logout failed' });
  }
});

app.post('/api/auth/username', (req: Request, res: Response) => {
  try {
    const { userId, username } = req.body;
    
    if (!userId || !username) {
      res.status(400).json({ error: 'Missing userId or username' });
      return;
    }
    
    updateUsername(userId, username);
    
    res.setHeader('Content-Type', 'application/json');
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to update username' });
  }
});

app.post('/api/auth/password', (req: Request, res: Response) => {
  try {
    const { userId, currentPassword, newPassword } = req.body;
    
    if (!userId || !currentPassword || !newPassword) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }
    
    updatePassword(userId, currentPassword, newPassword);
    
    res.setHeader('Content-Type', 'application/json');
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to update password' });
  }
});

app.get('/session', async (req: Request, res: Response) => {
  const isHealthy = await checkServerHealth(openCodePort);
  
  if (!isHealthy) {
    res.status(503).json({ error: 'OpenCode server not running' });
    return;
  }

  try {
    const sessionsRes = await httpRequest({
      hostname: OPENCODE_HOST,
      port: openCodePort,
      path: '/session',
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    let sessions: any[] = [];
    
    if (Array.isArray(sessionsRes.data)) {
      sessions = sessionsRes.data;
    } else if (sessionsRes.data && Array.isArray((sessionsRes.data as any).sessions)) {
      sessions = (sessionsRes.data as any).sessions;
    }
    
    const roadmapSessions = sessions.filter((s: any) =>
      s.directory === getCurrentUserDir() &&
      !s.parentID &&
      !/\(@.*subagent\)/i.test(s.title || '') &&
      !(s.title || '').startsWith('modal-prompt:')
    );

    roadmapSessions.sort((a: any, b: any) =>
      (b.time?.created || 0) - (a.time?.created || 0)
    );

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(roadmapSessions));
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.use(express.static(path.join(__dirname, '../../dist')));

app.get('*', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '../../dist/index.html'));
});

const PORT = process.env.PORT || 3000;

async function main() {
  app.listen(PORT, () => {
    console.log(`[Production Server] Running on http://localhost:${PORT}`);
  });
}

main();
