// ─── WebSocket Event Types ───────────────────────────────────────────────────

export type WSEventType =
  | 'AUTH'
  | 'AUTH_SUCCESS'
  | 'AUTH_ERROR'
  | 'JOIN_ROOM'
  | 'LEAVE_ROOM'
  | 'ROOM_JOINED'
  | 'ROOM_LEFT'
  | 'ROOM_LIST'
  | 'ROOM_USERS'
  | 'SEND_MESSAGE'
  | 'NEW_MESSAGE'
  | 'TYPING_START'
  | 'TYPING_STOP'
  | 'USER_TYPING'
  | 'USER_STOPPED_TYPING'
  | 'USER_JOINED'
  | 'USER_LEFT'
  | 'ERROR';

export interface WSEvent<T = unknown> {
  type: WSEventType;
  payload: T;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthPayload {
  token: string;
}

export interface RegisterBody {
  username: string;
  password: string;
  displayName: string;
}

export interface LoginBody {
  username: string;
  password: string;
}

export interface JWTPayload {
  userId: string;
  username: string;
  displayName: string;
}

// ─── Users ────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  username: string;
  displayName: string;
  avatar: string; // initials-based color
}

// ─── Rooms ────────────────────────────────────────────────────────────────────

export interface Room {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  memberCount: number;
}

export interface JoinRoomPayload {
  roomId: string;
}

// ─── Messages ─────────────────────────────────────────────────────────────────

export interface Message {
  id: string;
  roomId: string;
  sender: User;
  content: string;
  timestamp: Date;
}

export interface SendMessagePayload {
  roomId: string;
  content: string;
}

// ─── Typing ───────────────────────────────────────────────────────────────────

export interface TypingPayload {
  roomId: string;
}

// ─── Connected Client (server-side) ──────────────────────────────────────────

export interface ConnectedClient {
  user: User;
  rooms: Set<string>;
}
