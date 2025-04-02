
/**
 * Changes made:
 * - 2024-11-21: Extracted from seller-valuation.ts as part of refactoring
 * - 2024-11-23: Fixed Promise chain issue with proper Promise handling
 * - 2024-11-23: Added comprehensive logging for debugging
 * - 2024-11-24: Added type guards to fix TypeScript errors with JSON data
 * - 2028-06-13: Updated storeSellerValuationCache to return a Promise for proper chain handling
 */

import { supabase } from "@/integrations/supabase/client";

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
 * Get cached seller valuation
 */
export async function getSellerValuationCache(vin: string, mileage: number): Promise<any | null> {
  console.log('Checking cache for VIN:', vin, 'with mileage:', mileage);
  try {
    const { data: cachedValuation, error } = await supabase
      .from('vin_valuation_cache')
      .select('valuation_data, created_at')
      .eq('vin', vin)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (error) {
      console.warn('Cache retrieval error:', error);
      return null;
    }
    
    if (cachedValuation?.valuation_data) {
      console.log('Cache hit! Found valuation data from:', cachedValuation.created_at);
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
    
    console.log('Cache miss for VIN:', vin);
    return null;
  } catch (cacheError) {
    console.warn('Cache retrieval error:', cacheError);
    return null;
  }
}

/**
 * Store seller valuation in cache
 * @returns Promise that resolves when storage is complete
 */
export async function storeSellerValuationCache(vin: string, mileage: number, valuationData: any): Promise<void> {
  console.log('Storing in cache for VIN:', vin, 'with keys:', Object.keys(valuationData));
  
  try {
    const { error } = await supabase
      .from('vin_valuation_cache')
      .upsert({
        vin,
        mileage,
        valuation_data: valuationData
      });
    
    if (error) {
      console.warn('Cache storage error:', error);
      throw error;
    }
    
    console.log('Valuation data cached successfully for VIN:', vin);
  } catch (error) {
    console.warn('Failed to store valuation in cache:', error);
    throw error; // Re-throw to allow proper promise chain handling
  }
}
