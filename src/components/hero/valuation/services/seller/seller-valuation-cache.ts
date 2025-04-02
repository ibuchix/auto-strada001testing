
/**
 * Changes made:
 * - 2024-11-21: Extracted from seller-valuation.ts as part of refactoring
 */

import { supabase } from "@/integrations/supabase/client";

/**
 * Get cached seller valuation
 */
export async function getSellerValuationCache(vin: string, mileage: number): Promise<any | null> {
  try {
    const { data: cachedValuation } = await supabase
      .from('vin_valuation_cache')
      .select('valuation_data')
      .eq('vin', vin)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (cachedValuation?.valuation_data) {
      return cachedValuation.valuation_data;
    }
    
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
  // Use Promise.resolve to make this non-blocking
  Promise.resolve().then(() => {
    supabase
      .from('vin_valuation_cache')
      .upsert({
        vin,
        mileage,
        valuation_data: valuationData
      })
      .then(() => {
        console.log('Valuation data cached successfully');
      })
      .catch(error => {
        console.log('Non-critical cache error:', error);
      });
  }).catch(error => {
    console.warn('Failed to initiate cache operation:', error);
  });
}
