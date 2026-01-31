import { cache } from "react";

type CacheEntry<T> = {
  data: T;
  timestamp: number;
};

const memoryCache = new Map<string, CacheEntry<any>>();

const DEFAULT_TTL = 5 * 60 * 1000;

export function getCached<T>(key: string): T | null {
  const entry = memoryCache.get(key);
  if (!entry) return null;

  const now = Date.now();
  if (now - entry.timestamp > DEFAULT_TTL) {
    memoryCache.delete(key);
    return null;
  }

  return entry.data as T;
}

export function setCached<T>(
  key: string,
  data: T,
  ttl: number = DEFAULT_TTL,
): void {
  memoryCache.set(key, {
    data,
    timestamp: Date.now(),
  });

  setTimeout(() => {
    memoryCache.delete(key);
  }, ttl);
}

export function clearCache(pattern?: string): void {
  if (!pattern) {
    memoryCache.clear();
    return;
  }

  const keysToDelete: string[] = [];
  for (const key of memoryCache.keys()) {
    if (key.includes(pattern)) {
      keysToDelete.push(key);
    }
  }

  for (const key of keysToDelete) {
    memoryCache.delete(key);
  }
}

export const cachedFetch = cache(
  async <T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = DEFAULT_TTL,
  ): Promise<T> => {
    const cached = getCached<T>(key);
    if (cached !== null) {
      return cached;
    }

    const data = await fetcher();
    setCached(key, data, ttl);
    return data;
  },
);

export function getCacheStats() {
  return {
    size: memoryCache.size,
    keys: Array.from(memoryCache.keys()),
  };
}
