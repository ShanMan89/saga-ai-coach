'use client';

// In-memory cache with TTL support
class MemoryCache {
  private cache = new Map<string, { data: any; expires: number }>();
  private timers = new Map<string, NodeJS.Timeout>();

  set(key: string, data: any, ttlMs: number = 5 * 60 * 1000) {
    const expires = Date.now() + ttlMs;
    
    // Clear existing timer
    const existingTimer = this.timers.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Set new cache entry
    this.cache.set(key, { data, expires });

    // Set expiration timer
    const timer = setTimeout(() => {
      this.delete(key);
    }, ttlMs);
    
    this.timers.set(key, timer);
  }

  get(key: string) {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expires) {
      this.delete(key);
      return null;
    }

    return entry.data;
  }

  delete(key: string) {
    const timer = this.timers.get(key);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(key);
    }
    
    this.cache.delete(key);
  }

  clear() {
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers.clear();
    this.cache.clear();
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    if (Date.now() > entry.expires) {
      this.delete(key);
      return false;
    }
    
    return true;
  }

  size(): number {
    return this.cache.size;
  }
}

// Global cache instance
const globalCache = new MemoryCache();

// Cache configuration
export const CACHE_CONFIGS = {
  // User data cache for 10 minutes
  USER_PROFILE: { ttl: 10 * 60 * 1000, key: (userId: string) => `user:${userId}` },
  
  // Chat history cache for 5 minutes
  CHAT_HISTORY: { ttl: 5 * 60 * 1000, key: (userId: string) => `chat:${userId}` },
  
  // Journal entries cache for 15 minutes
  JOURNAL_ENTRIES: { ttl: 15 * 60 * 1000, key: (userId: string) => `journal:${userId}` },
  
  // Community posts cache for 2 minutes
  COMMUNITY_POSTS: { ttl: 2 * 60 * 1000, key: () => 'community:posts' },
  
  // Subscription data cache for 30 minutes
  SUBSCRIPTION: { ttl: 30 * 60 * 1000, key: (userId: string) => `subscription:${userId}` },
  
  // API responses cache for 1 minute
  API_RESPONSE: { ttl: 60 * 1000, key: (endpoint: string, params?: string) => 
    `api:${endpoint}${params ? `:${params}` : ''}` },
};

// Generic cache wrapper function
export function withCache<T>(
  cacheConfig: { ttl: number; key: (...args: any[]) => string },
  fetchFunction: (...args: any[]) => Promise<T>
) {
  return async (...args: any[]): Promise<T> => {
    const cacheKey = cacheConfig.key(...args);
    
    // Try to get from cache first
    const cached = globalCache.get(cacheKey);
    if (cached !== null) {
      return cached;
    }

    // Fetch fresh data
    try {
      const data = await fetchFunction(...args);
      
      // Cache the result
      globalCache.set(cacheKey, data, cacheConfig.ttl);
      
      return data;
    } catch (error) {
      // Don't cache errors, but you might want to cache error states
      throw error;
    }
  };
}

// Browser storage cache (localStorage/sessionStorage)
class BrowserStorageCache {
  private storage: Storage;
  private prefix: string;

  constructor(storage: Storage, prefix: string = 'saga_cache_') {
    this.storage = storage;
    this.prefix = prefix;
  }

  private getKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  set(key: string, data: any, ttlMs: number = 24 * 60 * 60 * 1000) {
    const item = {
      data,
      expires: Date.now() + ttlMs,
    };

    try {
      this.storage.setItem(this.getKey(key), JSON.stringify(item));
    } catch (error) {
      // Storage might be full or unavailable
      console.warn('Failed to cache to storage:', error);
    }
  }

  get(key: string) {
    try {
      const item = this.storage.getItem(this.getKey(key));
      if (!item) return null;

      const parsed = JSON.parse(item);
      
      if (Date.now() > parsed.expires) {
        this.delete(key);
        return null;
      }

      return parsed.data;
    } catch (error) {
      // Parsing error or storage unavailable
      this.delete(key);
      return null;
    }
  }

  delete(key: string) {
    try {
      this.storage.removeItem(this.getKey(key));
    } catch (error) {
      console.warn('Failed to delete from storage:', error);
    }
  }

  clear() {
    try {
      const keys = Object.keys(this.storage);
      keys.forEach(key => {
        if (key.startsWith(this.prefix)) {
          this.storage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Failed to clear storage cache:', error);
    }
  }
}

// Create storage cache instances
export const localStorageCache = typeof window !== 'undefined' 
  ? new BrowserStorageCache(localStorage, 'saga_local_')
  : null;

export const sessionStorageCache = typeof window !== 'undefined'
  ? new BrowserStorageCache(sessionStorage, 'saga_session_')
  : null;

// Cached fetch wrapper with automatic retry and fallback
export async function cachedFetch<T>(
  url: string,
  options: RequestInit & { 
    cacheKey?: string; 
    cacheTtl?: number;
    retries?: number;
    fallbackData?: T;
  } = {}
): Promise<T> {
  const {
    cacheKey = url,
    cacheTtl = CACHE_CONFIGS.API_RESPONSE.ttl,
    retries = 3,
    fallbackData,
    ...fetchOptions
  } = options;

  // Try memory cache first
  const cached = globalCache.get(cacheKey);
  if (cached !== null) {
    return cached;
  }

  // Try localStorage cache for GET requests
  if ((!fetchOptions.method || fetchOptions.method === 'GET') && localStorageCache) {
    const storedCache = localStorageCache.get(cacheKey);
    if (storedCache !== null) {
      // Also update memory cache
      globalCache.set(cacheKey, storedCache, cacheTtl);
      return storedCache;
    }
  }

  let lastError: Error | null = null;
  
  // Retry logic
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers: {
          'Content-Type': 'application/json',
          ...fetchOptions.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: T = await response.json();
      
      // Cache successful responses
      globalCache.set(cacheKey, data, cacheTtl);
      
      // Also cache in localStorage for GET requests
      if ((!fetchOptions.method || fetchOptions.method === 'GET') && localStorageCache) {
        localStorageCache.set(cacheKey, data, cacheTtl * 2); // Longer TTL for storage
      }

      return data;
    } catch (error) {
      lastError = error as Error;
      
      // Wait before retry (exponential backoff)
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }

  // If all retries failed, try to return fallback data
  if (fallbackData !== undefined) {
    return fallbackData;
  }

  // If no fallback, throw the last error
  throw lastError || new Error('Unknown fetch error');
}

// Cache invalidation utilities
export const cacheInvalidation = {
  // Invalidate user-specific caches
  invalidateUser(userId: string) {
    globalCache.delete(CACHE_CONFIGS.USER_PROFILE.key(userId));
    globalCache.delete(CACHE_CONFIGS.CHAT_HISTORY.key(userId));
    globalCache.delete(CACHE_CONFIGS.JOURNAL_ENTRIES.key(userId));
    globalCache.delete(CACHE_CONFIGS.SUBSCRIPTION.key(userId));
  },

  // Invalidate community caches
  invalidateCommunity() {
    globalCache.delete(CACHE_CONFIGS.COMMUNITY_POSTS.key());
  },

  // Invalidate all caches
  invalidateAll() {
    globalCache.clear();
    localStorageCache?.clear();
    sessionStorageCache?.clear();
  },

  // Invalidate by pattern
  invalidatePattern(pattern: string) {
    // This is a simple implementation - in production you might want more sophisticated pattern matching
    const keys = Array.from((globalCache as any).cache.keys());
    keys.forEach((key: string) => {
      if (typeof key === 'string' && key.includes(pattern)) {
        globalCache.delete(key);
      }
    });
  },
};

// React hook for cache management
export function useCache() {
  return {
    cache: globalCache,
    invalidate: cacheInvalidation,
    localCache: localStorageCache,
    sessionCache: sessionStorageCache,
  };
}

// Preload critical data
export function preloadCriticalData(userId: string) {
  // This would typically preload user profile, recent chat history, etc.
  // Implementation depends on your specific data fetching functions
  console.log(`Preloading critical data for user: ${userId}`);
}

export { globalCache };
export default globalCache;