// =============================================================================
// Realtime Service - socket.io server attachment
// Attaches a socket.io server to an existing HTTP server and wires up
// authenticated rooms (user:<id>, role:<role>, seller:<sellerId>) plus
// realtime event helpers used across the app.
// =============================================================================

import { Server as SocketIOServer } from 'socket.io';
import type { Server as HttpServer } from 'http';
import { SignJWT, jwtVerify } from 'jose';
import { AUTH_CONFIG } from '@/config/constants';

const secret = new TextEncoder().encode(AUTH_CONFIG.secret);

export interface RealtimeEvent {
  userId?: string;
  role?: string;
  sellerId?: string;
  event: string;
  data: Record<string, unknown>;
}

let io: SocketIOServer | null = null;

export function getIO(): SocketIOServer | null {
  return io;
}

export function isRealtimeAvailable(): boolean {
  // The custom server sets a global flag; API route bundles run in their own
  // module instance, so check both the local `io` and the global marker.
  return io !== null || Boolean((globalThis as any).__LOCALMART_SOCKET__);
}

async function verifySocketToken(token: string | undefined): Promise<Record<string, unknown> | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as Record<string, unknown>;
  } catch {
    return null;
  }
}

function getCookieToken(cookieHeader: string | undefined): string | undefined {
  if (!cookieHeader) return undefined;
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${AUTH_CONFIG.cookieName}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

/**
 * Attaches socket.io to the HTTP server and wires up auth + rooms.
 * Called from the custom Next.js server (server.ts).
 */
export function initRealtimeServer(httpServer: HttpServer): SocketIOServer {
  if (io) return io;

  io = new SocketIOServer(httpServer, {
    path: '/socket.io',
    cors: { origin: true, credentials: true },
    transports: ['websocket', 'polling'],
  });

  io.use(async (socket, next) => {
    const token =
      (socket.handshake.auth?.token as string | undefined) ||
      getCookieToken(socket.handshake.headers.cookie);

    const payload = await verifySocketToken(token);
    if (!payload || !payload.id) {
      return next(new Error('Unauthorized'));
    }
    socket.data.user = payload;
    next();
  });

  io.on('connection', (socket) => {
    const user = socket.data.user as Record<string, unknown>;
    const userId = user.id as string;
    const role = (user.role as string) || 'guest';
    const sellerId = (user.sellerId as string) || '';

    socket.join(`user:${userId}`);
    socket.join(`role:${role}`);
    if (sellerId) socket.join(`seller:${sellerId}`);

    socket.emit('connected', { userId, role, at: new Date().toISOString() });

    socket.on('chat:join', (conversationId: string) => {
      socket.join(`chat:${conversationId}`);
    });

    socket.on('chat:leave', (conversationId: string) => {
      socket.leave(`chat:${conversationId}`);
    });

    socket.on('disconnect', () => {
      // Rooms are cleaned up automatically on disconnect
    });
  });

  (globalThis as any).__LOCALMART_SOCKET__ = true;
  console.log('[realtime] socket.io attached at /socket.io');
  return io;
}

/** Emits an event to the rooms a given recipient belongs to */
export function emitToUser(userId: string, event: string, data: Record<string, unknown>): void {
  io?.to(`user:${userId}`).emit(event, data);
}

export function emitToRole(role: string, event: string, data: Record<string, unknown>): void {
  io?.to(`role:${role}`).emit(event, data);
}

export function emitToSeller(sellerId: string, event: string, data: Record<string, unknown>): void {
  io?.to(`seller:${sellerId}`).emit(event, data);
}

export function emitToChat(conversationId: string, event: string, data: Record<string, unknown>): void {
  io?.to(`chat:${conversationId}`).emit(event, data);
}

/** Single entrypoint used by services to fan out realtime events */
export function emitRealtime(evt: RealtimeEvent): void {
  if (!io) return;
  const payload = { event: evt.event, data: evt.data, at: new Date().toISOString() };

  if (evt.userId) emitToUser(evt.userId, 'app:event', payload);
  if (evt.role) emitToRole(evt.role, 'app:event', payload);
  if (evt.sellerId) emitToSeller(evt.sellerId, 'app:event', payload);
}
