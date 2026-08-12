import { hashPassword, verifyPassword, createToken, verifyToken } from '@/lib/auth';

describe('Auth Service', () => {
  test('should hash and verify password', async () => {
    const password = 'TestPassword123!';
    const hash = await hashPassword(password);
    expect(hash).not.toBe(password);
    expect(await verifyPassword(password, hash)).toBe(true);
    expect(await verifyPassword('wrong', hash)).toBe(false);
  });

  test('should create and verify JWT token', async () => {
    const payload = { id: '123', name: 'Test User', role: 'customer' };
    const token = await createToken(payload);
    expect(typeof token).toBe('string');
    const verified = await verifyToken(token);
    expect(verified).toBeTruthy();
    expect(verified?.id).toBe('123');
    expect(verified?.name).toBe('Test User');
  });

  test('should reject invalid token', async () => {
    const result = await verifyToken('invalid-token');
    expect(result).toBeNull();
  });
});
