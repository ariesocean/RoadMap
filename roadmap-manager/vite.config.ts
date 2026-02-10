import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'

const roadmapPlugin = {
  name: 'roadmap-api',
  configureServer(server: any) {
    server.middlewares.use('/api/read-roadmap', async (req: any, res: any, next: any) => {
      if (req.method === 'GET') {
        try {
          const content = fs.readFileSync('/Users/SparkingAries/VibeProjects/RoadMap/roadmap.md', 'utf-8');
          res.setHeader('Content-Type', 'text/plain');
          res.end(content);
        } catch (error) {
          res.status(500).end('Error reading roadmap.md');
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
          fs.writeFileSync('/Users/SparkingAries/VibeProjects/RoadMap/roadmap.md', body.content);
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: true }));
        } catch (error) {
          res.status(500).end(JSON.stringify({ error: String(error) }));
        }
      } else {
        next();
      }
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
    port: 1430,
  },
  envPrefix: ['VITE_', 'TAURI_'],
})
