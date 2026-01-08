import { WebSocket, WebSocketServer } from "ws";
import type { Server } from "http";
import { log } from "./index";

interface ExtWebSocket extends WebSocket {
    userId?: number;
    isAlive: boolean;
}

export let wss: WebSocketServer;
const clients = new Map<number, Set<ExtWebSocket>>();

export function setupWebSocket(server: Server) {
    wss = new WebSocketServer({ server, path: "/ws" });

    wss.on("connection", (ws: ExtWebSocket, req) => {
        ws.isAlive = true;

        // session parsing would ideally happen here to auto-authenticate
        // For now, we'll wait for a "auth" message

        ws.on("pong", () => {
            ws.isAlive = true;
        });

        ws.on("message", (data) => {
            try {
                const message = JSON.parse(data.toString());
                if (message.type === "auth" && message.userId) {
                    ws.userId = message.userId;

                    if (!clients.has(ws.userId)) {
                        clients.set(ws.userId, new Set());
                    }
                    clients.get(ws.userId)?.add(ws);

                    log(`WS Client connected: User ${ws.userId}`, "ws");
                }
            } catch (err) {
                // ignore invalid JSON
            }
        });

        ws.on("close", () => {
            if (ws.userId && clients.has(ws.userId)) {
                clients.get(ws.userId)?.delete(ws);
                if (clients.get(ws.userId)?.size === 0) {
                    clients.delete(ws.userId);
                }
            }
        });
    });

    // Heartbeat
    const interval = setInterval(() => {
        wss.clients.forEach((ws: WebSocket) => {
            const extWs = ws as ExtWebSocket;
            if (extWs.isAlive === false) return ws.terminate();

            extWs.isAlive = false;
            ws.ping();
        });
    }, 30000);

    wss.on("close", () => {
        clearInterval(interval);
    });
}

export function broadcast(userId: number, type: string, payload: any) {
    if (clients.has(userId)) {
        const userClients = clients.get(userId);
        const message = JSON.stringify({ type, payload });
        userClients?.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    }
}
