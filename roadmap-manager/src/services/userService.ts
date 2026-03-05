import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

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
  return JSON.parse(fs.readFileSync(PORTS_FILE, 'utf-8'));
}

function savePorts(ports: PortMapping): void {
  fs.writeFileSync(PORTS_FILE, JSON.stringify(ports, null, 2));
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
  
  const ports = getPorts();
  
  const existingUsers = fs.readdirSync(USERS_DIR).filter(f => f !== 'ports.json');
  const userExists = existingUsers.some(f => f.startsWith(username + '_'));
  if (userExists) {
    throw new Error('Username already exists');
  }
  
  const userId = generateUserId(username);
  const userDir = path.join(USERS_DIR, userId);
  
  if (fs.existsSync(userDir)) {
    throw new Error('User already exists');
  }
  
  fs.mkdirSync(userDir, { recursive: true });
  
  const port = ports.nextPort;
  if (port > 51099) {
    throw new Error('No available ports');
  }
  ports.users[userId] = port;
  ports.nextPort = port + 1;
  savePorts(ports);
  
  fs.writeFileSync(path.join(userDir, 'roadmap.md'), '# Roadmap\n\n');
  fs.writeFileSync(path.join(userDir, 'roadmap-config.json'), JSON.stringify({ lastEditedMapId: null }));
  fs.writeFileSync(path.join(userDir, 'devices.json'), JSON.stringify({
    devices: [{ deviceId, name: 'Current Device', registeredAt: new Date().toISOString(), lastLoginAt: new Date().toISOString() }]
  }));
  fs.writeFileSync(path.join(userDir, 'login-history.json'), JSON.stringify({ history: [] }));
  
  const token = crypto.randomUUID();
  
  return { userId, token };
}

export async function loginUser(username: string, _password: string, deviceId: string, deviceInfo: string): Promise<{ userId: string; token: string }> {
  ensureUsersDir();
  
  getPorts();
  
  const existingUsers = fs.readdirSync(USERS_DIR).filter(f => f !== 'ports.json');
  const userDir = existingUsers.find(f => f.startsWith(username + '_'));
  
  if (!userDir) {
    throw new Error('Invalid credentials');
  }
  
  const userId = userDir;
  
  const devicesPath = path.join(USERS_DIR, userId, 'devices.json');
  const devices = JSON.parse(fs.readFileSync(devicesPath, 'utf-8'));
  const device = devices.devices.find((d: Device) => d.deviceId === deviceId);
  
  if (!device) {
    throw new Error('Device not authorized');
  }
  
  device.lastLoginAt = new Date().toISOString();
  fs.writeFileSync(devicesPath, JSON.stringify(devices, null, 2));
  
  const historyPath = path.join(USERS_DIR, userId, 'login-history.json');
  const history = JSON.parse(fs.readFileSync(historyPath, 'utf-8'));
  history.history.unshift({ deviceId, loginAt: new Date().toISOString(), deviceInfo });
  fs.writeFileSync(historyPath, JSON.stringify(history, null, 2));
  
  const token = crypto.randomUUID();
  
  return { userId, token };
}

export async function autoLogin(deviceId: string): Promise<{ userId: string; token: string } | null> {
  ensureUsersDir();
  
  getPorts();
  const existingUsers = fs.readdirSync(USERS_DIR).filter(f => f !== 'ports.json');
  
  for (const userId of existingUsers) {
    const devicesPath = path.join(USERS_DIR, userId, 'devices.json');
    if (!fs.existsSync(devicesPath)) continue;
    
    const devices = JSON.parse(fs.readFileSync(devicesPath, 'utf-8'));
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
