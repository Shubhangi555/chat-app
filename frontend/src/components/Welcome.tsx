import { Room } from '../types';

interface WelcomeProps {
  rooms: Room[];
  onSelectRoom: (room: Room) => void;
}

export function Welcome({ rooms, onSelectRoom }: WelcomeProps) {
  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.icon}>💬</div>
        <h2 style={styles.title}>Welcome to LiveChat</h2>
        <p style={styles.subtitle}>Pick a channel from the sidebar to start chatting</p>
        <div style={styles.rooms}>
          {rooms.slice(0, 4).map(room => (
            <button key={room.id} onClick={() => onSelectRoom(room)} style={styles.roomCard}>
              <span style={styles.hash}>#</span>
              <div>
                <p style={styles.roomName}>{room.name}</p>
                <p style={styles.roomDesc}>{room.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: '#16213e', height: '100vh',
  },
  content: { textAlign: 'center', maxWidth: 520, padding: 20 },
  icon: { fontSize: 64, marginBottom: 16 },
  title: { color: '#fff', fontSize: 26, fontWeight: 800, margin: '0 0 8px' },
  subtitle: { color: 'rgba(255,255,255,0.4)', fontSize: 15, marginBottom: 32 },
  rooms: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, textAlign: 'left' },
  roomCard: {
    display: 'flex', gap: 12, alignItems: 'flex-start',
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 12, padding: '14px 16px', cursor: 'pointer', transition: 'all 0.2s',
    textAlign: 'left',
  },
  hash: { color: '#6366f1', fontSize: 20, fontWeight: 800, lineHeight: 1.2 },
  roomName: { color: '#fff', fontWeight: 700, fontSize: 14, margin: '0 0 4px' },
  roomDesc: { color: 'rgba(255,255,255,0.35)', fontSize: 12, margin: 0, lineHeight: 1.4 },
};
