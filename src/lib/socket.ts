'use client';

// =============================================================================
// Realtime client - socket.io singleton + React hook
// Connects to the same-origin socket.io endpoint when the app is served by
// the realtime-enabled server. Gracefully degrades to no-op when the socket
// is unavailable (e.g. serverless/Vercel) — the UI keeps working via REST.
// =============================================================================

import { useEffect, useRef, useState, useCallback } from 'react';
import type { Socket } from 'socket.io-client';

type SocketEvent = 'app:event' | 'connected' | 'disconnect';

interface RealtimePayload {
  event: string;
  data: Record<string, unknown>;
  at: string;
}

let socketSingleton: Socket | null = null;
let connectAttempts = 0;

function getToken(): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const match = document.cookie.match(/(?:^|;\s*)localmart_session=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : undefined;
}

/** Returns the shared socket instance (lazily connecting on first use) */
export function getSocket(): Socket | null {
  if (typeof window === 'undefined') return null;
  if (socketSingleton) return socketSingleton;

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { io } = require('socket.io-client') as typeof import('socket.io-client');

  socketSingleton = io(window.location.origin, {
    path: '/socket.io',
    transports: ['websocket', 'polling'],
    auth: { token: getToken() },
    reconnection: true,
    reconnectionAttempts: 3,
    timeout: 5000,
  });

  socketSingleton.on('connect_error', () => {
    connectAttempts += 1;
    if (connectAttempts > 3) {
      // Realtime unavailable — stop retrying and let the app fall back to REST
      socketSingleton?.disconnect();
    }
  });

  return socketSingleton;
}

export interface UseSocketResult {
  connected: boolean;
  /** Registers a listener for a named app event (e.g. 'order_update', 'notification') */
  on: (event: string, handler: (data: Record<string, unknown>) => void) => () => void;
  /** Emits an event to the server */
  emit: (event: string, data: unknown) => void;
}

export function useSocket(): UseSocketResult {
  const [connected, setConnected] = useState(false);
  const handlersRef = useRef<Record<string, ((data: Record<string, unknown>) => void)[]>>({});

  useEffect(() => {
    let socket: Socket | null = null;
    let mounted = true;

    try {
      socket = getSocket();
    } catch {
      return;
    }

    const onConnect = () => mounted && setConnected(true);
    const onDisconnect = () => mounted && setConnected(false);

    const onAppEvent = (payload: RealtimePayload) => {
      if (!mounted || !payload?.event) return;
      const handlers = handlersRef.current[payload.event];
      handlers?.forEach((handler) => {
        try {
          handler(payload.data || {});
        } catch (err) {
          console.error('[socket] handler error:', err);
        }
      });
    };

    socket?.on('connect', onConnect);
    socket?.on('disconnect', onDisconnect);
    socket?.on('app:event', onAppEvent);
    if (socket?.connected) setConnected(true);

    return () => {
      mounted = false;
      socket?.off('connect', onConnect);
      socket?.off('disconnect', onDisconnect);
      socket?.off('app:event', onAppEvent);
    };
  }, []);

  const on = useCallback((event: string, handler: (data: Record<string, unknown>) => void) => {
    if (!handlersRef.current[event]) handlersRef.current[event] = [];
    handlersRef.current[event].push(handler);
    return () => {
      handlersRef.current[event] = (handlersRef.current[event] || []).filter((h) => h !== handler);
    };
  }, []);

  const emit = useCallback((event: string, data: unknown) => {
    try {
      getSocket()?.emit(event, data);
    } catch {
      // Socket unavailable — silently ignore (REST fallback path)
    }
  }, []);

  return { connected, on, emit };
}
