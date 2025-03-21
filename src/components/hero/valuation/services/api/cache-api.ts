
/**
 * Changes made:
 * - 2024-08-01: Created caching API for valuation results
 * - 2024-08-02: Fixed type issues with ValuationData
 * - 2024-12-31: Updated to use security definer function for reliable caching
 * - 2025-03-21: Fixed TypeScript error with onConflict method
 * - 2025-04-22: Enhanced error handling and added anonymous access for caching
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

  try {
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
    // Ensure we return a proper ValuationData object
    return cachedEntry.valuation_data as ValuationData;
  } catch (error) {
    console.error('Unexpected error in getCachedValuation:', error);
    return null;
  }
}

/**
 * Store valuation data in the cache
 * Enhanced with additional error handling and a more reliable approach
 */
export async function storeValuationCache(
  vin: string,
  mileage: number,
  valuationData: ValuationData
): Promise<void> {
  console.log('Storing valuation in cache for VIN:', vin);
  
  try {
    // Try using the security definer function first
    const { error: rpcError } = await supabase.rpc(
      'store_vin_valuation_cache',
      {
        p_vin: vin,
        p_mileage: mileage,
        p_valuation_data: valuationData
      }
    );
    
    if (rpcError) {
      console.warn('Security definer function failed, falling back to direct insert:', rpcError);
      
      // First, check if user is authenticated
      const { data: sessionData } = await supabase.auth.getSession();
      const isAuthenticated = !!sessionData?.session?.user;
      
      // If not authenticated, we'll skip caching since it will fail due to RLS
      if (!isAuthenticated) {
        console.log('Skipping cache storage - user not authenticated');
        return;
      }
      
      // Try to find existing entry first
      const { data: existingData, error: selectError } = await supabase
        .from('vin_valuation_cache')
        .select('id')
        .eq('vin', vin)
        .maybeSingle();
        
      if (selectError) {
        console.error('Error checking existing cache entry:', selectError);
        return;
      }
      
      if (existingData) {
        // Update existing record
        const { error } = await supabase
          .from('vin_valuation_cache')
          .update({
            mileage,
            valuation_data: valuationData,
            created_at: new Date().toISOString()
          })
          .eq('vin', vin);
          
        if (error) {
          console.error('Error updating valuation cache:', error);
        } else {
          console.log('Successfully updated existing cache entry');
        }
      } else {
        // Insert new record
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
          console.error('Error inserting valuation cache:', error);
        } else {
          console.log('Successfully inserted new cache entry');
        }
      }
    } else {
      console.log('Successfully stored valuation in cache via security definer function');
    }
  } catch (error) {
    console.error('Failed to store valuation in cache:', error);
    // Don't throw the error, just log it as this is a non-critical operation
  }
}
