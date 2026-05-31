import WebSocket, { WebSocketServer } from 'ws';
import { verifyToken, buildUser } from './auth';
import { roomManager } from './roomManager';
import {
  WSEvent, WSEventType, ConnectedClient, User,
  AuthPayload, JoinRoomPayload, SendMessagePayload, TypingPayload,
} from './types';

// ─── Client registry ──────────────────────────────────────────────────────────
const clients = new Map<WebSocket, ConnectedClient>();

// ─── Helper: send typed event to a socket ────────────────────────────────────
function send<T>(ws: WebSocket, type: WSEventType, payload: T) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type, payload }));
  }
}

// ─── Helper: broadcast to all users in a room ────────────────────────────────
function broadcastToRoom<T>(roomId: string, type: WSEventType, payload: T, exclude?: WebSocket) {
  for (const [ws, client] of clients.entries()) {
    if (client.rooms.has(roomId) && ws !== exclude) {
      send(ws, type, payload);
    }
  }
}

// ─── Get User object from ws ──────────────────────────────────────────────────
function getClientUser(ws: WebSocket): User | null {
  return clients.get(ws)?.user ?? null;
}

// ─── Event Handlers ───────────────────────────────────────────────────────────

function handleAuth(ws: WebSocket, payload: AuthPayload) {
  try {
    const decoded = verifyToken(payload.token);
    const user = buildUser(decoded);
    clients.set(ws, { user, rooms: new Set() });

    send(ws, 'AUTH_SUCCESS', { user, rooms: roomManager.getAllRooms() });
    console.log(`[WS] Authenticated: ${user.username}`);
  } catch {
    send(ws, 'AUTH_ERROR', { message: 'Invalid or expired token' });
    ws.close();
  }
}

function handleJoinRoom(ws: WebSocket, payload: JoinRoomPayload) {
  const client = clients.get(ws);
  if (!client) return send(ws, 'ERROR', { message: 'Not authenticated' });

  const { roomId } = payload;
  if (!roomManager.roomExists(roomId)) return send(ws, 'ERROR', { message: 'Room not found' });

  roomManager.joinRoom(roomId, client.user.id);
  client.rooms.add(roomId);

  const room = roomManager.getRoom(roomId)!;
  const messages = roomManager.getRecentMessages(roomId);

  // Send history + room info to the joining user
  send(ws, 'ROOM_JOINED', { room, messages });

  // Notify others in the room
  broadcastToRoom(roomId, 'USER_JOINED', { roomId, user: client.user }, ws);

  console.log(`[WS] ${client.user.username} joined #${room.name}`);
}

function handleLeaveRoom(ws: WebSocket, payload: JoinRoomPayload) {
  const client = clients.get(ws);
  if (!client) return;

  const { roomId } = payload;
  roomManager.leaveRoom(roomId, client.user.id);
  client.rooms.delete(roomId);

  send(ws, 'ROOM_LEFT', { roomId });
  broadcastToRoom(roomId, 'USER_LEFT', { roomId, user: client.user }, ws);

  console.log(`[WS] ${client.user.username} left room ${roomId}`);
}

function handleSendMessage(ws: WebSocket, payload: SendMessagePayload) {
  const client = clients.get(ws);
  if (!client) return send(ws, 'ERROR', { message: 'Not authenticated' });

  const { roomId, content } = payload;

  if (!client.rooms.has(roomId)) return send(ws, 'ERROR', { message: 'Not in this room' });
  if (!content?.trim()) return send(ws, 'ERROR', { message: 'Message cannot be empty' });
  if (content.length > 2000) return send(ws, 'ERROR', { message: 'Message too long (max 2000 chars)' });

  const message = roomManager.addMessage(roomId, client.user, content);

  // Broadcast to everyone in the room including sender
  broadcastToRoom(roomId, 'NEW_MESSAGE', { message });
  send(ws, 'NEW_MESSAGE', { message });
}

function handleTyping(ws: WebSocket, payload: TypingPayload, isTyping: boolean) {
  const client = clients.get(ws);
  if (!client || !client.rooms.has(payload.roomId)) return;

  const event: WSEventType = isTyping ? 'USER_TYPING' : 'USER_STOPPED_TYPING';
  broadcastToRoom(payload.roomId, event, { roomId: payload.roomId, user: client.user }, ws);
}

function handleDisconnect(ws: WebSocket) {
  const client = clients.get(ws);
  if (!client) return;

  const leftRooms = roomManager.leaveAllRooms(client.user.id);
  for (const roomId of leftRooms) {
    broadcastToRoom(roomId, 'USER_LEFT', { roomId, user: client.user });
  }

  clients.delete(ws);
  console.log(`[WS] Disconnected: ${client.user.username}`);
}

// ─── Main WS setup ────────────────────────────────────────────────────────────

export function setupWebSocket(wss: WebSocketServer) {
  wss.on('connection', (ws: WebSocket) => {
    console.log('[WS] New connection');

    ws.on('message', (raw: Buffer) => {
      try {
        const event: WSEvent = JSON.parse(raw.toString());
        const { type, payload } = event;

        switch (type) {
          case 'AUTH':          return handleAuth(ws, payload as AuthPayload);
          case 'JOIN_ROOM':     return handleJoinRoom(ws, payload as JoinRoomPayload);
          case 'LEAVE_ROOM':    return handleLeaveRoom(ws, payload as JoinRoomPayload);
          case 'SEND_MESSAGE':  return handleSendMessage(ws, payload as SendMessagePayload);
          case 'TYPING_START':  return handleTyping(ws, payload as TypingPayload, true);
          case 'TYPING_STOP':   return handleTyping(ws, payload as TypingPayload, false);
          default:
            send(ws, 'ERROR', { message: `Unknown event: ${type}` });
        }
      } catch (err) {
        console.error('[WS] Message parse error:', err);
        send(ws, 'ERROR', { message: 'Invalid message format' });
      }
    });

    ws.on('close', () => handleDisconnect(ws));
    ws.on('error', (err) => {
      console.error('[WS] Socket error:', err.message);
      handleDisconnect(ws);
    });

    // Give client 10s to authenticate
    const authTimeout = setTimeout(() => {
      if (!clients.has(ws)) {
        console.log('[WS] Auth timeout - closing connection');
        ws.close();
      }
    }, 10000);

    ws.once('close', () => clearTimeout(authTimeout));
  });
}
