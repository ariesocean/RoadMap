import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'
import http from 'http'
import { spawn, execSync } from 'child_process'
import { registerUser, loginUser, autoLogin, getUserPort, getUserDir, getDevices, removeDevice, updateUsername, updatePassword, getUserInfo } from './src/services/server/userServiceServer'

const config = require('./src/config.cjs')
const PROJECT_DIR = process.env.PROJECT_DIR || config.projectDir
const USERS_DIR = process.env.USERS_DIR || config.usersDir || path.join(PROJECT_DIR, 'users')

async function checkPort(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:${port}/global/health`, (res) => {
      resolve(res.statusCode === 200)
    })
    req.on('error', () => resolve(false))
    req.setTimeout(2000, () => {
      req.destroy()
      resolve(false)
    })
  })
}

async function startUserOpenCodeServer(userId: string): Promise<number> {
  const port = getUserPort(userId);
  if (!port) throw new Error('User not found');
  
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

const roadmapPlugin = {
  name: 'roadmap-api',
  configureServer(server: any) {
    let currentUserId: string | null = null;

    function setCurrentUser(userId: string | null) {
      currentUserId = userId;
    }

    function getCurrentUserDir(): string {
      if (!currentUserId) {
        return PROJECT_DIR;
      }
      return path.join(USERS_DIR, currentUserId);
    }

    // Middleware to extract userId from request and set current user directory
    server.middlewares.use('/api/', async (req: any, res: any, next: any) => {
      const url = new URL(req.url, 'http://localhost');
      const userId = url.searchParams.get('userId');
      
      if (userId) {
        setCurrentUser(userId);
      } else {
        setCurrentUser(null);
      }
      
      next();
    });

    server.middlewares.use('/api/read-roadmap', async (req: any, res: any, next: any) => {
      if (req.method === 'GET') {
        try {
          const content = fs.readFileSync(path.resolve(getCurrentUserDir(), 'roadmap.md'), 'utf-8');
          res.setHeader('Content-Type', 'text/plain');
          res.end(content);
        } catch (error) {
          res.writeHead(500).end('Error reading roadmap.md');
        }
      } else {
        next();
      }
    });

    server.middlewares.use('/api/write-roadmap', async (req: any, res: any, next: any) => {
      if (req.method === 'POST') {
        try {
          const chunks: Buffer[] = [];
          for await (const chunk of req) {
            chunks.push(chunk);
          }
          const body = JSON.parse(Buffer.concat(chunks).toString());
          fs.writeFileSync(path.resolve(getCurrentUserDir(), 'roadmap.md'), body.content);
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: true }));
        } catch (error) {
          res.writeHead(500).end(JSON.stringify({ error: String(error) }));
        }
      } else {
        next();
      }
    });

    // List all map-*.md files in the roadmap directory
    server.middlewares.use('/api/list-maps', async (req: any, res: any, next: any) => {
      if (req.method === 'GET') {
        try {
          const mapsDir = getCurrentUserDir();
          const files = fs.readdirSync(mapsDir);
          const mapFiles = files
            .filter(f => f.startsWith('map-') && f.endsWith('.md'))
            .map(f => {
              const name = f.slice(4, -3); // Remove 'map-' prefix and '.md' suffix
              return {
                id: name,
                name: name,
                filename: f
              };
            });
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(mapFiles));
        } catch (error) {
          res.writeHead(500).end(JSON.stringify({ error: String(error) }));
        }
      } else {
        next();
      }
    });

    // Create a new map file
    server.middlewares.use('/api/create-map', async (req: any, res: any, next: any) => {
      if (req.method === 'POST') {
        try {
          const chunks: Buffer[] = [];
          for await (const chunk of req) {
            chunks.push(chunk);
          }
          const body = JSON.parse(Buffer.concat(chunks).toString());

          // Validate map name: letters (including Chinese), numbers, and hyphens
          const rawName = body.name?.trim();
          const validNameRegex = /^[\u4e00-\u9fa5a-zA-Z0-9][\u4e00-\u9fa5a-zA-Z0-9-]*$/;
          if (!rawName || !validNameRegex.test(rawName)) {
            res.writeHead(400).end(JSON.stringify({ error: 'Invalid map name. Use letters (including Chinese), numbers, and hyphens. Must start with a letter, number, or Chinese character.' }));
            return;
          }

          const mapName = rawName.replace(/\s+/g, '-');
          const filename = `map-${mapName}.md`;
          const filepath = path.resolve(getCurrentUserDir(), filename);

          if (fs.existsSync(filepath)) {
            res.writeHead(400).end(JSON.stringify({ error: 'Map already exists' }));
            return;
          }

          // Create empty map file
          fs.writeFileSync(filepath, '');
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({
            id: mapName,
            name: mapName,
            filename: filename
          }));
        } catch (error) {
          res.writeHead(500).end(JSON.stringify({ error: String(error) }));
        }
      } else {
        next();
      }
    });

    // Delete a map file
    server.middlewares.use('/api/delete-map', async (req: any, res: any, next: any) => {
      if (req.method === 'POST') {
        try {
          const chunks: Buffer[] = [];
          for await (const chunk of req) {
            chunks.push(chunk);
          }
          const body = JSON.parse(Buffer.concat(chunks).toString());
          const filename = body.filename || `map-${body.name}.md`;
          const filepath = path.resolve(getCurrentUserDir(), filename);

          if (!fs.existsSync(filepath)) {
            res.writeHead(404).end(JSON.stringify({ error: 'Map file not found' }));
            return;
          }

          fs.unlinkSync(filepath);
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: true }));
        } catch (error) {
          res.writeHead(500).end(JSON.stringify({ error: String(error) }));
        }
      } else {
        next();
      }
    });

    // Rename a map file
    server.middlewares.use('/api/rename-map', async (req: any, res: any, next: any) => {
      if (req.method === 'POST') {
        try {
          const chunks: Buffer[] = [];
          for await (const chunk of req) {
            chunks.push(chunk);
          }
          const body = JSON.parse(Buffer.concat(chunks).toString());
          const oldFilename = body.oldFilename || `map-${body.oldName}.md`;

          // Validate new name: letters (including Chinese), numbers, and hyphens
          const rawNewName = body.newName?.trim();
          const validNameRegex = /^[\u4e00-\u9fa5a-zA-Z0-9][\u4e00-\u9fa5a-zA-Z0-9-]*$/;
          if (!rawNewName || !validNameRegex.test(rawNewName)) {
            res.writeHead(400).end(JSON.stringify({ error: 'Invalid map name. Use letters (including Chinese), numbers, and hyphens. Must start with a letter, number, or Chinese character.' }));
            return;
          }

          const newName = rawNewName.replace(/\s+/g, '-');
          const newFilename = `map-${newName}.md`;
          const oldPath = path.resolve(getCurrentUserDir(), oldFilename);
          const newPath = path.resolve(getCurrentUserDir(), newFilename);

          if (!fs.existsSync(oldPath)) {
            res.writeHead(404).end(JSON.stringify({ error: 'Map file not found' }));
            return;
          }

          if (fs.existsSync(newPath)) {
            res.writeHead(400).end(JSON.stringify({ error: 'A map with that name already exists' }));
            return;
          }

          fs.renameSync(oldPath, newPath);
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({
            id: newName,
            name: newName,
            filename: newFilename
          }));
        } catch (error) {
          res.writeHead(500).end(JSON.stringify({ error: String(error) }));
        }
      } else {
        next();
      }
    });

    // Read a specific map file
    server.middlewares.use('/api/read-map', async (req: any, res: any, next: any) => {
      if (req.method === 'POST') {
        try {
          const chunks: Buffer[] = [];
          for await (const chunk of req) {
            chunks.push(chunk);
          }
          const body = JSON.parse(Buffer.concat(chunks).toString());
          const filename = body.filename || `map-${body.name}.md`;
          const filepath = path.resolve(getCurrentUserDir(), filename);

          if (!fs.existsSync(filepath)) {
            res.writeHead(404).end(JSON.stringify({ error: 'Map file not found' }));
            return;
          }

          const content = fs.readFileSync(filepath, 'utf-8');
          res.setHeader('Content-Type', 'text/plain');
          res.end(content);
        } catch (error) {
          res.writeHead(500).end(JSON.stringify({ error: String(error) }));
        }
      } else {
        next();
      }
    });

    // Write to a specific map file (for archiving)
    server.middlewares.use('/api/write-map', async (req: any, res: any, next: any) => {
      if (req.method === 'POST') {
        try {
          const chunks: Buffer[] = [];
          for await (const chunk of req) {
            chunks.push(chunk);
          }
          const body = JSON.parse(Buffer.concat(chunks).toString());
          const filename = body.filename || `map-${body.name}.md`;
          const filepath = path.resolve(getCurrentUserDir(), filename);

          fs.writeFileSync(filepath, body.content);
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: true }));
        } catch (error) {
          res.writeHead(500).end(JSON.stringify({ error: String(error) }));
        }
      } else {
        next();
      }
    });

    // Read roadmap-config.json
    const configPath = path.resolve(getCurrentUserDir(), 'roadmap-config.json');
    server.middlewares.use('/api/config', async (req: any, res: any, next: any) => {
      
      if (req.method === 'GET') {
        try {
          if (fs.existsSync(configPath)) {
            const content = fs.readFileSync(configPath, 'utf-8');
            res.setHeader('Content-Type', 'application/json');
            res.end(content);
          } else {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ lastEditedMapId: null }));
          }
        } catch (error) {
          res.writeHead(500).end(JSON.stringify({ error: String(error) }));
        }
      } else if (req.method === 'POST') {
        try {
          const chunks: Buffer[] = [];
          for await (const chunk of req) {
            chunks.push(chunk);
          }
          const body = JSON.parse(Buffer.concat(chunks).toString());
          fs.writeFileSync(configPath, JSON.stringify(body, null, 2));
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: true }));
        } catch (error) {
          res.writeHead(500).end(JSON.stringify({ error: String(error) }));
        }
      } else {
        next();
      }
    });

    // Auth endpoints
    server.middlewares.use('/api/auth/register', async (req: any, res: any, next: any) => {
      if (req.method === 'POST') {
        try {
          const chunks: Buffer[] = [];
          for await (const chunk of req) chunks.push(chunk);
          const body = JSON.parse(Buffer.concat(chunks).toString());
          
          const { username, email, password, deviceId } = body;
          
          if (!username || !email || !password || !deviceId) {
            res.writeHead(400).end(JSON.stringify({ error: 'Missing required fields' }));
            return;
          }
          
          const result = await registerUser(username, email, password, deviceId);
          const port = getUserPort(result.userId);
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ ...result, port }));
        } catch (error) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: error instanceof Error ? error.message : 'Registration failed' }));
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
          
          const { username, password, deviceId, deviceInfo } = body;
          
          if (!username || !password || !deviceId) {
            res.writeHead(400).end(JSON.stringify({ error: 'Missing required fields' }));
            return;
          }
          
          const result = await loginUser(username, password, deviceId, deviceInfo || 'Unknown');
          
          await startUserOpenCodeServer(result.userId);
          
          const port = getUserPort(result.userId);
          const userInfo = getUserInfo(result.userId);
          
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ ...result, port, username: userInfo.username }));
        } catch (error) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: error instanceof Error ? error.message : 'Login failed' }));
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
            res.writeHead(400).end(JSON.stringify({ error: 'Missing deviceId' }));
            return;
          }
          
          const result = await autoLogin(deviceId);
          
          if (!result) {
            res.writeHead(401).end(JSON.stringify({ error: 'Device not authorized' }));
            return;
          }
          
          await startUserOpenCodeServer(result.userId);
          
          const port = getUserPort(result.userId);
          const userInfo = getUserInfo(result.userId);
          
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ ...result, port, username: userInfo.username }));
        } catch (error) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Auto-login failed' }));
        }
      } else {

      }
    });

    server.middlewares.use('/api/auth/user-info', async (req: any, res: any, next: any) => {
      if (req.method === 'GET') {
        try {
          const url = new URL(req.url, 'http://localhost');
          const userId = url.searchParams.get('userId');
          
          if (!userId) {
            res.writeHead(400).end(JSON.stringify({ error: 'Missing userId' }));
            return;
          }
          
          const port = getUserPort(userId);
          const devices = getDevices(userId);
          const userInfo = getUserInfo(userId);
          
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ userId, port, devices, username: userInfo.username, email: userInfo.email }));
        } catch (error) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Failed to get user info' }));
        }
      } else {
        next();
      }
    });

    // GET /api/auth/devices - list all devices for a user
    server.middlewares.use('/api/auth/devices', async (req: any, res: any, next: any) => {
      if (req.method === 'GET') {
        try {
          const url = new URL(req.url, 'http://localhost');
          const userId = url.searchParams.get('userId');
          
          if (!userId) {
            res.writeHead(400).end(JSON.stringify({ error: 'Missing userId' }));
            return;
          }
          
          const devices = getDevices(userId);
          
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ devices }));
        } catch (error) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Failed to get devices' }));
        }
      } else {
        next();
      }
    });

    // DELETE /api/auth/devices/:deviceId - remove a device
    server.middlewares.use('/api/auth/devices/:deviceId', async (req: any, res: any, next: any) => {
      if (req.method === 'DELETE') {
        try {
          const url = new URL(req.url, 'http://localhost');
          const userId = url.searchParams.get('userId');
          const deviceId = url.searchParams.get('deviceId');
          
          if (!userId || !deviceId) {
            res.writeHead(400).end(JSON.stringify({ error: 'Missing userId or deviceId' }));
            return;
          }
          
          await removeDevice(userId, deviceId);
          
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: true }));
        } catch (error) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Failed to remove device' }));
        }
      } else {
        next();
      }
    });

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
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Logout failed' }));
        }
      } else {
        next();
      }
    });

    // POST /api/auth/username - update username
    server.middlewares.use('/api/auth/username', async (req: any, res: any, next: any) => {
      if (req.method === 'POST') {
        try {
          const chunks: Buffer[] = [];
          for await (const chunk of req) chunks.push(chunk);
          const body = JSON.parse(Buffer.concat(chunks).toString());
          
          const { userId, username } = body;
          
          if (!userId || !username) {
            res.writeHead(400).end(JSON.stringify({ error: 'Missing userId or username' }));
            return;
          }
          
          updateUsername(userId, username);
          
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: true }));
        } catch (error) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to update username' }));
        }
      } else {
        next();
      }
    });

    // POST /api/auth/password - update password
    server.middlewares.use('/api/auth/password', async (req: any, res: any, next: any) => {
      if (req.method === 'POST') {
        try {
          const chunks: Buffer[] = [];
          for await (const chunk of req) chunks.push(chunk);
          const body = JSON.parse(Buffer.concat(chunks).toString());
          
          const { userId, currentPassword, newPassword } = body;
          
          if (!userId || !currentPassword || !newPassword) {
            res.writeHead(400).end(JSON.stringify({ error: 'Missing required fields' }));
            return;
          }
          
          updatePassword(userId, currentPassword, newPassword);
          
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: true }));
        } catch (error) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to update password' }));
        }
      } else {
        next();
      }
    });

    server.middlewares.use(async (req: any, res: any, next: any) => {
      next();
    });
  }
};

export default defineConfig({
  plugins: [react(), roadmapPlugin as any],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 1630,
    proxy: {
      '/opencode': {
        target: 'http://localhost:51432',
        changeOrigin: true,
        rewrite: (path: string) => path.replace(/^\/opencode/, ''),
      },
    },
  },
  build: {
    target: 'esnext',
  },
})
