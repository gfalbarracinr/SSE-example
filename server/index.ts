import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { PingResponse } from 'ping/types/parser/base';
import { pingToServer } from './sseEvents.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uiDirectory = path.resolve(__dirname, '../UI');

const sendFile = (
  res: http.ServerResponse,
  fileName: string,
  contentType: string,
  statusCode = 200,
) => {
  const filePath = path.join(uiDirectory, fileName);

  try {
    res.writeHead(statusCode, { 'Content-Type': contentType });
    res.end(fs.readFileSync(filePath));
  } catch {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Internal Server Error');
  }
};

const connections: Array<http.ServerResponse> = [];
const pollingJobs = new Map<string, NodeJS.Timeout>();

const broadcastPing = (payload: { ping: Awaited<PingResponse>; link: string }) => {
  connections.forEach((connection) => {
    connection.write(`event: ping\ndata: ${JSON.stringify(payload)}\n\n`);
  });
};

const startPolling = (link: string) => {
  if (pollingJobs.has(link)) {
    return;
  }

  const runPing = async () => {
    try {
      const url = new URL(link);
      const pingResult = await pingToServer(url.hostname);
      broadcastPing({ ping: pingResult, link });
    } catch {
      console.log(`Failed to ping ${link}`);
    }
  };

  runPing();

  const job = setInterval(() => {
    runPing();
  }, 5000);

  pollingJobs.set(link, job);
};

const routes = async (req: http.IncomingMessage, res: http.ServerResponse) => {
  const pathname = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`).pathname;

  switch (pathname) {
    case '/':
      sendFile(res, 'index.html', 'text/html; charset=utf-8');
      break;
    case '/style.css':
      sendFile(res, 'style.css', 'text/css; charset=utf-8');
      break;
    case '/index.js':
      sendFile(res, 'index.js', 'text/javascript; charset=utf-8');
      break;
    case '/ping':
      if (req.method === 'GET') {
        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        });
        res.write('\n');

        connections.push(res);

        res.on('close', () => {
          const index = connections.indexOf(res);
          if (index !== -1) {
            connections.splice(index, 1);
          }
        });

        return;
      }

      if (req.method === 'POST') {
        req.setEncoding('utf-8');
        let body = '';
        for await (const chunk of req) {
          body += chunk;
        }

        const { link } = JSON.parse(body);

        startPolling(link);

        res.writeHead(202, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ queued: true, polling: true }));

        return;
      }

      res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Method Not Allowed');
      break;
    default:
      sendFile(res, '404.html', 'text/html; charset=utf-8', 404);
  }
};

const server = http.createServer((req, res) => {
  routes(req, res);
});

const PORT = Number(process.env.PORT) || 3000;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
