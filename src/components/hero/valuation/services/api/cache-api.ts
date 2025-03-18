
/**
 * Changes made:
 * - 2024-08-01: Created caching API for valuation results
 */

import { supabase } from "@/integrations/supabase/client";
import { ValuationData } from "../../types";

const CACHE_EXPIRY_DAYS = 30; // Cache validity period in days

/**
 * Check if a cached valuation exists for a given VIN and mileage
 */
export async function getCachedValuation(
  vin: string,
  mileage: number
): Promise<ValuationData | null> {
  console.log('Checking for cached valuation for VIN:', vin);

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
    console.error('Error fetching cached valuation:', error);
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

  console.log('Found valid cache for VIN:', vin);
  return cachedEntry.valuation_data;
}

/**
 * Store valuation data in the cache
 */
export async function storeValuationCache(
  vin: string,
  mileage: number,
  valuationData: ValuationData
): Promise<void> {
  console.log('Storing valuation in cache for VIN:', vin);
  
  try {
    const { error } = await supabase
      .from('vin_valuation_cache')
      .insert([
        {
          vin,
          mileage,
          valuation_data: valuationData
        }
      ]);
      
    if (error) {
      console.error('Error storing valuation cache:', error);
    }
  } catch (error) {
    console.error('Failed to store valuation in cache:', error);
  }
}
