
/**
 * Changes made:
 * - 2025-04-27: Created cache retrieval module extracted from cache-api.ts
 * - 2026-04-10: Fixed type handling and data normalization
 */

import { supabase } from "@/integrations/supabase/client";
import { ValuationData } from "../../types";
import { getSessionDebugInfo, logDetailedError } from "./utils/debug-utils";

const CACHE_EXPIRY_DAYS = 30; // Cache validity period in days

/**
 * Check if a cached valuation exists for a given VIN and mileage
 */
export async function getCachedValuation(
  vin: string,
  mileage: number
): Promise<ValuationData | null> {
  console.log('Checking for cached valuation for VIN:', vin);

  try {
    // Debug information about the current session
    const sessionInfo = await getSessionDebugInfo();
    console.log('Session info when checking cache:', sessionInfo);

    // Query the database for cached valuations
    const { data, error } = await supabase
      .from('vin_valuation_cache')
      .select('*')
      .eq('vin', vin)
      // Only get cache entries where the mileage is within 5% of the requested mileage
      .gte('mileage', mileage * 0.95)
      .lte('mileage', mileage * 1.05)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      logDetailedError(error, 'fetching cached valuation');
      return null;
    }

    if (!data || data.length === 0) {
      console.log('No cache found for VIN:', vin);
      return null;
    }

    const cachedEntry = data[0];
    
    // Check if cache is expired
    const cacheDate = new Date(cachedEntry.created_at);
    const now = new Date();
    const daysDifference = (now.getTime() - cacheDate.getTime()) / (1000 * 3600 * 24);
    
    if (daysDifference > CACHE_EXPIRY_DAYS) {
      console.log('Cache expired for VIN:', vin);
      return null;
    }

    console.log('Found valid cache for VIN:', vin, 'created on:', cachedEntry.created_at);
    
    // Normalize the cached data to ensure it matches ValuationData interface
    const cachedData = cachedEntry.valuation_data;
    if (!cachedData) return null;
    
    const normalizedData: Record<string, any> = {};
    
    // Handle different data types
    if (typeof cachedData === 'object' && cachedData !== null) {
      // Copy all properties
      Object.keys(cachedData).forEach(key => {
        normalizedData[key] = cachedData[key];
      });
    } else {
      // Handle primitive values
      normalizedData.valuation = cachedData;
    }
    
    // Ensure both valuation and reservePrice exist
    if ('valuation' in normalizedData && !('reservePrice' in normalizedData)) {
      normalizedData.reservePrice = normalizedData.valuation;
    } else if ('reservePrice' in normalizedData && !('valuation' in normalizedData)) {
      normalizedData.valuation = normalizedData.reservePrice;
    }
    
    // Convert numeric string values to actual numbers
    if (typeof normalizedData.valuation === 'string') {
      normalizedData.valuation = Number(normalizedData.valuation);
    }
    if (typeof normalizedData.reservePrice === 'string') {
      normalizedData.reservePrice = Number(normalizedData.reservePrice);
    }
    if (typeof normalizedData.averagePrice === 'string') {
      normalizedData.averagePrice = Number(normalizedData.averagePrice);
    }
    if (typeof normalizedData.basePrice === 'string') {
      normalizedData.basePrice = Number(normalizedData.basePrice);
    }
    
    return normalizedData as ValuationData;
  } catch (error) {
    console.error('Unexpected error in getCachedValuation:', error);
    return null;
  }
}
