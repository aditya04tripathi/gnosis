import { Redis } from "ioredis";

const getRedisClient = () => {
  if (!process.env.REDIS_URL || process.env.REDIS_URL === "/") {
    return null;
  }

  try {
    const client = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      retryStrategy: () => null, // Don't retry on connection failure
      lazyConnect: true, // Don't connect immediately
    });

    // Handle errors silently - Redis is optional
    client.on("error", () => {
      // Silently ignore Redis errors
    });

    client.on("connect", () => {
      // Connection successful
    });

    // Attempt connection, but don't fail if it doesn't work
    client.connect().catch(() => {
      // Silently ignore connection errors
    });

    return client;
  } catch (_error) {
    // Redis connection failed, return null to disable Redis features
    return null;
  }
};

export const redis = getRedisClient();

export async function getCache<T>(key: string): Promise<T | null> {
  if (!redis || redis.status !== "ready") return null;
  try {
    const value = await redis.get(key);
    return value ? (JSON.parse(value) as T) : null;
  } catch {
    return null;
  }
}

export async function setCache<T>(
  key: string,
  value: T,
  ttlSeconds?: number
): Promise<void> {
  if (!redis || redis.status !== "ready") return;
  try {
    const serialized = JSON.stringify(value);
    if (ttlSeconds) {
      await redis.setex(key, ttlSeconds, serialized);
    } else {
      await redis.set(key, serialized);
    }
  } catch {
    // Silently ignore Redis errors
  }
}

export async function deleteCache(key: string): Promise<void> {
  if (!redis || redis.status !== "ready") return;
  try {
    await redis.del(key);
  } catch {
    // Silently ignore Redis errors
  }
}

export async function rateLimit(
  identifier: string,
  maxRequests: number,
  windowMs: number
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  if (!redis || redis.status !== "ready") {
    return {
      allowed: true,
      remaining: maxRequests,
      resetAt: new Date(Date.now() + windowMs),
    };
  }

  const key = `rate_limit:${identifier}`;
  const windowSeconds = Math.floor(windowMs / 1000);

  try {
    const current = await redis.incr(key);
    if (current === 1) {
      await redis.expire(key, windowSeconds);
    }

    const ttl = await redis.ttl(key);
    const resetAt = new Date(Date.now() + (ttl + 1) * 1000);

    return {
      allowed: current <= maxRequests,
      remaining: Math.max(0, maxRequests - current),
      resetAt,
    };
  } catch {
    return {
      allowed: true,
      remaining: maxRequests,
      resetAt: new Date(Date.now() + windowMs),
    };
  }
}
