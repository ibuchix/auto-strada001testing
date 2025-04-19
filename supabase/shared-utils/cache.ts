
/**
 * Shared in-memory cache utility
 * Created: 2025-04-19
 */

interface CacheEntry {
  value: any;
  expiresAt: number | null;
}

export class MemoryCache {
  private cache: Map<string, CacheEntry> = new Map();

  /**
   * Get a value from the cache
   * @param key Cache key
   * @returns Cached value or undefined
   */
  get(key: string): any {
    const entry = this.cache.get(key);
    
    if (!entry) return undefined;
    
    // Check expiration
    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      this.delete(key);
      return undefined;
    }
    
    return entry.value;
  }

  /**
   * Set a value in the cache
   * @param key Cache key
   * @param value Value to store
   * @param ttlMs Time to live in milliseconds
   */
  set(key: string, value: any, ttlMs: number | null = null): void {
    const expiresAt = ttlMs ? Date.now() + ttlMs : null;
    
    this.cache.set(key, { value, expiresAt });
  }

  /**
   * Delete a value from the cache
   * @param key Cache key
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.cache.clear();
  }
}

// Export a singleton cache instance
export const memoryCache = new MemoryCache();
