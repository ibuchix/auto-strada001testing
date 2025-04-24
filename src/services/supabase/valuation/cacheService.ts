
/**
 * Changes made:
 * - 2024-09-11: Created valuation service for all valuation-related operations
 * - 2024-09-19: Optimized queries and improved caching for better performance
 * - 2024-09-20: Fixed issue with function invoke options
 * - 2024-10-15: Refactored into smaller modules for better maintainability
 * - 2025-04-24: Split into multiple focused modules for better organization
 */

import { ValuationServiceBase, ValuationData } from "./valuationServiceBase";
import { RpcStorageStrategy } from "./storage/rpcStorage";
import { DirectStorageStrategy } from "./storage/directStorage";
import { EdgeFunctionStorageStrategy } from "./storage/edgeFunctionStorage";
import { CacheCleanupService } from "./cleanup/cacheCleanup";
import { logDataStructure, logCacheOperation } from "./utils/logger";
import { CacheStorageOptions } from "./types/cache";
import { Json } from "@/integrations/supabase/types";

export class ValuationCacheService extends ValuationServiceBase {
  private rpcStorage: RpcStorageStrategy;
  private directStorage: DirectStorageStrategy;
  private edgeStorage: EdgeFunctionStorageStrategy;
  private cleanup: CacheCleanupService;

  constructor() {
    super();
    this.rpcStorage = new RpcStorageStrategy(this.supabase);
    this.directStorage = new DirectStorageStrategy(this.supabase);
    this.edgeStorage = new EdgeFunctionStorageStrategy(this.supabase);
    this.cleanup = new CacheCleanupService(this.supabase);
  }

  async storeInCache(
    vin: string, 
    mileage: number, 
    valuationData: ValuationData,
    options: CacheStorageOptions = {}
  ): Promise<boolean> {
    try {
      logCacheOperation('store_attempt', { 
        vin, 
        dataStructure: logDataStructure(valuationData as Json)
      });

      // Try RPC storage first
      const rpcResult = await this.rpcStorage.store(vin, mileage, valuationData as Json);
      if (rpcResult.success) return true;
      
      if (options.skipFallbacks) return false;

      // Try direct storage
      const directResult = await this.directStorage.store(vin, mileage, valuationData as Json);
      if (directResult.success) return true;

      // Try edge function storage
      const edgeResult = await this.edgeStorage.store(vin, mileage, valuationData as Json);
      return edgeResult.success;

    } catch (error) {
      logCacheOperation('store_error', { vin, error });
      return false;
    }
  }

  async getFromCache(
    vin: string, 
    mileage: number,
    options: CacheStorageOptions = {}
  ): Promise<ValuationData | null> {
    try {
      await this.cleanup.cleanupInvalidCache();

      // Try RPC retrieval first
      const rpcResult = await this.rpcStorage.retrieve(vin, mileage);
      if (rpcResult.success && rpcResult.data) {
        return rpcResult.data as ValuationData;
      }

      if (options.skipFallbacks) return null;

      // Try direct retrieval
      const directResult = await this.directStorage.retrieve(vin);
      if (directResult.success && directResult.data) {
        return directResult.data as ValuationData;
      }

      // Try edge function retrieval
      const edgeResult = await this.edgeStorage.retrieve(vin, mileage);
      if (edgeResult.success && edgeResult.data) {
        return edgeResult.data as ValuationData;
      }

      return null;
    } catch (error) {
      logCacheOperation('retrieve_error', { vin, error });
      return null;
    }
  }

  async cleanExpiredCache(): Promise<boolean> {
    return this.cleanup.cleanExpiredCache();
  }
}

// Export a singleton instance
export const valuationCacheService = new ValuationCacheService();

