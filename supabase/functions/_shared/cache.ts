
/**
 * Simple in-memory cache implementation for edge functions
 */

// Simple memory cache with expiration
class MemoryCache {
  private cache: Map<string, { value: any, expiry: number }> = new Map();
  private readonly DEFAULT_TTL = 10 * 60 * 1000; // 10 minutes in ms
  
  /**
   * Set a value in the cache with optional TTL
   */
  set(key: string, value: any, ttl: number = this.DEFAULT_TTL): void {
    const expiry = Date.now() + ttl;
    this.cache.set(key, { value, expiry });
    
    // Cleanup expired items occasionally (1% chance on writes)
    if (Math.random() < 0.01) {
      this.cleanup();
    }
  }
  
  /**
   * Get a value from the cache
   */
  get(key: string): any | null {
    const item = this.cache.get(key);
    
    // Return null if item doesn't exist or is expired
    if (!item || item.expiry < Date.now()) {
      if (item) {
        // Clean up expired item
        this.cache.delete(key);
      }
      return null;
    }
    
    return item.value;
  }
  
  /**
   * Check if a key exists and is not expired
   */
  has(key: string): boolean {
    const item = this.cache.get(key);
    return !!(item && item.expiry >= Date.now());
  }
  
  /**
   * Remove an item from the cache
   */
  delete(key: string): void {
    this.cache.delete(key);
  }
  
  /**
   * Clear all items from the cache
   */
  clear(): void {
    this.cache.clear();
  }
  
  /**
   * Remove all expired items from the cache
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (item.expiry < now) {
        this.cache.delete(key);
      }
    }
  }
  
  /**
   * Get the number of items in the cache
   */
  size(): number {
    return this.cache.size;
  }
}

// Export a singleton instance of the cache
export const memoryCache = new MemoryCache();
