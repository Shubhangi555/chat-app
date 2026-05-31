import express from 'express';
import cors from 'cors';
import http from 'http';
import { WebSocketServer } from 'ws';
import { registerUser, loginUser } from './auth';
import { setupWebSocket } from './wsHandler';
import { roomManager } from './roomManager';

const app = express();
const PORT = process.env.PORT || 4000;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

// ─── REST Routes ──────────────────────────────────────────────────────────────

app.post('/auth/register', async (req, res) => {
  try {
    const result = await registerUser(req.body);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

app.post('/auth/login', async (req, res) => {
  try {
    const result = await loginUser(req.body);
    res.json(result);
  } catch (err) {
    res.status(401).json({ error: (err as Error).message });
  }
});

app.get('/rooms', (_req, res) => {
  res.json(roomManager.getAllRooms());
});

app.post('/rooms', (req, res) => {
  const { name, description } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Room name required' });
  const room = roomManager.createRoom(name.trim(), description?.trim() || '');
  res.status(201).json(room);
});

app.get('/health', (_req, res) => res.json({ status: 'ok', ts: new Date() }));

// ─── HTTP + WS Server ─────────────────────────────────────────────────────────
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

setupWebSocket(wss);

server.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`🔌 WebSocket ready on ws://localhost:${PORT}/ws`);
  console.log(`\nDemo accounts: alice / bob (password: password123)\n`);
});
