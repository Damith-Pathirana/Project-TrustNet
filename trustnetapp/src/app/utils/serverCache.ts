import LRUCache from 'lru-cache';

// Create a cache with a maximum of 1000 items and 1 hour TTL
const cache = new LRUCache({
  max: 1000,
  ttl: 1000 * 60 * 60, // 1 hour
});

export const serverCache = {
  get: async function <T>(key: string, fetchFn: () => Promise<T>): Promise<T> {
    const cached = cache.get(key);
    if (cached) {
      return cached as T;
    }
    const data = await fetchFn();
    cache.set(key, data);
    return data;
  },

  set: (key: string, value: any) => {
    cache.set(key, value);
  },

  delete: (key: string) => {
    cache.delete(key);
  },

  clear: () => {
    cache.clear();
  },

  getCacheInstance: () => cache,
}; 