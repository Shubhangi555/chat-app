import { useState, FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';

const API = import.meta.env.VITE_API_URL || '';

export function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = mode === 'login' ? `${API}/auth/login` : `${API}/auth/register`;
      const body = mode === 'login'
        ? { username, password }
        : { username, password, displayName: displayName || username };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');

      login(data.token, data.user);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Logo */}
        <div style={styles.logo}>
          <span style={styles.logoIcon}>💬</span>
          <h1 style={styles.logoText}>LiveChat</h1>
        </div>
        <p style={styles.subtitle}>Real-time messaging with WebSockets</p>

        {/* Tabs */}
        <div style={styles.tabs}>
          {(['login', 'register'] as const).map(m => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(''); }}
              style={{ ...styles.tab, ...(mode === m ? styles.tabActive : {}) }}
            >
              {m === 'login' ? 'Sign In' : 'Register'}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={styles.form}>
          {mode === 'register' && (
            <div style={styles.field}>
              <label style={styles.label}>Display Name</label>
              <input
                style={styles.input}
                type="text"
                placeholder="Your Name"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
              />
            </div>
          )}
          <div style={styles.field}>
            <label style={styles.label}>Username</label>
            <input
              style={styles.input}
              type="text"
              placeholder="username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              autoComplete="username"
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              style={styles.input}
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
          </div>

          {error && <p style={styles.error}>⚠ {error}</p>}

          <button type="submit" style={styles.btn} disabled={loading}>
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        {/* Demo hint */}
        <p style={styles.hint}>
          Demo: <strong>alice</strong> or <strong>bob</strong> / password123
        </p>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)',
  },
  card: {
    background: 'rgba(255,255,255,0.05)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 20,
    padding: '40px 36px',
    width: '100%',
    maxWidth: 420,
    boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
  },
  logo: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 },
  logoIcon: { fontSize: 36 },
  logoText: { fontSize: 28, fontWeight: 800, color: '#fff', margin: 0, letterSpacing: -1 },
  subtitle: { color: 'rgba(255,255,255,0.5)', marginBottom: 28, fontSize: 14 },
  tabs: {
    display: 'flex',
    background: 'rgba(255,255,255,0.06)',
    borderRadius: 10,
    padding: 4,
    marginBottom: 24,
  },
  tab: {
    flex: 1, padding: '8px 0', border: 'none', borderRadius: 8,
    background: 'transparent', color: 'rgba(255,255,255,0.5)',
    cursor: 'pointer', fontSize: 14, fontWeight: 600, transition: 'all 0.2s',
  },
  tabActive: { background: '#6366f1', color: '#fff' },
  form: { display: 'flex', flexDirection: 'column', gap: 16 },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 600 },
  input: {
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 10,
    padding: '11px 14px',
    color: '#fff',
    fontSize: 15,
    outline: 'none',
  },
  error: { color: '#f87171', fontSize: 13, margin: 0, padding: '8px 12px', background: 'rgba(239,68,68,0.1)', borderRadius: 8 },
  btn: {
    marginTop: 4,
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    padding: '13px',
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'opacity 0.2s',
  },
  hint: { color: 'rgba(255,255,255,0.3)', fontSize: 12, textAlign: 'center', marginTop: 20, marginBottom: 0 },
};
