import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { AUTH_CONFIG } from '@/config/constants';
import { SessionUser } from '@/types';

const secret = new TextEncoder().encode(AUTH_CONFIG.secret);

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createToken(payload: Record<string, unknown>): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(AUTH_CONFIG.tokenExpiry)
    .sign(secret);
}

export async function verifyToken(token: string): Promise<Record<string, unknown> | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_CONFIG.cookieName)?.value;

  if (!token) return null;

  const payload = await verifyToken(token);
  if (!payload) return null;

  return {
    id: payload.id as string,
    name: payload.name as string,
    email: payload.email as string | undefined,
    phone: payload.phone as string,
    role: payload.role as string,
    avatar: payload.avatar as string | undefined,
    sellerId: payload.sellerId as string | undefined,
  };
}

export async function setSessionToken(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(AUTH_CONFIG.cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: '/',
  });
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_CONFIG.cookieName);
}

export function requireRole(session: SessionUser | null, roles: string[]): SessionUser {
  if (!session) {
    throw new Error('Unauthorized');
  }
  if (!roles.includes(session.role)) {
    throw new Error('Forbidden');
  }
  return session;
}

export function isAdmin(role: string): boolean {
  return ['super_admin', 'admin', 'finance_manager', 'delivery_manager', 'support_agent', 'marketing_manager'].includes(role);
}
