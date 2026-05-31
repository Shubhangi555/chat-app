import { useState, useEffect, useRef, FormEvent, KeyboardEvent } from 'react';
import { Message, Room, User } from '../types';

interface ChatRoomProps {
  room: Room;
  messages: Message[];
  typingUsers: User[];
  currentUser: User;
  onSendMessage: (content: string) => void;
  onTypingStart: () => void;
  onTypingStop: () => void;
  onLeave: () => void;
}

export function ChatRoom({
  room, messages, typingUsers, currentUser,
  onSendMessage, onTypingStart, onTypingStop, onLeave
}: ChatRoomProps) {
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  const handleInputChange = (val: string) => {
    setInput(val);
    if (!isTypingRef.current && val.trim()) {
      isTypingRef.current = true;
      onTypingStart();
    }
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      if (isTypingRef.current) {
        isTypingRef.current = false;
        onTypingStop();
      }
    }, 1500);
  };

  const handleSend = (e?: FormEvent) => {
    e?.preventDefault();
    if (!input.trim()) return;
    onSendMessage(input.trim());
    setInput('');
    if (isTypingRef.current) {
      isTypingRef.current = false;
      onTypingStop();
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Group consecutive messages from same user
  const groupedMessages = messages.reduce<Array<Message & { showAvatar: boolean }>>((acc, msg, i) => {
    const prev = messages[i - 1];
    const showAvatar = !prev || prev.sender.id !== msg.sender.id ||
      new Date(msg.timestamp).getTime() - new Date(prev.timestamp).getTime() > 5 * 60 * 1000;
    acc.push({ ...msg, showAvatar });
    return acc;
  }, []);

  const formatTime = (ts: string) =>
    new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const otherTyping = typingUsers.filter(u => u.id !== currentUser.id);

  return (
    <div style={styles.container}>
      {/* Room header */}
      <div style={styles.header}>
        <div>
          <h2 style={styles.roomName}># {room.name}</h2>
          <p style={styles.roomDesc}>{room.description}</p>
        </div>
        <div style={styles.headerRight}>
          <span style={styles.memberBadge}>👥 {room.memberCount}</span>
          <button onClick={onLeave} style={styles.leaveBtn}>Leave</button>
        </div>
      </div>

      {/* Messages */}
      <div style={styles.messages}>
        {groupedMessages.length === 0 && (
          <div style={styles.empty}>
            <p style={styles.emptyIcon}>#</p>
            <p style={styles.emptyText}>Start the conversation in <strong>#{room.name}</strong></p>
          </div>
        )}
        {groupedMessages.map(msg => {
          const isOwn = msg.sender.id === currentUser.id;
          return (
            <div key={msg.id} style={{ ...styles.messageRow, ...(isOwn ? styles.ownRow : {}) }}>
              {msg.showAvatar && !isOwn && (
                <div style={{ ...styles.avatar, background: msg.sender.avatar }}>
                  {msg.sender.displayName[0].toUpperCase()}
                </div>
              )}
              {!msg.showAvatar && !isOwn && <div style={styles.avatarSpacer} />}
              <div style={{ ...styles.bubble, maxWidth: '70%' }}>
                {msg.showAvatar && (
                  <div style={styles.meta}>
                    <span style={{ ...styles.senderName, color: isOwn ? '#a78bfa' : msg.sender.avatar }}>
                      {isOwn ? 'You' : msg.sender.displayName}
                    </span>
                    <span style={styles.time}>{formatTime(msg.timestamp)}</span>
                  </div>
                )}
                <div style={{ ...styles.content, ...(isOwn ? styles.ownContent : styles.otherContent) }}>
                  {msg.content}
                </div>
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {otherTyping.length > 0 && (
          <div style={styles.typing}>
            <div style={styles.typingDots}>
              <span /><span /><span />
            </div>
            <span style={styles.typingText}>
              {otherTyping.map(u => u.displayName).join(', ')} {otherTyping.length === 1 ? 'is' : 'are'} typing...
            </span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={styles.inputArea}>
        <textarea
          style={styles.textarea}
          placeholder={`Message #${room.name} — Enter to send, Shift+Enter for newline`}
          value={input}
          onChange={e => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
        />
        <button onClick={() => handleSend()} style={styles.sendBtn} disabled={!input.trim()}>
          ➤
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', background: '#16213e' },
  header: {
    padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    background: '#1a1a2e',
  },
  roomName: { color: '#fff', fontSize: 17, fontWeight: 700, margin: 0 },
  roomDesc: { color: 'rgba(255,255,255,0.35)', fontSize: 12, margin: '2px 0 0' },
  headerRight: { display: 'flex', alignItems: 'center', gap: 10 },
  memberBadge: { color: 'rgba(255,255,255,0.4)', fontSize: 13 },
  leaveBtn: {
    background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
    color: '#f87171', borderRadius: 6, padding: '5px 12px', fontSize: 12,
    cursor: 'pointer', fontWeight: 600,
  },
  messages: { flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 2 },
  empty: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.3 },
  emptyIcon: { fontSize: 48, color: '#6366f1', margin: 0 },
  emptyText: { color: '#fff', fontSize: 15, marginTop: 8 },
  messageRow: { display: 'flex', alignItems: 'flex-end', gap: 10, marginBottom: 2 },
  ownRow: { flexDirection: 'row-reverse' },
  avatar: {
    width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff', fontWeight: 700, fontSize: 13,
  },
  avatarSpacer: { width: 32, flexShrink: 0 },
  bubble: { display: 'flex', flexDirection: 'column' },
  meta: { display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 3 },
  senderName: { fontSize: 13, fontWeight: 700 },
  time: { fontSize: 11, color: 'rgba(255,255,255,0.2)' },
  content: {
    fontSize: 14, lineHeight: 1.5, borderRadius: 12, padding: '8px 12px',
    wordBreak: 'break-word', whiteSpace: 'pre-wrap',
  },
  otherContent: { background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.9)', borderTopLeftRadius: 2 },
  ownContent: { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', borderTopRightRadius: 2 },
  typing: { display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', height: 28 },
  typingDots: { display: 'flex', gap: 3, alignItems: 'center' },
  typingText: { color: 'rgba(255,255,255,0.35)', fontSize: 12 },
  inputArea: {
    padding: '12px 20px',
    borderTop: '1px solid rgba(255,255,255,0.06)',
    display: 'flex', gap: 10, alignItems: 'flex-end',
    background: '#1a1a2e',
  },
  textarea: {
    flex: 1, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 10, padding: '10px 14px', color: '#fff', fontSize: 14,
    outline: 'none', resize: 'none', fontFamily: 'inherit', lineHeight: 1.5,
    maxHeight: 120,
  },
  sendBtn: {
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none',
    borderRadius: 10, width: 40, height: 40, color: '#fff', fontSize: 16,
    cursor: 'pointer', flexShrink: 0, transition: 'opacity 0.2s',
  },
};
