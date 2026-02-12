import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'
import http from 'http'

const OPENCODE_PORT = 51432
const OPENCODE_HOST = '127.0.0.1'

async function checkServerHealth(): Promise<boolean> {
  return new Promise((resolve) => {
    const req = http.get(`http://${OPENCODE_HOST}:${OPENCODE_PORT}/global/health`, (res) => {
      resolve(res.statusCode === 200)
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

    server.middlewares.use('/session', async (req: any, res: any, next: any) => {
      const isHealthy = await checkServerHealth();
      
      if (!isHealthy) {
        res.writeHead(503, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'OpenCode server not running' }));
        return;
      }

      if (req.method === 'GET') {
        try {
          const sessionsRes = await httpRequest({
            hostname: OPENCODE_HOST,
            port: OPENCODE_PORT,
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
            s.directory === '/Users/SparkingAries/VibeProjects/RoadMap' &&
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
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: String(error) }));
        }
      } else {
        next();
      }
    });

    server.middlewares.use('/api/execute-navigate', async (req: any, res: any, next: any) => {
      if (req.method === 'POST') {
        try {
          const chunks: Buffer[] = [];
          for await (const chunk of req) {
            chunks.push(chunk);
          }
          const body = JSON.parse(Buffer.concat(chunks).toString());
          const prompt = body.prompt;
          let sessionId = body.sessionId;
          const model = body.model;

          res.setHeader('Content-Type', 'text/event-stream');
          res.setHeader('Cache-Control', 'no-cache');
          res.setHeader('Connection', 'keep-alive');
          res.flushHeaders();

          const sendEvent = (data: any) => {
            if (res.writableEnded) return;
            res.write(`data: ${JSON.stringify(data)}\n\n`);
          };

          const isHealthy = await checkServerHealth();

          if (!isHealthy) {
            sendEvent({ type: 'error', message: '❌ OpenCode Server 未运行\n\n请先运行: npm run opencode:server' });
            res.end();
            return;
          }

          sendEvent({ type: 'start', message: `正在发送命令: "${prompt}"\n\n` });

          const isValidServerSession = sessionId && typeof sessionId === 'string' && sessionId.startsWith('ses');
          
          if (!isValidServerSession) {
            const createSessionRes = await httpRequest({
              hostname: OPENCODE_HOST,
              port: OPENCODE_PORT,
              path: '/session',
              method: 'POST',
              headers: { 'Content-Type': 'application/json' }
            }, JSON.stringify({ title: `navigate: ${prompt}` }));

            if (createSessionRes.status !== 200) {
              sendEvent({ type: 'error', message: '❌ 创建会话失败' });
              res.end();
              return;
            }

            sessionId = createSessionRes.data.id;
          }

          sendEvent({ type: 'session', sessionId });

          // Prepare the payload for OpenCode Server
          const payload: any = {
            parts: [{ type: 'text', text: `navigate: ${prompt}` }]
          };

          // Include model if provided
          if (model && model.providerID && model.modelID) {
            payload.model = {
              providerID: model.providerID,
              modelID: model.modelID
            };
          }

          const sendMessageRes = await httpRequest({
            hostname: OPENCODE_HOST,
            port: OPENCODE_PORT,
            path: `/session/${sessionId}/prompt_async`,
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          }, JSON.stringify(payload));

          if (sendMessageRes.status !== 204) {
            console.error('[Roadmap] Send message failed:', sendMessageRes.status, sendMessageRes.data);
            sendEvent({ type: 'error', message: `❌ 发送消息失败 (${sendMessageRes.status}): ${JSON.stringify(sendMessageRes.data)}` });
            res.end();
            return;
          }

          sendEvent({ type: 'started', message: `会话已创建，开始处理...\n\n` });

          let isCompleted = false;
          let eventCounter = 0;
          const processedEvents = new Set<string>();

          const eventReq = http.get({
            hostname: OPENCODE_HOST,
            port: OPENCODE_PORT,
            path: `/event?session=${sessionId}`,
            headers: {
              'Accept': 'text/event-stream',
              'Connection': 'close'
            }
          }, (eventRes) => {
            eventRes.on('data', (chunk: Buffer) => {
              const text = chunk.toString();
              const lines = text.split('\n');
              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  try {
                    const wrapper = JSON.parse(line.slice(6));
                    const props = wrapper.properties || {};
                    const part = props.part || {};
                    const eventId = wrapper.id || part.id || `${wrapper.type}-${sessionId}-${eventCounter++}`;
                    if (processedEvents.has(eventId)) continue;
                    processedEvents.add(eventId);

                    const eventType = wrapper.type;

                    if (eventType === 'session.status') {
                      const status = props.status?.type;
                      if (status === 'idle' && !isCompleted) {
                        isCompleted = true;
                        sendEvent({ type: 'done', message: '\n✅ 执行完成!' });
                        res.end();
                      }
                    } else if (eventType === 'message.part.updated') {
                      const partType = part.type;

                      if (partType === 'text' && part.text) {
                        sendEvent({ type: 'text', content: part.text });
                      } else if (partType === 'tool') {
                        sendEvent({ type: 'tool-call', name: part.name || 'tool' });
                      } else if (partType === 'step-start') {
                        sendEvent({ type: 'step-start', snapshot: part.snapshot || '' });
                      } else if (partType === 'step-end') {
                        sendEvent({ type: 'step-end' });
                      } else if (partType === 'reasoning') {
                        sendEvent({ type: 'reasoning', content: part.reasoning || '' });
                      }
                    } else if (eventType === 'message.updated') {
                      const info = props.info || {};
                      if (info.role === 'assistant' && info.completed) {
                        sendEvent({ type: 'message-complete' });
                      }
                    }
                  } catch (e) {
                  }
                }
              }
            });
            eventRes.on('end', () => {
              if (!isCompleted) {
                sendEvent({ type: 'done', message: '\n✅ 执行完成!' });
                res.end();
              }
            });
          });

          eventReq.on('error', (err: Error) => {
            sendEvent({ type: 'error', message: `\n❌ 事件流错误: ${err.message}` });
            res.end();
          });

          eventReq.setTimeout(300000, () => {
            eventReq.destroy();
            sendEvent({ type: 'timeout', message: '\n⏱️ 执行超时' });
            res.end();
          });

        } catch (error) {
          const errMsg = error instanceof Error ? error.message : String(error);
          res.write(`data: ${JSON.stringify({ type: 'error', message: `❌ 错误: ${errMsg}` })}\n\n`);
          res.end();
        }
      } else {
        next();
      }
    });

    server.middlewares.use('/api/execute-modal-prompt', async (req: any, res: any, next: any) => {
      if (req.method === 'POST') {
        try {
          const chunks: Buffer[] = [];
          for await (const chunk of req) {
            chunks.push(chunk);
          }
          const body = JSON.parse(Buffer.concat(chunks).toString());
          const prompt = body.prompt;
          let sessionId = body.sessionId;
          const model = body.model;

          res.setHeader('Content-Type', 'text/event-stream');
          res.setHeader('Cache-Control', 'no-cache');
          res.setHeader('Connection', 'keep-alive');
          res.flushHeaders();

          const sendEvent = (data: any) => {
            if (res.writableEnded) return;
            res.write(`data: ${JSON.stringify(data)}\n\n`);
          };

          const isHealthy = await checkServerHealth();

          if (!isHealthy) {
            sendEvent({ type: 'error', message: '❌ OpenCode Server 未运行\n\n请先运行: npm run opencode:server' });
            res.end();
            return;
          }

          sendEvent({ type: 'start', message: `正在处理: "${prompt}"\n\n` });

          const isValidServerSession = sessionId && typeof sessionId === 'string' && sessionId.startsWith('ses');
          
          if (!isValidServerSession) {
            const createSessionRes = await httpRequest({
              hostname: OPENCODE_HOST,
              port: OPENCODE_PORT,
              path: '/session',
              method: 'POST',
              headers: { 'Content-Type': 'application/json' }
            }, JSON.stringify({ title: `modal-prompt: ${prompt}` }));

            if (createSessionRes.status !== 200) {
              sendEvent({ type: 'error', message: '❌ 创建会话失败' });
              res.end();
              return;
            }

            sessionId = createSessionRes.data.id;
          }

          sendEvent({ type: 'session', sessionId });

          // Prepare the payload for OpenCode Server
          const payload: any = {
            parts: [{ type: 'text', text: prompt }]
          };

          // Include model if provided
          if (model && model.providerID && model.modelID) {
            payload.model = {
              providerID: model.providerID,
              modelID: model.modelID
            };
          }

          const sendMessageRes = await httpRequest({
            hostname: OPENCODE_HOST,
            port: OPENCODE_PORT,
            path: `/session/${sessionId}/prompt_async`,
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          }, JSON.stringify(payload));

          if (sendMessageRes.status !== 204) {
            console.error('[Modal Prompt] Send message failed:', sendMessageRes.status, sendMessageRes.data);
            sendEvent({ type: 'error', message: `❌ 发送消息失败 (${sendMessageRes.status}): ${JSON.stringify(sendMessageRes.data)}` });
            res.end();
            return;
          }

          sendEvent({ type: 'started', message: `Processing...\n\n` });

          let isCompleted = false;
          let eventCounter = 0;
          const processedEvents = new Set<string>();

          const eventReq = http.get({
            hostname: OPENCODE_HOST,
            port: OPENCODE_PORT,
            path: `/event?session=${sessionId}`,
            headers: {
              'Accept': 'text/event-stream',
              'Connection': 'close'
            }
          }, (eventRes) => {
            eventRes.on('data', (chunk: Buffer) => {
              const text = chunk.toString();
              const lines = text.split('\n');
              for (const line of lines) {
                if (!line.trim() || !line.startsWith('data: ')) continue;

                try {
                  const wrapper = JSON.parse(line.slice(6));
                  const props = wrapper.properties || {};
                  const part = props.part || {};
                  const eventId = wrapper.id || part.id || `${wrapper.type}-${sessionId}-${eventCounter++}`;

                  if (processedEvents.has(eventId)) continue;
                  processedEvents.add(eventId);

                  const eventType = wrapper.type;

                  if (eventType === 'session.status') {
                    const status = props.status?.type;
                    if (status === 'idle' && !isCompleted) {
                      isCompleted = true;
                      sendEvent({ type: 'done', message: '\n✅ Completed!' });
                      res.end();
                    }
                   } else if (eventType === 'message.part.updated') {
                     const partType = part.type;

                     if (partType === 'text' && part.text) {
                      sendEvent({ type: 'text', content: part.text });
                    } else if (partType === 'tool') {
                      sendEvent({ type: 'tool-call', name: part.name || 'tool' });
                    } else if (partType === 'tool-result') {
                      sendEvent({ type: 'tool-result', name: part.name || 'tool' });
                    } else if (partType === 'step-start') {
                      sendEvent({ type: 'step-start', snapshot: part.snapshot || '' });
                    } else if (partType === 'step-end') {
                      sendEvent({ type: 'step-end' });
                    } else if (partType === 'reasoning') {
                      sendEvent({ type: 'reasoning', content: part.reasoning || '' });
                    }
                  } else if (eventType === 'message.updated') {
                    const info = props.info || {};
                    if (info.role === 'assistant' && info.completed) {
                      sendEvent({ type: 'message-complete' });
                    }
                  }
                } catch (e) {
                }
              }
            });
            eventRes.on('end', () => {
              if (!isCompleted) {
                isCompleted = true;
                sendEvent({ type: 'done', message: '\n✅ Completed!' });
                res.end();
              }
            });
          });

          eventReq.on('error', (err: Error) => {
            sendEvent({ type: 'error', message: `\n❌ Event stream error: ${err.message}` });
            res.end();
          });

          eventReq.setTimeout(300000, () => {
            eventReq.destroy();
            sendEvent({ type: 'timeout', message: '\n⏱️ Timeout' });
            res.end();
          });

        } catch (error) {
          const errMsg = error instanceof Error ? error.message : String(error);
          res.write(`data: ${JSON.stringify({ type: 'error', message: `❌ Error: ${errMsg}` })}\n\n`);
          res.end();
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
  optimizeDeps: {
    exclude: ['@opencode-ai/sdk'],
  },
  build: {
    target: 'esnext',
  },
})
