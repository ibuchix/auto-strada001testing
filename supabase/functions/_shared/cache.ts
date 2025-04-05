
/**
 * Simple memory cache implementation for edge functions
 */

// Define the cache entry type
interface CacheEntry {
  value: any;
  expiresAt: number | null;
}

// Create a class for the memory cache
class MemoryCache {
  private cache: Map<string, CacheEntry> = new Map();
  
  /**
   * Get a value from the cache
   * @param key The cache key
   * @returns The cached value or undefined if not found or expired
   */
  get(key: string): any {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return undefined;
    }
    
    // Check if the entry has expired
    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      this.delete(key);
      return undefined;
    }
    
    return entry.value;
  }
  
  /**
   * Set a value in the cache
   * @param key The cache key
   * @param value The value to store
   * @param ttlMs Time to live in milliseconds (null for no expiration)
   */
  set(key: string, value: any, ttlMs: number | null = null): void {
    const expiresAt = ttlMs ? Date.now() + ttlMs : null;
    
    this.cache.set(key, {
      value,
      expiresAt
    });
  }
  
  /**
   * Delete a value from the cache
   * @param key The cache key
   */
  delete(key: string): void {
    this.cache.delete(key);
  }
  
  /**
   * Clear all values from the cache
   */
  clear(): void {
    this.cache.clear();
  }
  
  /**
   * Get the number of entries in the cache
   */
  size(): number {
    return this.cache.size;
  }
}

// Create and export a singleton instance
export const memoryCache = new MemoryCache();
