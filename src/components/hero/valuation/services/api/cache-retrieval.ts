
/**
 * Changes made:
 * - 2025-04-27: Created cache retrieval module extracted from cache-api.ts
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
    // Ensure we return a proper ValuationData object
    return cachedEntry.valuation_data as ValuationData;
  } catch (error) {
    console.error('Unexpected error in getCachedValuation:', error);
    return null;
  }
}
