import { v4 as uuidv4 } from 'uuid';
import { Room, Message, User } from './types';

// ─── In-memory room + message store ──────────────────────────────────────────
class RoomManager {
  private rooms = new Map<string, Room>();
  private messages = new Map<string, Message[]>(); // roomId → messages
  private roomMembers = new Map<string, Set<string>>(); // roomId → Set<userId>

  constructor() {
    this.seedRooms();
  }

  private seedRooms() {
    const defaults = [
      { name: 'general', description: 'General discussion for everyone' },
      { name: 'random', description: 'Off-topic conversations' },
      { name: 'tech', description: 'Tech talk, code, and architecture' },
      { name: 'announcements', description: 'Important updates (read-only style)' },
    ];
    for (const r of defaults) {
      const id = uuidv4();
      this.rooms.set(id, { id, name: r.name, description: r.description, createdAt: new Date(), memberCount: 0 });
      this.messages.set(id, []);
      this.roomMembers.set(id, new Set());
    }
  }

  getAllRooms(): Room[] {
    return Array.from(this.rooms.values()).map(room => ({
      ...room,
      memberCount: this.roomMembers.get(room.id)?.size ?? 0,
    }));
  }

  getRoom(roomId: string): Room | undefined {
    const room = this.rooms.get(roomId);
    if (!room) return undefined;
    return { ...room, memberCount: this.roomMembers.get(roomId)?.size ?? 0 };
  }

  getRecentMessages(roomId: string, limit = 50): Message[] {
    return (this.messages.get(roomId) ?? []).slice(-limit);
  }

  addMessage(roomId: string, sender: User, content: string): Message {
    const message: Message = {
      id: uuidv4(),
      roomId,
      sender,
      content: content.trim(),
      timestamp: new Date(),
    };
    const msgs = this.messages.get(roomId) ?? [];
    msgs.push(message);
    // Cap history at 200 messages per room
    if (msgs.length > 200) msgs.splice(0, msgs.length - 200);
    this.messages.set(roomId, msgs);
    return message;
  }

  joinRoom(roomId: string, userId: string): boolean {
    const members = this.roomMembers.get(roomId);
    if (!members) return false;
    members.add(userId);
    return true;
  }

  leaveRoom(roomId: string, userId: string): boolean {
    return this.roomMembers.get(roomId)?.delete(userId) ?? false;
  }

  leaveAllRooms(userId: string): string[] {
    const left: string[] = [];
    for (const [roomId, members] of this.roomMembers.entries()) {
      if (members.delete(userId)) left.push(roomId);
    }
    return left;
  }

  getRoomMembers(roomId: string): string[] {
    return Array.from(this.roomMembers.get(roomId) ?? []);
  }

  roomExists(roomId: string): boolean {
    return this.rooms.has(roomId);
  }

  createRoom(name: string, description: string): Room {
    const id = uuidv4();
    const room: Room = { id, name, description, createdAt: new Date(), memberCount: 0 };
    this.rooms.set(id, room);
    this.messages.set(id, []);
    this.roomMembers.set(id, new Set());
    return room;
  }
}

export const roomManager = new RoomManager();
