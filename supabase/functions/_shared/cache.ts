
/**
 * Simple caching mechanism for edge functions
 */
import { logOperation } from './logging.ts';

// Simple in-memory cache (will reset when function goes cold)
interface CacheEntry {
  data: any;
  timestamp: number;
}

const CACHE_SIZE_LIMIT = 100;
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes cache lifetime

class MemoryCache {
  private cache = new Map<string, CacheEntry>();
  
  /**
   * Get item from cache
   * @param key Cache key
   * @returns Cached data or null if not found or expired
   */
  get(key: string): any | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }
    
    const now = Date.now();
    
    // Check if entry is expired
    if (now - entry.timestamp > CACHE_TTL) {
      this.delete(key);
      return null;
    }
    
    logOperation('cache_hit', { key, ageMs: now - entry.timestamp });
    return entry.data;
  }
  
  /**
   * Set item in cache
   * @param key Cache key
   * @param data Data to cache
   * @param ttl Optional custom TTL in ms
   */
  set(key: string, data: any, ttl?: number): void {
    // Prune if at capacity
    if (this.cache.size >= CACHE_SIZE_LIMIT) {
      this.prune();
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
    
    logOperation('cache_set', { key, size: JSON.stringify(data).length });
  }
  
  /**
   * Delete item from cache
   * @param key Cache key
   */
  delete(key: string): void {
    this.cache.delete(key);
  }
  
  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    logOperation('cache_cleared', { count: this.cache.size });
  }
  
  /**
   * Remove expired entries from cache
   */
  prune(): void {
    const now = Date.now();
    let prunedCount = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > CACHE_TTL) {
        this.cache.delete(key);
        prunedCount++;
      }
    }
    
    if (prunedCount > 0) {
      logOperation('cache_pruned', { 
        prunedCount, 
        remainingEntries: this.cache.size 
      });
    }
  }
}

// Singleton instance
export const memoryCache = new MemoryCache();
