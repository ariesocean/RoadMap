import * as http from 'http';
import { getUserPort } from './userServiceServer';

const OPENCODE_HOST = process.env.OPENCODE_HOST || '127.0.0.1';

interface ProxyOptions {
  userId: string;
  targetPath: string;
  queryString: string;
  method: string;
  headers: Record<string, string | string[] | undefined>;
  body: string;
  res: {
    writeHead: (status: number, headers?: Record<string, string>) => void;
    write: (data: string | Buffer) => void;
    end: (data?: string) => void;
  };
}

async function proxySSE(options: ProxyOptions): Promise<void> {
  const { userId, targetPath, queryString, res } = options;
  
  const port = getUserPort(userId);
  if (!port) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'User not found or port not assigned' }));
    return;
  }

  const targetUrl = `http://${OPENCODE_HOST}:${port}${targetPath}${queryString}`;

  try {
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Accept': 'text/event-stream'
      }
    });

    res.writeHead(response.status || 200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });

    if (response.body) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          res.write(chunk);
        }
      } catch {}
    }

    res.end();
  } catch (err) {
    console.error('[Proxy] SSE proxy error:', err);
    try {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to connect to OpenCode Server' }));
    } catch {}
  }
}

function proxyRequest(options: ProxyOptions): void {
  const { userId, targetPath, queryString, method, headers, body, res } = options;

  const port = getUserPort(userId);
  if (!port) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'User not found or port not assigned' }));
    return;
  }

  const targetUrl = `http://${OPENCODE_HOST}:${port}${targetPath}${queryString}`;
  const isSSE = targetPath.includes('/global/event');

  if (isSSE) {
    proxySSE(options);
    return;
  }

  const bodyLength = Buffer.byteLength(body);
  const proxyReq = http.request(targetUrl, {
    method,
    headers: {
      ...headers,
      ...(bodyLength > 0 ? { 'Content-Length': bodyLength } : {})
    }
  }, (proxyRes) => {
    let data = '';
    proxyRes.on('data', (chunk) => data += chunk);
    proxyRes.on('end', () => {
      res.writeHead(proxyRes.statusCode || 200, { 'Content-Type': 'application/json' });
      res.end(data);
    });
  });

  proxyReq.on('error', (err) => {
    console.error('Proxy error:', err);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Failed to connect to OpenCode Server' }));
  });

  if (body) {
    proxyReq.write(body);
  }
  proxyReq.end();
}

export function createOpenCodeProxyHandler() {
  return async function handleProxy(
    userId: string,
    originalUrl: string,
    method: string,
    headers: Record<string, string | string[] | undefined>,
    body: string,
    res: {
      writeHead: (status: number, headers?: Record<string, string>) => void;
      write: (data: string | Buffer) => void;
      end: (data?: string) => void;
      status?: (code: number) => { json: (data: unknown) => void };
      json?: (data: unknown) => void;
      headersSent?: boolean;
    }
  ): Promise<void> {
    if (!userId) {
      if (res.status && res.json) {
        res.status(401).json({ error: 'Authentication required' });
      } else {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Authentication required' }));
      }
      return;
    }

    const url = new URL(originalUrl, 'http://localhost');
    const targetPath = url.pathname.replace('/api/opencode', '') || '/';
    const queryString = url.search;

    proxyRequest({
      userId,
      targetPath,
      queryString,
      method,
      headers,
      body,
      res
    });
  };
}

export async function handleOpenCodeProxy(
  userId: string,
  originalUrl: string,
  method: string,
  headers: Record<string, string | string[] | undefined>,
  body: string,
  res: {
    writeHead: (status: number, headers?: Record<string, string>) => void;
    write: (data: string | Buffer) => void;
    end: (data?: string) => void;
  }
): Promise<void> {
  if (!userId) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Authentication required' }));
    return;
  }

  const url = new URL(originalUrl, 'http://localhost');
  const targetPath = url.pathname.replace('/api/opencode', '') || '/';
  const queryString = url.search;

  proxyRequest({
    userId,
    targetPath,
    queryString,
    method,
    headers,
    body,
    res
  });
}
