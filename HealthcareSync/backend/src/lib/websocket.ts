import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { NotificationService } from '../services/notification-service';
import type { RequestHandler } from 'express';
import { RateLimiterMemory } from 'rate-limiter-flexible';

interface WebSocketWithUser extends WebSocket {
  userId?: number;
  isAlive?: boolean;
}

// Rate limiter configuration
const rateLimiter = new RateLimiterMemory({
  points: process.env.NODE_ENV === 'development' ? 1000 : 100,
  duration: 60,
  blockDuration: 60,
});

export function setupWebSocket(server: Server, sessionMiddleware: RequestHandler) {
  const wss = new WebSocketServer({ noServer: true });
  const connectionQueue = new Map<number, number>();

  // Handle upgrade manually to integrate session
  server.on('upgrade', function upgrade(request, socket, head) {
    const pathname = new URL(request.url!, `http://${request.headers.host}`).pathname;
    console.log('WebSocket upgrade request:', pathname);

    if (pathname !== '/ws') {
      socket.write('HTTP/1.1 404 Not Found\r\n\r\n');
      socket.destroy();
      return;
    }

    sessionMiddleware(request as any, {} as any, async () => {
      const userId = (request as any).session?.passport?.user;
      if (!userId) {
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
        return;
      }

      try {
        if (process.env.NODE_ENV !== 'development') {
          const currentTime = Math.floor(Date.now() / 1000);
          const lastConnection = connectionQueue.get(userId) || 0;
          const timeSinceLastConnection = currentTime - lastConnection;

          if (timeSinceLastConnection < 2) {
            socket.write('HTTP/1.1 429 Too Many Requests\r\nRetry-After: 2\r\n\r\n');
            socket.destroy();
            return;
          }

          await rateLimiter.consume(userId.toString());
          connectionQueue.set(userId, currentTime);
        }

        wss.handleUpgrade(request, socket, head, (ws) => {
          wss.emit('connection', ws, request);
        });
      } catch (error) {
        console.error('WebSocket upgrade error:', error);
        if (error instanceof Error && error.message.includes('rate')) {
          socket.write('HTTP/1.1 429 Too Many Requests\r\nRetry-After: 60\r\n\r\n');
        } else {
          socket.write('HTTP/1.1 500 Internal Server Error\r\n\r\n');
        }
        socket.destroy();
      }
    });
  });

  setupHeartbeat(wss);
  setupConnectionHandlers(wss);

  return wss;
}

function setupHeartbeat(wss: WebSocketServer) {
  const interval = setInterval(() => {
    wss.clients.forEach((ws: WebSocketWithUser) => {
      if (ws.isAlive === false) {
        if (ws.userId) {
          NotificationService.removeClient(ws.userId);
        }
        return ws.terminate();
      }
      ws.isAlive = false;
      ws.ping();
    });
  }, 45000);

  wss.on('close', () => {
    clearInterval(interval);
  });
}

function setupConnectionHandlers(wss: WebSocketServer) {
  wss.on('connection', async (ws: WebSocketWithUser, req) => {
    const userId = (req as any).session?.passport?.user;
    if (!userId) {
      ws.close();
      return;
    }

    ws.userId = userId;
    ws.isAlive = true;
    NotificationService.addClient(userId, ws);

    ws.on('pong', () => {
      ws.isAlive = true;
    });

    try {
      const notifications = await NotificationService.getUserNotifications(userId);
      if (notifications.length > 0) {
        ws.send(JSON.stringify({
          type: 'notifications',
          data: notifications
        }));
      }
    } catch (error) {
      console.error('Error sending existing notifications:', error);
    }

    ws.on('error', (error) => {
      console.error('WebSocket error for user:', userId, error);
      if (ws.userId) {
        NotificationService.removeClient(ws.userId);
      }
    });

    ws.on('close', () => {
      if (ws.userId) {
        NotificationService.removeClient(ws.userId);
      }
    });
  });
}
