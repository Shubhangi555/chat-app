import { useEffect, useRef, useCallback, useState } from 'react';
import { WSEventType, WSEvent } from '../types';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:4000/ws';
const RECONNECT_DELAY_MS = 3000;
const MAX_RECONNECT_ATTEMPTS = 5;

type EventHandler = (payload: unknown) => void;

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export function useWebSocket(token: string | null) {
  const wsRef = useRef<WebSocket | null>(null);
  const handlersRef = useRef<Map<WSEventType, EventHandler[]>>(new Map());
  const reconnectAttempts = useRef(0);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');

  // ─── Send helper ────────────────────────────────────────────────────────────
  const send = useCallback(<T>(type: WSEventType, payload: T) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, payload }));
    } else {
      console.warn('[WS] Tried to send while not connected:', type);
    }
  }, []);

  // ─── Subscribe to events ────────────────────────────────────────────────────
  const on = useCallback((type: WSEventType, handler: EventHandler) => {
    const map = handlersRef.current;
    if (!map.has(type)) map.set(type, []);
    map.get(type)!.push(handler);

    // Return unsubscribe fn
    return () => {
      const handlers = map.get(type) ?? [];
      map.set(type, handlers.filter(h => h !== handler));
    };
  }, []);

  // ─── Connect / reconnect ────────────────────────────────────────────────────
  const connect = useCallback(() => {
    if (!token) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    setStatus('connecting');
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      reconnectAttempts.current = 0;
      setStatus('connected');
      // Authenticate immediately after connection
      ws.send(JSON.stringify({ type: 'AUTH', payload: { token } }));
    };

    ws.onmessage = (event: MessageEvent) => {
      try {
        const { type, payload } = JSON.parse(event.data) as WSEvent;
        const handlers = handlersRef.current.get(type) ?? [];
        handlers.forEach(h => h(payload));
      } catch (err) {
        console.error('[WS] Parse error:', err);
      }
    };

    ws.onclose = () => {
      setStatus('disconnected');
      wsRef.current = null;

      if (reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttempts.current += 1;
        console.log(`[WS] Reconnecting (${reconnectAttempts.current}/${MAX_RECONNECT_ATTEMPTS})...`);
        reconnectTimer.current = setTimeout(connect, RECONNECT_DELAY_MS);
      } else {
        setStatus('error');
        console.error('[WS] Max reconnection attempts reached');
      }
    };

    ws.onerror = (err) => {
      console.error('[WS] Error:', err);
      setStatus('error');
    };
  }, [token]);

  // ─── Disconnect ─────────────────────────────────────────────────────────────
  const disconnect = useCallback(() => {
    if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    reconnectAttempts.current = MAX_RECONNECT_ATTEMPTS; // prevent auto-reconnect
    wsRef.current?.close();
    wsRef.current = null;
    setStatus('disconnected');
  }, []);

  // ─── Lifecycle ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (token) connect();
    return () => disconnect();
  }, [token, connect, disconnect]);

  return { send, on, status, connect, disconnect };
}
