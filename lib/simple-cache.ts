'use client';

// Simple in-memory cache for essential functionality
class SimpleCache {
  private cache = new Map<string, { data: any; expires: number }>();

  set(key: string, data: any, ttlMs: number = 5 * 60 * 1000) {
    const expires = Date.now() + ttlMs;
    this.cache.set(key, { data, expires });
  }

  get(key: string) {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  delete(key: string) {
    this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }
}

// Global cache instance
const globalCache = new SimpleCache();

// Simple cache wrapper function
export function withSimpleCache<T>(
  key: string,
  ttl: number,
  fetchFunction: () => Promise<T>
) {
  return async (): Promise<T> => {
    // Try to get from cache first
    const cached = globalCache.get(key);
    if (cached !== null) {
      return cached;
    }

    // Fetch fresh data
    const data = await fetchFunction();
    
    // Cache the result
    globalCache.set(key, data, ttl);
    
    return data;
  };
}

export { globalCache };
export default globalCache;