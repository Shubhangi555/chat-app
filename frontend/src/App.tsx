import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './context/AuthContext';
import { useWebSocket } from './hooks/useWebSocket';
import { AuthPage } from './components/AuthPage';
import { Sidebar } from './components/Sidebar';
import { ChatRoom } from './components/ChatRoom';
import { Welcome } from './components/Welcome';
import { Room, Message, User } from './types';

export function App() {
  const { user, token, logout } = useAuth();
  const { send, on, status } = useWebSocket(token);

  // ─── State ─────────────────────────────────────────────────────────────────
  const [rooms, setRooms] = useState<Room[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [joinedRooms, setJoinedRooms] = useState<Set<string>>(new Set());
  const [messagesByRoom, setMessagesByRoom] = useState<Record<string, Message[]>>({});
  const [typingByRoom, setTypingByRoom] = useState<Record<string, User[]>>({});

  // ─── WS Event Subscriptions ─────────────────────────────────────────────────
  useEffect(() => {
    if (!token) return;

    const unsubs = [
      on('AUTH_SUCCESS', (payload: unknown) => {
        const { rooms: serverRooms } = payload as { rooms: Room[] };
        setRooms(serverRooms);
      }),

      on('ROOM_JOINED', (payload: unknown) => {
        const { room, messages } = payload as { room: Room; messages: Message[] };
        setJoinedRooms(prev => new Set([...prev, room.id]));
        setRooms(prev => prev.map(r => r.id === room.id ? room : r));
        setMessagesByRoom(prev => ({ ...prev, [room.id]: messages }));
        setActiveRoomId(room.id);
      }),

      on('ROOM_LEFT', (payload: unknown) => {
        const { roomId } = payload as { roomId: string };
        setJoinedRooms(prev => { const s = new Set(prev); s.delete(roomId); return s; });
        if (activeRoomId === roomId) setActiveRoomId(null);
      }),

      on('NEW_MESSAGE', (payload: unknown) => {
        const { message } = payload as { message: Message };
        setMessagesByRoom(prev => ({
          ...prev,
          [message.roomId]: [...(prev[message.roomId] ?? []), message]
            // De-dupe by id
            .filter((m, i, arr) => arr.findIndex(x => x.id === m.id) === i),
        }));
      }),

      on('USER_JOINED', (payload: unknown) => {
        const { roomId } = payload as { roomId: string; user: User };
        setRooms(prev => prev.map(r => r.id === roomId ? { ...r, memberCount: r.memberCount + 1 } : r));
      }),

      on('USER_LEFT', (payload: unknown) => {
        const { roomId } = payload as { roomId: string; user: User };
        setRooms(prev => prev.map(r => r.id === roomId ? { ...r, memberCount: Math.max(0, r.memberCount - 1) } : r));
      }),

      on('USER_TYPING', (payload: unknown) => {
        const { roomId, user: typingUser } = payload as { roomId: string; user: User };
        setTypingByRoom(prev => ({
          ...prev,
          [roomId]: [...(prev[roomId] ?? []).filter(u => u.id !== typingUser.id), typingUser],
        }));
      }),

      on('USER_STOPPED_TYPING', (payload: unknown) => {
        const { roomId, user: typingUser } = payload as { roomId: string; user: User };
        setTypingByRoom(prev => ({
          ...prev,
          [roomId]: (prev[roomId] ?? []).filter(u => u.id !== typingUser.id),
        }));
      }),

      on('ERROR', (payload: unknown) => {
        const { message } = payload as { message: string };
        console.error('[Chat Error]', message);
      }),
    ];

    return () => unsubs.forEach(fn => fn());
  }, [token, on ]);

  // ─── Actions ────────────────────────────────────────────────────────────────
  const handleSelectRoom = useCallback((room: Room) => {
    if (joinedRooms.has(room.id)) {
      setActiveRoomId(room.id);
    } else {
      send('JOIN_ROOM', { roomId: room.id });
    }
  }, [joinedRooms, send]);

  const handleLeaveRoom = useCallback(() => {
    if (!activeRoomId) return;
    send('LEAVE_ROOM', { roomId: activeRoomId });
  }, [activeRoomId, send]);

  const handleSendMessage = useCallback((content: string) => {
    if (!activeRoomId) return;
    send('SEND_MESSAGE', { roomId: activeRoomId, content });
  }, [activeRoomId, send]);

  const handleTypingStart = useCallback(() => {
    if (!activeRoomId) return;
    send('TYPING_START', { roomId: activeRoomId });
  }, [activeRoomId, send]);

  const handleTypingStop = useCallback(() => {
    if (!activeRoomId) return;
    send('TYPING_STOP', { roomId: activeRoomId });
  }, [activeRoomId, send]);

  // ─── Render ─────────────────────────────────────────────────────────────────
  if (!user || !token) return <AuthPage />;

  const activeRoom = rooms.find(r => r.id === activeRoomId) ?? null;
  const activeMessages = activeRoomId ? (messagesByRoom[activeRoomId] ?? []) : [];
  const activeTyping = activeRoomId ? (typingByRoom[activeRoomId] ?? []) : [];

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar
        rooms={rooms}
        activeRoomId={activeRoomId}
        joinedRooms={joinedRooms}
        onSelectRoom={handleSelectRoom}
        user={user}
        onLogout={logout}
        status={status}
      />
      {activeRoom ? (
        <ChatRoom
          room={activeRoom}
          messages={activeMessages}
          typingUsers={activeTyping}
          currentUser={user}
          onSendMessage={handleSendMessage}
          onTypingStart={handleTypingStart}
          onTypingStop={handleTypingStop}
          onLeave={handleLeaveRoom}
        />
      ) : (
        <Welcome rooms={rooms} onSelectRoom={handleSelectRoom} />
      )}
    </div>
  );
}
