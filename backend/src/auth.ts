import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { JWTPayload, User, RegisterBody, LoginBody } from './types';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-prod';
const JWT_EXPIRES_IN = '7d';

// ─── In-memory user store (replace with DB in production) ────────────────────
interface StoredUser {
  id: string;
  username: string;
  passwordHash: string;
  displayName: string;
}

const users = new Map<string, StoredUser>();

// Seed a couple of demo users
(async () => {
  const demoUsers = [
    { username: 'alice', password: 'password123', displayName: 'Alice Johnson' },
    { username: 'bob', password: 'password123', displayName: 'Bob Smith' },
  ];
  for (const u of demoUsers) {
    const hash = await bcrypt.hash(u.password, 10);
    const id = uuidv4();
    users.set(u.username, { id, username: u.username, passwordHash: hash, displayName: u.displayName });
  }
  console.log('Demo users seeded: alice / bob (password: password123)');
})();

// ─── Avatar color helper ──────────────────────────────────────────────────────
const AVATAR_COLORS = ['#6366f1', '#ec4899', '#14b8a6', '#f59e0b', '#ef4444', '#8b5cf6', '#10b981'];
export function getAvatarColor(username: string): string {
  const index = username.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}

// ─── Auth functions ───────────────────────────────────────────────────────────
export async function registerUser(body: RegisterBody): Promise<{ token: string; user: User }> {
  const { username, password, displayName } = body;

  if (users.has(username)) throw new Error('Username already taken');
  if (username.length < 3) throw new Error('Username must be at least 3 characters');
  if (password.length < 6) throw new Error('Password must be at least 6 characters');

  const passwordHash = await bcrypt.hash(password, 10);
  const id = uuidv4();
  users.set(username, { id, username, passwordHash, displayName });

  const payload: JWTPayload = { userId: id, username, displayName };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  const user: User = { id, username, displayName, avatar: getAvatarColor(username) };

  return { token, user };
}

export async function loginUser(body: LoginBody): Promise<{ token: string; user: User }> {
  const { username, password } = body;

  const stored = users.get(username);
  if (!stored) throw new Error('Invalid username or password');

  const valid = await bcrypt.compare(password, stored.passwordHash);
  if (!valid) throw new Error('Invalid username or password');

  const payload: JWTPayload = { userId: stored.id, username, displayName: stored.displayName };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  const user: User = { id: stored.id, username, displayName: stored.displayName, avatar: getAvatarColor(username) };

  return { token, user };
}

export function verifyToken(token: string): JWTPayload {
  return jwt.verify(token, JWT_SECRET) as JWTPayload;
}

export function buildUser(payload: JWTPayload): User {
  return {
    id: payload.userId,
    username: payload.username,
    displayName: payload.displayName,
    avatar: getAvatarColor(payload.username),
  };
}
