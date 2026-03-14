import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

const config = require('../../config.cjs');
const PROJECT_DIR = process.env.PROJECT_DIR || config.projectDir;
const USERS_DIR = process.env.USERS_DIR || config.usersDir || path.join(PROJECT_DIR, 'users');
const PORTS_FILE = path.join(USERS_DIR, 'ports.json');

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

export interface UserCredentials {
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

export interface LoginRecord {
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

export function hashPassword(_password: string): string {
  return crypto.createHash('sha256').update(_password).digest('hex');
}

function generateUserId(username: string): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const shortName = username.slice(0, 6);
  return `${shortName}_${dateStr}`;
}

export async function registerUser(username: string, _email: string, _password: string, deviceId: string): Promise<{ userId: string; token: string }> {
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
    
    const userGuideDest = path.join(userDir, 'map-UserGuide.md');
    let content = fs.readFileSync(userGuideDest, 'utf-8');
    const now = new Date();
    const formattedDate = now.toLocaleString('zh-CN', {
      timeZone: 'Asia/Shanghai',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).replace(/\//g, '-');
    content = content.replace(/\[created: [^\]]+\]/g, `[created: ${formattedDate}]`);
    fs.writeFileSync(userGuideDest, content);
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

export async function loginUser(username: string, _password: string, deviceId: string, deviceInfo: string): Promise<{ userId: string; token: string }> {
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

export async function autoLogin(deviceId: string): Promise<{ userId: string; token: string } | null> {
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

export function getUserPort(userId: string): number | null {
  if (!userExists(userId)) {
    throw new Error(ERRORS.USER_NOT_FOUND);
  }
  const ports = getPorts();
  return ports.users[userId] || null;
}

export function getUserDir(userId: string): string {
  if (!userExists(userId)) {
    throw new Error(ERRORS.USER_NOT_FOUND);
  }
  return path.join(USERS_DIR, userId);
}

export async function addDevice(userId: string, deviceId: string, deviceName: string): Promise<void> {
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

export function getDevices(userId: string): Device[] {
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

export function getUserInfo(userId: string): { username: string; email: string } {
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

export function updateUsername(userId: string, newUsername: string): void {
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

export function updatePassword(userId: string, currentPassword: string, newPassword: string): void {
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
