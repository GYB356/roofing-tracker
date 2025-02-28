import { WebSocket, WebSocketServer } from 'ws';
import { Server } from 'http';
import { parse } from 'url';

interface WebSocketConnection {
  ws: WebSocket;
  userId: number;
  role: string;
  isAlive: boolean;
}

interface SignalingMessage {
  type: string;
  appointmentId: number;
  signal: any;
}

class WebSocketService {
  private wss: WebSocketServer;
  private connections: Map<number, Set<WebSocketConnection>> = new Map();
  private heartbeatInterval!: NodeJS.Timeout;

  constructor(server: Server) {
    try {
      this.wss = new WebSocketServer({ noServer: true });

      server.on('upgrade', (request, socket, head) => {
        try {
          const { pathname, query } = parse(request.url || '', true);

          if (pathname === '/ws') {
            // Handle video consultation connections
            this.wss.handleUpgrade(request, socket, head, (ws) => {
              this.wss.emit('connection', ws, { ...request, isVideoConsultation: true });
            });
          }
        } catch (error) {
          console.error('WebSocket upgrade error:', error);
          socket.destroy();
        }
      });

      this.wss.on('connection', this.handleConnection.bind(this));
      this.setupHeartbeat();
      console.log('WebSocket server initialized successfully');
    } catch (error) {
      console.error('Failed to initialize WebSocket server:', error);
      throw error;
    }
  }

  private setupHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      this.connections.forEach((userConnections, userId) => {
        userConnections.forEach((connection) => {
          if (!connection.isAlive) {
            this.removeConnection(userId, connection);
            return;
          }
          connection.isAlive = false;
          connection.ws.ping();
        });
      });
    }, 30000);

    this.wss.on('close', () => {
      clearInterval(this.heartbeatInterval);
    });
  }

  private handleConnection(ws: WebSocket, request: any) {
    try {
      const userId = request.session?.passport?.user;
      const userRole = request.session?.passport?.role;

      if (!userId) {
        console.log('WebSocket connection rejected: No authentication');
        ws.close(1008, 'Authentication required');
        return;
      }

      console.log(`New WebSocket connection for user ${userId} with role ${userRole}`);

      const connection: WebSocketConnection = {
        ws,
        userId,
        role: userRole,
        isAlive: true
      };

      if (!this.connections.has(userId)) {
        this.connections.set(userId, new Set());
      }
      this.connections.get(userId)!.add(connection);

      ws.on('pong', () => {
        connection.isAlive = true;
      });

      ws.on('message', (data: string) => {
        try {
          const message = JSON.parse(data) as SignalingMessage;

          // Handle WebRTC signaling for video consultations
          if (message.type === 'signal') {
            this.handleSignaling(message);
          }
        } catch (error) {
          console.error('Error processing WebSocket message:', error);
        }
      });

      ws.on('close', () => {
        this.removeConnection(userId, connection);
      });

      ws.on('error', (error) => {
        console.error(`WebSocket error for user ${userId}:`, error);
        this.removeConnection(userId, connection);
      });

    } catch (error) {
      console.error('Error handling WebSocket connection:', error);
      if (ws.readyState === WebSocket.OPEN) {
        ws.close(1011, 'Internal server error');
      }
    }
  }

  private handleSignaling(message: SignalingMessage) {
    try {
      // Forward the signaling message to all users in the same appointment
      this.connections.forEach((userConnections) => {
        userConnections.forEach(({ ws }) => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(message));
          }
        });
      });
    } catch (error) {
      console.error('Error handling signaling message:', error);
    }
  }

  private removeConnection(userId: number, connection: WebSocketConnection) {
    const userConnections = this.connections.get(userId);
    if (userConnections) {
      userConnections.delete(connection);
      if (userConnections.size === 0) {
        this.connections.delete(userId);
      }
      console.log(`WebSocket connection removed for user ${userId}`);
    }
  }

  public notifyUser(userId: number, data: any) {
    try {
      const userConnections = this.connections.get(userId);
      if (userConnections) {
        const message = JSON.stringify(data);
        userConnections.forEach(({ ws }) => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(message);
          }
        });
      }
    } catch (error) {
      console.error(`Error notifying user ${userId}:`, error);
    }
  }
}

export let websocketService: WebSocketService;

export function initializeWebSocket(server: Server) {
  try {
    websocketService = new WebSocketService(server);
    return websocketService;
  } catch (error) {
    console.error('Failed to initialize WebSocket service:', error);
    throw error;
  }
}