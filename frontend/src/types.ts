export type WSEventType =
  | 'AUTH' | 'AUTH_SUCCESS' | 'AUTH_ERROR'
  | 'JOIN_ROOM' | 'LEAVE_ROOM' | 'ROOM_JOINED' | 'ROOM_LEFT'
  | 'ROOM_LIST' | 'ROOM_USERS'
  | 'SEND_MESSAGE' | 'NEW_MESSAGE'
  | 'TYPING_START' | 'TYPING_STOP' | 'USER_TYPING' | 'USER_STOPPED_TYPING'
  | 'USER_JOINED' | 'USER_LEFT'
  | 'ERROR';

export interface WSEvent<T = unknown> {
  type: WSEventType;
  payload: T;
}

export interface User {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
}

export interface Room {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  memberCount: number;
}

export interface Message {
  id: string;
  roomId: string;
  sender: User;
  content: string;
  timestamp: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
}
