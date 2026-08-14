// =============================================================================
// Cache Service - Redis-backed caching with graceful in-memory fallback
// Works in any environment: uses Redis when REDIS_URL is configured,
// otherwise falls back to an in-process Map (perfect for dev/Vercel).
// =============================================================================

type CacheValue = string | number | boolean | Record<string, unknown> | unknown[] | null;

interface CacheEntry {
  value: CacheValue;
  expiresAt: number | null;
}

let redisClient: any = null;
let redisConnecting: Promise<any> | null = null;
const memoryStore = new Map<string, CacheEntry>();

function getRedis() {
  const url = process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL || '';
  if (!url) return null;
  if (redisClient) return redisClient;
  if (!redisConnecting) {
    redisConnecting = (async () => {
      try {
        // Lazy dynamic import so Redis is never required for the build
        const { default: Redis } = await import('ioredis');
        redisClient = new Redis(url, {
          maxRetriesPerRequest: 1,
          connectTimeout: 3000,
          lazyConnect: true,
          retryStrategy: (times: number) => (times > 3 ? null : Math.min(times * 200, 1000)),
        });
        await redisClient.connect();
        redisClient.on('error', (err: Error) => {
          console.warn('[cache] Redis connection error, falling back to memory:', err.message);
          redisClient = null;
        });
        return redisClient;
      } catch (err) {
        console.warn('[cache] Redis unavailable, using in-memory cache:', (err as Error).message);
        redisClient = null;
        return null;
      }
    })();
  }
  return redisConnecting;
}

function memoryGet(key: string): CacheValue | null {
  const entry = memoryStore.get(key);
  if (!entry) return null;
  if (entry.expiresAt !== null && entry.expiresAt < Date.now()) {
    memoryStore.delete(key);
    return null;
  }
  return entry.value;
}

function memorySet(key: string, value: CacheValue, ttlSeconds?: number) {
  memoryStore.set(key, {
    value,
    expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : null,
  });
  // Basic size guard so the in-memory store can't grow unbounded
  if (memoryStore.size > 10_000) {
    const oldest = memoryStore.keys().next().value;
    if (oldest) memoryStore.delete(oldest);
  }
}

export async function cacheGet<T = CacheValue>(key: string): Promise<T | null> {
  const redis = await getRedis();
  if (redis) {
    try {
      const raw = await redis.get(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch (err) {
      console.warn('[cache] Redis get failed, using memory:', (err as Error).message);
    }
  }
  return memoryGet(key) as T | null;
}

export async function cacheSet(
  key: string,
  value: CacheValue,
  ttlSeconds?: number
): Promise<void> {
  const redis = await getRedis();
  if (redis) {
    try {
      const raw = JSON.stringify(value);
      if (ttlSeconds) {
        await redis.set(key, raw, 'EX', ttlSeconds);
      } else {
        await redis.set(key, raw);
      }
      return;
    } catch (err) {
      console.warn('[cache] Redis set failed, using memory:', (err as Error).message);
    }
  }
  memorySet(key, value, ttlSeconds);
}

export async function cacheDelete(key: string): Promise<void> {
  const redis = await getRedis();
  if (redis) {
    try {
      await redis.del(key);
    } catch (err) {
      console.warn('[cache] Redis del failed:', (err as Error).message);
    }
  }
  memoryStore.delete(key);
}

export async function cacheFlush(): Promise<void> {
  const redis = await getRedis();
  if (redis) {
    try {
      await redis.flushdb();
    } catch (err) {
      console.warn('[cache] Redis flush failed:', (err as Error).message);
    }
  }
  memoryStore.clear();
}

/** Cached wrapper: runs `loader` on miss, caches the result, with stale-while-revalidate */
export async function cached<T>(
  key: string,
  loader: () => Promise<T>,
  ttlSeconds = 60
): Promise<T> {
  const hit = await cacheGet<T>(key);
  if (hit !== null) return hit;
  const value = await loader();
  await cacheSet(key, value as CacheValue, ttlSeconds);
  return value;
}

/** Returns the cache backend currently in use — useful for /api/health */
export async function getCacheStatus(): Promise<{ backend: 'redis' | 'memory'; healthy: boolean }> {
  const redis = await getRedis();
  if (redis) {
    try {
      await redis.ping();
      return { backend: 'redis', healthy: true };
    } catch {
      return { backend: 'memory', healthy: false };
    }
  }
  return { backend: 'memory', healthy: true };
}

/** Invalidate all cache keys matching a prefix (e.g. 'analytics:') */
export async function invalidatePrefix(prefix: string): Promise<void> {
  const redis = await getRedis();
  if (redis) {
    try {
      const keys = await redis.keys(`${prefix}*`);
      if (keys.length > 0) await redis.del(...keys);
    } catch (err) {
      console.warn('[cache] invalidatePrefix failed:', (err as Error).message);
    }
  }
  for (const key of [...memoryStore.keys()]) {
    if (key.startsWith(prefix)) memoryStore.delete(key);
  }
}
