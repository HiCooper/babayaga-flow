import { WebSocket, WebSocketServer } from 'ws';
import { Server } from 'http';
import { WSMessage } from '../types';

type ClientInfo = { ws: WebSocket; subscribedProjects: Set<string> };

export class WSHub {
  private wss!: WebSocketServer;
  private clients: Map<string, ClientInfo> = new Map();
  private clientId = 0;

  init(server: Server): void {
    this.wss = new WebSocketServer({ server, path: '/ws' });
    this.wss.on('connection', (ws) => {
      const cid = `c${++this.clientId}`;
      this.clients.set(cid, { ws, subscribedProjects: new Set() });
      ws.send(JSON.stringify({ type: 'connected', clientId: cid }));

      ws.on('message', (raw) => {
        try {
          const msg: WSMessage = JSON.parse(raw.toString());
          if (msg.type === 'subscribe' && msg.projectId) {
            this.clients.get(cid)?.subscribedProjects.add(msg.projectId);
          } else if (msg.type === 'unsubscribe' && msg.projectId) {
            this.clients.get(cid)?.subscribedProjects.delete(msg.projectId);
          }
        } catch {}
      });

      ws.on('close', () => { this.clients.delete(cid); });
    });
  }

  broadcastProject(projectId: string, message: WSMessage): void {
    const payload = JSON.stringify(message);
    this.clients.forEach((info) => {
      if (info.subscribedProjects.has(projectId) && info.ws.readyState === WebSocket.OPEN) {
        info.ws.send(payload);
      }
    });
  }

  broadcastAll(message: WSMessage): void {
    const payload = JSON.stringify(message);
    this.clients.forEach((info) => {
      if (info.ws.readyState === WebSocket.OPEN) info.ws.send(payload);
    });
  }

  getConnectedCount(): number { return this.clients.size; }
}

export const wsHub = new WSHub();
