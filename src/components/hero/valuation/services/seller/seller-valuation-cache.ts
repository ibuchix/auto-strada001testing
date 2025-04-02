
/**
 * Changes made:
 * - 2024-11-21: Extracted from seller-valuation.ts as part of refactoring
 * - 2024-11-23: Fixed Promise chain issue with proper Promise handling
 * - 2024-11-23: Added comprehensive logging for debugging
 */

import { supabase } from "@/integrations/supabase/client";

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
      console.log('Cached valuation data preview:', {
        make: valData.make,
        model: valData.model,
        year: valData.year,
        basePrice: valData.basePrice || valData.averagePrice,
        reservePrice: valData.reservePrice || valData.valuation,
        valuation: valData.valuation || valData.reservePrice
      });
      
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
 */
export function storeSellerValuationCache(vin: string, mileage: number, valuationData: any): void {
  console.log('Storing in cache for VIN:', vin, 'with keys:', Object.keys(valuationData));
  
  // Use Promise chain with proper error handling instead of Promise.resolve().then()
  Promise.resolve()
    .then(() => {
      return supabase
        .from('vin_valuation_cache')
        .upsert({
          vin,
          mileage,
          valuation_data: valuationData
        });
    })
    .then(({ error }) => {
      if (error) {
        throw error;
      }
      console.log('Valuation data cached successfully for VIN:', vin);
    })
    .catch(error => {
      console.warn('Non-critical cache error:', error);
    });
}
