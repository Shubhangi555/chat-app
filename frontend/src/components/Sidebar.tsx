import { Room, User } from '../types';
import { ConnectionStatus } from '../hooks/useWebSocket';

interface SidebarProps {
  rooms: Room[];
  activeRoomId: string | null;
  joinedRooms: Set<string>;
  onSelectRoom: (room: Room) => void;
  user: User;
  onLogout: () => void;
  status: ConnectionStatus;
}

const statusColors: Record<ConnectionStatus, string> = {
  connected: '#10b981',
  connecting: '#f59e0b',
  disconnected: '#6b7280',
  error: '#ef4444',
};

const statusLabels: Record<ConnectionStatus, string> = {
  connected: 'Connected',
  connecting: 'Connecting...',
  disconnected: 'Disconnected',
  error: 'Connection Error',
};

export function Sidebar({ rooms, activeRoomId, joinedRooms, onSelectRoom, user, onLogout, status }: SidebarProps) {
  return (
    <div style={styles.sidebar}>
      {/* Header */}
      <div style={styles.header}>
        <span style={styles.logo}>💬 LiveChat</span>
        <div style={styles.statusDot} title={statusLabels[status]}>
          <span style={{ ...styles.dot, background: statusColors[status] }} />
          <span style={styles.statusText}>{statusLabels[status]}</span>
        </div>
      </div>

      {/* Rooms */}
      <div style={styles.section}>
        <p style={styles.sectionLabel}>CHANNELS</p>
        {rooms.map(room => {
          const isActive = room.id === activeRoomId;
          const isJoined = joinedRooms.has(room.id);
          return (
            <button
              key={room.id}
              onClick={() => onSelectRoom(room)}
              style={{
                ...styles.roomBtn,
                ...(isActive ? styles.roomActive : {}),
                ...(isJoined && !isActive ? styles.roomJoined : {}),
              }}
            >
              <span style={styles.roomHash}>#</span>
              <span style={styles.roomName}>{room.name}</span>
              {room.memberCount > 0 && (
                <span style={styles.memberCount}>{room.memberCount}</span>
              )}
              {isJoined && !isActive && <span style={styles.joinedDot} />}
            </button>
          );
        })}
      </div>

      {/* User Profile */}
      <div style={styles.profile}>
        <div style={{ ...styles.avatar, background: user.avatar }}>
          {user.displayName[0].toUpperCase()}
        </div>
        <div style={styles.profileInfo}>
          <p style={styles.profileName}>{user.displayName}</p>
          <p style={styles.profileUsername}>@{user.username}</p>
        </div>
        <button onClick={onLogout} style={styles.logoutBtn} title="Sign out">
          ↩
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  sidebar: {
    width: 240,
    minWidth: 240,
    background: '#1a1a2e',
    borderRight: '1px solid rgba(255,255,255,0.06)',
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
  },
  header: {
    padding: '18px 16px 14px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  logo: { color: '#fff', fontWeight: 800, fontSize: 18 },
  statusDot: { display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 },
  dot: { width: 7, height: 7, borderRadius: '50%', display: 'inline-block' },
  statusText: { color: 'rgba(255,255,255,0.4)', fontSize: 11 },
  section: { flex: 1, overflowY: 'auto', padding: '12px 8px' },
  sectionLabel: {
    color: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: 700,
    letterSpacing: 1, padding: '0 8px', marginBottom: 4, marginTop: 0,
  },
  roomBtn: {
    display: 'flex', alignItems: 'center', gap: 6,
    width: '100%', background: 'transparent', border: 'none',
    borderRadius: 6, padding: '7px 8px', cursor: 'pointer',
    color: 'rgba(255,255,255,0.5)', fontSize: 14, textAlign: 'left',
    transition: 'all 0.15s', position: 'relative',
  },
  roomActive: { background: 'rgba(99,102,241,0.25)', color: '#fff' },
  roomJoined: { color: 'rgba(255,255,255,0.75)' },
  roomHash: { color: 'rgba(255,255,255,0.3)', fontSize: 16, lineHeight: 1 },
  roomName: { flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  memberCount: {
    fontSize: 11, color: 'rgba(255,255,255,0.3)',
    background: 'rgba(255,255,255,0.06)', borderRadius: 10, padding: '1px 5px',
  },
  joinedDot: {
    width: 6, height: 6, borderRadius: '50%',
    background: '#6366f1', marginLeft: 2,
  },
  profile: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '12px 14px',
    borderTop: '1px solid rgba(255,255,255,0.06)',
    background: '#141428',
  },
  avatar: {
    width: 34, height: 34, borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff', fontWeight: 700, fontSize: 14, flexShrink: 0,
  },
  profileInfo: { flex: 1, overflow: 'hidden' },
  profileName: { color: '#fff', fontSize: 13, fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  profileUsername: { color: 'rgba(255,255,255,0.35)', fontSize: 11, margin: 0 },
  logoutBtn: {
    background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.3)',
    cursor: 'pointer', fontSize: 18, padding: 4, borderRadius: 4,
    transition: 'color 0.2s',
  },
};
