
/**
 * Changes made:
 * - 2024-11-21: Extracted from seller-valuation.ts as part of refactoring
 * - 2024-11-23: Fixed Promise chain issue with proper Promise handling
 * - 2024-11-23: Added comprehensive logging for debugging
 * - 2024-11-24: Added type guards to fix TypeScript errors with JSON data
 * - 2024-11-15: Implemented multiple cache storage methods with fallbacks
 * - 2028-06-13: Updated storeSellerValuationCache to return a Promise for proper chain handling
 */

import { supabase } from "@/integrations/supabase/client";
import { valuationCacheService } from "@/services/supabase/valuation/cacheService";

// Define type for valuation data to help TypeScript
interface ValuationData {
  make?: string;
  model?: string;
  year?: number;
  basePrice?: number;
  averagePrice?: number;
  reservePrice?: number;
  valuation?: number;
  [key: string]: any;
}

/**
 * Type guard to check if value is a ValuationData object
 */
function isValuationData(obj: any): obj is ValuationData {
  return obj && typeof obj === 'object' && !Array.isArray(obj);
}

/**
 * Get cached seller valuation with multiple fallback approaches
 */
export async function getSellerValuationCache(vin: string, mileage: number): Promise<any | null> {
  console.log('Checking cache for VIN:', vin, 'with mileage:', mileage);
  
  // Method 1: Try using the optimized cache service first
  try {
    const cachedData = await valuationCacheService.getFromCache(vin, mileage);
    if (cachedData) {
      console.log('Cache service hit! Found valuation data');
      return cachedData;
    }
  } catch (serviceError) {
    console.warn('Cache service retrieval error:', serviceError);
  }
  
  // Method 2: Try direct database access
  try {
    const { data: cachedValuation, error } = await supabase
      .from('vin_valuation_cache')
      .select('valuation_data, created_at')
      .eq('vin', vin)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (error) {
      console.warn('Direct cache retrieval error:', error);
    } else if (cachedValuation?.valuation_data) {
      console.log('Direct cache hit! Found valuation data from:', cachedValuation.created_at);
      console.log('Cache data structure:', Object.keys(cachedValuation.valuation_data));
      
      // Log important values from cache
      const valData = cachedValuation.valuation_data;
      
      // Make sure valData is an object before accessing properties
      if (isValuationData(valData)) {
        console.log('Cached valuation data preview:', {
          make: valData.make,
          model: valData.model,
          year: valData.year,
          basePrice: valData.basePrice || valData.averagePrice,
          reservePrice: valData.reservePrice || valData.valuation,
          valuation: valData.valuation || valData.reservePrice
        });
      } else {
        console.log('Cached data is not in expected format:', typeof valData);
      }
      
      return cachedValuation.valuation_data;
    }
  } catch (directError) {
    console.warn('Direct cache retrieval error:', directError);
  }
  
  // Method 3: Try edge function as final fallback
  try {
    const { data: funcResult, error: funcError } = await supabase.functions.invoke(
      'handle-seller-operations',
      {
        body: {
          operation: 'get_cached_valuation',
          vin,
          mileage
        }
      }
    );
    
    if (!funcError && funcResult && funcResult.success && funcResult.data) {
      console.log('Edge function cache hit!');
      return funcResult.data;
    }
    
    if (funcError) {
      console.warn('Edge function cache retrieval error:', funcError);
    }
  } catch (funcException) {
    console.warn('Edge function cache exception:', funcException);
  }
  
  console.log('Cache miss for VIN:', vin);
  return null;
}

/**
 * Store seller valuation in cache with multiple fallback mechanisms
 * @returns Promise that resolves when storage is complete
 */
export async function storeSellerValuationCache(vin: string, mileage: number, valuationData: any): Promise<void> {
  console.log('Storing in cache for VIN:', vin, 'with keys:', Object.keys(valuationData));
  
  // Method 1: Try using the optimized cache service first
  try {
    const success = await valuationCacheService.storeInCache(vin, mileage, valuationData);
    if (success) {
      console.log('Valuation data cached successfully via cache service for VIN:', vin);
      return;
    }
  } catch (serviceError) {
    console.warn('Cache service storage error:', serviceError);
  }
  
  // Method 2: Try direct database access
  try {
    const { error } = await supabase
      .from('vin_valuation_cache')
      .upsert({
        vin,
        mileage,
        valuation_data: valuationData
      });
    
    if (!error) {
      console.log('Valuation data cached successfully via direct insert for VIN:', vin);
      return;
    }
    
    console.warn('Direct cache storage error:', error);
  } catch (directError) {
    console.warn('Direct cache storage exception:', directError);
  }
  
  // Method 3: Try edge function as final fallback
  try {
    const { data: funcResult, error: funcError } = await supabase.functions.invoke(
      'handle-seller-operations',
      {
        body: {
          operation: 'cache_valuation',
          vin,
          mileage,
          valuation_data: valuationData
        }
      }
    );
    
    if (!funcError) {
      console.log('Valuation data cached successfully via edge function for VIN:', vin);
      return;
    }
    
    console.warn('Edge function cache storage error:', funcError);
  } catch (funcException) {
    console.warn('Edge function cache storage exception:', funcException);
  }
  
  console.warn('Failed to store valuation in cache after trying all methods');
}
